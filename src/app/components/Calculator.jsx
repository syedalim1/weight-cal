"use client"
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
import TubeForm from "./TubeForm.jsx";
import TubeList from "./TubeList.jsx";
import CalculationSummary from "./CalculationSummary.jsx";
import CalculatorToolbar from "./CalculatorToolbar.jsx";
import SettingsTab from "./SettingsTab.jsx";




export default function Calculator() {
  // Use hooks for state management
  const settings = useSettings();
  const tubesHook = useTubes(settings.material);
  const calculations = useCalculations(tubesHook.tubes, settings.pricePerKg, settings.material);
  const exports = useExports(tubesHook.tubes, settings.pricePerKg, calculations.calculationName);

  return (
    <div className=" flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-4xl shadow-[var(--shadow-elevated)]">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold ">
                  Advanced Tube Weight Calculator
                </CardTitle>
                <CardDescription className="text-base">
                  Calculate weight for multiple materials with precision and export capabilities
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

        <CardContent className="space-y-6">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-6">
              <TubeForm
                shape={tubesHook.shape}
                setShape={tubesHook.setShape}
                standardSize={tubesHook.standardSize}
                setStandardSize={tubesHook.setStandardSize}
                customSize={tubesHook.customSize}
                setCustomSize={tubesHook.setCustomSize}
                standardWidth={tubesHook.standardWidth}
                setStandardWidth={tubesHook.setStandardWidth}
                customWidth={tubesHook.customWidth}
                setCustomWidth={tubesHook.setCustomWidth}
                standardHeight={tubesHook.standardHeight}
                setStandardHeight={tubesHook.setStandardHeight}
                customHeight={tubesHook.customHeight}
                setCustomHeight={tubesHook.setCustomHeight}
                thickness={tubesHook.thickness}
                setThickness={tubesHook.setThickness}
                length={tubesHook.length}
                setLength={tubesHook.setLength}
                quantity={tubesHook.quantity}
                setQuantity={tubesHook.setQuantity}
                pricePerKg={settings.pricePerKg}
                setPricePerKg={settings.setPricePerKg}
                editingTube={tubesHook.editingTube}
                onAddTube={tubesHook.addTube}
                onUpdateTube={tubesHook.updateTube}
                onShapeChange={tubesHook.handleShapeChange}
              />

              <TubeList
                tubes={tubesHook.tubes}
                searchTerm={tubesHook.searchTerm}
                setSearchTerm={tubesHook.setSearchTerm}
                pricePerKg={settings.pricePerKg}
                onRemoveTube={tubesHook.removeTube}
                onDuplicateTube={tubesHook.duplicateTube}
                onEditTube={tubesHook.editTube}
              />

              <CalculationSummary tubes={tubesHook.tubes} pricePerKg={settings.pricePerKg} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
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
