import GPAWidget from "./GPAWidget";
import RiskCard from "./RiskCard";
import "./Dashboard.css";

/** Dashboard page skeleton — composes widgets. Replace placeholder content
 * as features land. */
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <GPAWidget />
        <RiskCard />
      </div>
    </main>
  );
}
