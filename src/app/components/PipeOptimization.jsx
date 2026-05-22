"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Percent, Ruler, Layers, ShieldAlert, Sparkles } from "lucide-react";

export default function PipeOptimization({ pipes = [] }) {
  const [standardLengthFt, setStandardLengthFt] = useState("24"); // Default 24 feet
  const standardLengthIn = parseFloat(standardLengthFt) * 12 || 288; // Convert to inches

  // Group pipes by Shape + Size/Dimensions + Thickness (ignore sheets, sheets are raw material, not cut from standard pipes)
  const cutPipes = useMemo(() => {
    return pipes.filter((p) => p.shape !== "sheet" && (parseFloat(rowVal(p, "length")) > 0) && (parseFloat(rowVal(p, "quantity")) > 0));
  }, [pipes]);

  function rowVal(row, field) {
    return row[field] || "";
  }

  // Group key generator
  const getGroupKey = (p) => {
    if (p.shape === "rectangular") {
      return `${p.shape}_w${p.width}_h${p.height}_t${p.thickness}`;
    }
    return `${p.shape}_s${p.size}_t${p.thickness}`;
  };

  // Group label generator
  const getGroupLabel = (p) => {
    const shapeStr = p.shape.charAt(0).toUpperCase() + p.shape.slice(1);
    const sizeStr = p.shape === "rectangular" ? `${p.width}"×${p.height}"` : `${p.size}"`;
    return `${shapeStr} Pipe [${sizeStr} | ${p.thickness}mm]`;
  };

  // Run the 1D Bin Packing (First Fit Decreasing) for each unique pipe spec group
  const optimizationResults = useMemo(() => {
    if (cutPipes.length === 0 || standardLengthIn <= 0) return [];

    // 1. Group pipes by specifications
    const groups = {};
    cutPipes.forEach((p) => {
      const key = getGroupKey(p);
      if (!groups[key]) {
        groups[key] = {
          label: getGroupLabel(p),
          cuts: [],
        };
      }
      const len = parseFloat(p.length) || 0;
      const qty = parseInt(p.quantity, 10) || 0;
      for (let i = 0; i < qty; i++) {
        groups[key].cuts.push({
          id: `${p.id}_${i}`,
          name: p.name || `Cut #${i + 1}`,
          length: len,
        });
      }
    });

    // 2. Process each group
    const results = Object.keys(groups).map((key) => {
      const group = groups[key];
      // Sort cuts in descending order for First Fit Decreasing
      const sortedCuts = [...group.cuts].sort((a, b) => b.length - a.length);

      // Verify that no individual cut exceeds the standard length
      const oversizedCuts = sortedCuts.filter((c) => c.length > standardLengthIn);
      const standardLength = standardLengthIn;

      const bins = []; // Each bin represents one standard pipe of standardLength

      sortedCuts.forEach((cut) => {
        if (cut.length > standardLength) return; // Skip oversized cuts in the visualizer, they will show in warnings

        // Find the first bin that can hold this cut
        let placed = false;
        for (let i = 0; i < bins.length; i++) {
          const usedSpace = bins[i].cuts.reduce((sum, c) => sum + c.length, 0);
          if (standardLength - usedSpace >= cut.length) {
            bins[i].cuts.push(cut);
            placed = true;
            break;
          }
        }

        // If no bin found, open a new bin (standard pipe)
        if (!placed) {
          bins.push({
            id: bins.length + 1,
            cuts: [cut],
          });
        }
      });

      // Calculate waste metrics for this group
      let groupTotalUsed = 0;
      let groupTotalReusable = 0;
      let groupTotalWaste = 0;

      const processedBins = bins.map((bin) => {
        const cutsLength = bin.cuts.reduce((sum, c) => sum + c.length, 0);
        const leftover = standardLength - cutsLength;
        
        // Let's say if leftover is >= 3 feet (36 inches), it is reusable, else it is waste
        const isReusable = leftover >= 36;
        const waste = isReusable ? 0 : leftover;
        const reusable = isReusable ? leftover : 0;

        groupTotalUsed += cutsLength;
        groupTotalReusable += reusable;
        groupTotalWaste += waste;

        return {
          id: bin.id,
          cuts: bin.cuts,
          cutsLength,
          leftover,
          reusable,
          waste,
        };
      });

      const totalBinsLength = bins.length * standardLength;
      const wastePercent = totalBinsLength > 0 ? (groupTotalWaste / totalBinsLength) * 100 : 0;
      const reusablePercent = totalBinsLength > 0 ? (groupTotalReusable / totalBinsLength) * 100 : 0;
      const cutsPercent = totalBinsLength > 0 ? (groupTotalUsed / totalBinsLength) * 100 : 0;

      return {
        key,
        label: group.label,
        bins: processedBins,
        oversizedCuts,
        totalPipesNeeded: bins.length,
        totalUsed: groupTotalUsed,
        totalReusable: groupTotalReusable,
        totalWaste: groupTotalWaste,
        wastePercent,
        reusablePercent,
        cutsPercent,
      };
    });

    return results;
  }, [cutPipes, standardLengthIn]);

  // Overall totals across all pipe groups
  const overallTotals = useMemo(() => {
    let pipesNeeded = 0;
    let totalUsed = 0;
    let totalReusable = 0;
    let totalWaste = 0;

    optimizationResults.forEach((res) => {
      pipesNeeded += res.totalPipesNeeded;
      totalUsed += res.totalUsed;
      totalReusable += res.totalReusable;
      totalWaste += res.totalWaste;
    });

    const totalIn = pipesNeeded * standardLengthIn;
    const wastePct = totalIn > 0 ? (totalWaste / totalIn) * 100 : 0;

    return {
      pipesNeeded,
      totalUsed,
      totalReusable,
      totalWaste,
      wastePct,
    };
  }, [optimizationResults, standardLengthIn]);

  if (cutPipes.length === 0) {
    return (
      <Card className="border-white/5 bg-zinc-950/40">
        <CardContent className="p-6 text-center text-zinc-500 text-sm">
          Add standard pipe details (Round, Square, Rectangular) with length and quantity to see cutting optimizations.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-zinc-950/70 glass-panel">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                Pipe Cutting Optimization
              </CardTitle>
              <CardDescription>
                Calculates how many standard length pipes are needed and plans cut distributions.
              </CardDescription>
            </div>
            {/* Standard Pipe Length Input */}
            <div className="flex items-center gap-2 max-w-xs">
              <Label htmlFor="std-length" className="text-zinc-400 text-xs shrink-0 font-mono">
                Standard Length:
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="std-length"
                  type="number"
                  min="1"
                  value={standardLengthFt}
                  onChange={(e) => setStandardLengthFt(e.target.value)}
                  className="h-8 w-20 font-mono text-center pr-6 bg-zinc-900 border-white/10 text-white"
                />
                <span className="absolute right-2 text-zinc-500 text-[10px] font-mono pointer-events-none">ft</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Overall Stats Cards */}
          {overallTotals.pipesNeeded > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/40 p-4 rounded-xl border border-white/5">
              <div className="text-center md:text-left space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Standard Pipes Needed</span>
                <span className="text-xl font-bold tracking-tight text-white font-mono">{overallTotals.pipesNeeded} pcs</span>
              </div>
              <div className="text-center md:text-left space-y-1 border-l border-white/5 pl-3">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Total Used Length</span>
                <span className="text-xl font-bold tracking-tight text-zinc-300 font-mono">{(overallTotals.totalUsed / 12).toFixed(1)} ft</span>
              </div>
              <div className="text-center md:text-left space-y-1 border-l border-white/5 pl-3">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Reusable Leftover (≥3ft)</span>
                <span className="text-xl font-bold tracking-tight text-emerald-400 font-mono">{(overallTotals.totalReusable / 12).toFixed(1)} ft</span>
              </div>
              <div className="text-center md:text-left space-y-1 border-l border-white/5 pl-3">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Total Waste (<span className="text-red-400">Loss</span>)</span>
                <span className="text-xl font-bold tracking-tight text-red-400 font-mono">{(overallTotals.totalWaste / 12).toFixed(1)} ft ({overallTotals.wastePct.toFixed(1)}%)</span>
              </div>
            </div>
          )}

          {/* Group-by-group optimization results */}
          <div className="space-y-6">
            {optimizationResults.map((groupRes) => (
              <div key={groupRes.key} className="space-y-3 bg-zinc-900/20 p-4 rounded-xl border border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <h4 className="text-sm font-semibold text-zinc-200">{groupRes.label}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-white/10 text-zinc-400 font-mono text-[10px]">
                      {groupRes.totalPipesNeeded} pipes needed
                    </Badge>
                    <Badge variant="outline" className="border-red-500/20 bg-red-500/5 text-red-400 font-mono text-[10px]">
                      {groupRes.wastePercent.toFixed(1)}% waste
                    </Badge>
                  </div>
                </div>

                {/* Oversized cut warnings */}
                {groupRes.oversizedCuts.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      Warning: Some cuts are longer than the {standardLengthFt} ft standard pipe ({groupRes.oversizedCuts.map((c) => `${c.length}"`).join(", ")}). These cuts cannot be planned.
                    </span>
                  </div>
                )}

                {/* Visual pipes representation */}
                <div className="space-y-4 pt-1 max-h-72 overflow-y-auto pr-1">
                  {groupRes.bins.map((bin) => (
                    <div key={bin.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
                        <span>Standard Pipe #{bin.id}</span>
                        <span>Used: {bin.cutsLength}" | Remaining: {bin.leftover}"</span>
                      </div>
                      
                      {/* Bar Layout */}
                      <div className="h-6 w-full bg-zinc-900 border border-white/10 rounded-md overflow-hidden flex relative">
                        {bin.cuts.map((cut, idx) => {
                          const widthPct = (cut.length / standardLengthIn) * 100;
                          // Alternating colors for distinct visual cuts
                          const cutColors = [
                            "bg-indigo-600 border-indigo-700 text-indigo-100",
                            "bg-indigo-700 border-indigo-800 text-indigo-200",
                            "bg-slate-700 border-slate-800 text-slate-200",
                            "bg-slate-600 border-slate-700 text-slate-100",
                          ];
                          const color = cutColors[idx % cutColors.length];
                          
                          return (
                            <div
                              key={cut.id}
                              style={{ width: `${widthPct}%` }}
                              className={`h-full border-r flex items-center justify-center text-[9px] font-mono overflow-hidden whitespace-nowrap px-0.5 truncate ${color}`}
                              title={`${cut.name}: ${cut.length}"`}
                            >
                              {cut.length}"
                            </div>
                          );
                        })}

                        {/* Reusable leftover segment */}
                        {bin.reusable > 0 && (
                          <div
                            style={{ width: `${(bin.reusable / standardLengthIn) * 100}%` }}
                            className="h-full bg-emerald-500/20 border-r border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[9px] font-mono overflow-hidden whitespace-nowrap px-0.5 truncate"
                            title={`Reusable leftover: ${bin.reusable}"`}
                          >
                            R: {bin.reusable}"
                          </div>
                        )}

                        {/* Waste segment */}
                        {bin.waste > 0 && (
                          <div
                            style={{ width: `${(bin.waste / standardLengthIn) * 100}%` }}
                            className="h-full bg-red-500/10 text-red-400 flex items-center justify-center text-[9px] font-mono overflow-hidden whitespace-nowrap px-0.5 truncate"
                            title={`Waste: ${bin.waste}"`}
                          >
                            W: {bin.waste}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
