"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Calculator as CalculatorIcon } from "lucide-react";

import { useTubes } from "@/hooks/useTubes.js";
import { useCalculations } from "@/hooks/useCalculations.js";
import { useExports } from "@/hooks/useExports.js";
import { useSettings } from "@/hooks/useSettings.js";

import PipeTable, { calculateRowWeight } from "./PipeTable.jsx";
import PipeOptimization from "./PipeOptimization.jsx";
import CalculationSummary from "./CalculationSummary.jsx";
import CalculatorToolbar from "./CalculatorToolbar.jsx";
import SettingsTab from "./SettingsTab.jsx";

export default function Calculator({ 
  defaultMaterial = "stainless-steel",
  defaultPrice = 260,
  title = "Advanced Tube Weight Calculator",
  description = "Calculate weight for multiple materials with precision and export capabilities"
}) {
  const settings = useSettings(defaultMaterial, defaultPrice);
  const tubesHook = useTubes(settings.material);
  const calculations = useCalculations(tubesHook.tubes, settings.pricePerKg, settings.material);
  const exports = useExports(tubesHook.tubes, settings.pricePerKg, calculations.calculationName);

  // Intercept changes to auto-compute weightPerTube for background calculations & CSV/PDF exports
  const handlePipesChange = (newPipes) => {
    const updated = newPipes.map((row) => {
      const materialCode = settings.material === "mild-steel" ? "ms" : "ss";
      const wt = calculateRowWeight(row, materialCode);
      return {
        ...row,
        weightPerTube: parseFloat(wt.toFixed(3)),
      };
    });
    tubesHook.setTubes(updated);
  };

  return (
    <div className="flex items-center justify-center p-4 bg-[#09090b]">
      <Card className="w-full max-w-5xl border-white/10 bg-zinc-950/60 glass-panel shadow-2xl">
        <CardHeader className="pb-4 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 border border-white/10 rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-zinc-300" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-white font-mono">
                  {title}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 font-mono">
                  {description}
                </CardDescription>
              </div>
            </div>

            <CalculatorToolbar
              calculationName={calculations.calculationName}
              setCalculationName={calculations.setCalculationName}
              savedCalculations={calculations.savedCalculations}
              showSaveDialog={calculations.showSaveDialog}
              setShowSaveDialog={calculations.setShowSaveDialog}
              showLoadDialog={calculations.showLoadDialog}
              setShowLoadDialog={calculations.setShowLoadDialog}
              tubes={tubesHook.tubes}
              pricePerKg={settings.pricePerKg}
              onSaveCalculation={calculations.saveCalculation}
              onLoadCalculation={(calc) => calculations.loadCalculation(calc, tubesHook.setTubes, settings.setPricePerKg, settings.setMaterial)}
              onDeleteCalculation={calculations.deleteCalculation}
              onExportToCSV={exports.exportToCSV}
              onExportToPDF={exports.exportToPDF}
              onClearAll={tubesHook.clearAll}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-white/5 p-1 rounded-lg">
              <TabsTrigger value="calculator" className="font-mono text-xs uppercase py-1.5 rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Calculator</TabsTrigger>
              <TabsTrigger value="settings" className="font-mono text-xs uppercase py-1.5 rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-6 pt-4">
              {/* Spreadsheet Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Pipes Specification</h3>
                <PipeTable
                  pipes={tubesHook.tubes}
                  onChange={handlePipesChange}
                  pricePerKg={settings.pricePerKg}
                  material={settings.material === "mild-steel" ? "ms" : "ss"}
                />
              </div>

              {/* Cutting Optimizer */}
              <PipeOptimization pipes={tubesHook.tubes} />

              {/* Calculations Summary */}
              <CalculationSummary tubes={tubesHook.tubes} pricePerKg={settings.pricePerKg} material={settings.material === "mild-steel" || settings.material === "carbon-steel" ? "ms" : "ss"} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 pt-4">
              <SettingsTab
                pricePerKg={settings.pricePerKg}
                setPricePerKg={settings.setPricePerKg}
                material={settings.material}
                setMaterial={settings.setMaterial}
                savedCalculations={calculations.savedCalculations}
                onClearSavedCalculations={calculations.clearSavedCalculations}
                unitSystem={settings.unitSystem}
                setUnitSystem={settings.setUnitSystem}
                weightUnit={settings.weightUnit}
                setWeightUnit={settings.setWeightUnit}
                customMaterials={settings.customMaterials}
                setCustomMaterials={settings.setCustomMaterials}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
