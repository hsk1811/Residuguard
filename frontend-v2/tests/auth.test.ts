import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { registerUser, signIn } from "../src/services/api/auth";
import { ApiError } from "../src/services/api/client";
import { clearStoredSession, persistSession, readStoredSession } from "../src/features/auth/sessionStorage";
import { dashboardPathForRole, registrationPathForRole, roleGuardDestination } from "../src/features/auth/roles";
import { assertRegistrationRoleProfile, emptyRegistrationValues, registrationPayload, validateRegistration, type RegistrationValues } from "../src/features/auth/registrationSchemas";
import { registrationErrorMessage } from "../src/features/auth/registrationErrors";

const initialFetch = globalThis.fetch;
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const baseValues: RegistrationValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  village: "",
  organization: "",
  licenseNumber: "",
  specialization: "",
  clinicName: "",
  address: "",
  centreName: "",
  registrationNumber: "",
  factoryName: "",
  department: "",
  designation: "",
  employeeId: "",
  officeAddress: "",
};

function validValues(patch: Partial<RegistrationValues> = {}): RegistrationValues {
  return {
    ...baseValues,
    name: "Test User",
    email: "test@example.test",
    password: "a-long-test-password",
    confirmPassword: "a-long-test-password",
    phone: "555-0101",
    village: "Sample village",
    ...patch,
  };
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => {
  globalThis.fetch = initialFetch;
  if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

describe("registration validation and payloads", () => {
  it("starts every role form field empty", () => {
    expect(Object.values(emptyRegistrationValues()).every((value) => value === "")).toBe(true);
  });

  it("rejects invalid email, short password, missing role fields, and mismatched confirmation", () => {
    const errors = validateRegistration("FARMER", validValues({ email: "bad", password: "short", village: "", confirmPassword: "different" }));
    expect(errors.email).toBe("Enter a valid email address");
    expect(errors.password).toBe("Password must be at least 8 characters");
    expect(errors.village).toBe("Village is required");
    expect(errors.confirmPassword).toBe("Passwords do not match");
  });

  it("validates a veterinarian form and builds only the backend fields with its fixed role", () => {
    const values = validValues({ licenseNumber: "VET-123", specialization: "Large animal", clinicName: "Rural Clinic", address: "Main road" });
    expect(validateRegistration("VETERINARIAN", values)).toEqual({});
    expect(registrationPayload("VETERINARIAN", values)).toEqual({
      role: "VETERINARIAN",
      name: "Test User",
      email: "test@example.test",
      password: "a-long-test-password",
      phone: "555-0101",
      licenseNumber: "VET-123",
      specialization: "Large animal",
      clinicName: "Rural Clinic",
      address: "Main road",
    });
  });

  it("maps the other four role forms to their matching backend fields", () => {
    const farmer = validValues({ organization: "Farm Co" });
    const collection = validValues({ centreName: "Centre", registrationNumber: "CC-1", address: "Road" });
    const factory = validValues({ factoryName: "Dairy Plant", registrationNumber: "F-1", address: "Road" });
    const authority = validValues({ department: "Food Safety", designation: "Officer", employeeId: "E-1", officeAddress: "Office" });
    expect(validateRegistration("FARMER", farmer)).toEqual({});
    expect(validateRegistration("COLLECTION_CENTRE", collection)).toEqual({});
    expect(validateRegistration("FACTORY", factory)).toEqual({});
    expect(validateRegistration("AUTHORITY", authority)).toEqual({});
    expect(registrationPayload("FARMER", farmer)).toMatchObject({ role: "FARMER", village: "Sample village", organization: "Farm Co" });
    expect(registrationPayload("COLLECTION_CENTRE", collection)).toMatchObject({ role: "COLLECTION_CENTRE", centreName: "Centre", registrationNumber: "CC-1", address: "Road" });
    expect(registrationPayload("FACTORY", factory)).toMatchObject({ role: "FACTORY", factoryName: "Dairy Plant", registrationNumber: "F-1", address: "Road" });
    expect(registrationPayload("AUTHORITY", authority)).toMatchObject({ role: "AUTHORITY", department: "Food Safety", designation: "Officer", employeeId: "E-1", officeAddress: "Office" });
  });
});

describe("verified authentication API contracts", () => {
  it("posts a farmer registration and handles duplicate email errors", async () => {
    let submittedBody = "";
    globalThis.fetch = async (input, init) => {
      expect(String(input)).toEndWith("/api/auth/register");
      submittedBody = String(init?.body);
      return response({ message: "Farmer registration successful", user: { id: "u1", name: "Test User", email: "test@example.test", role: "FARMER", organization: null, farmer: { village: "Sample village" } } }, 201);
    };
    const payload = registrationPayload("FARMER", validValues());
    const result = await registerUser(payload);
    expect(result.user.role).toBe("FARMER");
    expect(result.user).toHaveProperty("farmer");
    expect(() => assertRegistrationRoleProfile("FARMER", result)).not.toThrow();
    expect(JSON.parse(submittedBody)).toEqual(payload);

    globalThis.fetch = async () => response({ error: "An account with this email already exists" }, 409);
    await expect(registerUser(payload)).rejects.toMatchObject<ApiError>({ status: 409, message: "An account with this email already exists" });
  });

  it("reports veterinarian registration as unavailable while the legacy license mapping is unresolved", async () => {
    globalThis.fetch = async () => response({ error: "Veterinarian registration is unavailable until the legacy license identifier mapping is approved." }, 503);
    const payload = registrationPayload("VETERINARIAN", validValues({ licenseNumber: "VET-123" }));
    await expect(registerUser(payload)).rejects.toMatchObject<ApiError>({ status: 503 });
    try {
      await registerUser(payload);
    } catch (error) {
      expect(registrationErrorMessage(error)).toContain("mapping is approved");
    }
  });

  it("shows safe server validation errors and hides internal 500 details", async () => {
    globalThis.fetch = async () => response({ error: "A veterinarian with this license number is already registered" }, 409);
    const payload = registrationPayload("VETERINARIAN", validValues({ licenseNumber: "VET-123" }));
    try {
      await registerUser(payload);
    } catch (error) {
      expect(error).toMatchObject<ApiError>({ status: 409 });
      expect(registrationErrorMessage(error)).toBe("A veterinarian with this license number is already registered");
    }

    globalThis.fetch = async () => response({ error: "SQL error; password=private-value" }, 500);
    try {
      await registerUser(payload);
    } catch (error) {
      expect(registrationErrorMessage(error)).toBe("Unable to complete registration right now. Please try again later.");
      expect(registrationErrorMessage(error)).not.toContain("private-value");
      expect(registrationErrorMessage(error)).not.toContain("SQL");
    }
  });

  it("surfaces failed login and returns the role from successful login", async () => {
    globalThis.fetch = async (_input, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({ email: "test@example.test", password: "typed-password" });
      return response({ error: "Invalid email or password" }, 401);
    };
    await expect(signIn("test@example.test", "typed-password")).rejects.toMatchObject<ApiError>({ status: 401, message: "Invalid email or password" });

    globalThis.fetch = async () => response({ message: "Login successful", token: "test-jwt", user: { id: "u1", name: "Vet User", email: "vet@example.test", role: "VETERINARIAN", organization: null } });
    const result = await signIn("vet@example.test", "typed-password");
    expect(result.user.role).toBe("VETERINARIAN");
  });
});

describe("session persistence and role redirects", () => {
  const data = new Map<string, string>();

  beforeEach(() => {
    data.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
        removeItem: (key: string) => { data.delete(key); },
      },
    });
  });

  it("persists across a refresh, clears on logout, and maps all roles to their own dashboard", () => {
    const session = { token: "server-issued-jwt", user: { id: "u1", name: "Vet User", email: "vet@example.test", role: "VETERINARIAN" as const, organization: null } };
    persistSession(session);
    expect(readStoredSession()).toEqual(session);
    expect(dashboardPathForRole("VETERINARIAN")).toBe("/dashboard/veterinarian");
    expect(registrationPathForRole("VETERINARIAN")).toBe("/register/veterinarian");
    expect(dashboardPathForRole("FARMER")).toBe("/dashboard/farmer");
    expect(dashboardPathForRole("COLLECTION_CENTRE")).toBe("/dashboard/collection-centre");
    expect(dashboardPathForRole("FACTORY")).toBe("/dashboard/factory");
    expect(dashboardPathForRole("AUTHORITY")).toBe("/dashboard/authority");
    expect(roleGuardDestination(null, "FARMER")).toBe("/sign-in");
    expect(roleGuardDestination("VETERINARIAN", "FARMER")).toBe("/dashboard/veterinarian");
    expect(roleGuardDestination("FARMER", "FARMER")).toBeNull();
    clearStoredSession();
    expect(readStoredSession()).toBeNull();
  });
});
