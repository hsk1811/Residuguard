import { prisma } from "../lib/prisma";
import { jwtVerify, SignJWT } from "jose";
import { isRegistrationRecord, registrationString, safeRegistrationFailure } from "./registrationErrors";
import { VETERINARIAN_REGISTRATION_BLOCK_MESSAGE } from "./profileCompatibility";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface AuthIdentity {
  userId: string;
  role: string;
}

export async function verifyBearerToken(request: Request): Promise<AuthIdentity | null> {
  const authorization = request.headers.get("Authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

// -------------------------
// LOGIN
// -------------------------

export async function login(request: Request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const passwordValid = await Bun.password.verify(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await new SignJWT({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return Response.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}

// -------------------------
// REGISTRATION
// -------------------------

type RegisterRole =
  | "FARMER"
  | "VETERINARIAN"
  | "COLLECTION_CENTRE"
  | "FACTORY"
  | "AUTHORITY";

export async function register(request: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
    if (!isRegistrationRecord(rawBody)) {
      return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }
    const body = rawBody;

    // -------------------------
    // COMMON FIELDS
    // -------------------------

    const name = registrationString(body, "name");
    const email = registrationString(body, "email").toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const organization = registrationString(body, "organization") || null;

    const role = (registrationString(body, "role") || "FARMER").toUpperCase() as RegisterRole;

    const allowedRoles: RegisterRole[] = [
      "FARMER",
      "VETERINARIAN",
      "COLLECTION_CENTRE",
      "FACTORY",
      "AUTHORITY",
    ];

    if (!allowedRoles.includes(role)) {
      return Response.json(
        {
          error: "Invalid registration role",
        },
        { status: 400 },
      );
    }

    if (!name || !email || !password) {
      return Response.json(
        {
          error: "Name, email and password are required",
        },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Email address is not valid" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        {
          error: "Password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

    if (role === "VETERINARIAN") {
      const phone = registrationString(body, "phone");
      const licenseNumber = registrationString(body, "licenseNumber");
      if (!phone || !licenseNumber) {
        return Response.json(
          { error: "Phone and license number are required for veterinarian registration" },
          { status: 400 },
        );
      }
      return Response.json(
        { error: VETERINARIAN_REGISTRATION_BLOCK_MESSAGE },
        { status: 503 },
      );
    }

    // -------------------------
    // CHECK EXISTING USER
    // -------------------------

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        {
          error: "An account with this email already exists",
        },
        { status: 409 },
      );
    }

    // -------------------------
    // PASSWORD HASH
    // -------------------------

    const passwordHash = await Bun.password.hash(password);

    // =========================================================
    // FARMER REGISTRATION
    // =========================================================

    if (role === "FARMER") {
      const phone = registrationString(body, "phone");
      const village = registrationString(body, "village");

      if (!phone || !village) {
        return Response.json(
          {
            error:
              "Phone and village are required for farmer registration",
          },
          { status: 400 },
        );
      }

      const user = await prisma.$transaction(async (tx) => {
        return await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "FARMER",
            organization,

            farmer: {
              create: {
                village,
                phone,
              },
            },
          },

          include: {
            farmer: true,
          },
        });
      });

      return Response.json(
        {
          message: "Farmer registration successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            farmer: user.farmer,
          },
        },
        { status: 201 },
      );
    }

    // =========================================================
    // COLLECTION CENTRE REGISTRATION
    // =========================================================

    if (role === "COLLECTION_CENTRE") {
      const centreName = registrationString(body, "centreName");
      const registrationNumber = registrationString(body, "registrationNumber");
      const phone = registrationString(body, "phone");
      const address = registrationString(body, "address");
      const village = registrationString(body, "village") || null;

      if (
        !centreName ||
        !registrationNumber ||
        !phone ||
        !address
      ) {
        return Response.json(
          {
            error:
              "Centre name, registration number, phone and address are required for collection centre registration",
          },
          { status: 400 },
        );
      }

      const user = await prisma.$transaction(async (tx) => {
        return await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "COLLECTION_CENTRE",
            organization,

            collectionCentre: {
              create: {
                centreName,
                registrationNumber,
                phone,
                address,
                village,
              },
            },
          },

          include: {
            collectionCentre: true,
          },
        });
      });

      return Response.json(
        {
          message: "Collection centre registration successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            collectionCentre: user.collectionCentre,
          },
        },
        { status: 201 },
      );
    }

    // =========================================================
    // FACTORY REGISTRATION
    // =========================================================

    if (role === "FACTORY") {
      const factoryName = registrationString(body, "factoryName");
      const registrationNumber = registrationString(body, "registrationNumber");
      const phone = registrationString(body, "phone");
      const address = registrationString(body, "address");

      if (
        !factoryName ||
        !registrationNumber ||
        !phone ||
        !address
      ) {
        return Response.json(
          {
            error:
              "Factory name, registration number, phone and address are required for factory registration",
          },
          { status: 400 },
        );
      }

      const user = await prisma.$transaction(async (tx) => {
        return await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "FACTORY",
            organization,

            factory: {
              create: {
                factoryName,
                registrationNumber,
                phone,
                address,
              },
            },
          },

          include: {
            factory: true,
          },
        });
      });

      return Response.json(
        {
          message: "Factory registration successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            factory: user.factory,
          },
        },
        { status: 201 },
      );
    }

    // =========================================================
    // AUTHORITY REGISTRATION
    // =========================================================

    if (role === "AUTHORITY") {
      const department = registrationString(body, "department");
      const designation = registrationString(body, "designation");
      const employeeId = registrationString(body, "employeeId");
      const phone = registrationString(body, "phone");
      const officeAddress = registrationString(body, "officeAddress");

      if (
        !department ||
        !designation ||
        !employeeId ||
        !phone ||
        !officeAddress
      ) {
        return Response.json(
          {
            error:
              "Department, designation, employee ID, phone and office address are required for authority registration",
          },
          { status: 400 },
        );
      }

      const user = await prisma.$transaction(async (tx) => {
        return await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "AUTHORITY",
            organization,

            authority: {
              create: {
                department,
                designation,
                employeeId,
                phone,
                officeAddress,
              },
            },
          },

          include: {
            authority: true,
          },
        });
      });

      return Response.json(
        {
          message: "Authority registration successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            authority: user.authority,
          },
        },
        { status: 201 },
      );
    }

    // -------------------------
    // FALLBACK
    // -------------------------

    return Response.json(
      {
        error: "Unsupported registration role",
      },
      { status: 400 },
    );
  } catch (error) {
    // Do not log exception objects here: database errors may include SQL or
    // query metadata. In particular, never log the submitted request body.
    console.error("Registration failed due to a server-side error");
    const failure = safeRegistrationFailure(error);
    return Response.json({ error: failure.error }, { status: failure.status });
  }
}
