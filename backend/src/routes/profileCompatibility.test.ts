import { describe, expect, test } from "bun:test";
import {
  isCompleteCentreProfile,
  isCompleteFactoryProfile,
  canReceiveFarmerAccessGrant,
  profileCompleteness,
  profileUserLookup,
  VETERINARIAN_REGISTRATION_BLOCK_MESSAGE,
} from "./profileCompatibility";

describe("transitional profile compatibility", () => {
  test("looks up profiles by authenticated user ID, not legacy code or ID", () => {
    expect(profileUserLookup("user-auth-1")).toEqual({ userId: "user-auth-1" });
  });

  test("does not treat unlinked or incomplete centre/factory profiles as verified", () => {
    expect(isCompleteCentreProfile({ userId: null, user: null, centreName: null, registrationNumber: null, phone: null, address: null })).toBe(false);
    expect(isCompleteCentreProfile({ userId: "user-1", user: null, centreName: "Centre", registrationNumber: "R-1", phone: "555-0101", address: "Road" })).toBe(false);
    expect(isCompleteCentreProfile({ userId: "user-1", user: { id: "user-1" }, centreName: "Centre", registrationNumber: "R-1", phone: "555-0101", address: "Road" })).toBe(true);
    expect(canReceiveFarmerAccessGrant({ userId: null, user: null, centreName: "Legacy centre", registrationNumber: null, phone: null, address: null })).toBe(false);
    expect(canReceiveFarmerAccessGrant({ userId: "user-1", user: { id: "user-1" }, centreName: "Centre", registrationNumber: "R-1", phone: "555-0101", address: "Road" })).toBe(true);
    expect(isCompleteFactoryProfile({ userId: null, user: null, factoryName: "Factory", registrationNumber: "F-1", phone: "555-0101", address: "Road" })).toBe(false);
    expect(isCompleteFactoryProfile({ userId: "user-2", user: { id: "user-2" }, factoryName: "Factory", registrationNumber: "F-1", phone: "555-0101", address: "Road" })).toBe(true);
  });

  test("marks old unlinked vet records as incomplete and keeps registration blocked pending mapping approval", () => {
    expect(profileCompleteness(null, ["555-0101", null])).toBe("INCOMPLETE_LEGACY");
    expect(profileCompleteness("user-3", ["555-0101", "VET-1"])).toBe("COMPLETE");
    expect(VETERINARIAN_REGISTRATION_BLOCK_MESSAGE).toContain("mapping is approved");
  });
});
