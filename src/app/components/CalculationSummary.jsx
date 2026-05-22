export default function CalculationSummary({ tubes, pricePerKg, material = "ss" }) {
  const getTotalWeight = () => {
    return tubes.reduce((total, tube) => total + (tube.weightPerTube * tube.quantity), 0);
  };

  const getTotalPrice = () => {
    return getTotalWeight() * pricePerKg;
  };

  if (tubes.length === 0) {
    return null;
  }

  const isMs = material === "ms";

  return (
    <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Summary</h3>
        <span className="text-[10px] font-mono text-zinc-500">Auto-calculated</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Price per KG */}
        <div className="relative overflow-hidden p-3.5 rounded-lg bg-zinc-950/40 border border-white/5 flex flex-col justify-between min-h-[72px] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-zinc-500/40">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pl-2">Price per kg</span>
          <span className="text-xl font-bold tracking-tight text-white font-mono pl-2">₹{pricePerKg}</span>
        </div>
        
        {/* Total Weight */}
        <div className="relative overflow-hidden p-3.5 rounded-lg bg-zinc-950/40 border border-white/5 flex flex-col justify-between min-h-[72px] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sky-500">
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 pl-2">Total Weight</span>
          <span className="text-xl font-bold tracking-tight text-white font-mono pl-2">
            {getTotalWeight().toFixed(2)} <span className="text-xs text-zinc-400 font-normal font-sans">kg</span>
          </span>
        </div>

        {/* Total Price */}
        <div className={`relative overflow-hidden p-3.5 rounded-lg bg-zinc-950/40 border border-white/5 flex flex-col justify-between min-h-[72px] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${isMs ? "before:bg-orange-500" : "before:bg-emerald-500"}`}>
          <span className={`text-[10px] font-mono uppercase tracking-wider pl-2 ${isMs ? "text-orange-400" : "text-emerald-400"}`}>Total Price</span>
          <span className="text-xl font-bold tracking-tight text-white font-mono pl-2">
            ₹{getTotalPrice().toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
