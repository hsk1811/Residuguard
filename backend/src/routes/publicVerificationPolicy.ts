export interface PublicProcessingBatch {
  entityId: string;
  batchId: string;
  date: string;
  status: string;
  sourceBatchIds: string[];
}

export interface PublicPortalEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export function buildPublicMilkBatchVerification(
  batch: { id: string; batchId: string; date: string; status: string },
  processingBatches: PublicProcessingBatch[],
  portalEvents: PublicPortalEvent[],
) {
  const traceabilityEntityIds = new Map<string, string>([
    [batch.id, batch.batchId],
    ...processingBatches.map((processing) => [processing.entityId, processing.batchId] as [string, string]),
  ]);

  const timeline = [
    { eventType: "MILK_BATCH_COLLECTED", direction: "collection" as const, batchId: batch.batchId, occurredAt: batch.date },
    ...processingBatches.map((processing) => ({
      eventType: "PROCESSING_BATCH_RECORDED",
      direction: "forward" as const,
      batchId: processing.batchId,
      occurredAt: processing.date,
      sourceBatchIds: processing.sourceBatchIds,
    })),
    ...portalEvents.map((event) => ({
      eventType: event.eventType,
      direction: "portal" as const,
      batchId: traceabilityEntityIds.get(event.entityId) ?? batch.batchId,
      occurredAt: event.createdAt,
    })),
  ].sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));

  return {
    batch: {
      milkBatchId: batch.batchId,
      status: batch.status,
      collectionDate: batch.date,
      processingBatches: processingBatches.map(({ batchId, date, status, sourceBatchIds }) => ({ batchId, date, status, sourceBatchIds })),
      timeline,
      notices: [
        "Status reflects the stored batch record and does not represent laboratory residue testing.",
        "Portal traceability events are records only; no independent blockchain confirmation is available.",
      ],
    },
  };
}
