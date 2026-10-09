import { apiRequest } from "./client";
import type { LoginResponse, RegistrationResponse } from "../../types/api";
import type { RegisterPayload } from "../../features/auth/registrationSchemas";

export function signIn(email: string, password: string) {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function registerUser(payload: RegisterPayload) {
  return apiRequest<RegistrationResponse>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

