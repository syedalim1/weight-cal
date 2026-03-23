"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  IndianRupee,
  Package,
  Ruler,
  Layers,
  Armchair,
  Paintbrush,
  Wrench,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CircleDollarSign,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { usePricing } from "@/hooks/usePricing.js";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, placeholder, id, prefix = "₹", suffix }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          min="0"
          step="any"
          placeholder={placeholder || "0"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${prefix ? "pl-7" : ""} ${suffix ? "pr-9" : ""} tabular-nums`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PricingCalculator() {
  const p = usePricing();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (editId) {
      p.loadProduct(editId).then((res) => {
        if (!res?.success) {
          toast.error("Failed to load product", {
            description: res?.error || "Could not load the specified product.",
          });
        }
      });
    }
  }, [editId]);

  // Derived from `p` check
  const isEditing = !!p.editId;
  const isLoading = p.loadingProduct;

  const fmt = (v) =>
    v.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-flex items-center gap-2 p-2.5 bg-gradient-to-br from-primary to-primary/70 rounded-xl mb-2">
            <IndianRupee className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Steel Furniture Pricing
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Calculate total cost and generate Wholesale, Retail & Showroom
            prices
          </p>
        </div>

        {/* ── SECTION 1: Product Details ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={Package}
              title="Product Details"
              description="Select product type, material and model"
            />
            <div className="grid gap-6 md:grid-cols-3">
              {/* Product Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Product Type</Label>
                <RadioGroup
                  value={p.productType}
                  onValueChange={p.setProductType}
                  className="flex flex-wrap gap-2"
                >
                  {["chair", "table", "set"].map((v) => (
                    <Label
                      key={v}
                      htmlFor={`pt-${v}`}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        p.productType === v
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={v} id={`pt-${v}`} />
                      <span className="capitalize font-medium">{v}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Material Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Material Type</Label>
                <RadioGroup
                  value={p.materialType}
                  onValueChange={p.setMaterialType}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { val: "ss", label: "SS (Stainless Steel)" },
                    { val: "ms", label: "MS (Mild Steel)" },
                  ].map((m) => (
                    <Label
                      key={m.val}
                      htmlFor={`mt-${m.val}`}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        p.materialType === m.val
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={m.val} id={`mt-${m.val}`} />
                      <span className="font-medium">{m.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Model Number */}
              <div className="space-y-2">
                <Label htmlFor="model-number" className="text-sm font-medium">
                  Model Number
                </Label>
                <Input
                  id="model-number"
                  type="text"
                  placeholder="e.g. CH-204"
                  value={p.modelNumber}
                  onChange={(e) => p.setModelNumber(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 2: Size + Sheet + Pipe ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={Ruler}
              title="Size & Base Costs"
              description="Dimensions, sheet cost and pipe cost"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm font-medium">
                  Width
                </Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  placeholder="Width"
                  value={p.width}
                  onChange={(e) => p.setWidth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length" className="text-sm font-medium">
                  Length
                </Label>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  placeholder="Length"
                  value={p.length}
                  onChange={(e) => p.setLength(e.target.value)}
                />
              </div>
              <NumberInput
                label="Sheet Cost"
                value={p.sheetCost}
                onChange={p.setSheetCost}
                id="sheet-cost"
              />
              <NumberInput
                label="Total Pipe Weight"
                value={p.totalPipeWeight}
                onChange={p.setTotalPipeWeight}
                placeholder="e.g. 15.5 kg"
                id="total-pipe-weight"
                prefix=""
                suffix="kg"
              />
              <NumberInput
                label="SS Price/kg"
                value={p.ssPricePerKg}
                onChange={p.setSsPricePerKg}
                placeholder="e.g. 260"
                id="ss-price-per-kg"
                prefix="₹"
                suffix="/kg"
              />
              <NumberInput
                label="MS Price/kg"
                value={p.msPricePerKg}
                onChange={p.setMsPricePerKg}
                placeholder="e.g. 120"
                id="ms-price-per-kg"
                prefix="₹"
                suffix="/kg"
              />
            </div>

            {/* SS vs MS Pipe Cost Comparison */}
            {(p.ssPipeCost > 0 || p.msPipeCost > 0) && (
              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-sky-500/30 bg-sky-500/5">
                  <span className="text-sm font-medium text-sky-700 dark:text-sky-300">SS Pipe Cost</span>
                  <span className="text-lg font-bold tabular-nums">₹{fmt(p.ssPipeCost)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-orange-500/30 bg-orange-500/5">
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">MS Pipe Cost</span>
                  <span className="text-lg font-bold tabular-nums">₹{fmt(p.msPipeCost)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 3: Top Selection ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={Layers}
              title="Top Selection"
              description="Choose top type and enter cost"
            />
            <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Top Type</Label>
                <RadioGroup
                  value={p.topType}
                  onValueChange={p.setTopType}
                  className="grid grid-cols-2 gap-2"
                >
                  {["steel", "plywood", "granite", "glass"].map((v) => (
                    <Label
                      key={v}
                      htmlFor={`top-${v}`}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        p.topType === v
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={v} id={`top-${v}`} />
                      <span className="capitalize font-medium">{v}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <Separator orientation="vertical" className="hidden md:block" />

              <div className="space-y-4">
                {p.topType === "granite" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Granite Color</Label>
                    <RadioGroup
                      value={p.graniteColor}
                      onValueChange={p.setGraniteColor}
                      className="flex flex-wrap gap-2"
                    >
                      {["black", "red", "blue"].map((c) => (
                        <Label
                          key={c}
                          htmlFor={`gc-${c}`}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                            p.graniteColor === c
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <RadioGroupItem value={c} id={`gc-${c}`} />
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{
                              backgroundColor:
                                c === "black"
                                  ? "#1a1a1a"
                                  : c === "red"
                                  ? "#c0392b"
                                  : "#2980b9",
                            }}
                          />
                          <span className="capitalize font-medium">{c}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                )}
                <NumberInput
                  label={`${p.topType.charAt(0).toUpperCase() + p.topType.slice(1)} Top Cost`}
                  value={p.topCost}
                  onChange={p.setTopCost}
                  id="top-cost"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 4: Chair Seating ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={Armchair}
              title="Chair Seating"
              description="Select cushion or standard seat"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Seat Type</Label>
                <RadioGroup
                  value={p.seatType}
                  onValueChange={p.setSeatType}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { val: "cushion", label: "Cushion" },
                    { val: "without_cushion", label: "Without Cushion" },
                  ].map((s) => (
                    <Label
                      key={s.val}
                      htmlFor={`seat-${s.val}`}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        p.seatType === s.val
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={s.val} id={`seat-${s.val}`} />
                      <span className="font-medium">{s.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <NumberInput
                label={
                  p.seatType === "cushion" ? "Cushion Cost" : "Seat Cost"
                }
                value={p.seatCost}
                onChange={p.setSeatCost}
                id="seat-cost"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 5: Finishing ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={Paintbrush}
              title="Finishing"
              description="Polish or powder coating with color"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Finish Type</Label>
                  <RadioGroup
                    value={p.finishType}
                    onValueChange={p.setFinishType}
                    className="flex flex-wrap gap-2"
                  >
                    {[
                      { val: "polish", label: "Polish" },
                      { val: "powder_coating", label: "Powder Coating" },
                    ].map((f) => (
                      <Label
                        key={f.val}
                        htmlFor={`fin-${f.val}`}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          p.finishType === f.val
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <RadioGroupItem value={f.val} id={`fin-${f.val}`} />
                        <span className="font-medium">{f.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {p.finishType === "powder_coating" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Coating Color</Label>
                    <RadioGroup
                      value={p.coatingColor}
                      onValueChange={p.setCoatingColor}
                      className="flex flex-wrap gap-2"
                    >
                      {[
                        { val: "black", color: "#1a1a1a" },
                        { val: "gold", color: "#d4a017" },
                      ].map((c) => (
                        <Label
                          key={c.val}
                          htmlFor={`cc-${c.val}`}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                            p.coatingColor === c.val
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <RadioGroupItem value={c.val} id={`cc-${c.val}`} />
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="capitalize font-medium">
                            {c.val}
                          </span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>

              <NumberInput
                label="Finishing Cost"
                value={p.finishCost}
                onChange={p.setFinishCost}
                id="finish-cost"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 6: Labour & Fabrication ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={Wrench}
              title="Labour & Fabrication"
              description="All fabrication related costs"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberInput
                label="Labour Cost"
                value={p.labourCost}
                onChange={p.setLabourCost}
                id="labour-cost"
              />
              <NumberInput
                label="Welding Cost"
                value={p.weldingCost}
                onChange={p.setWeldingCost}
                id="welding-cost"
              />
              <NumberInput
                label="Electricity Cost"
                value={p.electricityCost}
                onChange={p.setElectricityCost}
                id="electricity-cost"
              />
              <NumberInput
                label="Machine Cost"
                value={p.machineCost}
                onChange={p.setMachineCost}
                id="machine-cost"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── TOTAL COST DISPLAY (SS vs MS) ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* SS Total */}
          <Card className="border-sky-500/30 bg-gradient-to-r from-sky-500/5 via-transparent to-sky-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10">
                  <CircleDollarSign className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                    SS Total Cost
                  </p>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    ₹{fmt(p.ssTotalCost)}
                  </p>
                  {p.ssPipeCost > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Pipe: ₹{fmt(p.ssPipeCost)} ({p.ssPricePerKg}/kg × {p.totalPipeWeight}kg)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MS Total */}
          <Card className="border-orange-500/30 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10">
                  <CircleDollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                    MS Total Cost
                  </p>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    ₹{fmt(p.msTotalCost)}
                  </p>
                  {p.msPipeCost > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Pipe: ₹{fmt(p.msPipeCost)} ({p.msPricePerKg}/kg × {p.totalPipeWeight}kg)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── SAVE PRODUCT BUTTON ── */}
        <div className="flex justify-center flex-col items-center gap-2">
          {isLoading && (
            <div className="flex items-center text-muted-foreground text-sm gap-2 mb-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading product data...
            </div>
          )}
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-semibold gap-2 transition-all hover:scale-105 active:scale-95 shadow-md disabled:hover:scale-100 disabled:opacity-75"
            disabled={p.saving || p.totalCost <= 0 || isLoading}
            onClick={async () => {
              const result = await p.saveProduct();
              if (result.success) {
                toast.success(result.isUpdate ? "Product updated!" : "Product saved!", {
                  description: `${p.modelNumber || p.productType} — ₹${p.totalCost.toLocaleString("en-IN")}`,
                });
                if (result.isUpdate) {
                   router.push("/products"); // Return to list after update
                }
              } else {
                toast.error("Failed to save product", {
                  description: result.error,
                });
              }
            }}
          >
            {p.saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {p.saving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Product" : "Save Product")}
          </Button>
        </div>

        {/* ── SECTION 7: Profit Percentages ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={TrendingUp}
              title="Profit Margins"
              description="Set profit % for each pricing tier"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="wholesale-pct" className="text-sm font-medium">
                  Wholesale Profit %
                </Label>
                <div className="relative">
                  <Input
                    id="wholesale-pct"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="10"
                    value={p.wholesalePercent}
                    onChange={(e) => p.setWholesalePercent(e.target.value)}
                    className="pr-7 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retail-pct" className="text-sm font-medium">
                  Retail Profit %
                </Label>
                <div className="relative">
                  <Input
                    id="retail-pct"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="20"
                    value={p.retailPercent}
                    onChange={(e) => p.setRetailPercent(e.target.value)}
                    className="pr-7 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="showroom-pct" className="text-sm font-medium">
                  Showroom Profit %
                </Label>
                <div className="relative">
                  <Input
                    id="showroom-pct"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="35"
                    value={p.showroomPercent}
                    onChange={(e) => p.setShowroomPercent(e.target.value)}
                    className="pr-7 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── PRICING SUMMARY (SS vs MS side by side) ── */}
        <div className="space-y-4">
          {/* SS Pricing */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-sky-500" />
              SS (Stainless Steel) Pricing
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-transparent">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Wholesale</p>
                  <p className="text-2xl font-bold tabular-nums">₹{fmt(p.ssWholesalePrice)}</p>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-600 dark:text-blue-400">+{p.wholesalePercent || 0}%</Badge>
                </CardContent>
              </Card>
              <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Retail</p>
                  <p className="text-2xl font-bold tabular-nums">₹{fmt(p.ssRetailPrice)}</p>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">+{p.retailPercent || 0}%</Badge>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Showroom</p>
                  <p className="text-2xl font-bold tabular-nums">₹{fmt(p.ssShowroomPrice)}</p>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">+{p.showroomPercent || 0}%</Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* MS Pricing */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
              MS (Mild Steel) Pricing
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-transparent">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Wholesale</p>
                  <p className="text-2xl font-bold tabular-nums">₹{fmt(p.msWholesalePrice)}</p>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-600 dark:text-blue-400">+{p.wholesalePercent || 0}%</Badge>
                </CardContent>
              </Card>
              <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Retail</p>
                  <p className="text-2xl font-bold tabular-nums">₹{fmt(p.msRetailPrice)}</p>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">+{p.retailPercent || 0}%</Badge>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Showroom</p>
                  <p className="text-2xl font-bold tabular-nums">₹{fmt(p.msShowroomPrice)}</p>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">+{p.showroomPercent || 0}%</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ── CUSTOM PRICE VALIDATION ── */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <SectionHeader
              icon={ShieldCheck}
              title="Price Validation"
              description="Enter a custom selling price to check profitability"
            />
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="w-full sm:w-72">
                <NumberInput
                  label="Custom Selling Price"
                  value={p.customPrice}
                  onChange={p.setCustomPrice}
                  placeholder="Enter price"
                  id="custom-price"
                />
              </div>

              {p.priceStatus && (
                <div className="flex items-center gap-2">
                  {p.priceStatus === "LOSS" && (
                    <Badge
                      className="text-sm px-4 py-2 bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20"
                      variant="outline"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      LOSS — Below wholesale
                    </Badge>
                  )}
                  {p.priceStatus === "LOW PROFIT" && (
                    <Badge
                      className="text-sm px-4 py-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      variant="outline"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1.5" />
                      LOW PROFIT — Below retail
                    </Badge>
                  )}
                  {p.priceStatus === "OK" && (
                    <Badge
                      className="text-sm px-4 py-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      variant="outline"
                    >
                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                      OK — Healthy profit
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Steel Furniture Pricing System — All prices in INR (₹)
        </p>
      </div>
    </div>
  );
}
