import { apiRequest } from "./client";
import type { CollectionCentreDashboardData, CollectionCentreDirectoryResponse, CreateCollectionBatchResponse } from "../../types/api";

export function getCollectionCentreDashboard(token: string) {
  return apiRequest<CollectionCentreDashboardData>("/api/collection-centre/dashboard", { token });
}

export function createCollectionMilkBatch(token: string, body: { cattleIds: string[]; volumeL: number; date: string }) {
  return apiRequest<CreateCollectionBatchResponse>("/api/collection-centre/milk-batches", {
    method: "POST", token, body,
  });
}

export function getFarmerCollectionCentres(token: string) {
  return apiRequest<CollectionCentreDirectoryResponse>("/api/farmer/collection-centres", { token });
}

export function setCollectionCentreAccess(token: string, centreId: string, grant: boolean) {
  return apiRequest<{ grant?: { id: string; grantedAt: string }; message?: string }>(
    `/api/farmer/collection-centres/${encodeURIComponent(centreId)}/access`,
    { method: grant ? "POST" : "DELETE", token },
  );
}
