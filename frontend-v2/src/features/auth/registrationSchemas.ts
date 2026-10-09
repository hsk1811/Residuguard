import { z } from "zod";
import type { RegistrationResponse, UserRole } from "../../types/api";

export const registrationFields = [
  "name", "email", "password", "confirmPassword", "phone", "village", "organization",
  "licenseNumber", "specialization", "clinicName", "address", "centreName", "registrationNumber",
  "factoryName", "department", "designation", "employeeId", "officeAddress",
] as const;

export type RegistrationField = typeof registrationFields[number];
export type RegistrationValues = Record<RegistrationField, string>;

export function emptyRegistrationValues(): RegistrationValues {
  return Object.fromEntries(registrationFields.map((key) => [key, ""])) as RegistrationValues;
}

const required = (label: string) => z.string().trim().min(1, `${label} is required`);
const phone = required("Phone number").regex(/^\+?[0-9().\s-]{7,20}$/, "Enter a valid phone number");
const email = z.string().trim().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters");
const optional = z.string().trim().optional();
const common = {
  name: required("Name"),
  email,
  password,
  confirmPassword: required("Confirm password"),
};
const passwordMatch = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.refine(
  (values) => values.password === values.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] },
);

export const farmerRegistrationSchema = passwordMatch(z.object({
  ...common,
  phone,
  village: required("Village"),
  organization: optional,
}));

export const veterinarianRegistrationSchema = passwordMatch(z.object({
  ...common,
  phone,
  licenseNumber: required("Veterinary license number"),
  specialization: optional,
  clinicName: optional,
  address: optional,
}));

export const collectionCentreRegistrationSchema = passwordMatch(z.object({
  ...common,
  centreName: required("Centre name"),
  registrationNumber: required("Registration number"),
  phone,
  address: required("Address"),
  village: optional,
}));

export const factoryRegistrationSchema = passwordMatch(z.object({
  ...common,
  factoryName: required("Factory name"),
  registrationNumber: required("Registration number"),
  phone,
  address: required("Address"),
}));

export const authorityRegistrationSchema = passwordMatch(z.object({
  ...common,
  department: required("Department"),
  designation: required("Designation"),
  employeeId: required("Employee ID"),
  phone,
  officeAddress: required("Office address"),
}));

const schemaByRole = {
  FARMER: farmerRegistrationSchema,
  VETERINARIAN: veterinarianRegistrationSchema,
  COLLECTION_CENTRE: collectionCentreRegistrationSchema,
  FACTORY: factoryRegistrationSchema,
  AUTHORITY: authorityRegistrationSchema,
};

export function validateRegistration(role: UserRole, values: RegistrationValues): Partial<Record<RegistrationField, string>> {
  const result = schemaByRole[role].safeParse(values);
  if (result.success) return {};
  const errors: Partial<Record<RegistrationField, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && registrationFields.includes(key as RegistrationField)) {
      errors[key as RegistrationField] ??= issue.message;
    }
  }
  return errors;
}

function optionalValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export type RegisterPayload =
  | { role: "FARMER"; name: string; email: string; password: string; phone: string; village: string; organization?: string }
  | { role: "VETERINARIAN"; name: string; email: string; password: string; phone: string; licenseNumber: string; specialization?: string; clinicName?: string; address?: string }
  | { role: "COLLECTION_CENTRE"; name: string; email: string; password: string; centreName: string; registrationNumber: string; phone: string; address: string; village?: string }
  | { role: "FACTORY"; name: string; email: string; password: string; factoryName: string; registrationNumber: string; phone: string; address: string }
  | { role: "AUTHORITY"; name: string; email: string; password: string; department: string; designation: string; employeeId: string; phone: string; officeAddress: string };

export function registrationPayload(role: UserRole, values: RegistrationValues): RegisterPayload {
  const base = { name: values.name.trim(), email: values.email.trim(), password: values.password };
  switch (role) {
    case "FARMER": {
      const organization = optionalValue(values.organization);
      return { ...base, role, phone: values.phone.trim(), village: values.village.trim(), ...(organization ? { organization } : {}) };
    }
    case "VETERINARIAN": {
      const specialization = optionalValue(values.specialization);
      const clinicName = optionalValue(values.clinicName);
      const address = optionalValue(values.address);
      return { ...base, role, phone: values.phone.trim(), licenseNumber: values.licenseNumber.trim(), ...(specialization ? { specialization } : {}), ...(clinicName ? { clinicName } : {}), ...(address ? { address } : {}) };
    }
    case "COLLECTION_CENTRE": {
      const village = optionalValue(values.village);
      return { ...base, role, centreName: values.centreName.trim(), registrationNumber: values.registrationNumber.trim(), phone: values.phone.trim(), address: values.address.trim(), ...(village ? { village } : {}) };
    }
    case "FACTORY": return { ...base, role, factoryName: values.factoryName.trim(), registrationNumber: values.registrationNumber.trim(), phone: values.phone.trim(), address: values.address.trim() };
    case "AUTHORITY": return { ...base, role, department: values.department.trim(), designation: values.designation.trim(), employeeId: values.employeeId.trim(), phone: values.phone.trim(), officeAddress: values.officeAddress.trim() };
  }
}

export function assertRegistrationRoleProfile(role: UserRole, response: RegistrationResponse): void {
  const profileKey = {
    FARMER: "farmer",
    VETERINARIAN: "veterinarian",
    COLLECTION_CENTRE: "collectionCentre",
    FACTORY: "factory",
    AUTHORITY: "authority",
  }[role];
  if (response.user.role !== role) {
    throw new Error("The server returned an account with a different role. Contact support before signing in.");
  }
  const profile = response.user[profileKey];
  if (typeof profile !== "object" || profile === null) {
    throw new Error(`The server did not return the expected ${role.toLowerCase()} profile.`);
  }
}
