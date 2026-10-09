import type { Session } from "./AuthContext";
import type { AuthUser, UserRole } from "../../types/api";

const STORAGE_KEY = "residuguard.frontend-v2.session";
const supportedRoles: UserRole[] = ["FARMER", "VETERINARIAN", "COLLECTION_CENTRE", "FACTORY", "AUTHORITY"];

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) return false;
  if (!("id" in value) || typeof value.id !== "string") return false;
  if (!("name" in value) || typeof value.name !== "string") return false;
  if (!("email" in value) || typeof value.email !== "string") return false;
  if (!("role" in value) || typeof value.role !== "string" || !supportedRoles.includes(value.role as UserRole)) return false;
  return "organization" in value && (typeof value.organization === "string" || value.organization === null);
}

export function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null || !("token" in value) || typeof value.token !== "string" || value.token.length === 0 || !("user" in value)) return false;
  return isAuthUser(value.user);
}

export function readStoredSession(): Session | null {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return isSession(stored) ? stored : null;
  } catch { /* An absent or invalid local session starts signed out. */ }
  return null;
}

export function persistSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
