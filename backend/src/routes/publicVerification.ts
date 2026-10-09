import { prisma } from "../lib/prisma";
import { buildPublicMilkBatchVerification } from "./publicVerificationPolicy";

/** Return an explicit public projection; never serialize Prisma entities directly. */
export async function getPublicMilkBatchVerification(rawBatchId: string) {
  const batchId = rawBatchId.trim();
  if (!batchId || batchId.length > 100) return { error: "Enter a valid Milk Batch ID.", status: 400 } as const;

  const batch = await prisma.milkBatch.findUnique({
    where: { batchId },
    select: {
      id: true,
      batchId: true,
      date: true,
      status: true,
      processingBatches: {
        select: {
          processingBatch: {
            select: {
              id: true, batchId: true, date: true, status: true,
              sourceMilkBatches: { select: { milkBatch: { select: { batchId: true } } } },
            },
          },
        },
      },
    },
  });
  if (!batch) return { error: "Milk Batch ID was not found.", status: 404 } as const;

  const processingBatches = batch.processingBatches.map(({ processingBatch }) => ({
    batchId: processingBatch.batchId,
    date: processingBatch.date.toISOString(),
    status: processingBatch.status,
    sourceBatchIds: processingBatch.sourceMilkBatches.map(({ milkBatch }) => milkBatch.batchId),
  }));
  const traceabilityEntityIds = [batch.id, ...batch.processingBatches.map(({ processingBatch }) => processingBatch.id)];
  const portalEvents = await prisma.traceabilityEvent.findMany({
    where: { entityId: { in: traceabilityEntityIds } },
    select: { eventType: true, entityType: true, entityId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return buildPublicMilkBatchVerification(
    { id: batch.id, batchId: batch.batchId, date: batch.date.toISOString(), status: batch.status },
    processingBatches.map((processing) => ({ ...processing, entityId: batch.processingBatches.find(({ processingBatch }) => processingBatch.batchId === processing.batchId)?.processingBatch.id ?? "" })),
    portalEvents.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
  );
}
