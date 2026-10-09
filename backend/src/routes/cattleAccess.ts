export interface CattleRequestIdentity {
  userId: string;
  role: string;
}

export type CattleAccessDecision =
  | { allowed: true; farmerUserId: string }
  | { allowed: false; status: 401 | 403; error: string };

export function authorizeCattleRead(identity: CattleRequestIdentity | null): CattleAccessDecision {
  if (!identity) return { allowed: false, status: 401, error: "Authentication required" };
  if (identity.role !== "FARMER") return { allowed: false, status: 403, error: "Farmer access is required" };
  return { allowed: true, farmerUserId: identity.userId };
}

export function farmerCattleWhere(userId: string) {
  return { farmer: { is: { userId } } };
}
