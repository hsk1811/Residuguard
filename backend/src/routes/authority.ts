import { prisma } from "../lib/prisma";
import { assessMilkEligibility } from "./collectionCentrePolicy";
import { profileCompleteness } from "./profileCompatibility";

export function isConfiguredAuthorityAdmin(userId: string) {
  const configuredIds = (process.env.AUTHORITY_ADMIN_USER_IDS ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return configuredIds.length > 0 && configuredIds.includes(userId);
}

export async function getAuthorityDashboard() {
  const now = new Date();
  const [users, cattle, treatments, milkBatches, processingBatches, events, userCount, cattleCount, treatmentCount, milkBatchCount, processingBatchCount, userRoleCounts, activeWithdrawalCattle, unknownWithdrawalCattle, milkBatchStatuses, processingBatchStatuses] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, organization: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 500,
    }),
    prisma.cattle.findMany({
      select: {
        id: true, cattleId: true, name: true, breed: true, sex: true, createdAt: true,
        farmer: { select: { village: true, user: { select: { name: true, email: true } } } },
        treatments: { select: { id: true, medicineName: true, dosage: true, administeredAt: true, withdrawalEnds: true, reason: true, veterinarian: { select: { userId: true, phone: true, licenseNumber: true, user: { select: { name: true } } } } }, orderBy: { administeredAt: "desc" } },
      }, orderBy: { cattleId: "asc" }, take: 500,
    }),
    prisma.treatment.findMany({
      select: { id: true, medicineName: true, dosage: true, administeredAt: true, withdrawalEnds: true, reason: true, cattle: { select: { cattleId: true, name: true, farmer: { select: { user: { select: { name: true } } } } } }, veterinarian: { select: { userId: true, phone: true, licenseNumber: true, user: { select: { name: true } } } } },
      orderBy: { administeredAt: "desc" }, take: 500,
    }),
    prisma.milkBatch.findMany({
      select: { id: true, batchId: true, date: true, volumeL: true, status: true, collectionCentre: { select: { userId: true, user: { select: { id: true } }, centreName: true, registrationNumber: true, phone: true, address: true } }, contributingAnimals: { select: { cattle: { select: { cattleId: true, name: true, treatments: { select: { administeredAt: true, withdrawalEnds: true } } } } } }, processingBatches: { select: { processingBatch: { select: { batchId: true } } } } },
      orderBy: { date: "desc" }, take: 500,
    }),
    prisma.processingBatch.findMany({
      select: { id: true, batchId: true, date: true, volumeL: true, product: true, packs: true, status: true, factory: { select: { userId: true, user: { select: { id: true } }, factoryName: true, registrationNumber: true, phone: true, address: true } }, sourceMilkBatches: { select: { milkBatch: { select: { batchId: true, status: true } } } } },
      orderBy: { date: "desc" }, take: 500,
    }),
    prisma.traceabilityEvent.findMany({
      select: { id: true, eventType: true, entityType: true, entityId: true, payload: true, blockchainTxId: true, blockNumber: true, blockchainStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 500,
    }),
    prisma.user.count(), prisma.cattle.count(), prisma.treatment.count(), prisma.milkBatch.count(), prisma.processingBatch.count(),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.treatment.findMany({ where: { administeredAt: { lte: now }, withdrawalEnds: { gt: now } }, select: { cattleId: true }, distinct: ["cattleId"] }),
    prisma.treatment.findMany({ where: { administeredAt: { lte: now }, withdrawalEnds: null }, select: { cattleId: true }, distinct: ["cattleId"] }),
    prisma.milkBatch.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.processingBatch.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const cattleRows = cattle.map((animal) => {
    const eligibility = assessMilkEligibility(animal.treatments, now);
    return {
      ...animal, createdAt: animal.createdAt.toISOString(),
      treatments: animal.treatments.map((treatment) => ({
        ...treatment,
        administeredAt: treatment.administeredAt.toISOString(),
        withdrawalEnds: treatment.withdrawalEnds?.toISOString() ?? null,
        veterinarian: {
          name: treatment.veterinarian.user?.name ?? null,
          profileCompleteness: profileCompleteness(
            treatment.veterinarian.user && treatment.veterinarian.userId ? treatment.veterinarian.userId : null,
            [treatment.veterinarian.phone, treatment.veterinarian.licenseNumber],
          ),
        },
      })),
      withdrawalStatus: eligibility,
    };
  });
  const milkRows = milkBatches.map((batch) => {
    const sources = batch.contributingAnimals.map(({ cattle: animal }) => ({
      cattleId: animal.cattleId, name: animal.name,
      eligibility: assessMilkEligibility(animal.treatments, batch.date, now.getTime()),
    }));
    const eligibility = batch.status === "SAFE" && sources.length > 0 && sources.every((source) => source.eligibility === "ELIGIBLE_BY_RECORD")
      ? "ELIGIBLE_BY_RECORD" as const : "HOLD" as const;
    return {
      id: batch.id, batchId: batch.batchId, date: batch.date.toISOString(), volumeL: batch.volumeL, status: batch.status,
      collectionCentre: profileCompleteness(batch.collectionCentre.user?.id ?? null, [batch.collectionCentre.centreName, batch.collectionCentre.registrationNumber, batch.collectionCentre.phone, batch.collectionCentre.address]) === "COMPLETE" ? batch.collectionCentre.centreName : null,
      collectionCentreProfileCompleteness: profileCompleteness(batch.collectionCentre.user?.id ?? null, [batch.collectionCentre.centreName, batch.collectionCentre.registrationNumber, batch.collectionCentre.phone, batch.collectionCentre.address]),
      eligibility, sources,
      processingBatchIds: batch.processingBatches.map(({ processingBatch }) => processingBatch.batchId),
    };
  });
  const processingRows = processingBatches.map((batch) => ({
    id: batch.id, batchId: batch.batchId, date: batch.date.toISOString(), volumeL: batch.volumeL,
    product: batch.product, packs: batch.packs, status: batch.status,
    factoryName: profileCompleteness(batch.factory.user?.id ?? null, [batch.factory.factoryName, batch.factory.registrationNumber, batch.factory.phone, batch.factory.address]) === "COMPLETE" ? batch.factory.factoryName : null,
    factoryProfileCompleteness: profileCompleteness(batch.factory.user?.id ?? null, [batch.factory.factoryName, batch.factory.registrationNumber, batch.factory.phone, batch.factory.address]),
    sourceMilkBatchIds: batch.sourceMilkBatches.map(({ milkBatch }) => milkBatch.batchId),
  }));
  const roleCounts = userRoleCounts.reduce<Record<string, number>>((counts, row) => {
    counts[row.role] = row._count._all;
    return counts;
  }, {});
  const holdMilk = milkRows.filter((batch) => batch.status === "HOLD" || batch.eligibility !== "ELIGIBLE_BY_RECORD");
  const holdProcessing = processingRows.filter((batch) => batch.status === "HOLD");
  const holdCattle = cattleRows.filter((animal) => animal.withdrawalStatus !== "ELIGIBLE_BY_RECORD");
  const milkStatusCounts = milkBatchStatuses.reduce<Record<string, number>>((counts, row) => { counts[row.status] = row._count._all; return counts; }, {});
  const processingStatusCounts = processingBatchStatuses.reduce<Record<string, number>>((counts, row) => { counts[row.status] = row._count._all; return counts; }, {});

  return {
    summary: {
      users: userCount, cattle: cattleCount, treatments: treatmentCount, milkBatches: milkBatchCount,
      processingBatches: processingBatchCount, activeWithdrawalHolds: activeWithdrawalCattle.length,
      withdrawalUnverified: unknownWithdrawalCattle.length, holdMilkBatches: milkStatusCounts.HOLD ?? 0,
      holdProcessingBatches: processingStatusCounts.HOLD ?? 0,
    },
    roleCounts,
    users: users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
    cattle: cattleRows,
    treatments: treatments.map((treatment) => ({
      ...treatment,
      administeredAt: treatment.administeredAt.toISOString(),
      withdrawalEnds: treatment.withdrawalEnds?.toISOString() ?? null,
      veterinarian: {
        name: treatment.veterinarian.user?.name ?? null,
        profileCompleteness: profileCompleteness(
          treatment.veterinarian.user && treatment.veterinarian.userId ? treatment.veterinarian.userId : null,
          [treatment.veterinarian.phone, treatment.veterinarian.licenseNumber],
        ),
      },
    })),
    milkBatches: milkRows,
    processingBatches: processingRows,
    holds: { cattle: holdCattle.map((animal) => ({ cattleId: animal.cattleId, name: animal.name, farmerName: animal.farmer.user.name, status: animal.withdrawalStatus })), milkBatches: holdMilk, processingBatches: holdProcessing },
    traceabilityEvents: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString(), payload: event.payload })),
    dataAvailability: {
      mrlReferences: { available: false, reason: "No MRL reference model or API exists in the current backend." },
      holdInvestigations: { available: false, reason: "No investigation case model or workflow API exists; HOLD records are shown for review only." },
      blockchainVerification: { available: false, reason: "The schema stores optional blockchain metadata, but no blockchain integration or independent verification API is present." },
      managementActions: { available: false, reason: "No backend endpoint exists for changing user roles or account status." },
      recordsReturned: { users: users.length, cattle: cattle.length, treatments: treatments.length, milkBatches: milkBatches.length, processingBatches: processingBatches.length, traceabilityEvents: events.length },
      recordLimit: 500,
    },
    generatedAt: now.toISOString(),
  };
}
