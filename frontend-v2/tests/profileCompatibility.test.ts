import { describe, expect, test } from "bun:test";
import { ApiError } from "../src/services/api/client";
import { registrationErrorMessage } from "../src/features/auth/registrationErrors";
import { emptyRegistrationValues, registrationPayload, validateRegistration } from "../src/features/auth/registrationSchemas";

describe("transitional registration behavior", () => {
  test("starts every registration field empty and keeps new centre fields required", () => {
    const values = emptyRegistrationValues();
    expect(Object.values(values).every((value) => value === "")).toBe(true);

    values.name = "Centre account";
    values.email = "centre@example.test";
    values.password = "long-password";
    values.confirmPassword = "long-password";
    values.phone = "9876543210";
    values.address = "Office address";
    expect(validateRegistration("COLLECTION_CENTRE", values)).toHaveProperty("centreName");
    expect(validateRegistration("COLLECTION_CENTRE", values)).toHaveProperty("registrationNumber");
  });

  test("keeps veterinarian registration validation strict while server mapping is unresolved", () => {
    const values = emptyRegistrationValues();
    values.name = "Vet account";
    values.email = "vet@example.test";
    values.password = "long-password";
    values.confirmPassword = "long-password";
    expect(validateRegistration("VETERINARIAN", values)).toMatchObject({
      phone: "Phone number is required",
      licenseNumber: "Veterinary license number is required",
    });
    expect(registrationErrorMessage(new ApiError(
      "Veterinarian registration is unavailable until the legacy license identifier mapping is approved.",
      503,
    ))).toContain("mapping is approved");
  });

  test("does not expose unsafe registration failures", () => {
    expect(registrationErrorMessage(new ApiError("SQL detail password=secret", 500)))
      .toBe("Unable to complete registration right now. Please try again later.");
  });

  test("does not silently submit legacy centre codes as registration numbers", () => {
    const values = emptyRegistrationValues();
    values.name = "Centre account";
    values.email = "centre@example.test";
    values.password = "long-password";
    values.centreName = "Centre";
    values.registrationNumber = "NEW-REG-1";
    values.phone = "9876543210";
    values.address = "Office address";
    const payload = registrationPayload("COLLECTION_CENTRE", values);
    expect(payload).toHaveProperty("registrationNumber", "NEW-REG-1");
    expect(payload).not.toHaveProperty("code");
  });
});
