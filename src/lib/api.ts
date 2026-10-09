export type ApiCattle = {
  id: string;
  cattleId: string;
  name: string | null;
  breed: string | null;
  eligibility: "ELIGIBLE_BY_RECORD" | "HOLD" | "UNVERIFIED";
  withdrawalEnds: string[];
  farmer: {
    village: string;
    user: {
      name: string;
    };
  };
};

export async function fetchCattle(token: string | null): Promise<ApiCattle[]> {
  if (!token) throw new Error("Sign in with an authorized collection centre account to view supplier cattle.");
  const response = await fetch("http://localhost:3000/api/collection-centre/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
      ? result.error
      : "Failed to fetch authorized supplier cattle.";
    throw new Error(message);
  }

  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null || !("sources" in result) || !Array.isArray(result.sources)) {
    throw new Error("The collection centre API returned an invalid cattle response.");
  }
  return result.sources as ApiCattle[];
}

export type LoginUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: LoginUser;
};

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Login failed");
  }

  
  return data;
}
export type RegisterResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string | null;
  };
  profile: Record<string, unknown>;
};

export type RegisterData = {
  role:
    | "FARMER"
    | "VETERINARIAN"
    | "COLLECTION_CENTRE"
    | "FACTORY"
    | "AUTHORITY";

  name: string;
  email: string;
  password: string;

  organization?: string;

  // Common contact/details
  phone?: string;
  address?: string;
  village?: string;

  // Veterinarian
  licenseNumber?: string;
  specialization?: string;
  clinicName?: string;

  // Collection Centre
  centreName?: string;
  registrationNumber?: string;

  // Factory
  factoryName?: string;

  // Regulatory Authority
  department?: string;
  designation?: string;
  employeeId?: string;
  officeAddress?: string;
};

export async function registerUser(
  data: RegisterData,
): Promise<RegisterResponse> {
  const response = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Registration failed");
  }

  return result;
}
