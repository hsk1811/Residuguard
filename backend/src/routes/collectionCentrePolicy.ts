type WithdrawalRecord = { administeredAt: Date; withdrawalEnds: Date | null };
export type MilkEligibility = "ELIGIBLE_BY_RECORD" | "HOLD" | "UNVERIFIED";

export function hasClientControlledBatchFields(input: unknown): boolean {
  return typeof input === "object" && input !== null && !Array.isArray(input)
    && ("status" in input || "batchId" in input);
}

export function assessMilkEligibility(treatments: WithdrawalRecord[], collectedAt: Date, now = Date.now()): MilkEligibility {
  if (Number.isNaN(collectedAt.getTime()) || collectedAt.getTime() > now) return "UNVERIFIED";

  const relevantTreatments = treatments.filter((treatment) => treatment.administeredAt <= collectedAt);
  if (relevantTreatments.some((treatment) =>
    treatment.withdrawalEnds === null || treatment.withdrawalEnds < treatment.administeredAt,
  )) return "UNVERIFIED";
  if (relevantTreatments.some((treatment) => treatment.withdrawalEnds !== null && treatment.withdrawalEnds > collectedAt)) {
    return "HOLD";
  }
  return "ELIGIBLE_BY_RECORD";
}
