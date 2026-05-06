/** Mock user profile shape — placeholder. Real auth/user state should land
 * in src/context/UserContext.tsx; this file is for sample/seed data. */
export interface UserProfile {
  id: string;
  name: string;
  major?: string;
  year?: number;
  targetGPA?: number;
}

export const mockUserProfile: UserProfile = {
  id: "demo",
  name: "Demo Student",
};
