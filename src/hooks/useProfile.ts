// Profile state hook: current profile + updateProfile / refresh helpers.
// Re-export of the ProfileContext hook so call sites don't need to know
// the context implementation lives elsewhere (mirrors useAuth.ts pattern).
export { useProfileContext as useProfile } from "@/context/ProfileContext";
