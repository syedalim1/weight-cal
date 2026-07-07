import { Suspense } from "react";
import AIAnalyzer from "../components/AIAnalyzer";

export default function AIAnalyzerPage() {
  return (
    <div className="">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-zinc-400 font-mono text-sm">
            Loading AI Analyzer...
          </div>
        }
      >
        <AIAnalyzer />
      </Suspense>
    </div>
  );
}
