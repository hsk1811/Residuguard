export type ApiCattle = {
  id: string;
  cattleId: string;
  name: string | null;
  breed: string | null;
  sex: string | null;
  farmer: {
    village: string;
    user: {
      name: string;
    };
  };
  treatments: {
    id: string;
    medicineName: string;
    dosage: string | null;
    administeredAt: string;
    withdrawalEnds: string | null;
    reason: string | null;
  }[];
};

export async function fetchCattle(): Promise<ApiCattle[]> {
  const response = await fetch("http://localhost:3000/api/cattle");

  if (!response.ok) {
    throw new Error("Failed to fetch cattle");
  }

  return response.json();
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
    farmer: {
      id: string;
      village: string;
      phone: string;
    };
  };
};

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  village: string;
  organization?: string;
}): Promise<RegisterResponse> {
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