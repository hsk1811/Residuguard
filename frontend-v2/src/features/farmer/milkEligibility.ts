import type { FarmerCattle, FarmerMilkBatch, MilkEligibility } from "../../types/api";

export function milkEligibilityForCattle(cattle: FarmerCattle, now = Date.now()): MilkEligibility {
  const withdrawalEnds = cattle.treatments.map((treatment) => {
    const administeredAt = Date.parse(treatment.administeredAt);
    const endsAt = treatment.withdrawalEnds === null ? Number.NaN : Date.parse(treatment.withdrawalEnds);
    if (!Number.isFinite(administeredAt) || !Number.isFinite(endsAt) || endsAt < administeredAt) return null;
    return endsAt;
  });

  if (withdrawalEnds.some((end) => end === null)) return "UNVERIFIED";
  if (withdrawalEnds.some((end) => end !== null && end > now)) {
    return "HOLD";
  }
  return "ELIGIBLE_BY_RECORD";
}

export function isSafeMilkBatch(batch: FarmerMilkBatch): boolean {
  return batch.status === "SAFE";
}
