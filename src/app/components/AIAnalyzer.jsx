"use client";
import React, { useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  Sparkles,
  Upload,
  X,
  ImageIcon,
  Ruler,
  Brain,
  ListChecks,
  IndianRupee,
  ChevronRight,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wrench,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAIAnalysis } from "@/hooks/useAIAnalysis.js";
import PipeTable, { calculateRowWeight } from "./PipeTable.jsx";
import CalculationSummary from "./CalculationSummary.jsx";

// Pipe size options
const PIPE_SIZES = ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"];
const THICKNESS_OPTIONS = ["1.0", "1.2", "1.5", "2.0", "3.0"];

// Step configuration
const STEPS = [
  { num: 1, label: "Upload", icon: ImageIcon },
  { num: 2, label: "Dimensions", icon: Ruler },
  { num: 3, label: "AI Analysis", icon: Brain },
  { num: 4, label: "Cut List", icon: ListChecks },
  { num: 5, label: "Results", icon: IndianRupee },
];

export default function AIAnalyzer() {
  const ai = useAIAnalysis();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-violet-500/60", "bg-violet-500/5");
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-violet-500/60", "bg-violet-500/5");
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-violet-500/60", "bg-violet-500/5");
    }
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      ai.handleImageUpload(files[0]);
    }
  }, [ai]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      ai.handleImageUpload(file);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }, [ai]);

  // Handle pipe table changes — recalculate weights
  const handlePipesChange = useCallback((newPipes) => {
    const material = ai.dimensions.materialType === "ms" ? "ms" : "ss";
    const updated = newPipes.map((row) => {
      const wt = calculateRowWeight(row, material);
      return { ...row, weightPerTube: parseFloat(wt.toFixed(3)) };
    });
    ai.setCutList(updated);
  }, [ai]);

  // Price per kg based on material
  const pricePerKg = ai.dimensions.materialType === "ms" ? Number(ai.msSteelRate) || 120 : 260;

  return (
    <div className="flex items-center justify-center p-4 bg-[#09090b] min-h-screen">
      <Card className="w-full max-w-5xl border-white/10 bg-zinc-950/60 glass-panel shadow-2xl">
        {/* Header */}
        <CardHeader className="pb-4 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 bg-zinc-900 border border-white/10 rounded-lg hover:bg-zinc-800 hover:border-white/20 transition-all"
              >
                <ArrowLeft className="h-5 w-5 text-zinc-400" />
              </Link>
              <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-white font-mono">
                  AI Furniture Analyzer
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 font-mono">
                  Upload a photo → AI generates the pipe cut list → automatic weight & cost
                </CardDescription>
              </div>
            </div>

            {/* Reset button */}
            {ai.currentStep > 1 && (
              <Button
                onClick={() => {
                  ai.resetAnalysis();
                  toast.success("Analysis reset");
                }}
                variant="outline"
                className="bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider h-8"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Start Over
              </Button>
            )}
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = ai.currentStep === step.num;
              const isCompleted = ai.currentStep > step.num;
              const isDisabled = ai.currentStep < step.num;

              return (
                <React.Fragment key={step.num}>
                  <button
                    onClick={() => {
                      // Allow navigating back to completed steps
                      if (isCompleted || isActive) {
                        ai.setCurrentStep(step.num);
                      }
                    }}
                    disabled={isDisabled}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                      isActive
                        ? "step-active text-violet-300 border border-violet-500/40"
                        : isCompleted
                        ? "step-completed text-violet-400/80 border border-violet-500/20 cursor-pointer hover:border-violet-500/40"
                        : "text-zinc-600 border border-transparent cursor-not-allowed"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.num}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isCompleted ? "text-violet-500/40" : "text-zinc-700"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Error Display */}
          {ai.error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-red-300/80 text-xs mt-1">{ai.error}</p>
              </div>
            </div>
          )}

          {/* ===== STEP 1: Image Upload ===== */}
          {ai.currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Step 1 — Upload Furniture Image
              </h3>

              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 group"
              >
                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-violet-400" />
                </div>
                <p className="text-zinc-300 font-medium text-sm">
                  Drop your furniture image here
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  or click to browse • JPG, PNG, WebP up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                <Wrench className="h-4 w-4 text-zinc-600" />
                <span>Supports: Steel Chairs, Tables, Stools, Racks, Shelves, Beds, Benches</span>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Dimensions & Settings ===== */}
          {ai.currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Ruler className="h-4 w-4" /> Step 2 — Furniture Dimensions & Pipe Specs
              </h3>

              {/* Image Preview */}
              {ai.image && (
                <div className="relative inline-block">
                  <img
                    src={ai.image}
                    alt="Uploaded furniture"
                    className="max-h-48 rounded-lg border border-white/10 object-contain"
                  />
                  <button
                    onClick={ai.removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] text-zinc-300 font-mono">
                    {ai.imageFile}
                  </div>
                </div>
              )}

              {/* MS Steel Rate & Manual Mode Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                    MS Steel Rate (₹/kg)
                  </label>
                  <input
                    type="number"
                    value={ai.msSteelRate}
                    onChange={(e) => ai.setMsSteelRate(e.target.value)}
                    className="w-full h-9 px-3 bg-zinc-900/60 border border-white/10 rounded-md text-zinc-200 text-sm font-mono focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="manual-mode"
                    checked={ai.isManualMode}
                    onCheckedChange={ai.setIsManualMode}
                    className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                  />
                  <label
                    htmlFor="manual-mode"
                    className="text-sm font-medium text-zinc-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Enable Manual Dimensions & Pipe Specification
                  </label>
                </div>
              </div>

              {ai.isManualMode && (
                <div className="space-y-6 pt-2">
                  {/* Overall Dimensions */}
                  <div className="space-y-3">
                    <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Overall Dimensions (inches)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <DimensionInput
                        label="Height"
                        value={ai.dimensions.overallHeight}
                        onChange={(v) => ai.updateDimension("overallHeight", v)}
                        placeholder="e.g. 34"
                      />
                      <DimensionInput
                        label="Width"
                        value={ai.dimensions.overallWidth}
                        onChange={(v) => ai.updateDimension("overallWidth", v)}
                        placeholder="e.g. 18"
                      />
                      <DimensionInput
                        label="Depth"
                        value={ai.dimensions.overallDepth}
                        onChange={(v) => ai.updateDimension("overallDepth", v)}
                        placeholder="e.g. 18"
                      />
                    </div>
                  </div>

                  {/* Material & Shape */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Material Type</label>
                      <Select
                        value={ai.dimensions.materialType}
                        onValueChange={(v) => ai.updateDimension("materialType", v)}
                      >
                        <SelectTrigger className="h-9 bg-zinc-900/60 border-white/10 text-zinc-200 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          <SelectItem value="ms">Mild Steel (MS)</SelectItem>
                          <SelectItem value="ss">Stainless Steel (SS)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Pipe Shape</label>
                      <Select
                        value={ai.dimensions.pipeShape}
                        onValueChange={(v) => ai.updateDimension("pipeShape", v)}
                      >
                        <SelectTrigger className="h-9 bg-zinc-900/60 border-white/10 text-zinc-200 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="round">Round</SelectItem>
                          <SelectItem value="rectangular">Rectangular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Pipe Thickness</label>
                      <Select
                        value={ai.dimensions.pipeThickness}
                        onValueChange={(v) => ai.updateDimension("pipeThickness", v)}
                      >
                        <SelectTrigger className="h-9 bg-zinc-900/60 border-white/10 text-zinc-200 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          {THICKNESS_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>{t} mm</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Pipe Sizes */}
                  <div className="space-y-3">
                    <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Pipe Sizes (inches)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <PipeSizeSelect
                        label="Main Pipe"
                        value={ai.dimensions.mainPipeSize}
                        onChange={(v) => ai.updateDimension("mainPipeSize", v)}
                      />
                      <PipeSizeSelect
                        label="Side Pipe"
                        value={ai.dimensions.sidePipeSize}
                        onChange={(v) => ai.updateDimension("sidePipeSize", v)}
                      />
                      <PipeSizeSelect
                        label="Leg Pipe"
                        value={ai.dimensions.legPipeSize}
                        onChange={(v) => ai.updateDimension("legPipeSize", v)}
                      />
                      <PipeSizeSelect
                        label="Seat Support"
                        value={ai.dimensions.seatSupportPipeSize}
                        onChange={(v) => ai.updateDimension("seatSupportPipeSize", v)}
                      />
                      <PipeSizeSelect
                        label="Back Support"
                        value={ai.dimensions.backSupportPipeSize}
                        onChange={(v) => ai.updateDimension("backSupportPipeSize", v)}
                      />
                    </div>
                  </div>
                </div>
              )}



              {/* Analyze Button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={ai.analyzeImage}
                  disabled={ai.isAnalyzing}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-mono text-sm uppercase tracking-wider h-10 px-6 shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30 disabled:opacity-50"
                >
                  {ai.isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" /> Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: AI Analysis In Progress / Results ===== */}
          {ai.currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Brain className="h-4 w-4" /> Step 3 — AI Structure Analysis
              </h3>

              {ai.isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="relative">
                    <div className="p-6 bg-violet-500/10 border border-violet-500/30 rounded-2xl ai-analyzing">
                      <Brain className="h-12 w-12 text-violet-400" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                      </span>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-zinc-200 font-medium">
                      {ai.progressMessage || "Analyzing furniture structure..."}
                    </p>
                    <p className="text-zinc-500 text-xs font-mono">
                      Running durable background workflow...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 font-mono">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing with vision model
                  </div>
                </div>
              ) : ai.analysisResult ? (
                <div className="space-y-4">
                  {/* Analysis Summary */}
                  <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-400" />
                      <span className="text-violet-300 font-mono text-xs uppercase tracking-wider">
                        Identified: {ai.analysisResult.furnitureType}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-sm">{ai.analysisResult.analysis}</p>
                  </div>

                  {/* Structural Members */}
                  {ai.analysisResult.structuralMembers?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                        Structural Members Identified ({ai.analysisResult.structuralMembers.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {ai.analysisResult.structuralMembers.map((member, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/60 border border-white/5"
                          >
                            <div className="p-1.5 bg-violet-500/10 rounded-md">
                              <Wrench className="h-3.5 w-3.5 text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-200 text-sm font-medium truncate">{member.name}</p>
                              <p className="text-zinc-500 text-[10px] font-mono">{member.description}</p>
                            </div>
                            <span className="text-violet-400 font-mono text-sm font-bold">
                              ×{member.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Re-analyze or proceed */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => ai.setCurrentStep(2)}
                      variant="outline"
                      className="bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider h-9"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Re-analyze
                    </Button>
                    {ai.cutList.length > 0 && (
                      <Button
                        onClick={() => ai.setCurrentStep(4)}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs uppercase tracking-wider h-9 px-5"
                      >
                        View Cut List <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">
                    Go back to Step 2 and click &quot;Analyze with AI&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===== STEP 4: Generated Cut List (Editable PipeTable) ===== */}
          {ai.currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Step 4 — AI-Generated Cut List
                </h3>
                <span className="text-violet-400 text-xs font-mono bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                  {ai.cutList.length} pipes identified
                </span>
              </div>

              {/* Analysis context */}
              {ai.analysisResult && (
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 text-xs">
                  <span className="text-zinc-500 font-mono uppercase tracking-wider">Furniture: </span>
                  <span className="text-zinc-300 capitalize">{ai.analysisResult.furnitureType}</span>
                  <span className="text-zinc-600 mx-2">•</span>
                  <span className="text-zinc-500 font-mono uppercase tracking-wider">Material: </span>
                  <span className="text-zinc-300">{ai.dimensions.materialType === "ms" ? "Mild Steel" : "Stainless Steel"}</span>
                  <span className="text-zinc-600 mx-2">•</span>
                  <span className="text-zinc-500 font-mono uppercase tracking-wider">Rate: </span>
                  <span className="text-zinc-300">₹{pricePerKg}/kg</span>
                </div>
              )}

              {/* Editable PipeTable */}
              <PipeTable
                pipes={ai.cutList}
                onChange={handlePipesChange}
                pricePerKg={pricePerKg}
                material={ai.dimensions.materialType === "ms" ? "ms" : "ss"}
              />

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={() => ai.setCurrentStep(3)}
                  variant="outline"
                  className="bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider h-9"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Analysis
                </Button>
                <Button
                  onClick={ai.goToResults}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs uppercase tracking-wider h-9 px-5 shadow-lg shadow-violet-500/20"
                >
                  View Weight & Cost <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 5: Weight & Price Results ===== */}
          {ai.currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" /> Step 5 — Weight & Cost Summary
              </h3>

              {/* Summary Cards */}
              <CalculationSummary
                tubes={ai.cutList}
                pricePerKg={pricePerKg}
                material={ai.dimensions.materialType === "ms" ? "ms" : "ss"}
              />

              {/* Category-wise breakdown */}
              <CategoryBreakdown
                cutList={ai.cutList}
                material={ai.dimensions.materialType === "ms" ? "ms" : "ss"}
                pricePerKg={pricePerKg}
              />

              {/* Cut list table (read view) */}
              <div className="space-y-2">
                <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Detailed Cut List</p>
                <PipeTable
                  pipes={ai.cutList}
                  onChange={handlePipesChange}
                  pricePerKg={pricePerKg}
                  material={ai.dimensions.materialType === "ms" ? "ms" : "ss"}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={() => ai.setCurrentStep(4)}
                  variant="outline"
                  className="bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider h-9"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Edit Cut List
                </Button>
                <Button
                  onClick={() => {
                    ai.resetAnalysis();
                    toast.success("Ready for new analysis");
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs uppercase tracking-wider h-9 px-5"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> New Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Sub-components =====

function DimensionInput({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
        {label}
      </label>
      <input
        type="number"
        step="any"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 bg-zinc-900/60 border border-white/10 rounded-md text-zinc-200 text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
      />
    </div>
  );
}

function PipeSizeSelect({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-zinc-900/60 border-white/10 text-zinc-200 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-white/10">
          {PIPE_SIZES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}&quot; pipe
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CategoryBreakdown({ cutList, material, pricePerKg }) {
  // Group by pipe size/shape
  const categories = {};
  cutList.forEach((row) => {
    const key = `${row.shape} ${row.size || `${row.width}×${row.height}`}"`;
    if (!categories[key]) {
      categories[key] = { label: key, totalWeight: 0, totalCost: 0, count: 0 };
    }
    const weight = calculateRowWeight(row, material) * (parseFloat(row.quantity) || 0);
    categories[key].totalWeight += weight;
    categories[key].totalCost += weight * pricePerKg;
    categories[key].count += parseFloat(row.quantity) || 0;
  });

  const categoryList = Object.values(categories).sort((a, b) => b.totalWeight - a.totalWeight);

  if (categoryList.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Category-wise Breakdown</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categoryList.map((cat, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-white/5"
          >
            <div>
              <p className="text-zinc-200 text-sm font-medium capitalize">{cat.label}</p>
              <p className="text-zinc-500 text-[10px] font-mono mt-0.5">
                {cat.count} piece{cat.count !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-zinc-200 text-sm font-mono font-medium">
                {cat.totalWeight.toFixed(2)} kg
              </p>
              <p className="text-zinc-500 text-[10px] font-mono">
                ₹{cat.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
