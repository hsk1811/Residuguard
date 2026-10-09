import { prisma } from "../lib/prisma";
import { assessMilkEligibility } from "./collectionCentrePolicy";
import { isCompleteCentreProfile, isCompleteFactoryProfile, profileUserLookup } from "./profileCompatibility";

const cattleSelect = {
  treatments: { select: { administeredAt: true, withdrawalEnds: true } },
};

function makeProcessingBatchId(date: Date) {
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date).replaceAll("-", "");
  return `RG-PB-${dateKey}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function mapMilkBatch(batch: {
  id: string; batchId: string; date: Date; volumeL: number; status: string;
  collectionCentre: { userId: string | null; user: { id: string } | null; centreName: string | null; registrationNumber: string | null; phone: string | null; address: string | null };
  contributingAnimals: Array<{ cattle: { treatments: Array<{ administeredAt: Date; withdrawalEnds: Date | null }> } }>;
  processingBatches: Array<{ processingBatch: { batchId: string } }>;
}, now: Date) {
  const contributorEligibility = batch.contributingAnimals.map(({ cattle }) => assessMilkEligibility(cattle.treatments, batch.date, now.getTime()));
  const eligible = batch.status === "SAFE" && contributorEligibility.length > 0
    && contributorEligibility.every((source) => source === "ELIGIBLE_BY_RECORD");
  const centreProfileComplete = isCompleteCentreProfile(batch.collectionCentre);
  return {
    id: batch.id, batchId: batch.batchId, date: batch.date.toISOString(), volumeL: batch.volumeL,
    recordedStatus: batch.status, eligibility: eligible ? "ELIGIBLE_BY_RECORD" as const : "HOLD" as const,
    available: batch.processingBatches.length === 0,
    collectionCentre: centreProfileComplete ? batch.collectionCentre.centreName : null,
    collectionCentreProfileComplete: centreProfileComplete,
    sourceCount: batch.contributingAnimals.length,
  };
}

const milkBatchInclude = {
  collectionCentre: { select: { userId: true, user: { select: { id: true } }, centreName: true, registrationNumber: true, phone: true, address: true } },
  contributingAnimals: { select: { cattle: { select: cattleSelect } } },
  processingBatches: { select: { processingBatch: { select: { batchId: true } } } },
};

export async function getFactoryDashboard(userId: string) {
  const factory = await prisma.factory.findUnique({
    where: profileUserLookup(userId),
    select: { id: true, userId: true, factoryName: true, registrationNumber: true, phone: true, address: true, user: { select: { id: true, name: true } } },
  });
  if (!factory || !isCompleteFactoryProfile(factory) || !factory.user) return null;
  const [incoming, processingBatches] = await Promise.all([
    prisma.milkBatch.findMany({ where: { processingBatches: { none: {} } }, include: milkBatchInclude, orderBy: { date: "desc" } }),
    prisma.processingBatch.findMany({
      where: { factoryId: factory.id }, orderBy: { date: "desc" },
      include: { sourceMilkBatches: { include: { milkBatch: { include: milkBatchInclude } } } },
    }),
  ]);
  const now = new Date();
  const availableBatches = incoming.map((batch) => mapMilkBatch(batch, now));
  const history = processingBatches.map((batch) => ({
    id: batch.id, batchId: batch.batchId, date: batch.date.toISOString(), createdAt: batch.createdAt.toISOString(),
    volumeL: batch.volumeL, product: batch.product, packs: batch.packs, status: batch.status,
    sources: batch.sourceMilkBatches.map(({ milkBatch }) => mapMilkBatch(milkBatch, now)),
  }));
  return {
    factory: { name: factory.user.name, factoryName: factory.factoryName },
    summary: {
      incomingBatches: availableBatches.filter((batch) => batch.available).length,
      eligibleIncomingL: availableBatches.filter((batch) => batch.available && batch.eligibility === "ELIGIBLE_BY_RECORD").reduce((sum, batch) => sum + batch.volumeL, 0),
      holdIncoming: availableBatches.filter((batch) => batch.available && batch.eligibility !== "ELIGIBLE_BY_RECORD").length,
      processedBatches: history.length,
      processedVolumeL: history.reduce((sum, batch) => sum + batch.volumeL, 0),
    },
    incoming: availableBatches,
    processingBatches: history,
    generatedAt: now.toISOString(),
  };
}

export async function createProcessingBatch(userId: string, input: unknown) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { error: "Provide processing details as a JSON object.", status: 400 } as const;
  const body = input as Record<string, unknown>;
  if ("batchId" in body || "status" in body || "volumeL" in body || "factoryId" in body) return { error: "Processing ID, status, volume, and factory are assigned or validated by the server.", status: 400 } as const;
  const sourceBatchIds = body.milkBatchIds;
  if (!Array.isArray(sourceBatchIds) || sourceBatchIds.length === 0 || sourceBatchIds.some((id) => typeof id !== "string" || !id.trim())) return { error: "Select at least one incoming Milk Batch ID.", status: 400 } as const;
  if (new Set(sourceBatchIds).size !== sourceBatchIds.length) return { error: "A Milk Batch ID can only be selected once.", status: 400 } as const;
  if (typeof body.product !== "string" || !body.product.trim() || body.product.trim().length > 120) return { error: "Enter a product name of up to 120 characters.", status: 400 } as const;
  const productName = body.product.trim();
  if (typeof body.packs !== "number" || !Number.isInteger(body.packs) || body.packs < 1) return { error: "Pack count must be a whole number greater than zero.", status: 400 } as const;
  if (typeof body.date !== "string" || !Number.isFinite(Date.parse(body.date))) return { error: "Provide a valid processing date and time.", status: 400 } as const;
  const processedAt = new Date(body.date);
  if (processedAt.getTime() > Date.now()) return { error: "Processing time cannot be in the future.", status: 400 } as const;
  const factory = await prisma.factory.findUnique({
    where: profileUserLookup(userId),
    select: { id: true, userId: true, factoryName: true, registrationNumber: true, phone: true, address: true, user: { select: { id: true } } },
  });
  if (!factory) return { error: "Factory profile not found.", status: 404 } as const;
  if (!isCompleteFactoryProfile(factory)) return { error: "Factory profile is incomplete and cannot create processing batches.", status: 409 } as const;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const batchId = makeProcessingBatchId(processedAt);
    try {
      const result = await prisma.$transaction(async (tx) => {
        const selected = await tx.milkBatch.findMany({
          where: { batchId: { in: sourceBatchIds as string[] } }, include: milkBatchInclude,
        });
        if (selected.length !== sourceBatchIds.length) return { error: "One or more Milk Batch IDs are unavailable.", status: 404 } as const;
        const now = new Date();
        const mapped = selected.map((batch) => mapMilkBatch(batch, now));
        const unavailable = mapped.filter((batch) => !batch.available);
        if (unavailable.length) return { error: `These Milk Batch IDs are already linked to processing: ${unavailable.map((batch) => batch.batchId).join(", ")}.`, status: 409 } as const;
        const ineligible = mapped.filter((batch) => batch.recordedStatus !== "SAFE" || batch.eligibility !== "ELIGIBLE_BY_RECORD");
        if (ineligible.length) return { error: `Only batches eligible by recorded withdrawal dates can be processed as eligible sources. HOLD or unverified batches: ${ineligible.map((batch) => batch.batchId).join(", ")}.`, status: 409 } as const;
        const created = await tx.processingBatch.create({
          data: {
            batchId, factoryId: factory.id, date: processedAt,
            volumeL: selected.reduce((sum, batch) => sum + batch.volumeL, 0),
            product: productName, packs: body.packs as number,
            sourceMilkBatches: { create: selected.map((batch) => ({ milkBatchId: batch.id })) },
          },
          include: { sourceMilkBatches: { include: { milkBatch: { include: milkBatchInclude } } } },
        });
        await tx.traceabilityEvent.create({
          data: {
            eventType: "PROCESSING_BATCH_CREATED", entityType: "PROCESSING_BATCH", entityId: created.id,
            payload: { processingBatchId: created.batchId, sourceMilkBatchIds: mapped.map((batch) => batch.batchId), eligibilityBasis: "recorded withdrawal dates; no laboratory test implied" },
          },
        });
        return {
          processingBatch: {
            id: created.id, batchId: created.batchId, date: created.date.toISOString(), createdAt: created.createdAt.toISOString(),
            volumeL: created.volumeL, product: created.product, packs: created.packs, status: created.status,
            sources: created.sourceMilkBatches.map(({ milkBatch }) => mapMilkBatch(milkBatch, now)),
          },
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
  return { error: "Could not generate a unique Processing Batch ID. Please retry.", status: 503 } as const;
}
