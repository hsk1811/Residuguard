import { ApiError } from "../../services/api/client";

const safeValidationMessages = new Set([
  "Request body must be valid JSON",
  "Request body must be a JSON object",
  "Invalid registration role",
  "Name, email and password are required",
  "Email address is not valid",
  "Password must be at least 8 characters long",
  "An account with this email already exists",
  "Phone and village are required for farmer registration",
  "Phone and license number are required for veterinarian registration",
  "A veterinarian with this license number is already registered",
  "Centre name, registration number, phone and address are required for collection centre registration",
  "A collection centre with this registration number is already registered",
  "A centre or factory with this registration number is already registered",
  "Factory name, registration number, phone and address are required for factory registration",
  "A factory with this registration number is already registered",
  "Department, designation, employee ID, phone and office address are required for authority registration",
  "An authority with this employee ID is already registered",
  "Veterinarian registration is unavailable until the legacy license identifier mapping is approved.",
]);

export function registrationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Registration failed. Please try again.";
  if ([400, 409, 503].includes(error.status) && safeValidationMessages.has(error.message)) {
    return error.message;
  }
  if (error.status === 0) return error.message;
  return "Unable to complete registration right now. Please try again later.";
}
