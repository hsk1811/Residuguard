import { apiRequest } from "./client";
import type { PublicBatchVerification } from "../../types/api";

export function verifyPublicMilkBatch(batchId: string) {
  return apiRequest<PublicBatchVerification>(`/api/public/milk-batches/${encodeURIComponent(batchId)}/verification`);
}
