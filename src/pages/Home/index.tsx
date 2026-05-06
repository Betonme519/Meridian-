import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroLaptopShowcase from "./HeroLaptopShowcase";
import Flow from "./Flow";
import Explain from "./Explain";
import GpaMath from "./GpaMath";
import Honesty from "./Honesty";
import Control from "./Control";
import Feedback from "./Feedback";
import FinalCTA from "./FinalCTA";
import "./Home.css";

/**
 * Home page — composition of section components. Each section lives in its
 * own file so multiple agents can edit them in parallel without merge
 * conflicts.
 *
 * Note: the standalone Trust section (Trust.tsx) is currently NOT mounted —
 * its copy is rendered inline by HeroLaptopShowcase as the page-2 left
 * panel. Trust.tsx is kept for re-use.
 */
export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <Navbar />
      <HeroLaptopShowcase />
      <Flow />
      <Explain />
      <GpaMath />
      <Honesty />
      <Control />
      <Feedback />
      <FinalCTA />
      <Footer />
    </main>
  );
}
