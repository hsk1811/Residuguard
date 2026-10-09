import type { UserRole } from "../../types/api";

export const roleOptions: Array<{ role: UserRole; path: string; label: string; description: string }> = [
  { role: "FARMER", path: "farmer", label: "Farmer", description: "Cattle health and farm records" },
  { role: "VETERINARIAN", path: "veterinarian", label: "Veterinarian", description: "Treatment and withdrawal records" },
  { role: "COLLECTION_CENTRE", path: "collection-centre", label: "Collection centre", description: "Milk collection records" },
  { role: "FACTORY", path: "factory", label: "Factory", description: "Processing and package records" },
  { role: "AUTHORITY", path: "authority", label: "Authority", description: "Compliance oversight records" },
];

export function dashboardPathForRole(role: UserRole): string {
  const option = roleOptions.find((candidate) => candidate.role === role);
  if (!option) throw new Error("Unsupported account role");
  return `/dashboard/${option.path}`;
}

export function registrationPathForRole(role: UserRole): string {
  const option = roleOptions.find((candidate) => candidate.role === role);
  if (!option) throw new Error("Unsupported account role");
  return `/register/${option.path}`;
}

export function roleForRegistrationPath(path: string): UserRole | null {
  return roleOptions.find((candidate) => candidate.path === path)?.role ?? null;
}

export function roleLabel(role: UserRole): string {
  return roleOptions.find((candidate) => candidate.role === role)?.label ?? role;
}

export function roleGuardDestination(currentRole: UserRole | null, requiredRole: UserRole): string | null {
  if (!currentRole) return "/sign-in";
  if (currentRole !== requiredRole) return dashboardPathForRole(currentRole);
  return null;
}
