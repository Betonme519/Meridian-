import { createContext } from "react";

export interface UserContextValue {
  profile: unknown | null;
}

export const UserContext = createContext<UserContextValue>({
  profile: null,
});
