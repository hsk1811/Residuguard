interface PrismaErrorLike {
  code?: unknown;
  meta?: { target?: unknown };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueTarget(error: unknown): string[] {
  if (!isRecord(error) || !isRecord(error.meta)) return [];
  const target = error.meta.target;
  if (Array.isArray(target)) return target.filter((item): item is string => typeof item === "string");
  return typeof target === "string" ? [target] : [];
}

export function safeRegistrationFailure(error: unknown): { status: number; error: string } {
  const prismaError = (isRecord(error) ? error : {}) as PrismaErrorLike;
  if (prismaError.code === "P2002") {
    const target = uniqueTarget(error).join(" ").toLowerCase();
    if (target.includes("email")) return { status: 409, error: "An account with this email already exists" };
    if (target.includes("licensenumber")) return { status: 409, error: "A veterinarian with this license number is already registered" };
    if (target.includes("registrationnumber")) return { status: 409, error: "A centre or factory with this registration number is already registered" };
    if (target.includes("employeeid")) return { status: 409, error: "An authority with this employee ID is already registered" };
    return { status: 409, error: "Registration conflicts with an existing record" };
  }
  return { status: 500, error: "Unable to complete registration" };
}

export function isRegistrationRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

export function registrationString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}
