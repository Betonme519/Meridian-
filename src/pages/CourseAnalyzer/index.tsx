import UploadPanel from "./UploadPanel";
import AnalysisResult from "./AnalysisResult";
import "./CourseAnalyzer.css";

/** Course analyzer page skeleton — upload manual + analyze + show results. */
export default function CourseAnalyzerPage() {
  return (
    <main className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-semibold mb-6">Course Analyzer</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <UploadPanel />
        <AnalysisResult />
      </div>
    </main>
  );
}
