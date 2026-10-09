export interface TransitionalCentreProfile {
  userId: string | null;
  user: { id: string } | null;
  centreName: string | null;
  registrationNumber: string | null;
  phone: string | null;
  address: string | null;
}

export type CompleteCentreProfile = TransitionalCentreProfile & {
  userId: string;
  user: { id: string };
  centreName: string;
  registrationNumber: string;
  phone: string;
  address: string;
};

export interface TransitionalFactoryProfile {
  userId: string | null;
  user: { id: string } | null;
  factoryName: string | null;
  registrationNumber: string | null;
  phone: string | null;
  address: string | null;
}

export type CompleteFactoryProfile = TransitionalFactoryProfile & {
  userId: string;
  user: { id: string };
  factoryName: string;
  registrationNumber: string;
  phone: string;
  address: string;
};

function hasText(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isCompleteCentreProfile(profile: TransitionalCentreProfile): profile is CompleteCentreProfile {
  return hasText(profile.userId) && profile.user?.id === profile.userId && hasText(profile.centreName)
    && hasText(profile.registrationNumber) && hasText(profile.phone) && hasText(profile.address);
}

export function canReceiveFarmerAccessGrant(profile: TransitionalCentreProfile): profile is CompleteCentreProfile {
  return isCompleteCentreProfile(profile);
}

export function isCompleteFactoryProfile(profile: TransitionalFactoryProfile): profile is CompleteFactoryProfile {
  return hasText(profile.userId) && profile.user?.id === profile.userId && hasText(profile.factoryName)
    && hasText(profile.registrationNumber) && hasText(profile.phone) && hasText(profile.address);
}

export function profileUserLookup(userId: string): { userId: string } {
  return { userId };
}

export type ProfileCompleteness = "COMPLETE" | "INCOMPLETE_LEGACY";

export function profileCompleteness(userId: string | null, requiredValues: Array<string | null>): ProfileCompleteness {
  return hasText(userId) && requiredValues.every(hasText) ? "COMPLETE" : "INCOMPLETE_LEGACY";
}

export const VETERINARIAN_REGISTRATION_BLOCK_MESSAGE =
  "Veterinarian registration is unavailable until the legacy license identifier mapping is approved.";
