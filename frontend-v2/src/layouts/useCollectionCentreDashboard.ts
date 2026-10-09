import { useOutletContext } from "react-router-dom";
import type { CollectionCentreOutletContext } from "./CollectionCentreDashboardLayout";

export function useCollectionCentreDashboard() {
  return useOutletContext<CollectionCentreOutletContext>();
}
