import { useCallback, useMemo, useState, type ReactNode } from "react";
import { signIn as requestSignIn } from "../../services/api/auth";
import { AuthContext, type Session } from "./AuthContext";
import { clearStoredSession, isSession, persistSession, readStoredSession } from "./sessionStorage";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await requestSignIn(email, password);
    if (!isSession(result)) throw new Error("The server returned an invalid authentication response.");
    const next = { token: result.token, user: result.user };
    persistSession(next);
    setSession(next);
  }, []);
  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);
  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
