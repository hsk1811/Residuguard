import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";

import { Brand } from "@/components/residuguard/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roles } from "@/lib/roles";
import { loginUser } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { RoleId } from "@/lib/residuguard-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ResiduGuard Dairy Portal" },
      {
        name: "description",
        content:
          "Sign in to ResiduGuard as a farmer, veterinarian, collection centre, factory or regulatory authority.",
      },
      {
        property: "og:title",
        content: "Sign in — ResiduGuard Dairy Portal",
      },
      {
        property: "og:description",
        content:
          "Role-based access for farmers, vets, collection centres, factories and regulators.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [selected, setSelected] = useState<RoleId>("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useSession();
  const navigate = useNavigate();

  const active = roles.find((role) => role.id === selected)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    /*
     * Consumers do not have an account.
     * They directly use public batch verification.
     */
    if (selected === "consumer") {
      navigate({ to: "/verify" });
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email.trim(), password);

      /*
       * Store authentication information.
       */
      localStorage.setItem("residuguard.token", result.token);
      localStorage.setItem(
        "residuguard.user",
        JSON.stringify(result.user),
      );

      /*
       * Update frontend session.
       */
      signIn(selected);

      /*
       * Send the user to the dashboard
       * belonging to their database role.
       */
      const rolePaths: Record<string, string> = {
        FARMER: "/farmer",
        VETERINARIAN: "/veterinarian",
        COLLECTION_CENTRE: "/collection-centre",
        FACTORY: "/factory",
        AUTHORITY: "/authority",
      };

      const destination = rolePaths[result.user.role];

      if (!destination) {
        throw new Error("Your account does not have a valid role.");
      }

      navigate({
        to: destination as
          | "/farmer"
          | "/veterinarian"
          | "/collection-centre"
          | "/factory"
          | "/authority",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
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
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold">
          Sign in to ResiduGuard
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Select your role and sign in using your ResiduGuard account.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]"
        >
          {/* ROLE SELECTION */}
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role) => {
              const isActive = selected === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelected(role.id);
                    setError("");
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "panel p-5 text-left transition-colors",
                    isActive
                      ? "border-primary ring-2 ring-primary/25"
                      : "hover:border-primary/50",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-lg",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground",
                    )}
                  >
                    <role.icon className="size-5" aria-hidden />
                  </span>

                  <span className="mt-3 block font-heading text-base font-semibold text-heading">
                    {role.label}
                  </span>

                  <span className="mt-1 block text-sm text-muted-foreground">
                    {role.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* LOGIN PANEL */}
          <div className="panel h-fit p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Signing in as
            </p>

            <p className="mt-1 font-heading text-xl font-semibold text-heading">
              {active.label}
            </p>

            <p className="text-sm text-muted-foreground">
              {selected === "consumer"
                ? "Batch verification is available without an account."
                : `Sign in with your registered ${active.label} account.`}
            </p>

            {/* EMAIL + PASSWORD ARE NOT NEEDED FOR CONSUMER */}
            {selected !== "consumer" && (
              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="userid">Email</Label>

                  <Input
                    id="userid"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pass">Password</Label>

                  <Input
                    id="pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : selected === "consumer"
                  ? "Continue to batch verification"
                  : "Sign in"}

              {!loading && (
                <ArrowRight className="size-4" aria-hidden />
              )}
            </Button>

            {/* FARMER REGISTRATION */}
            {selected === "farmer" && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have a farmer account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </Link>
              </div>
            )}

            {/* VETERINARIAN REGISTRATION */}
            {selected === "vet" && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have a veterinarian account?{" "}
                <Link
                  to="/veterinarian-register"
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </Link>
              </div>
            )}

            {/* COLLECTION CENTRE REGISTRATION */}
            {selected === "collection" && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have a collection centre account?{" "}
                <Link
                  to="/register/collection_centre"
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </Link>
              </div>
            )}

            {/* FACTORY REGISTRATION */}
            {selected === "factory" && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have a factory account?{" "}
                <Link
                  to="/register/factory"
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </Link>
              </div>
            )}

            {/* REGULATORY AUTHORITY REGISTRATION */}
            {selected === "authority" && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have a regulatory authority account?{" "}
                <Link
                  to="/register/authority"
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </Link>
              </div>
            )}

            {/* CONSUMER INFORMATION */}
            <p className="mt-4 flex gap-2 rounded-md bg-info-soft p-3 text-xs text-info">
              <Info
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />

              Consumers do not need an account — batch verification is
              open to the public.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
