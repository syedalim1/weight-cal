import UnifiedCalculator from "../components/UnifiedCalculator";

export const metadata = {
  title: "Calculator | Steel Arc",
  description: "Unified Steel Furniture Calculator",
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white p-6 md:p-10 pt-20">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/30 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <div className="space-y-1 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Unified Calculator</h1>
          <p className="text-zinc-400">Configure pipe sizes manually or let AI estimate dimensions.</p>
        </div>
        
        <UnifiedCalculator />
      </div>
    </div>
  );
}
