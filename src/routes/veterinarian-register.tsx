import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import { Brand } from "@/components/residuguard/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/api";

export const Route = createFileRoute("/veterinarian-register")({
  head: () => ({
    meta: [
      {
        title: "Veterinarian Registration — ResiduGuard",
      },
      {
        name: "description",
        content: "Create a ResiduGuard veterinarian account.",
      },
    ],
  }),
  component: VeterinarianRegistrationPage,
});

function VeterinarianRegistrationPage() {
  const navigate = useNavigate();

  // -------------------------
  // FORM STATE
  // -------------------------

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------
  // SUBMIT
  // -------------------------

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!licenseNumber.trim()) {
      setError("Please enter your veterinary license number.");
      return;
    }

    if (!specialization.trim()) {
      setError("Please enter your specialization.");
      return;
    }

    if (!clinicName.trim()) {
      setError("Please enter your clinic or hospital name.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter your clinic address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // -------------------------
      // VETERINARIAN REGISTRATION DATA
      // -------------------------

      const registrationData = {
        role: "VETERINARIAN" as const,
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        specialization: specialization.trim(),
        clinicName: clinicName.trim(),
        address: address.trim(),
      };

      console.log(
        "Veterinarian registration data:",
        registrationData,
      );

      await registerUser(registrationData);

      setSuccess(
        "Veterinarian account created successfully. Redirecting to login...",
      );

      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // UI
  // -------------------------

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Brand />

          <Button asChild variant="ghost" size="sm">
            <Link to="/login">
              <ArrowLeft className="mr-2 size-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>

          <h1 className="text-3xl font-semibold">
            Veterinarian Registration
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Create your professional ResiduGuard account to manage
            livestock treatments, prescriptions and withdrawal
            periods.
          </p>
        </div>

        <form onSubmit={submit} className="panel p-6 sm:p-8">
          <div className="space-y-8">

            {/* =========================
                PERSONAL INFORMATION
            ========================= */}

            <section>
              <h2 className="font-heading text-lg font-semibold text-heading">
                Personal Information
              </h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">

                {/* Full Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name">
                    Full Name *
                  </Label>

                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Amit Sharma"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email Address *
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Phone Number *
                  </Label>

                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    placeholder="9876543210"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </section>

            {/* =========================
                PROFESSIONAL INFORMATION
            ========================= */}

            <section>
              <h2 className="font-heading text-lg font-semibold text-heading">
                Professional Information
              </h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">

                {/* License Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="licenseNumber">
                    Veterinary License Number *
                  </Label>

                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) =>
                      setLicenseNumber(e.target.value)
                    }
                    placeholder="VET-12345"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Specialization */}
                <div className="space-y-1.5">
                  <Label htmlFor="specialization">
                    Specialization *
                  </Label>

                  <Input
                    id="specialization"
                    value={specialization}
                    onChange={(e) =>
                      setSpecialization(e.target.value)
                    }
                    placeholder="Veterinary Medicine"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Clinic Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="clinicName">
                    Clinic / Hospital Name *
                  </Label>

                  <Input
                    id="clinicName"
                    value={clinicName}
                    onChange={(e) =>
                      setClinicName(e.target.value)
                    }
                    placeholder="Sharma Veterinary Clinic"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Clinic Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">
                    Clinic Address *
                  </Label>

                  <Input
                    id="address"
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                    placeholder="Enter complete clinic address"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </section>

            {/* =========================
                ACCOUNT SECURITY
            ========================= */}

            <section>
              <h2 className="font-heading text-lg font-semibold text-heading">
                Account Security
              </h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    Password *
                  </Label>

                  <div className="relative">
                    <Input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Minimum 8 characters"
                      disabled={loading}
                      className="pr-10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">
                    Confirm Password *
                  </Label>

                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value,
                        )
                      }
                      placeholder="Re-enter your password"
                      disabled={loading}
                      className="pr-10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* =========================
              ERROR / SUCCESS
          ========================= */}

          {error && (
            <p className="mt-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-6 rounded-md bg-green-500/10 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          {/* =========================
              SUBMIT BUTTON
          ========================= */}

          <Button
            type="submit"
            className="mt-8 w-full"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Veterinarian Account"}

            {!loading && (
              <ShieldCheck
                className="ml-2 size-4"
                aria-hidden
              />
            )}
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
