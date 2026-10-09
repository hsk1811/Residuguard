import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/residuguard/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Farmer Account — ResiduGuard" },
      {
        name: "description",
        content:
          "Create your ResiduGuard farmer account and manage your dairy farm.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [organization, setOrganization] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
  role: "FARMER",
  name,
  email,
  password,
  phone,
  village,
  organization,
});

      setSuccess(
        "Account created successfully! Redirecting to sign in...",
      );

      setTimeout(() => {
        navigate({
          to: "/login",
        });
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Brand />

          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Already have an account?</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">
            Farmer Registration
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Create your ResiduGuard account
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Register your farm to manage cattle, treatments, milk
            batches and compliance records.
          </p>
        </div>

        <form onSubmit={submit} className="panel p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>

              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>

              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email Address</Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  disabled={loading}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">
                Confirm Password
              </Label>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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

            <div className="space-y-1.5">
              <Label htmlFor="village">Village</Label>

              <Input
                id="village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Enter your village"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="organization">
                Farm / Organization Name
              </Label>

              <Input
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Optional"
                disabled={loading}
              />
            </div>
          </div>

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

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Farmer Account"}

            {!loading && (
              <ArrowRight className="size-4" aria-hidden />
            )}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered?{" "}
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