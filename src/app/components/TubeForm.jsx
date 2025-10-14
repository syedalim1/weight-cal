import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";

const standardSizes = {
  round: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  square: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  rectangular: {
    width: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"],
    height: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"]
  },
  sheet: {
    width: ["12", "24", "36", "48", "60", "72"],
    length: ["12", "24", "36", "48", "60", "72", "96", "120"]
  }
};

const thicknessOptions = {
  tube: ["1.0", "1.2", "1.5","2.0","3.0"],
  sheet: ["0.5", "1.0", "1.5", "2.0", "3.0", "4.0", "5.0", "6.0"]
};

export default function TubeForm({
  shape,
  setShape,
  standardSize,
  setStandardSize,
  customSize,
  setCustomSize,
  standardWidth,
  setStandardWidth,
  customWidth,
  setCustomWidth,
  standardHeight,
  setStandardHeight,
  customHeight,
  setCustomHeight,
  thickness,
  setThickness,
  length,
  setLength,
  quantity,
  setQuantity,
  pricePerKg,
  setPricePerKg,
  editingTube,
  onAddTube,
  onUpdateTube,
  onShapeChange
}) {
  return (
    <div className="space-y-6">
      {/* Price per kg input */}
      <div className="space-y-2">
        <Label htmlFor="price-per-kg" className="text-base font-semibold">Price per kg (₹)</Label>
        <Input
          id="price-per-kg"
          type="number"
          step="0.01"
          value={pricePerKg}
          onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
          className="h-11"
        />
      </div>

      {/* Shape Selection */}
      <div className="space-y-2">
        <Label htmlFor="shape" className="text-base font-semibold">Shape</Label>
        <Select value={shape} onValueChange={onShapeChange}>
          <SelectTrigger id="shape" className="h-11">
            <SelectValue placeholder="Select shape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="round">Round</SelectItem>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="rectangular">Rectangular</SelectItem>
            <SelectItem value="sheet">Sheet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Size Input - Dynamic based on shape */}
      {shape === "sheet" ? (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
          {/* Width */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Width (Inches)</Label>
            <div className="space-y-2">
              <Select value={standardWidth} onValueChange={setStandardWidth}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select standard width" />
                </SelectTrigger>
                <SelectContent>
                  {standardSizes.sheet.width.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              <Input
                type="number"
                step="0.01"
                placeholder="Custom width"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </div>
      ) : shape !== "rectangular" ? (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="space-y-2">
            <Label htmlFor="standard-size" className="text-base font-semibold">
              Select Standard Size (Inches)
            </Label>
            <Select value={standardSize} onValueChange={setStandardSize}>
              <SelectTrigger id="standard-size" className="h-11">
                <SelectValue placeholder="Select standard size" />
              </SelectTrigger>
              <SelectContent>
                {standardSizes[shape].map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">OR</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-size" className="text-base font-semibold">
              Enter Custom Size (Inches)
            </Label>
            <Input
              id="custom-size"
              type="number"
              step="0.01"
              placeholder="e.g., 1.35"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
          {/* Width */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Width (Inches)</Label>
            <div className="space-y-2">
              <Select value={standardWidth} onValueChange={setStandardWidth}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select standard width" />
                </SelectTrigger>
                <SelectContent>
                  {standardSizes.rectangular.width.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              <Input
                type="number"
                step="0.01"
                placeholder="Custom width"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Height */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Height (Inches)</Label>
            <div className="space-y-2">
              <Select value={standardHeight} onValueChange={setStandardHeight}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select standard height" />
                </SelectTrigger>
                <SelectContent>
                  {standardSizes.rectangular.height.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              <Input
                type="number"
                step="0.01"
                placeholder="Custom height"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </div>
      )}

      {/* Thickness */}
      <div className="space-y-2">
        <Label htmlFor="thickness" className="text-base font-semibold">{shape === "sheet" ? "Sheet Thickness" : "Tube Thickness"}</Label>
        <Select value={thickness} onValueChange={setThickness}>
          <SelectTrigger id="thickness" className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(shape === "sheet" ? thicknessOptions.sheet : thicknessOptions.tube).map((t) => (
              <SelectItem key={t} value={t}>
                {t} mm
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Length */}
      <div className="space-y-2">
        <Label htmlFor="length" className="text-base font-semibold">{shape === "sheet" ? "Sheet Length (Inches)" : "Tube Length (Inches)"}</Label>
        <Input
          id="length"
          type="number"
          step="0.01"
          placeholder={shape === "sheet" ? "e.g., 96" : "e.g., 236.22"}
          value={length}
          onChange={(e) => setLength(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="quantity" className="text-base font-semibold">{shape === "sheet" ? "Number of Sheets" : "Number of Tubes"}</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Add/Update Button */}
      <Button
        onClick={editingTube ? onUpdateTube : onAddTube}
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        size="lg"
      >
        {editingTube ? (
          <>
            <Edit className="mr-2 h-5 w-5" />
            Update {shape === "sheet" ? "Sheet" : "Tube"}
          </>
        ) : (
          <>
            <Plus className="mr-2 h-5 w-5" />
            Add {shape === "sheet" ? "Sheet" : "Tube"}
          </>
        )}
      </Button>
    </div>
  );
}
