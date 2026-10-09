import { describe, expect, it } from "bun:test";
import { milkEligibilityForCattle } from "../src/features/farmer/milkEligibility";
import type { FarmerCattle } from "../src/types/api";

function cattle(treatments: FarmerCattle["treatments"]): FarmerCattle {
  return {
    id: "cow-1",
    cattleId: "COW-1",
    name: "",
    breed: null,
    sex: null,
    dateOfBirth: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    treatments,
  };
}

describe("farmer withdrawal status display", () => {
  it("shows HOLD while a valid recorded withdrawal is active", () => {
    expect(milkEligibilityForCattle(cattle([
      { id: "t1", medicineName: "recorded medicine", dosage: null, administeredAt: "2026-01-01T00:00:00.000Z", withdrawalEnds: "2026-01-03T00:00:00.000Z", reason: null },
    ]), Date.parse("2026-01-02T00:00:00.000Z"))).toBe("HOLD");
  });

  it("shows UNVERIFIED for absent, invalid, or contradictory withdrawal dates", () => {
    const administeredAt = "2026-01-02T00:00:00.000Z";
    expect(milkEligibilityForCattle(cattle([
      { id: "t1", medicineName: "recorded medicine", dosage: null, administeredAt, withdrawalEnds: null, reason: null },
    ]))).toBe("UNVERIFIED");
    expect(milkEligibilityForCattle(cattle([
      { id: "t2", medicineName: "recorded medicine", dosage: null, administeredAt, withdrawalEnds: "invalid", reason: null },
    ]))).toBe("UNVERIFIED");
    expect(milkEligibilityForCattle(cattle([
      { id: "t3", medicineName: "recorded medicine", dosage: null, administeredAt, withdrawalEnds: "2026-01-01T00:00:00.000Z", reason: null },
    ]))).toBe("UNVERIFIED");
  });

  it("shows eligible by record after all valid withdrawal dates", () => {
    expect(milkEligibilityForCattle(cattle([
      { id: "t1", medicineName: "recorded medicine", dosage: null, administeredAt: "2026-01-01T00:00:00.000Z", withdrawalEnds: "2026-01-02T00:00:00.000Z", reason: null },
    ]), Date.parse("2026-01-02T00:00:00.000Z"))).toBe("ELIGIBLE_BY_RECORD");
  });
});
