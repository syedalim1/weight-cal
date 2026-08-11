"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Plus, UploadCloud, Cpu, PenTool, Image as ImageIcon, Settings2, Save, FolderOpen, Loader2, Copy, ClipboardList, FileText, Printer, Eye, EyeOff, DollarSign, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { saveFurnitureModel, getFurnitureModels, updateFurnitureModel } from "../actions/furniture";

export default function UnifiedCalculator() {
  const [mode, setMode] = useState("manual"); // "manual" or "ai"
  const [material, setMaterial] = useState("ms"); // "ms" or "ss"

  // Global Rates & Settings
  const [rates, setRates] = useState({ ms: 120, ss: 260 });
  const [orderQuantity, setOrderQuantity] = useState(1);

  // Pricing & Profit Margin State
  const [laborCost, setLaborCost] = useState(0);
  const [finishingCost, setFinishingCost] = useState(0);
  const [accessoriesCost, setAccessoriesCost] = useState(0);
  const [profitMargin, setProfitMargin] = useState(20);
  const [fabricationNotes, setFabricationNotes] = useState("");
  const [showBaseCost, setShowBaseCost] = useState(false);

  // Manual Mode State
  const [rows, setRows] = useState([
    {
      id: Date.now().toString(),
      partName: "",
      shape: "square",
      size: "",
      thicknessUnit: "gauge",
      thickness: "",
      lengthUnit: "mm",
      length: "",
      quantity: 1,
    }
  ]);

  // AI Mode State
  const [aiDimensions, setAiDimensions] = useState({
    overallHeight: "",
    seatHeight: "",
    width: "",
    length: "",
  });
  const [aiMaterialPreset, setAiMaterialPreset] = useState("ms_cr");
  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // DB State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [modelNameInput, setModelNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [savedModels, setSavedModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [loadedModelId, setLoadedModelId] = useState(null); // to track if we are updating an existing one

  // Handlers
  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        partName: "",
        shape: "square",
        size: "",
        thicknessUnit: "gauge",
        thickness: "",
        lengthUnit: "mm",
        length: "",
        quantity: 1,
      }
    ]);
  };

  const removeRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) {
      alert("Please upload an image first.");
      return;
    }
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/analyze-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          dimensions: aiDimensions,
          preset: aiMaterialPreset,
        }),
      });

      const res = await response.json();

      if (res.success && res.cutList) {
        // Map AI response to our row state
        const mappedRows = res.cutList.map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          partName: item.partName || "",
          shape: item.shape || "square",
          size: item.size_mm || "",
          thicknessUnit: "gauge",
          thickness: item.thickness_gauge || "",
          lengthUnit: "mm",
          length: item.length_mm?.toString() || "",
          quantity: item.qty || 1,
        }));
        
        setRows(mappedRows);
        setMode("manual"); // Switch back to manual to review
        alert("AI analysis complete! Review the generated cut-list.");
      } else {
        alert(res.error || "Failed to analyze image.");
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveModel = async () => {
    if (!modelNameInput.trim()) {
      alert("Please enter a model name.");
      return;
    }
    
    setIsSaving(true);
    
    const payload = {
      modelName: modelNameInput,
      materialType: material,
      referenceDimensions: aiDimensions,
      cutList: rows,
    };

    let res;
    if (loadedModelId) {
      res = await updateFurnitureModel(loadedModelId, payload);
    } else {
      res = await saveFurnitureModel(payload);
    }

    setIsSaving(false);
    if (res.success) {
      setIsSaveModalOpen(false);
      setModelNameInput("");
      setLoadedModelId(res.model.id); // now we are tracking this saved model
      alert("Model saved successfully!");
    } else {
      alert(res.error || "Failed to save model.");
    }
  };

  const fetchModels = async () => {
    setIsLoadingModels(true);
    const res = await getFurnitureModels();
    if (res.success) {
      setSavedModels(res.models);
    }
    setIsLoadingModels(false);
  };

  // Fetch when sheet opens
  useEffect(() => {
    if (isSheetOpen) {
      fetchModels();
    }
  }, [isSheetOpen]);

  const handleLoadModel = (model) => {
    setMaterial(model.materialType || "ms");
    setAiDimensions(model.referenceDimensions || { overallHeight: "", seatHeight: "", width: "", length: "" });
    
    // The cutList is stored as JSON, ensure it matches row structure
    if (Array.isArray(model.cutList)) {
      setRows(model.cutList);
    }
    
    setLoadedModelId(model.id);
    setModelNameInput(model.modelName);
    setIsSheetOpen(false);
    setMode("manual");
  };

  // Procurement Logic
  const getLengthInMM = (len, unit) => {
    const num = parseFloat(len);
    if (isNaN(num)) return 0;
    if (unit === "feet" || unit === "ft") return num * 304.8;
    if (unit === "inch" || unit === "in") return num * 25.4;
    return num; // mm
  };

  const generateProcurementList = () => {
    const groups = {};
    rows.forEach(row => {
      if (!row.size || !row.thickness || !row.length) return;
      const key = `${row.shape}_${row.size}_${row.thickness}${row.thicknessUnit}`;
      
      if (!groups[key]) {
        groups[key] = {
          shape: row.shape,
          size: row.size,
          thickness: row.thickness,
          thicknessUnit: row.thicknessUnit,
          totalLengthMM: 0
        };
      }
      
      const lengthMM = getLengthInMM(row.length, row.lengthUnit);
      groups[key].totalLengthMM += (lengthMM * (row.quantity || 1) * (orderQuantity || 1));
    });

    return Object.values(groups).map(g => {
      const standardPipeMM = 6096; // 20 feet
      const pipesNeeded = Math.ceil((g.totalLengthMM * 1.05) / standardPipeMM);
      return {
        ...g,
        pipesNeeded
      };
    });
  };

  const procurementList = generateProcurementList();

  const handleCopyProcurement = () => {
    let text = `*Supplier Procurement List*\nModel: ${modelNameInput || "Untitled Model"}\nTotal Order Quantity: ${orderQuantity}\nMaterial: ${material.toUpperCase()}\n\n`;
    
    if (procurementList.length === 0) {
      text += "No pipes configured.";
    } else {
      procurementList.forEach(p => {
        const shapeStr = p.shape.charAt(0).toUpperCase() + p.shape.slice(1);
        const thickStr = p.thicknessUnit === 'gauge' ? `${p.thickness} Gauge` : `${p.thickness}mm`;
        text += `- ${shapeStr} Pipe - ${p.size}mm (${thickStr}) -> *${p.pipesNeeded} Full Lengths (20ft)*\n`;
      });
    }

    navigator.clipboard.writeText(text);
    alert("Procurement list copied to clipboard!");
  };

  // Financial & Weight Calculations
  const gaugeToMM = (gaugeStr) => {
    const g = parseInt(gaugeStr);
    if (isNaN(g)) return parseFloat(gaugeStr) || 1.2;
    const gaugeMap = { 14: 2.0, 16: 1.6, 18: 1.2, 19: 1.0, 20: 0.9, 22: 0.7 };
    return gaugeMap[g] || 1.2;
  };

  const calculateRowWeightPerItem = (row) => {
    if (!row.size || !row.thickness || !row.length) return 0;
    
    const thicknessMM = row.thicknessUnit === "gauge" ? gaugeToMM(row.thickness) : (parseFloat(row.thickness) || 1.2);
    const lengthMeters = getLengthInMM(row.length, row.lengthUnit) / 1000;
    const qty = row.quantity || 1;

    // Density factor: MS ~7.85 g/cm³, SS ~7.93 g/cm³
    // Standard formulas use 7.85 as the base density; scale for SS
    const densityFactor = material === "ss" ? (7.93 / 7.85) : 1.0;

    let weightPerMeter = 0;
    let width = parseFloat(row.size) || 25;
    let height = width;
    if (typeof row.size === 'string' && row.size.toLowerCase().includes('x')) {
      const parts = row.size.toLowerCase().split('x').map(p => parseFloat(p.trim()));
      width = parts[0] || 25;
      height = parts[1] || parts[0] || 25;
    }

    if (row.shape === "round") {
      weightPerMeter = (width - thicknessMM) * thicknessMM * 0.02466;
    } else if (row.shape === "square") {
      weightPerMeter = (width - thicknessMM) * thicknessMM * 0.0314;
    } else if (row.shape === "rectangle") {
      weightPerMeter = (((width + height) / 2) - thicknessMM) * thicknessMM * 0.0314;
    } else {
      weightPerMeter = (width - thicknessMM) * thicknessMM * 0.0314;
    }

    return Math.max(0, weightPerMeter * lengthMeters * qty * densityFactor);
  };

  const totalMaterialWeightPerItem = rows.reduce((acc, row) => acc + calculateRowWeightPerItem(row), 0);
  const totalMaterialWeightOrder = totalMaterialWeightPerItem * (orderQuantity || 1);
  const activeRate = rates[material] || 120;
  const totalMaterialCost = totalMaterialWeightOrder * activeRate;

  const baseCost = Number((totalMaterialCost + (parseFloat(laborCost) || 0) + (parseFloat(finishingCost) || 0) + (parseFloat(accessoriesCost) || 0)).toFixed(2));
  const profitAmount = Number((baseCost * ((profitMargin || 0) / 100)).toFixed(2));
  const finalSellingPrice = Number((baseCost + profitAmount).toFixed(2));
  const gstAmount = Number((finalSellingPrice * 0.18).toFixed(2));
  const grandTotal = Number((parseFloat(finalSellingPrice) + parseFloat(gstAmount)).toFixed(2));

  // PDF Generation Functions — shared brand header helper
  const _drawBrandHeader = (doc, subtitle) => {
    // Brand colour: deep industrial blue
    doc.setFillColor(15, 30, 75);
    doc.rect(0, 0, 210, 38, "F");

    // Company name
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("INDIAN MAKE STEEL INDUSTRIES", 14, 16);

    // Address line
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 200, 230);
    doc.text("Pollachi Main Road, SIDCO Industrial Estate, Coimbatore, Tamil Nadu, India.", 14, 24);

    // Subtitle & date
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 230, 255);
    doc.text(subtitle, 14, 33);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 155, 33);

    // Divider
    doc.setLineWidth(0.7);
    doc.setDrawColor(30, 64, 175);
    doc.line(14, 40, 196, 40);
  };

  const generateCustomerQuotePDF = () => {
    const doc = new jsPDF();

    _drawBrandHeader(doc, "Official Customer Quotation");

    // Model & Details
    let currentY = 50;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Product: ${modelNameInput || "Custom Steel Furniture"}`, 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Material: ${material.toUpperCase()} Steel`, 14, currentY + 7);
    doc.text(`Total Quantity: ${orderQuantity} Unit(s)`, 14, currentY + 14);

    currentY += 24;

    // Optional Furniture Image
    if (imageBase64) {
      try {
        doc.addImage(imageBase64, "JPEG", 14, currentY, 55, 55);
        currentY += 62;
      } catch (e) {
        console.warn("Could not render image in customer PDF", e);
      }
    }

    // ── Strict floating-point safe totals for PDF ──
    const pdfSellingPrice = parseFloat(finalSellingPrice).toFixed(2);
    const pdfGST = parseFloat(gstAmount).toFixed(2);
    const pdfGrandTotal = (parseFloat(pdfSellingPrice) + parseFloat(pdfGST)).toFixed(2);

    // ── Modern invoice-style financial table ──
    autoTable(doc, {
      startY: currentY,
      head: [["Description", "Amount (INR)"]],
      body: [
        [`Selling Price (${orderQuantity} Unit${orderQuantity > 1 ? 's' : ''})`, pdfSellingPrice],
        ["GST @ 18%", pdfGST],
      ],
      foot: [["Grand Total (Incl. GST)", pdfGrandTotal]],
      theme: "grid",
      headStyles: { fillColor: [15, 30, 75], textColor: 255, fontStyle: "bold", fontSize: 10 },
      footStyles: { fillColor: [240, 245, 255], textColor: [15, 30, 75], fontStyle: "bold", fontSize: 12 },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 72, halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 14;

    // Terms & Conditions
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Terms & Conditions:", 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("1. 50% advance payment required upon order confirmation.", 14, currentY + 7);
    doc.text("2. Delivery timeline: 7-10 working days from advance payment receipt.", 14, currentY + 13);
    doc.text("3. Quotation is valid for 15 days from the date of issuance.", 14, currentY + 19);

    // Footer line
    doc.setDrawColor(200, 210, 230);
    doc.setLineWidth(0.3);
    doc.line(14, currentY + 28, 196, currentY + 28);
    doc.setFontSize(8);
    doc.setTextColor(160, 170, 185);
    doc.text("Thank you for choosing Indian Make Steel Industries.", 14, currentY + 33);

    doc.save(`Quotation_${modelNameInput || 'Steel_Furniture'}.pdf`);
  };

  const generateFactoryJobCardPDF = () => {
    const doc = new jsPDF();

    _drawBrandHeader(doc, "Internal Factory Job Card");

    // Model details
    let currentY = 50;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Model: ${modelNameInput || "Untitled Model"}`, 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Material: ${material.toUpperCase()}`, 100, currentY);
    doc.text(`Order Qty: ${orderQuantity} Unit(s)`, 155, currentY);

    currentY += 10;

    // Optional Furniture Image
    if (imageBase64) {
      try {
        doc.addImage(imageBase64, "JPEG", 14, currentY, 50, 50);
        currentY += 56;
      } catch (e) {
        console.warn("Could not render image in job card PDF", e);
      }
    }

    // ── Filter out empty / incomplete rows ──
    const validRows = rows.filter(r => r.partName && r.size && r.thickness && r.length);

    const tableData = validRows.map((r, i) => [
      i + 1,
      r.partName,
      r.shape.charAt(0).toUpperCase() + r.shape.slice(1),
      `${r.size} mm`,
      `${r.thickness} ${r.thicknessUnit === "gauge" ? "G" : "mm"}`,
      `${r.length} ${r.lengthUnit}`,
      r.quantity || 1,
      (r.quantity || 1) * (orderQuantity || 1)
    ]);

    if (tableData.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(180, 30, 30);
      doc.text("No valid pipe rows to display. Please fill in all fields before exporting.", 14, currentY + 6);
      currentY += 14;
    } else {
      autoTable(doc, {
        startY: currentY,
        head: [["#", "Part Name", "Shape", "Size", "Thickness", "Cut Length", "Qty/Item", "Total Qty"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [15, 30, 75], textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 14, right: 14 },
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }

    // ── Fabrication Notes — highlighted box so welders don't miss it ──
    const notesText = fabricationNotes.trim() || "No special notes specified. Follow standard factory fabrication specs.";
    const splitNotes = doc.splitTextToSize(notesText, 170);
    const notesBoxH = Math.max(24, splitNotes.length * 5 + 18);

    // Yellow-tinted highlight box
    doc.setFillColor(255, 250, 230);
    doc.setDrawColor(210, 160, 30);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, currentY, 182, notesBoxH, 3, 3, "FD");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(140, 90, 0);
    doc.text("\u26A0  Special Fabrication & Assembly Notes:", 20, currentY + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 40, 10);
    doc.text(splitNotes, 20, currentY + 15);

    doc.save(`JobCard_${modelNameInput || 'Steel_Furniture'}.pdf`);
  };

  // Theme Classes
  const isMS = material === "ms";
  const themeClasses = isMS 
    ? "border-orange-500/20 from-orange-500/10 to-transparent focus-visible:ring-orange-500" 
    : "border-sky-500/20 from-sky-500/10 to-transparent focus-visible:ring-sky-500";
  const textAccent = isMS ? "text-orange-400" : "text-sky-400";
  const bgAccent = isMS ? "bg-orange-500" : "bg-sky-500";
  const bgAccentMuted = isMS ? "bg-orange-500/20 text-orange-400" : "bg-sky-500/20 text-sky-400";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Top Controls Bar */}
      <div className={`p-4 rounded-xl border bg-zinc-900/50 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-500 ${themeClasses}`}>
        
        {/* Mode Toggle */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === "manual" ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <PenTool className="w-4 h-4" />
            Manual Entry
          </button>
          <button
            onClick={() => setMode("ai")}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === "ai" ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Cpu className="w-4 h-4" />
            AI Auto-Generate
          </button>
        </div>

        {/* Material Toggle */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
           <button
            onClick={() => setMaterial("ms")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${material === "ms" ? 'bg-orange-500/20 text-orange-400 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            MS (Mild Steel)
          </button>
          <button
            onClick={() => setMaterial("ss")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${material === "ss" ? 'bg-sky-500/20 text-sky-400 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            SS (Stainless Steel)
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-300 hover:text-white">
                <FolderOpen className="w-4 h-4 mr-2" /> Saved Models
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-zinc-950 border-zinc-800 text-zinc-200 sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="text-white">Saved Models</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 overflow-y-auto max-h-[80vh]">
                {isLoadingModels ? (
                  <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-zinc-500"/></div>
                ) : savedModels.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center">No saved models found.</p>
                ) : (
                  savedModels.map(model => (
                    <div key={model.id} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{model.modelName}</h4>
                        <p className="text-xs text-zinc-500">{new Date(model.createdAt).toLocaleDateString()} • {model.materialType}</p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleLoadModel(model)}>
                        Load
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>

      {/* Global Rates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
          <Label className="text-xs text-zinc-400 uppercase tracking-wider">MS Rate (₹/kg)</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
            <Input 
              type="number" 
              value={rates.ms} 
              onChange={(e) => setRates({...rates, ms: Number(e.target.value)})}
              className="pl-7 bg-zinc-950 border-zinc-800 h-10 font-mono"
            />
          </div>
        </div>
        <div className="space-y-1.5 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
          <Label className="text-xs text-zinc-400 uppercase tracking-wider">SS Rate (₹/kg)</Label>
          <div className="relative">
             <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
            <Input 
              type="number" 
              value={rates.ss} 
              onChange={(e) => setRates({...rates, ss: Number(e.target.value)})}
              className="pl-7 bg-zinc-950 border-zinc-800 h-10 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`rounded-xl border bg-gradient-to-b from-zinc-900/50 to-zinc-950 p-6 transition-colors duration-500 ${themeClasses}`}>
        
        {mode === "manual" ? (
          /* MANUAL ENTRY UI */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${textAccent}`}>
                <PenTool className="w-5 h-5" />
                Pipe Configuration
              </h2>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">
                  <Label className="text-sm text-zinc-400 pl-2">Total Order Qty:</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                    className="h-8 w-20 bg-zinc-950 border-zinc-800 text-center font-bold"
                  />
                </div>
                <Button onClick={() => setIsSaveModalOpen(true)} className={`text-white ${bgAccent} hover:opacity-90`}>
                  <Save className="w-4 h-4 mr-2" /> {loadedModelId ? "Update Model" : "Save Model"}
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-900 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg font-medium w-44">Part Name</th>
                    <th className="px-4 py-3 font-medium w-28">Shape</th>
                    <th className="px-4 py-3 font-medium w-28">Size (mm)</th>
                    <th className="px-4 py-3 font-medium w-36">Thickness</th>
                    <th className="px-4 py-3 font-medium w-44">Cut Length</th>
                    <th className="px-4 py-3 font-medium w-20">Qty</th>
                    <th className="px-4 py-3 font-medium w-24 text-right">Weight (KG)</th>
                    <th className="px-4 py-3 font-medium w-28 text-right">Cost (₹)</th>
                    <th className="px-4 py-3 rounded-tr-lg w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {rows.map((row) => {
                    const rowWeight = calculateRowWeightPerItem(row);
                    const rowCost = Number((rowWeight * activeRate).toFixed(2));
                    return (
                    <tr key={row.id} className="group hover:bg-zinc-900/30 transition-colors">
                      <td className="p-2">
                        <Input 
                          placeholder="e.g. Front Legs" 
                          value={row.partName}
                          onChange={(e) => updateRow(row.id, "partName", e.target.value)}
                          className="h-9 bg-zinc-950 border-zinc-800"
                        />
                      </td>
                      <td className="p-2">
                        <Select value={row.shape} onValueChange={(val) => updateRow(row.id, "shape", val)}>
                          <SelectTrigger className="h-9 bg-zinc-950 border-zinc-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="round">Round</SelectItem>
                            <SelectItem value="rectangle">Rectangle</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input 
                          placeholder={row.shape === "round" ? "e.g. 25" : "e.g. 20x20"} 
                          value={row.size}
                          onChange={(e) => updateRow(row.id, "size", e.target.value)}
                          className="h-9 bg-zinc-950 border-zinc-800 font-mono text-xs"
                        />
                      </td>
                      <td className="p-2 flex items-center gap-1">
                        <div className="flex border border-zinc-800 rounded-md overflow-hidden h-9">
                           <button 
                             onClick={() => updateRow(row.id, "thicknessUnit", "gauge")}
                             className={`px-2 text-xs font-medium transition-colors ${row.thicknessUnit === "gauge" ? 'bg-zinc-700 text-white' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'}`}
                           >
                             G
                           </button>
                           <button 
                             onClick={() => updateRow(row.id, "thicknessUnit", "mm")}
                             className={`px-2 text-xs font-medium transition-colors border-l border-zinc-800 ${row.thicknessUnit === "mm" ? 'bg-zinc-700 text-white' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'}`}
                           >
                             mm
                           </button>
                        </div>
                        <Input 
                          placeholder={row.thicknessUnit === "gauge" ? "18" : "1.2"} 
                          type="number"
                          value={row.thickness}
                          onChange={(e) => updateRow(row.id, "thickness", e.target.value)}
                          className="h-9 w-20 bg-zinc-950 border-zinc-800 font-mono"
                        />
                      </td>
                      <td className="p-2">
                         <div className="flex gap-1">
                           <Input 
                            placeholder="Len" 
                            type="number"
                            value={row.length}
                            onChange={(e) => updateRow(row.id, "length", e.target.value)}
                            className="h-9 bg-zinc-950 border-zinc-800 font-mono"
                          />
                          <Select value={row.lengthUnit} onValueChange={(val) => updateRow(row.id, "lengthUnit", val)}>
                            <SelectTrigger className="h-9 w-20 bg-zinc-950 border-zinc-800">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mm">mm</SelectItem>
                              <SelectItem value="inch">in</SelectItem>
                              <SelectItem value="feet">ft</SelectItem>
                            </SelectContent>
                          </Select>
                         </div>
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, "quantity", parseInt(e.target.value) || 1)}
                          className="h-9 bg-zinc-950 border-zinc-800 font-mono text-center"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <span className="inline-block h-9 leading-9 font-mono text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md px-2 w-full text-right tabular-nums">
                          {rowWeight > 0 ? rowWeight.toFixed(2) : "—"}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="inline-block h-9 leading-9 font-mono text-xs text-emerald-400 bg-zinc-950 border border-zinc-800 rounded-md px-2 w-full text-right tabular-nums">
                          {rowCost > 0 ? `₹${rowCost.toFixed(2)}` : "—"}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeRow(row.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Button 
              onClick={addRow}
              variant="outline"
              className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent h-12"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pipe Row
            </Button>

            {/* Supplier Procurement Summary */}
            {procurementList.length > 0 && (
              <div className="mt-8 p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" /> Supplier Procurement Summary
                  </h3>
                  <Button 
                    onClick={handleCopyProcurement}
                    variant="outline" 
                    className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 bg-transparent"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy for WhatsApp
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <span className="bg-zinc-900 px-2 py-1 rounded">Model: {modelNameInput || "Untitled"}</span>
                    <span className="bg-zinc-900 px-2 py-1 rounded">Qty: {orderQuantity} items</span>
                  </div>
                  
                  <div className="grid gap-2">
                    {procurementList.map((p, idx) => {
                      const shapeStr = p.shape.charAt(0).toUpperCase() + p.shape.slice(1);
                      const thickStr = p.thicknessUnit === 'gauge' ? `${p.thickness} Gauge` : `${p.thickness}mm`;
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                          <div className="text-zinc-300 font-medium">
                            {shapeStr} Pipe - <span className="text-white">{p.size}mm</span> ({thickStr})
                          </div>
                          <div className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            {p.pipesNeeded} <span className="text-emerald-500/70 text-sm font-normal">Full Lengths (20ft)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Total Weight & Material Cost Summary */}
            <div className={`mt-8 p-5 rounded-xl border ${isMS ? 'border-orange-500/30 bg-orange-500/5' : 'border-sky-500/30 bg-sky-500/5'} flex flex-col sm:flex-row sm:items-center justify-around gap-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isMS ? 'bg-orange-500/20' : 'bg-sky-500/20'}`}>
                  <Settings2 className={`w-5 h-5 ${textAccent}`} />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 uppercase tracking-wider block">Total Steel Weight</span>
                  <span className={`text-xl font-black font-mono ${textAccent}`}>{totalMaterialWeightPerItem.toFixed(2)} KG</span>
                  {orderQuantity > 1 && (
                    <span className="text-xs text-zinc-500 ml-2">({totalMaterialWeightOrder.toFixed(2)} KG for {orderQuantity} units)</span>
                  )}
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-zinc-700"></div>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isMS ? 'bg-orange-500/20' : 'bg-sky-500/20'}`}>
                  <DollarSign className={`w-5 h-5 ${textAccent}`} />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 uppercase tracking-wider block">Base Material Cost</span>
                  <span className={`text-xl font-black font-mono ${textAccent}`}>₹{totalMaterialCost.toFixed(2)}</span>
                  <span className="text-xs text-zinc-500 ml-2">@ ₹{activeRate}/kg</span>
                </div>
              </div>
            </div>

            {/* Pricing & Profit Margin Section */}
            <div className="mt-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" /> Pricing & Profit Margin
                </h3>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowBaseCost(!showBaseCost)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {showBaseCost ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                  {showBaseCost ? "Hide Internal Costs" : "Show Internal Costs"}
                </Button>
              </div>

              {/* Internal Costs Breakdown (Hidden by Default) */}
              {showBaseCost && (
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-2 animate-in fade-in">
                  <p className="font-semibold text-zinc-300">Internal Base Cost Breakdown:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-zinc-400">
                    <div>Material Weight: <span className="text-white font-mono">{totalMaterialWeightOrder.toFixed(2)} kg</span></div>
                    <div>Material Cost: <span className="text-white font-mono">₹{totalMaterialCost.toFixed(2)}</span></div>
                    <div>Labor + Finish + Acc: <span className="text-white font-mono">₹{((parseFloat(laborCost)||0) + (parseFloat(finishingCost)||0) + (parseFloat(accessoriesCost)||0)).toFixed(2)}</span></div>
                    <div>Calculated Base Cost: <span className="text-emerald-400 font-bold font-mono">₹{baseCost.toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {/* Cost Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Fabrication Labor Cost (₹)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={laborCost || ""}
                    onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Finishing / Powder Coating (₹)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={finishingCost || ""}
                    onChange={(e) => setFinishingCost(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Accessories Cost (Lamination/Bushes) (₹)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={accessoriesCost || ""}
                    onChange={(e) => setAccessoriesCost(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border-zinc-800 font-mono"
                  />
                </div>
              </div>

              {/* Profit Margin Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <Label className="text-zinc-300 font-medium">Profit Margin</Label>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${bgAccentMuted}`}>
                    {profitMargin}% (+₹{profitAmount.toFixed(2)})
                  </span>
                </div>
                <Slider 
                  value={[profitMargin]} 
                  onValueChange={(val) => setProfitMargin(val[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Financial Totals Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Selling Price ({orderQuantity} units)</span>
                  <span className="text-xl font-bold text-white font-mono">₹{finalSellingPrice.toFixed(2)}</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">GST (18%)</span>
                  <span className="text-xl font-bold text-zinc-300 font-mono">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-r ${isMS ? 'from-orange-500/20 to-amber-500/10 border-orange-500/30' : 'from-sky-500/20 to-blue-500/10 border-sky-500/30'} border`}>
                  <span className="text-xs text-zinc-300 uppercase tracking-wider block font-semibold">Grand Total (Incl. GST)</span>
                  <span className={`text-2xl font-black font-mono ${textAccent}`}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Special Fabrication Notes */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <Label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Special Fabrication & Assembly Notes (Internal)
              </Label>
              <Textarea 
                placeholder="e.g., Add circular round bushes at the bottom leg ends. Top face requires 18mm lamination wood fitting..."
                value={fabricationNotes}
                onChange={(e) => setFabricationNotes(e.target.value)}
                className="bg-zinc-950 border-zinc-800 min-h-[90px] text-sm"
              />
            </div>

            {/* PDF Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button 
                onClick={generateCustomerQuotePDF}
                className="flex-1 h-12 text-md font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
              >
                <FileText className="w-5 h-5 mr-2" /> Download Customer Quote (PDF)
              </Button>
              <Button 
                onClick={generateFactoryJobCardPDF}
                variant="outline"
                className="flex-1 h-12 text-md font-bold border-rose-500/40 text-rose-300 hover:bg-rose-500/10 bg-zinc-950"
              >
                <Printer className="w-5 h-5 mr-2" /> Download Factory Job Card (PDF)
              </Button>
            </div>
          </div>
        ) : (
          /* AI AUTO-GENERATE UI */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className={`text-2xl font-bold ${textAccent}`}>AI Vision Analysis</h2>
              <p className="text-zinc-400 text-sm">Upload a photo of any steel furniture, and our AI will estimate the complete pipe cut list, sizes, and structure.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Image Dropzone */}
              <label className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors rounded-2xl bg-zinc-900/30 flex flex-col items-center justify-center p-10 min-h-[300px] cursor-pointer group relative overflow-hidden">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                
                {imageBase64 ? (
                  <img src={imageBase64} alt="Uploaded" className="absolute inset-0 w-full h-full object-contain opacity-40 group-hover:opacity-30 transition-opacity" />
                ) : null}

                <div className={`relative z-10 p-4 rounded-full ${bgAccentMuted} mb-4 group-hover:scale-110 transition-transform`}>
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="relative z-10 text-lg font-medium text-zinc-200">
                  {imageFile ? imageFile.name : "Drag & drop furniture image"}
                </h3>
                <p className="relative z-10 text-sm text-zinc-500 mt-1">or click to browse from device</p>
                <div className="relative z-10 mt-6 flex items-center gap-2 text-xs text-zinc-600 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
                  <ImageIcon className="w-3 h-3" /> JPG, PNG, WEBP
                </div>
              </label>

              {/* Reference Dimensions & Settings */}
              <div className="space-y-6">
                
                <div className="space-y-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Reference Dimensions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Overall Height (mm)</Label>
                      <Input 
                        placeholder="e.g. 900" 
                        className="bg-zinc-950 border-zinc-800"
                        value={aiDimensions.overallHeight}
                        onChange={(e) => setAiDimensions({...aiDimensions, overallHeight: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Seat Height (mm)</Label>
                      <Input 
                        placeholder="e.g. 450" 
                        className="bg-zinc-950 border-zinc-800"
                        value={aiDimensions.seatHeight}
                        onChange={(e) => setAiDimensions({...aiDimensions, seatHeight: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Width (mm)</Label>
                      <Input 
                        placeholder="e.g. 400" 
                        className="bg-zinc-950 border-zinc-800"
                        value={aiDimensions.width}
                        onChange={(e) => setAiDimensions({...aiDimensions, width: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Length (mm)</Label>
                      <Input 
                        placeholder="e.g. 400" 
                        className="bg-zinc-950 border-zinc-800"
                        value={aiDimensions.length}
                        onChange={(e) => setAiDimensions({...aiDimensions, length: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Material Preset</Label>
                  <Select value={aiMaterialPreset} onValueChange={setAiMaterialPreset}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ms_cr">MS CR Pipe (Light Furniture)</SelectItem>
                      <SelectItem value="ms_hr">MS HR Pipe (Heavy Duty)</SelectItem>
                      <SelectItem value="ss_202">SS 202 (Indoor)</SelectItem>
                      <SelectItem value="ss_304">SS 304 (Premium/Outdoor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAnalyze}
                  disabled={!imageBase64 || isAnalyzing}
                  className={`w-full h-12 text-md font-bold shadow-lg ${bgAccent} hover:opacity-90 text-white border-0 disabled:opacity-50`}
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Image...</>
                  ) : (
                    <><Cpu className="w-5 h-5 mr-2" /> Analyze with AI</>
                  )}
                </Button>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* Save Model Dialog */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-white">Save Furniture Model</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter a recognizable name or nickname for this model (e.g., "IMS 7").
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-zinc-400 mb-2 block">Model Name</Label>
            <Input 
              value={modelNameInput}
              onChange={(e) => setModelNameInput(e.target.value)}
              placeholder="e.g. Office Chair Standard"
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveModel} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loadedModelId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
