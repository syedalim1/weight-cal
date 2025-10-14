import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Moon, Sun, Ruler, Weight } from "lucide-react";

export default function SettingsTab({
  pricePerKg,
  setPricePerKg,
  material,
  setMaterial,
  savedCalculations,
  onClearSavedCalculations,
  unitSystem,
  setUnitSystem,
  weightUnit,
  setWeightUnit,
  customMaterials,
  setCustomMaterials
}) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Application Settings</h3>

      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="default-price" className="text-base font-semibold">Default Price per kg (₹)</Label>
          <Input
            id="default-price"
            type="number"
            step="0.01"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
            className="h-11"
          />
          <p className="text-sm text-muted-foreground">
            This price will be used for all calculations. Changes are auto-saved.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Default Material</Label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stainless-steel">Stainless Steel (7.85 g/cm³)</SelectItem>
              <SelectItem value="carbon-steel">Carbon Steel (7.85 g/cm³)</SelectItem>
              <SelectItem value="aluminum">Aluminum (2.7 g/cm³)</SelectItem>
              <SelectItem value="copper">Copper (8.96 g/cm³)</SelectItem>
              <SelectItem value="brass">Brass (8.5 g/cm³)</SelectItem>
              <SelectItem value="titanium">Titanium (4.51 g/cm³)</SelectItem>
              {customMaterials.map((mat, index) => (
                <SelectItem key={index} value={mat.name}>
                  {mat.name} ({mat.density} g/cm³)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select the default material for weight calculations. Density affects weight calculations.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Unit System
            </Label>
            <Switch
              checked={unitSystem === "metric"}
              onCheckedChange={(checked) => setUnitSystem(checked ? "metric" : "imperial")}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {unitSystem === "metric" ? "Using millimeters (mm) for dimensions" : "Using inches for dimensions"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Weight className="h-4 w-4" />
              Weight Unit
            </Label>
            <Switch
              checked={weightUnit === "kg"}
              onCheckedChange={(checked) => setWeightUnit(checked ? "kg" : "lbs")}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {weightUnit === "kg" ? "Weights displayed in kilograms" : "Weights displayed in pounds"}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Theme</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
              className="flex items-center space-x-2"
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
              className="flex items-center space-x-2"
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
              className="flex items-center space-x-2"
            >
              <span>System</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose your preferred theme. System will follow your OS setting.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Saved Calculations</Label>
          <p className="text-sm text-muted-foreground">
            You have {savedCalculations.length} saved calculation(s). Use the Load button to access them.
          </p>
          {savedCalculations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSavedCalculations}
            >
              Clear All Saved Calculations
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Custom Materials</Label>
          <div className="space-y-2">
            {customMaterials.map((mat, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                <span className="flex-1">{mat.name} ({mat.density} g/cm³)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = customMaterials.filter((_, i) => i !== index);
                    setCustomMaterials(updated);
                    localStorage.setItem("steelCalc_customMaterials", JSON.stringify(updated));
                    toast({
                      title: "Material removed",
                      description: `${mat.name} has been removed.`,
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const name = prompt("Enter material name:");
                if (!name) return;
                const density = parseFloat(prompt("Enter density (g/cm³):"));
                if (isNaN(density) || density <= 0) {
                  toast({
                    title: "Invalid density",
                    description: "Please enter a valid density greater than 0.",
                    variant: "destructive",
                  });
                  return;
                }
                const newMaterial = { name, density };
                const updated = [...customMaterials, newMaterial];
                setCustomMaterials(updated);
                localStorage.setItem("steelCalc_customMaterials", JSON.stringify(updated));
                toast({
                  title: "Material added",
                  description: `${name} has been added to custom materials.`,
                });
              }}
            >
              Add Custom Material
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Add custom materials with specific densities for specialized calculations.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">About</Label>
          <p className="text-sm text-muted-foreground">
            Advanced Stainless Steel Tube Weight Calculator v3.0<br />
            Features: Multi-material support, unit conversion, custom materials, CSV/PDF export, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
