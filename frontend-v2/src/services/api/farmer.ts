import { apiRequest } from "./client";
import type { FarmerDashboardData } from "../../types/api";

export function getFarmerDashboard(token: string) {
  return apiRequest<FarmerDashboardData>("/api/farmer/dashboard", { token });
}
