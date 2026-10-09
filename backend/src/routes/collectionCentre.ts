import { prisma } from "../lib/prisma";
import { assessMilkEligibility, hasClientControlledBatchFields } from "./collectionCentrePolicy";
import { isCompleteCentreProfile, profileUserLookup } from "./profileCompatibility";

function localDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function generateMilkBatchId(date: Date): string {
  const dateKey = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `RG-MB-${dateKey}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

const sourceSelect = {
  id: true,
  cattleId: true,
  name: true,
  breed: true,
  farmer: { select: { village: true, user: { select: { id: true, name: true } } } },
  treatments: { orderBy: { administeredAt: "desc" as const }, select: { id: true, medicineName: true, administeredAt: true, withdrawalEnds: true } },
};

export async function getCollectionCentreDashboard(userId: string) {
  const centre = await prisma.collectionCentre.findUnique({
    where: profileUserLookup(userId),
    select: { id: true, userId: true, centreName: true, registrationNumber: true, phone: true, address: true, village: true, user: { select: { id: true, name: true } } },
  });
  if (!centre || !isCompleteCentreProfile(centre) || !centre.user) return null;

  const activeGrants = await prisma.collectionCentreSupplier.findMany({
    where: { collectionCentreId: centre.id, revokedAt: null },
    select: { farmerId: true },
  });
  const authorizedFarmerIds = activeGrants.map((grant) => grant.farmerId);

  const [cattle, batches] = await Promise.all([
    authorizedFarmerIds.length === 0 ? Promise.resolve([]) : prisma.cattle.findMany({
      where: { farmerId: { in: authorizedFarmerIds } },
      select: sourceSelect,
      orderBy: { cattleId: "asc" },
    }),
    prisma.milkBatch.findMany({
      where: { collectionCentreId: centre.id },
      select: {
        id: true, batchId: true, date: true, volumeL: true, status: true, createdAt: true,
        contributingAnimals: { select: { cattle: { select: sourceSelect } } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const now = new Date();
  const traceability = batches.length > 0
    ? await prisma.traceabilityEvent.findMany({
      where: { entityType: "MILK_BATCH", entityId: { in: batches.map((batch) => batch.id) } },
      select: { id: true, entityId: true, eventType: true, blockchainStatus: true, blockchainTxId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })
    : [];

  const today = localDateKey(now);
  const batchRows = batches.map((batch) => {
    const contributors = batch.contributingAnimals.map(({ cattle: animal }) => ({
      id: animal.id,
      cattleId: animal.cattleId,
      name: animal.name,
      farmer: animal.farmer,
      eligibility: assessMilkEligibility(animal.treatments, batch.date, now.getTime()),
    }));
    const eligibility = contributors.every((source) => source.eligibility === "ELIGIBLE_BY_RECORD")
      ? "ELIGIBLE_BY_RECORD" as const
      : "HOLD" as const;
    return {
      id: batch.id, batchId: batch.batchId, date: batch.date.toISOString(), volumeL: batch.volumeL,
      createdAt: batch.createdAt.toISOString(), status: batch.status, eligibility, contributors,
      traceability: traceability.filter((event) => event.entityId === batch.id).map((event) => ({
        id: event.id, eventType: event.eventType, blockchainStatus: event.blockchainStatus,
        blockchainTxId: event.blockchainTxId, createdAt: event.createdAt.toISOString(),
      })),
    };
  });
  const todaysBatches = batchRows.filter((batch) => localDateKey(new Date(batch.date)) === today);

  return {
    centre: { name: centre.user.name, centreName: centre.centreName, village: centre.village },
    summary: {
      todaysCollectionL: todaysBatches.reduce((total, batch) => total + batch.volumeL, 0),
      eligibleMilkL: todaysBatches.filter((batch) => batch.eligibility === "ELIGIBLE_BY_RECORD")
        .reduce((total, batch) => total + batch.volumeL, 0),
      holdSources: cattle.filter((animal) => assessMilkEligibility(animal.treatments, now) !== "ELIGIBLE_BY_RECORD").length,
      todaysBatches: todaysBatches.length,
    },
    sources: cattle.map((animal) => ({
      id: animal.id, cattleId: animal.cattleId, name: animal.name, breed: animal.breed,
      farmer: animal.farmer,
      eligibility: assessMilkEligibility(animal.treatments, now),
      withdrawalEnds: animal.treatments.flatMap((treatment) => treatment.withdrawalEnds ? [treatment.withdrawalEnds.toISOString()] : []),
    })),
    batches: batchRows,
    generatedAt: now.toISOString(),
  };
}

export interface CreateMilkBatchInput { cattleIds: string[]; volumeL: number; date: string }

export async function createCollectionBatch(userId: string, input: unknown) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { error: "Provide collection details as a JSON object.", status: 400 } as const;
  }
  const body = input as Record<string, unknown>;
  if (hasClientControlledBatchFields(body)) {
    return { error: "Batch ID and eligibility status are generated by the server.", status: 400 } as const;
  }
  const cattleIds = body.cattleIds;
  const volumeL = body.volumeL;
  const date = body.date;
  if (!Array.isArray(cattleIds) || cattleIds.length === 0 || cattleIds.some((id) => typeof id !== "string" || !id.trim())) {
    return { error: "Select at least one valid cattle ID.", status: 400 } as const;
  }
  if (new Set(cattleIds).size !== cattleIds.length) return { error: "A cattle source can only be selected once.", status: 400 } as const;
  if (typeof volumeL !== "number" || !Number.isFinite(volumeL) || volumeL <= 0) {
    return { error: "Quantity must be greater than zero litres.", status: 400 } as const;
  }
  if (typeof date !== "string" || !Number.isFinite(Date.parse(date))) {
    return { error: "Provide a valid collection date and time.", status: 400 } as const;
  }
  const collectedAt = new Date(date);
  if (collectedAt.getTime() > Date.now()) return { error: "Collection time cannot be in the future.", status: 400 } as const;

  const centre = await prisma.collectionCentre.findUnique({
    where: profileUserLookup(userId),
    select: { id: true, userId: true, centreName: true, registrationNumber: true, phone: true, address: true, user: { select: { id: true } } },
  });
  if (!centre) return { error: "Collection centre profile not found.", status: 404 } as const;
  if (!isCompleteCentreProfile(centre)) {
    return { error: "Collection centre profile is incomplete and cannot create milk batches.", status: 409 } as const;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const batchId = generateMilkBatchId(collectedAt);
    try {
      const result = await prisma.$transaction(async (tx) => {
        const activeGrants = await tx.collectionCentreSupplier.findMany({
          where: { collectionCentreId: centre.id, revokedAt: null },
          select: { farmerId: true },
        });
        const authorizedFarmerIds = activeGrants.map((grant) => grant.farmerId);
        if (authorizedFarmerIds.length === 0) {
          return { error: "No farmers have granted this centre access to their cattle records.", status: 403 } as const;
        }
        const cattle = await tx.cattle.findMany({
          where: { cattleId: { in: cattleIds as string[] }, farmerId: { in: authorizedFarmerIds } },
          select: sourceSelect,
        });
        if (cattle.length !== cattleIds.length) {
          return { error: "One or more selected sources are unavailable to this centre. Confirm that the farmer granted access.", status: 403 } as const;
        }
        const contributors = cattle.map((animal) => ({
          id: animal.id, cattleId: animal.cattleId, name: animal.name, farmer: animal.farmer,
          eligibility: assessMilkEligibility(animal.treatments, collectedAt),
        }));
        const ineligible = contributors.filter((source) => source.eligibility !== "ELIGIBLE_BY_RECORD");
        const status = ineligible.length === 0 ? "SAFE" as const : "HOLD" as const;
        const traceabilityPayload = {
          batchStatus: status,
          eligibilityBasis: "recorded treatment withdrawal dates; no laboratory test implied",
          collectionDate: collectedAt.toISOString(),
          contributingCattleIds: contributors.map((source) => source.cattleId),
        };
        const created = await tx.milkBatch.create({
          data: {
            batchId, collectionCentreId: centre.id, date: collectedAt, volumeL, status,
            contributingAnimals: { create: cattle.map((animal) => ({ cattleId: animal.id })) },
          },
          select: {
            id: true, batchId: true, date: true, volumeL: true, status: true, createdAt: true,
            contributingAnimals: { select: { cattle: { select: sourceSelect } } },
          },
        });
        await tx.traceabilityEvent.create({
          data: { eventType: "MILK_BATCH_CREATED", entityType: "MILK_BATCH", entityId: created.id, payload: traceabilityPayload },
        });
        return {
          batch: {
            id: created.id, batchId: created.batchId, date: created.date.toISOString(), volumeL: created.volumeL,
            status: created.status, createdAt: created.createdAt.toISOString(), contributors,
            traceability: [{ eventType: "MILK_BATCH_CREATED", blockchainStatus: null, blockchainTxId: null, createdAt: created.createdAt.toISOString() }],
          },
          warnings: ineligible.map((source) => ({ cattleId: source.cattleId, eligibility: source.eligibility })),
        };
      }, { isolationLevel: "Serializable" });
      if ("error" in result) return result;
      return result;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
      if ((code === "P2002" || code === "P2034") && attempt < 2) continue;
      throw error;
    }
  }
  return { error: "Could not generate a unique milk batch ID. Please retry.", status: 503 } as const;
}
