import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SettingsTab({
  pricePerKg,
  setPricePerKg,
  material,
  setMaterial,
  savedCalculations,
  onClearSavedCalculations
}) {
  const { toast } = useToast();

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
              <SelectItem value="aluminum">Aluminum (2.70 g/cm³)</SelectItem>
              <SelectItem value="copper">Copper (8.96 g/cm³)</SelectItem>
              <SelectItem value="brass">Brass (8.50 g/cm³)</SelectItem>
              <SelectItem value="titanium">Titanium (4.51 g/cm³)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select the default material for weight calculations. Density affects weight calculations.
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
