import { apiRequest } from "./client";
import type { CreateProcessingBatchResponse, FactoryDashboardData } from "../../types/api";

export function getFactoryDashboard(token: string) {
  return apiRequest<FactoryDashboardData>("/api/factory/dashboard", { token });
}

export function createFactoryProcessingBatch(token: string, body: { milkBatchIds: string[]; date: string; product: string; packs: number }) {
  return apiRequest<CreateProcessingBatchResponse>("/api/factory/processing-batches", { method: "POST", token, body });
}
