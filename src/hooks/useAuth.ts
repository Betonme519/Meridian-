// Auth state hook: current user + login/register/logout helpers.
// Re-export of the AuthContext hook so call sites don't need to know
// the context implementation lives elsewhere.
export { useAuthContext as useAuth } from "@/context/AuthContext";
