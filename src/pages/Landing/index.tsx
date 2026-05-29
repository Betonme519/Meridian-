import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroLaptopShowcase from "./HeroLaptopShowcase";
import Flow from "./Flow";
import Explain from "./Explain";
import GpaMath from "./GpaMath";
import Transparency from "./Transparency";
import Control from "./Control";
import Feedback from "./Feedback";
import Faq from "./Faq";
import FinalCTA from "./FinalCTA";
import "./Landing.css";

/**
 * Home page — composition of section components. Each section lives in its
 * own file so multiple agents can edit them in parallel without merge
 * conflicts.
 *
 * Page-2 left panel inside HeroLaptopShowcase carries the new "建立信任 /
 * 计算你的整个学业路径" copy with sequential check-in animation. The older
 * "一个 AI 凭什么帮我选课？" transparency copy is folded into Honesty.tsx
 * as that section's hero. The standalone Trust.tsx is kept unmounted for
 * possible re-use elsewhere.
 */
export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <Navbar />
      <HeroLaptopShowcase />
      <Flow />
      <Explain />
      <GpaMath />
      <Transparency />
      <Control />
      <Feedback />
      <Faq />
      <FinalCTA />
      <Footer />
    </main>
  );
}
