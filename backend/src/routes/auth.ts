import { prisma } from "../lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

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
// FARMER REGISTRATION
// -------------------------

export async function register(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const phone = body.phone?.trim();
    const village = body.village?.trim();
    const organization = body.organization?.trim() || null;

    if (!name || !email || !password || !phone || !village) {
      return Response.json(
        {
          error:
            "Name, email, password, phone and village are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          error: "Password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

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

    const passwordHash = await Bun.password.hash(password);

    const user = await prisma.user.create({
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

    return Response.json(
      {
        message: "Farmer registration successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          farmer: {
            id: user.farmer?.id,
            village: user.farmer?.village,
            phone: user.farmer?.phone,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return Response.json(
      { error: "Unable to register farmer" },
      { status: 500 },
    );
  }
}
