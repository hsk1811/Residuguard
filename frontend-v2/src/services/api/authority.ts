import { apiRequest } from "./client";
import type { AuthorityDashboardData } from "../../types/api";

export function getAuthorityDashboard(token: string) {
  return apiRequest<AuthorityDashboardData>("/api/authority/dashboard", { token });
}
