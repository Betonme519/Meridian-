import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageShellProps {
  children: ReactNode;
  /** Skip the footer (rare; used by pages that own the entire viewport). */
  hideFooter?: boolean;
}

/**
 * Standard page layout: fixed Navbar on top, page content in <main>, Footer
 * at the bottom. Pages render their own sections as `children`.
 */
export default function PageShell({ children, hideFooter }: PageShellProps) {
  return (
    <main className="bg-white min-h-screen">
      <Navbar />
      {children}
      {!hideFooter && <Footer />}
    </main>
  );
}
