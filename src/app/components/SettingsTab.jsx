import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function SettingsTab({
  pricePerKg,
  setPricePerKg,
  material,
  setMaterial,
  savedCalculations,
  onClearSavedCalculations
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
              <SelectItem value="ss-steel-tube">SS Steel Tube (7.85 g/cm³)</SelectItem>
              <SelectItem value="ms-metal-tube">MS Metal Tube (7.85 g/cm³)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select the default material for weight calculations. Density affects weight calculations.
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
          <Label className="text-base font-semibold">About</Label>
          <p className="text-sm text-muted-foreground">
            Advanced Stainless Steel Tube Weight Calculator v2.0<br />
            Features: Save/Load calculations, CSV export, tube editing, search, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
