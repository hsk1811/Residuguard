import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorMessage } from "../components/ui/Feedback";
import { FormField } from "../components/ui/FormField";
import { useAuth } from "../features/auth/useAuth";
import { dashboardPathForRole } from "../features/auth/roles";

export function SignInPage() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session) navigate(dashboardPathForRole(session.user.role), { replace: true });
  }, [session, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setBusy(true);
    try { await signIn(email, password); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Sign in failed. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="signin-page mx-auto grid max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr]">
    <section className="max-w-xl">
      <p className="eyebrow"><ShieldCheck size={15} aria-hidden="true" /> Dairy assurance platform</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-emerald-950 sm:text-5xl">Confidence in every step from farm to table.</h1>
      <p className="mt-5 max-w-lg text-lg leading-8 text-stone-600">Keep animal health records and dairy traceability connected in one clear place.</p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm text-stone-600"><span className="feature-pill">Animal health</span><span className="feature-pill">Residue compliance</span><span className="feature-pill">Supply chain records</span></div>
    </section>
    <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="mb-6"><p className="eyebrow">Welcome back</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Sign in to ResiduGuard</h2><p className="mt-2 text-sm text-stone-500">Use the account registered with your organization.</p></div>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField label="Email address" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <FormField label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} trailing={<button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button>} />
        <Button className="w-full" type="submit" disabled={busy}>{busy ? "Signing in…" : <>Sign in <ArrowRight size={17} aria-hidden="true" /></>}</Button>
      </form>
      <p className="auth-secondary-link">New to ResiduGuard? <Link to="/register">Create an account</Link></p>
      <p className="auth-session-note">Your session is retained in this browser so it survives a page refresh. Secure HttpOnly-cookie sessions are not supported by the current backend.</p>
    </Card>
  </div>;
}
