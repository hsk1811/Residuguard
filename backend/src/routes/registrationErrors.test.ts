import { describe, expect, test } from "bun:test";
import { isRegistrationRecord, registrationString, safeRegistrationFailure } from "./registrationErrors";

describe("registration request validation and safe failures", () => {
  test("rejects non-object request bodies and safely reads string fields", () => {
    expect(isRegistrationRecord(null)).toBe(false);
    expect(isRegistrationRecord([])).toBe(false);
    expect(isRegistrationRecord({ name: "  Dr Example  " })).toBe(true);
    expect(registrationString({ name: "  Dr Example  " }, "name")).toBe("Dr Example");
    expect(registrationString({ name: 42 }, "name")).toBe("");
  });

  test("converts duplicate veterinarian license errors into a safe validation response", () => {
    expect(safeRegistrationFailure({ code: "P2002", meta: { target: ["licenseNumber"] } })).toEqual({
      status: 409,
      error: "A veterinarian with this license number is already registered",
    });
  });

  test("never returns SQL, internal exception details, or submitted password data", () => {
    const response = safeRegistrationFailure(new Error("SQL failed for password: private-value"));
    expect(response).toEqual({ status: 500, error: "Unable to complete registration" });
    expect(JSON.stringify(response)).not.toContain("SQL");
    expect(JSON.stringify(response)).not.toContain("private-value");
  });
});
