"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.jsx";
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
  FileDown,
  UploadCloud,
  X,
  ArrowLeft,
} from "lucide-react";

import { usePricing } from "@/hooks/usePricing.js";
import PipeTable from "@/app/components/PipeTable.jsx";
import { exportPricingQuote } from "@/lib/pdfExporter.js";

function AccordionHeader({ icon: Icon, title, description, badge }) {
  return (
    <div className="flex items-center justify-between w-full pr-4 text-left">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded bg-zinc-900 border border-white/5">
          <Icon className="h-4 w-4 text-zinc-400" />
        </div>
        <div>
          <span className="font-semibold text-sm text-zinc-200 block">{title}</span>
          {description && (
            <span className="text-[11px] text-zinc-500 font-normal">{description}</span>
          )}
        </div>
      </div>
      {badge && (
        <Badge variant="secondary" className="text-[10px] bg-zinc-900 text-zinc-400 font-mono py-0 px-1.5">
          {badge}
        </Badge>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, placeholder, id, prefix = "₹", suffix }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-mono text-zinc-400">
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          min="0"
          step="any"
          placeholder={placeholder || "0"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-8 w-full bg-zinc-950 border border-white/10 rounded px-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 ${prefix ? "pl-6" : ""} ${suffix ? "pr-8" : ""}`}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
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
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Initialize/Load
  useEffect(() => {
    if (editId) {
      p.loadProduct(editId).then((res) => {
        if (!res?.success) {
          toast.error("Failed to load product", {
            description: res?.error || "Could not load the specified product.",
          });
        }
      });
    } else {
      p.resetForm();
    }
  }, [editId]);

  const isEditing = !!p.editId;
  const isLoading = p.loadingProduct;

  const fmt = (v) => {
    const val = parseFloat(v) || 0;
    return val.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleImageFile = (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format", { description: "Please upload an image file (PNG/JPG)." });
      return;
    }
    // Limit to 1.5MB for local storage safety
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("File too large", { description: "Image must be under 1.5 MB to save successfully." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      p.setImage(reader.result);
      toast.success("Product image uploaded");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    p.setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Image removed");
  };

  // Trigger PDF quote sheet export
  const handleExportPDF = () => {
    if (!p.totalCost || p.totalCost <= 0) {
      toast.error("No calculation data", { description: "Add costing details before exporting." });
      return;
    }
    
    // Create base product object to pass
    const productRecord = {
      model_number: p.modelNumber,
      product_type: p.productType,
      material_type: p.materialType,
      width: p.width,
      length: p.length,
      total_pipe_weight: p.totalPipeWeight,
      ss_price_per_kg: p.ssPricePerKg,
      ms_price_per_kg: p.msPricePerKg,
      pipe_cost: p.pipeCost,
      sheet_cost: p.sheetCost,
      top_type: p.topType,
      top_cost: p.topCost,
      seat_cost: p.seatCost,
      finish_type: p.finishType,
      finish_cost: p.finishCost,
      labour_cost: p.labourCost,
      welding_cost: p.weldingCost,
      electricity_cost: p.electricityCost,
      machine_cost: p.machineCost,
      total_cost: p.totalCost,
      ss_wholesale_percent: p.ssWholesalePercent,
      ss_retail_percent: p.ssRetailPercent,
      ss_showroom_percent: p.ssShowroomPercent,
      ms_wholesale_percent: p.msWholesalePercent,
      ms_retail_percent: p.msRetailPercent,
      ms_showroom_percent: p.msShowroomPercent,
      ss_wholesale_price: p.ssWholesalePrice,
      ss_retail_price: p.ssRetailPrice,
      ss_showroom_price: p.ssShowroomPrice,
      ms_wholesale_price: p.msWholesalePrice,
      ms_retail_price: p.msRetailPrice,
      ms_showroom_price: p.msShowroomPrice,
    };

    const res = exportPricingQuote(productRecord, p.pipes, p.image);
    if (res.success) {
      toast.success("Quote exported successfully", { description: res.filename });
    } else {
      toast.error("Failed to export PDF", { description: res.error });
    }
  };

  // Calculate sum of additional costs (excludes pipe)
  const additionalCostSum = 
    (parseFloat(p.sheetCost) || 0) +
    (parseFloat(p.topCost) || 0) +
    (parseFloat(p.seatCost) || 0) +
    (parseFloat(p.finishCost) || 0) +
    (parseFloat(p.labourCost) || 0) +
    (parseFloat(p.weldingCost) || 0) +
    (parseFloat(p.electricityCost) || 0) +
    (parseFloat(p.machineCost) || 0);

  // Active pricing values based on current material
  const activeWholesalePrice = p.materialType === "ss" ? p.ssWholesalePrice : p.msWholesalePrice;
  const activeRetailPrice = p.materialType === "ss" ? p.ssRetailPrice : p.msRetailPrice;
  const activeShowroomPrice = p.materialType === "ss" ? p.ssShowroomPrice : p.msShowroomPrice;
  
  const activeWholesalePct = p.materialType === "ss" ? p.ssWholesalePercent : p.msWholesalePercent;
  const activeRetailPct = p.materialType === "ss" ? p.ssRetailPercent : p.msRetailPercent;
  const activeShowroomPct = p.materialType === "ss" ? p.ssShowroomPercent : p.msShowroomPercent;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased pb-12">
      {/* Navbar Toolbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/products")}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white font-mono">
              {isEditing ? `EDIT QUOTE: ${p.modelNumber || "MODEL"}` : "CREATE NEW QUOTE"}
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono">
              Premium Steel Furniture Pricing Engine
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
              Syncing DB
            </span>
          )}
          <Badge variant="outline" className="border-white/10 font-mono text-[10px] text-zinc-400 uppercase">
            {p.materialType} Spec Mode
          </Badge>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-4 pt-6">
        {/* Main Dashboard Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          
          {/* LEFT COLUMN: Collapsible Input Configurations */}
          <div className="space-y-4">
            
            <Accordion type="multiple" defaultValue={["product-profile", "pipes-specs"]} className="space-y-4 border-none">
              
              {/* Section 1: Product Profile & Image Upload */}
              <AccordionItem value="product-profile" className="border border-white/10 rounded-lg bg-zinc-950/60 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-zinc-900/40 border-b border-white/5">
                  <AccordionHeader
                    icon={Package}
                    title="1. Product Profile & Image"
                    description="Category, model specs and reference photo"
                    badge={p.modelNumber || "Unnamed"}
                  />
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Details side */}
                    <div className="space-y-4">
                      {/* Product Type */}
                      <div className="space-y-2">
                        <Label className="text-xs font-mono text-zinc-400">Product Category</Label>
                        <RadioGroup
                          value={p.productType}
                          onValueChange={p.setProductType}
                          className="flex gap-2"
                        >
                          {["chair", "table", "set"].map((v) => (
                            <Label
                              key={v}
                              htmlFor={`pt-${v}`}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer transition-all font-mono uppercase ${
                                p.productType === v
                                  ? "border-zinc-400 bg-white/5 text-white"
                                  : "border-white/10 text-zinc-400 hover:border-white/20"
                              }`}
                            >
                              <RadioGroupItem value={v} id={`pt-${v}`} className="sr-only" />
                              <span>{v}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Material Type */}
                      <div className="space-y-2">
                        <Label className="text-xs font-mono text-zinc-400">Material Build</Label>
                        <RadioGroup
                          value={p.materialType}
                          onValueChange={p.setMaterialType}
                          className="flex gap-2"
                        >
                          {[
                            { val: "ss", label: "SS (Stainless)" },
                            { val: "ms", label: "MS (Mild Steel)" },
                          ].map((m) => (
                            <Label
                              key={m.val}
                              htmlFor={`mt-${m.val}`}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer transition-all font-mono uppercase ${
                                p.materialType === m.val
                                  ? m.val === "ss" ? "border-sky-500 bg-sky-500/10 text-sky-400" : "border-orange-500 bg-orange-500/10 text-orange-400"
                                  : "border-white/10 text-zinc-400 hover:border-white/20"
                              }`}
                            >
                              <RadioGroupItem value={m.val} id={`mt-${m.val}`} className="sr-only" />
                              <span>{m.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Model & Dimensions */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="model-num" className="text-xs font-mono text-zinc-400">Model #</Label>
                          <input
                            id="model-num"
                            type="text"
                            placeholder="e.g. CH-204"
                            value={p.modelNumber}
                            onChange={(e) => p.setModelNumber(e.target.value)}
                            className="h-8 w-full bg-zinc-950 border border-white/10 rounded px-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                          />
                        </div>
                        <NumberInput
                          label="Width (in)"
                          value={p.width}
                          onChange={p.setWidth}
                          prefix=""
                          placeholder="W"
                        />
                        <NumberInput
                          label="Length (in)"
                          value={p.length}
                          onChange={p.setLength}
                          prefix=""
                          placeholder="L"
                        />
                      </div>
                    </div>

                    {/* Image Upload side */}
                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-zinc-400">Reference Product Image</Label>
                      
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-[126px] relative overflow-hidden ${
                          dragActive ? "border-zinc-400 bg-white/5" : "border-white/10 bg-zinc-950/40 hover:border-white/20"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />

                        {p.image ? (
                          <div className="absolute inset-0 w-full h-full bg-zinc-950/90 flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt="Product Preview"
                                className="w-16 h-16 object-contain rounded border border-white/10 bg-white/[0.02]"
                              />
                              <div>
                                <span className="text-[10px] text-zinc-400 block font-mono">Status</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono py-0 px-1">Active</Badge>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={removeImage}
                              className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center space-y-1">
                            <UploadCloud className="h-6 w-6 text-zinc-500 mx-auto" />
                            <p className="text-[10px] font-mono text-zinc-400">Drag photo here or Click to select</p>
                            <p className="text-[9px] text-zinc-600 font-mono">PNG/JPG up to 1.5MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Pipe details */}
              <AccordionItem value="pipes-specs" className="border border-white/10 rounded-lg bg-zinc-950/60 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-zinc-900/40 border-b border-white/5">
                  <AccordionHeader
                    icon={Ruler}
                    title="2. Steel Pipes & Materials Specification"
                    description="Enter raw material pipes breakdown to auto-calculate weights"
                    badge={p.totalPipeWeight ? `${p.totalPipeWeight} kg` : "Empty"}
                  />
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  {/* Steel Rates Config inside the section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900/20 p-3 rounded border border-white/5 mb-2">
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Rate configuration</span>
                      <span className="text-xs font-semibold text-zinc-300">Raw Steel Price / Kg</span>
                    </div>
                    <NumberInput
                      label="SS Base Rate (₹/Kg)"
                      value={p.ssPricePerKg}
                      onChange={p.setSsPricePerKg}
                      id="ss-rate"
                      prefix="₹"
                    />
                    <NumberInput
                      label="MS Base Rate (₹/Kg)"
                      value={p.msPricePerKg}
                      onChange={p.setMsPricePerKg}
                      id="ms-rate"
                      prefix="₹"
                    />
                  </div>

                  {/* Embedded Spreadsheet PipeTable */}
                  <PipeTable
                    pipes={p.pipes}
                    onChange={p.setPipes}
                    pricePerKg={p.materialType === "ms" ? p.msPricePerKg : p.ssPricePerKg}
                    material={p.materialType}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Section 3: Top Selection */}
              <AccordionItem value="top-select" className="border border-white/10 rounded-lg bg-zinc-950/60 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-zinc-900/40 border-b border-white/5">
                  <AccordionHeader
                    icon={Layers}
                    title="3. Table Top Selection"
                    description="Select top type and material costs"
                    badge={p.topType !== "steel" || p.topCost ? `${p.topType} (₹${p.topCost || 0})` : "Steel Default"}
                  />
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-zinc-400">Top Plate Material</Label>
                      <RadioGroup
                        value={p.topType}
                        onValueChange={p.setTopType}
                        className="grid grid-cols-2 gap-2"
                      >
                        {["steel", "plywood", "granite", "glass"].map((v) => (
                          <Label
                            key={v}
                            htmlFor={`top-${v}`}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs cursor-pointer transition-all font-mono capitalize ${
                              p.topType === v
                                ? "border-zinc-400 bg-white/5 text-white"
                                : "border-white/10 text-zinc-400 hover:border-white/20"
                            }`}
                          >
                            <RadioGroupItem value={v} id={`top-${v}`} className="sr-only" />
                            <span>{v}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      {p.topType === "granite" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-mono text-zinc-400">Granite Slab Shade</Label>
                          <RadioGroup
                            value={p.graniteColor}
                            onValueChange={p.setGraniteColor}
                            className="flex gap-2"
                          >
                            {["black", "red", "blue"].map((c) => (
                              <Label
                                key={c}
                                htmlFor={`gc-${c}`}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded border text-xs cursor-pointer transition-all font-mono capitalize ${
                                  p.graniteColor === c
                                    ? "border-zinc-400 bg-white/5 text-white"
                                    : "border-white/10 text-zinc-400 hover:border-white/20"
                                }`}
                              >
                                <RadioGroupItem value={c} id={`gc-${c}`} className="sr-only" />
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white/10"
                                  style={{
                                    backgroundColor:
                                      c === "black"
                                        ? "#18181b"
                                        : c === "red"
                                        ? "#991b1b"
                                        : "#1e3a8a",
                                  }}
                                />
                                <span>{c}</span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                      
                      <NumberInput
                        label={`${p.topType.toUpperCase()} Top Plate Cost`}
                        value={p.topCost}
                        onChange={p.setTopCost}
                        id="top-cost"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 4: Seat Cushion Options */}
              <AccordionItem value="seat-cushion" className="border border-white/10 rounded-lg bg-zinc-950/60 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-zinc-900/40 border-b border-white/5">
                  <AccordionHeader
                    icon={Armchair}
                    title="4. Seating & Cushion Layout"
                    description="Configure cushion integration and foam base costs"
                    badge={p.seatType === "cushion" ? `Cushion (₹${p.seatCost || 0})` : "No Cushion"}
                  />
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-zinc-400">Seat Style</Label>
                      <RadioGroup
                        value={p.seatType}
                        onValueChange={p.setSeatType}
                        className="flex gap-2"
                      >
                        {[
                          { val: "cushion", label: "With Cushion" },
                          { val: "without_cushion", label: "Bare Steel / Wood" },
                        ].map((s) => (
                          <Label
                            key={s.val}
                            htmlFor={`seat-${s.val}`}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer transition-all font-mono uppercase ${
                              p.seatType === s.val
                                ? "border-zinc-400 bg-white/5 text-white"
                                : "border-white/10 text-zinc-400 hover:border-white/20"
                            }`}
                          >
                            <RadioGroupItem value={s.val} id={`seat-${s.val}`} className="sr-only" />
                            <span>{s.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <NumberInput
                      label={p.seatType === "cushion" ? "Foam & Leatherette Cost" : "Alternative Seat Base Cost"}
                      value={p.seatCost}
                      onChange={p.setSeatCost}
                      id="seat-cost"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 5: Finishing & Powder Coating */}
              <AccordionItem value="finish-coating" className="border border-white/10 rounded-lg bg-zinc-950/60 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-zinc-900/40 border-b border-white/5">
                  <AccordionHeader
                    icon={Paintbrush}
                    title="5. Finishing & Powder Coating"
                    description="Coating types, polish, or specific color costings"
                    badge={p.finishType === "powder_coating" ? `Coating (${p.coatingColor})` : "Polish Finish"}
                  />
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-mono text-zinc-400">Finish Treatment</Label>
                        <RadioGroup
                          value={p.finishType}
                          onValueChange={p.setFinishType}
                          className="flex gap-2"
                        >
                          {[
                            { val: "polish", label: "Buffing & Polish" },
                            { val: "powder_coating", label: "Powder Coating" },
                          ].map((f) => (
                            <Label
                              key={f.val}
                              htmlFor={`fin-${f.val}`}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer transition-all font-mono uppercase ${
                                p.finishType === f.val
                                  ? "border-zinc-400 bg-white/5 text-white"
                                  : "border-white/10 text-zinc-400 hover:border-white/20"
                              }`}
                            >
                              <RadioGroupItem value={f.val} id={`fin-${f.val}`} className="sr-only" />
                              <span>{f.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>

                      {p.finishType === "powder_coating" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-mono text-zinc-400">Coating Color Shade</Label>
                          <RadioGroup
                            value={p.coatingColor}
                            onValueChange={p.setCoatingColor}
                            className="flex gap-2"
                          >
                            {[
                              { val: "black", color: "#09090b" },
                              { val: "gold", color: "#ca8a04" },
                            ].map((c) => (
                              <Label
                                key={c.val}
                                htmlFor={`cc-${c.val}`}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded border text-xs cursor-pointer transition-all font-mono capitalize ${
                                  p.coatingColor === c.val
                                    ? "border-zinc-400 bg-white/5 text-white"
                                    : "border-white/10 text-zinc-400 hover:border-white/20"
                                }`}
                              >
                                <RadioGroupItem value={c.val} id={`cc-${c.val}`} className="sr-only" />
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white/10"
                                  style={{ backgroundColor: c.color }}
                                />
                                <span>{c.val}</span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                    </div>

                    <NumberInput
                      label="Chemical & Finish Cost"
                      value={p.finishCost}
                      onChange={p.setFinishCost}
                      id="finish-cost"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 6: Labour & Fabrication */}
              <AccordionItem value="labour-fab" className="border border-white/10 rounded-lg bg-zinc-950/60 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-zinc-900/40 border-b border-white/5">
                  <AccordionHeader
                    icon={Wrench}
                    title="6. Labour & Fabrication Charges"
                    description="Welding, sheet metal, power consumption, machine wear"
                    badge={`Total Fab: ₹${(parseFloat(p.labourCost) || 0) + (parseFloat(p.weldingCost) || 0) + (parseFloat(p.electricityCost) || 0) + (parseFloat(p.machineCost) || 0)}`}
                  />
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <NumberInput
                      label="Labour Charge"
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
                      label="Electricity"
                      value={p.electricityCost}
                      onChange={p.setElectricityCost}
                      id="electricity-cost"
                    />
                    <NumberInput
                      label="Machine Setup"
                      value={p.machineCost}
                      onChange={p.setMachineCost}
                      id="machine-cost"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 7: Profit Margins */}
              <AccordionItem value="margins" className="border border-white/10 rounded-lg bg-zinc-950/60 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-zinc-900/40 border-b border-white/5">
                  <AccordionHeader
                    icon={TrendingUp}
                    title="7. Profit Margin Layouts"
                    description="Configure percentage markups for Wholesale, Retail, and Showroom tiers"
                    badge={`W:${activeWholesalePct}% R:${activeRetailPct}% S:${activeShowroomPct}%`}
                  />
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  <div className="space-y-4">
                    {/* SS Margins */}
                    <div>
                      <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wide block mb-2">Stainless Steel (SS) Margins</span>
                      <div className="grid grid-cols-3 gap-2">
                        <NumberInput
                          label="SS Wholesale %"
                          value={p.ssWholesalePercent}
                          onChange={p.setSsWholesalePercent}
                          prefix=""
                          suffix="%"
                        />
                        <NumberInput
                          label="SS Retail %"
                          value={p.ssRetailPercent}
                          onChange={p.setSsRetailPercent}
                          prefix=""
                          suffix="%"
                        />
                        <NumberInput
                          label="SS Showroom %"
                          value={p.ssShowroomPercent}
                          onChange={p.setSsShowroomPercent}
                          prefix=""
                          suffix="%"
                        />
                      </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* MS Margins */}
                    <div>
                      <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wide block mb-2">Mild Steel (MS) Margins</span>
                      <div className="grid grid-cols-3 gap-2">
                        <NumberInput
                          label="MS Wholesale %"
                          value={p.msWholesalePercent}
                          onChange={p.setMsWholesalePercent}
                          prefix=""
                          suffix="%"
                        />
                        <NumberInput
                          label="MS Retail %"
                          value={p.msRetailPercent}
                          onChange={p.setMsRetailPercent}
                          prefix=""
                          suffix="%"
                        />
                        <NumberInput
                          label="MS Showroom %"
                          value={p.msShowroomPercent}
                          onChange={p.setMsShowroomPercent}
                          prefix=""
                          suffix="%"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>

          {/* RIGHT COLUMN: Sticky Summary Sidebar Panel */}
          <div className="lg:sticky lg:top-20 space-y-4">
            
            {/* Base Costing Summary Panel */}
            <Card className="border-white/10 bg-zinc-950/80 glass-panel">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Costing Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 font-mono text-xs">
                
                {/* Weight Row */}
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Pipe Weight:</span>
                  <span className="text-zinc-200 font-semibold">{p.totalPipeWeight ? `${p.totalPipeWeight} kg` : "0.00 kg"}</span>
                </div>

                {/* Pipe Cost Row */}
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Pipe Base Cost:</span>
                  <span className="text-zinc-200">₹{fmt(p.pipeCost)}</span>
                </div>

                {/* Additional Cost Row */}
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Additional Cost:</span>
                  <span className="text-zinc-200" title="Includes top, seat, finish, and fab costs">₹{fmt(additionalCostSum)}</span>
                </div>

                <Separator className="bg-white/5" />

                {/* Total Cost Row */}
                <div className="flex items-center justify-between py-1 bg-white/[0.02] px-2 rounded border border-white/5">
                  <span className="text-zinc-300 font-semibold">Total Base Mfg Cost:</span>
                  <span className="text-base font-bold text-white">₹{fmt(p.totalCost)}</span>
                </div>

              </CardContent>
            </Card>

            {/* Pricing Tiers Card */}
            <Card className={`border-l-4 bg-zinc-950/80 glass-panel ${p.materialType === "ss" ? "border-l-sky-500 border-white/10" : "border-l-orange-500 border-white/10"}`}>
              <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
                    Calculated Quotes ({p.materialType.toUpperCase()})
                  </CardTitle>
                </div>
                <Badge variant="outline" className={`font-mono text-[9px] px-1 py-0 ${p.materialType === "ss" ? "border-sky-500/30 text-sky-400" : "border-orange-500/30 text-orange-400"}`}>
                  {p.materialType === "ss" ? "SS Active" : "MS Active"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Wholesale Price Box */}
                <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-white/5">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Wholesale (+{activeWholesalePct}%)</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">₹{fmt(activeWholesalePrice)}</span>
                  </div>
                  <Badge className="bg-zinc-800 text-zinc-400 font-mono text-[10px]">Dealer</Badge>
                </div>

                {/* Retail Price Box */}
                <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-white/5">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Retail (+{activeRetailPct}%)</span>
                    <span className="text-lg font-bold font-mono text-zinc-200">₹{fmt(activeRetailPrice)}</span>
                  </div>
                  <Badge className="bg-zinc-800 text-zinc-400 font-mono text-[10px]">Standard</Badge>
                </div>

                {/* Showroom Price Box */}
                <div className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-white/5">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Showroom Spec (+{activeShowroomPct}%)</span>
                    <span className="text-lg font-bold font-mono text-white">₹{fmt(activeShowroomPrice)}</span>
                  </div>
                  <Badge className="bg-zinc-800 text-zinc-400 font-mono text-[10px]">Premium</Badge>
                </div>

              </CardContent>
            </Card>

            {/* Custom Profitability Checker widget */}
            <Card className="border-white/10 bg-zinc-950/80 glass-panel">
              <CardContent className="p-4 space-y-3">
                <NumberInput
                  label="Validate Custom Quote (₹)"
                  value={p.customPrice}
                  onChange={p.setCustomPrice}
                  id="custom-validate"
                  prefix="₹"
                  placeholder="Enter custom selling price"
                />

                {p.priceStatus && (
                  <div className="pt-1">
                    {p.priceStatus === "LOSS" && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-red-400 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>LOSS: Below Wholesale</span>
                      </div>
                    )}
                    {p.priceStatus === "LOW PROFIT" && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>LOW PROFIT: Under standard Retail</span>
                      </div>
                    )}
                    {p.priceStatus === "OK" && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>PROFIT OK: Healthy margin achieved</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Primary Action Buttons */}
            <div className="space-y-2 pt-2">
              
              <Button
                type="button"
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono text-xs h-9 uppercase tracking-wider font-bold"
                disabled={p.saving || p.totalCost <= 0 || isLoading}
                onClick={async () => {
                  const result = await p.saveProduct();
                  if (result.success) {
                    toast.success(result.isUpdate ? "Quote updated" : "Quote saved successfully", {
                      description: `${p.modelNumber || "Product"} costing logged to system database.`,
                    });
                    if (result.isUpdate) {
                      router.push("/products");
                    }
                  } else {
                    toast.error("Failed to save product", {
                      description: result.error,
                    });
                  }
                }}
              >
                {p.saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving to DB...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Quotation
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 hover:bg-zinc-900 text-zinc-300 hover:text-white font-mono text-[11px] h-9 uppercase"
                  disabled={p.totalCost <= 0}
                  onClick={handleExportPDF}
                >
                  <FileDown className="h-3.5 w-3.5 mr-1" />
                  PDF Quote
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-red-500/10 text-zinc-500 hover:text-red-400 font-mono text-[11px] h-9 uppercase"
                  onClick={() => {
                    p.resetForm();
                    toast.success("Form fields reset to default values.");
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
