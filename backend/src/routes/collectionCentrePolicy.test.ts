import { describe, expect, test } from "bun:test";
import { assessMilkEligibility, hasClientControlledBatchFields } from "./collectionCentrePolicy";

const instant = (value: string) => new Date(value);
const now = instant("2026-10-09T12:00:00.000Z").getTime();

describe("collection milk eligibility", () => {
  test("rejects client supplied status or batch ID", () => {
    expect(hasClientControlledBatchFields({ cattleIds: ["COW-1"], volumeL: 20, date: "2026-10-09", status: "SAFE" })).toBe(true);
    expect(hasClientControlledBatchFields({ batchId: "FAKE-ID" })).toBe(true);
    expect(hasClientControlledBatchFields({ cattleIds: ["COW-1"], volumeL: 20, date: "2026-10-09" })).toBe(false);
  });

  test("permits by recorded dates only when no withdrawal is active", () => {
    expect(assessMilkEligibility([], instant("2026-10-09T11:00:00.000Z"), now)).toBe("ELIGIBLE_BY_RECORD");
    expect(assessMilkEligibility([
      { administeredAt: instant("2026-10-01T00:00:00.000Z"), withdrawalEnds: instant("2026-10-08T00:00:00.000Z") },
    ], instant("2026-10-09T11:00:00.000Z"), now)).toBe("ELIGIBLE_BY_RECORD");
  });

  test("holds a source whose withdrawal ends after collection", () => {
    expect(assessMilkEligibility([
      { administeredAt: instant("2026-10-08T00:00:00.000Z"), withdrawalEnds: instant("2026-10-10T00:00:00.000Z") },
    ], instant("2026-10-09T11:00:00.000Z"), now)).toBe("HOLD");
  });

  test("does not treat a missing or contradictory withdrawal end as eligible", () => {
    expect(assessMilkEligibility([
      { administeredAt: instant("2026-10-08T00:00:00.000Z"), withdrawalEnds: null },
    ], instant("2026-10-09T11:00:00.000Z"), now)).toBe("UNVERIFIED");
    expect(assessMilkEligibility([
      { administeredAt: instant("2026-10-08T00:00:00.000Z"), withdrawalEnds: instant("2026-10-07T00:00:00.000Z") },
    ], instant("2026-10-09T11:00:00.000Z"), now)).toBe("UNVERIFIED");
  });

  test("ignores treatments administered after the historical collection time", () => {
    expect(assessMilkEligibility([
      { administeredAt: instant("2026-10-10T00:00:00.000Z"), withdrawalEnds: instant("2026-10-12T00:00:00.000Z") },
    ], instant("2026-10-09T11:00:00.000Z"), now)).toBe("ELIGIBLE_BY_RECORD");
  });

  test("does not mark future collections eligible", () => {
    expect(assessMilkEligibility([], instant("2026-10-10T00:00:00.000Z"), now)).toBe("UNVERIFIED");
  });
});
