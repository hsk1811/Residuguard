import { createContext } from "react";
import type { AuthUser } from "../../types/api";

export interface Session { token: string; user: AuthUser }
export interface AuthContextValue {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
