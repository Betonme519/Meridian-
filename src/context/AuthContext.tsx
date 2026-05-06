import { createContext } from "react";

export interface AuthContextValue {
  user: unknown | null;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
});
