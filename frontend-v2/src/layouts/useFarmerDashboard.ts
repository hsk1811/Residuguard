import { useOutletContext } from "react-router-dom";
import type { FarmerDashboardData } from "../types/api";

export interface FarmerDashboardOutletContext {
  data: FarmerDashboardData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFarmerDashboard() {
  return useOutletContext<FarmerDashboardOutletContext>();
}
