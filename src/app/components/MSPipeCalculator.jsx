"use client";
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Calculator as CalculatorIcon, Download, Plus, Save, Upload, Trash2, Copy, Edit, Search, FileText, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { useToast } from "@/hooks/use-toast.js";

// MS Pipe data - Round Pipes
const roundPipeSizes = {
  "1/2\"": 12.7,
  "5/8\"": 15.87,
  "3/4\"": 19.05,
  "7/8\"": 22.05,
  "1\"": 25.4,
  "1 1/4\"": 31.75,
  "1 1/2\"": 38.1,
  "2\"": 50.8,
  "2 1/2\"": 63.5,
  "3\"": 76.2
};

// MS Square Pipe data
const squarePipeSizes = {
  "1/2\"": 12.7,
  "5/8\"": 15.87,
  "3/4\"": 19.05,
  "1\"": 25.4,
  "1 1/4\"": 31.75,
  "1 1/2\"": 38.1,
  "2\"": 50.8,
  "2 1/2\"": 63.5,
  "3\"": 76.2
};

// MS Rectangular Pipe data (Width x Height)
const rectangularPipeSizes = {
  "1\" x 2\"": { width: 25.4, height: 50.8 },
  "1\" x 3\"": { width: 25.4, height: 76.2 },
  "1 1/4\" x 2 1/2\"": { width: 31.75, height: 63.5 },
  "1 1/2\" x 3\"": { width: 38.1, height: 76.2 },
  "2\" x 3\"": { width: 50.8, height: 76.2 },
  "2\" x 4\"": { width: 50.8, height: 101.6 },
  "2 1/2\" x 4\"": { width: 63.5, height: 101.6 },
  "3\" x 4\"": { width: 76.2, height: 101.6 },
  "3\" x 5\"": { width: 76.2, height: 127 },
  "4\" x 6\"": { width: 101.6, height: 152.4 }
};

const wallThicknesses = [1.0, 1.2, 1.5, 1.6, 1.8];

const weightHeaders = {
  1.0: "1.0 mm (kg/6m)",
  1.2: "1.2 mm (kg/6m)",
  1.5: "1.5 mm (kg/6m)",
  1.6: "1.6 mm (kg/6m)",
  1.8: "1.8 mm (kg/6m)"
};

const priceHeaders = {
  1.0: "1.0 mm (Rate ₹)",
  1.2: "1.2 mm (Rate ₹)",
  1.5: "1.5 mm (Rate ₹)",
  1.6: "1.6 mm (Rate ₹)",
  1.8: "1.8 mm (Rate ₹)"
};

const ROUND_CONSTANT = 0.02466;
const SQUARE_CONSTANT = 0.00785;
const PIPE_LENGTH_METERS = 6.0;

// Chair and Table Templates
const chairTemplates = {
  "Standard Chair": {
    name: "Standard Chair",
    description: "Basic 4-leg chair frame",
    components: [
      { type: "round", size: "1\"", thickness: 1.5, length: 30, quantity: 4, description: "Legs" },
      { type: "round", size: "1\"", thickness: 1.5, length: 40, quantity: 2, description: "Back support" },
      { type: "round", size: "1\"", thickness: 1.5, length: 45, quantity: 2, description: "Seat supports" },
      { type: "square", size: "1\"", thickness: 1.5, length: 40, quantity: 1, description: "Backrest" }
    ]
  },
  "Arm Chair": {
    name: "Arm Chair",
    description: "Chair with armrests",
    components: [
      { type: "round", size: "1 1/4\"", thickness: 1.6, length: 35, quantity: 4, description: "Legs" },
      { type: "round", size: "1\"", thickness: 1.5, length: 50, quantity: 2, description: "Armrests" },
      { type: "round", size: "1\"", thickness: 1.5, length: 45, quantity: 2, description: "Back support" },
      { type: "round", size: "1\"", thickness: 1.5, length: 50, quantity: 2, description: "Seat supports" },
      { type: "square", size: "1\"", thickness: 1.5, length: 45, quantity: 1, description: "Backrest" }
    ]
  },
  "Bar Stool": {
    name: "Bar Stool",
    description: "High stool for bar counters",
    components: [
      { type: "round", size: "1\"", thickness: 1.5, length: 75, quantity: 4, description: "Legs" },
      { type: "round", size: "1 1/4\"", thickness: 1.6, length: 35, quantity: 1, description: "Seat ring" },
      { type: "round", size: "1\"", thickness: 1.5, length: 40, quantity: 4, description: "Cross braces" }
    ]
  }
};

const tableTemplates = {
  "Dining Table": {
    name: "Dining Table",
    description: "Standard 4-person dining table",
    components: [
      { type: "round", size: "1 1/2\"", thickness: 1.8, length: 75, quantity: 4, description: "Table legs" },
      { type: "rectangular", size: "2\" x 3\"", thickness: 1.6, length: 180, quantity: 2, description: "Long sides" },
      { type: "rectangular", size: "2\" x 3\"", thickness: 1.6, length: 90, quantity: 2, description: "Short sides" },
      { type: "rectangular", size: "1 1/2\" x 2\"", thickness: 1.5, length: 180, quantity: 2, description: "Cross supports" }
    ]
  },
  "Coffee Table": {
    name: "Coffee Table",
    description: "Low center table",
    components: [
      { type: "round", size: "1\"", thickness: 1.5, length: 45, quantity: 4, description: "Table legs" },
      { type: "rectangular", size: "1\" x 2\"", thickness: 1.5, length: 100, quantity: 2, description: "Long sides" },
      { type: "rectangular", size: "1\" x 2\"", thickness: 1.5, length: 60, quantity: 2, description: "Short sides" },
      { type: "square", size: "1\"", thickness: 1.5, length: 100, quantity: 2, description: "Cross supports" }
    ]
  },
  "Work Desk": {
    name: "Work Desk",
    description: "Office desk frame",
    components: [
      { type: "rectangular", size: "2\" x 3\"", thickness: 1.6, length: 150, quantity: 4, description: "Legs" },
      { type: "rectangular", size: "2\" x 4\"", thickness: 1.6, length: 120, quantity: 2, description: "Side rails" },
      { type: "rectangular", size: "2\" x 4\"", thickness: 1.6, length: 80, quantity: 2, description: "Back/front rails" },
      { type: "rectangular", size: "1 1/2\" x 2\"", thickness: 1.5, length: 120, quantity: 3, description: "Shelf supports" }
    ]
  }
};

// Material densities - moved inside component

export default function MSPipeCalculator() {
   const { toast } = useToast();
   const [pricePerKg, setPricePerKg] = useState(120);
   const [selectedSize, setSelectedSize] = useState("");
   const [selectedThickness, setSelectedThickness] = useState("");
   const [quantity, setQuantity] = useState(1);
   const [useCustomLength, setUseCustomLength] = useState(false);
   const [customLengthInches, setCustomLengthInches] = useState(1);

   // Advanced features from SS calculator
   const [material, setMaterial] = useState("carbon-steel");
   const [calculationName, setCalculationName] = useState("");
   const [savedCalculations, setSavedCalculations] = useState([]);
   const [showSaveDialog, setShowSaveDialog] = useState(false);
   const [showLoadDialog, setShowLoadDialog] = useState(false);
   const [showSettingsDialog, setShowSettingsDialog] = useState(false);
   const [unitSystem, setUnitSystem] = useState("metric");
   const [weightUnit, setWeightUnit] = useState("kg");
   const [customMaterials, setCustomMaterials] = useState([]);

   // Surface area calculation settings
   const [paintCostPerSqM, setPaintCostPerSqM] = useState(50);
   const [coatingType, setCoatingType] = useState("paint");

   // Custom material settings
   const [showCustomMaterialDialog, setShowCustomMaterialDialog] = useState(false);
   const [newMaterialName, setNewMaterialName] = useState("");
   const [newMaterialDensity, setNewMaterialDensity] = useState("");

   // Material densities - computed inside component
   const materialDensities = useMemo(() => ({
     "carbon-steel": 7.85,
     "stainless-steel": 7.85,
     aluminum: 2.7,
     copper: 8.96,
     brass: 8.5,
     titanium: 4.51,
     ...(customMaterials && Array.isArray(customMaterials) ? customMaterials.reduce((acc, mat) => ({ ...acc, [mat.name]: mat.density }), {}) : {})
   }), [customMaterials]);

   // Pipe list management
   const [pipes, setPipes] = useState([]);
   const [editingPipe, setEditingPipe] = useState(null);
   const [searchTerm, setSearchTerm] = useState("");

   // Cutting waste optimization
   const [stockLengths, setStockLengths] = useState([6000]); // Default 6m stock lengths
   const [showWasteOptimizer, setShowWasteOptimizer] = useState(false);

   // Comparison tool
   const [comparisonType, setComparisonType] = useState("round");
   const [comparisonBaseSize, setComparisonBaseSize] = useState("");
   const [comparisonLength, setComparisonLength] = useState(72); // 6 feet in inches
   const [comparisonData, setComparisonData] = useState([]);

  // Calculate weight for round pipe
  const calculateRoundWeight = (odMm, wt, lengthMeters = PIPE_LENGTH_METERS, density = materialDensities[material]) => {
    const weightPerMeter = (odMm - wt) * wt * ROUND_CONSTANT * (density / 7.85);
    return weightPerMeter * lengthMeters;
  };

  // Calculate weight for square pipe
  const calculateSquareWeight = (sideMm, wt, lengthMeters = PIPE_LENGTH_METERS, density = materialDensities[material]) => {
    const weightPerMeter = ((sideMm * 4) - (wt * 4)) * wt * SQUARE_CONSTANT * (density / 7.85);
    return weightPerMeter * lengthMeters;
  };

  // Calculate weight for rectangular pipe
  const calculateRectangularWeight = (widthMm, heightMm, wt, lengthMeters = PIPE_LENGTH_METERS, density = materialDensities[material]) => {
    const outerPerimeter = 2 * (widthMm + heightMm);
    const innerPerimeter = 2 * ((widthMm - wt) + (heightMm - wt));
    const weightPerMeter = (outerPerimeter - innerPerimeter) * wt * SQUARE_CONSTANT * (density / 7.85);
    return weightPerMeter * lengthMeters;
  };

  // Calculate price for a given weight
  const calculatePrice = (weight) => {
    return weight * pricePerKg;
  };

  // Calculate surface area for painting/coating estimates
  const calculateSurfaceArea = (size, thickness, length, type) => {
    let outerSurfaceArea = 0;
    let innerSurfaceArea = 0;

    if (type === "round") {
      const outerDiameter = size;
      const innerDiameter = outerDiameter - (2 * thickness);
      outerSurfaceArea = Math.PI * outerDiameter * length;
      innerSurfaceArea = Math.PI * innerDiameter * length;
    } else if (type === "square") {
      const side = size;
      const innerSide = side - (2 * thickness);
      outerSurfaceArea = 4 * side * length;
      innerSurfaceArea = 4 * innerSide * length;
    } else if (type === "rectangular") {
      const width = size.width;
      const height = size.height;
      const innerWidth = width - (2 * thickness);
      const innerHeight = height - (2 * thickness);
      outerSurfaceArea = 2 * ((width * length) + (height * length));
      innerSurfaceArea = 2 * ((innerWidth * length) + (innerHeight * length));
    }

    return outerSurfaceArea + innerSurfaceArea; // Total surface area to paint
  };

  // Generate round pipe weight data
  const roundWeightData = Object.entries(roundPipeSizes).map(([inchName, odMm]) => {
    const row = { "Size (Inch)": inchName, "Size (mm)": odMm };
    wallThicknesses.forEach(wt => {
      row[wt] = Math.round(calculateRoundWeight(odMm, wt) * 1000) / 1000; // Round to 3 decimal places
    });
    return row;
  });

  // Generate round pipe price data
  const roundPriceData = Object.entries(roundPipeSizes).map(([inchName, odMm]) => {
    const row = { "Size (Inch)": inchName, "Size (mm)": odMm };
    wallThicknesses.forEach(wt => {
      const weight = calculateRoundWeight(odMm, wt);
      row[wt] = Math.round(calculatePrice(weight) * 100) / 100; // Round to 2 decimal places
    });
    return row;
  });

  // Generate square pipe weight data
  const squareWeightData = Object.entries(squarePipeSizes).map(([inchName, sideMm]) => {
    const row = { "Size (Inch)": inchName, "Size (mm)": sideMm };
    wallThicknesses.forEach(wt => {
      row[wt] = Math.round(calculateSquareWeight(sideMm, wt) * 1000) / 1000; // Round to 3 decimal places
    });
    return row;
  });

  // Generate square pipe price data
  const squarePriceData = Object.entries(squarePipeSizes).map(([inchName, sideMm]) => {
    const row = { "Size (Inch)": inchName, "Size (mm)": sideMm };
    wallThicknesses.forEach(wt => {
      const weight = calculateSquareWeight(sideMm, wt);
      row[wt] = Math.round(calculatePrice(weight) * 100) / 100; // Round to 2 decimal places
    });
    return row;
  });

  // Generate rectangular pipe weight data
  const rectangularWeightData = Object.entries(rectangularPipeSizes).map(([inchName, dimensions]) => {
    const row = { "Size (Inch)": inchName, "Size (mm)": `${dimensions.width} x ${dimensions.height}` };
    wallThicknesses.forEach(wt => {
      row[wt] = Math.round(calculateRectangularWeight(dimensions.width, dimensions.height, wt) * 1000) / 1000; // Round to 3 decimal places
    });
    return row;
  });

  // Generate rectangular pipe price data
  const rectangularPriceData = Object.entries(rectangularPipeSizes).map(([inchName, dimensions]) => {
    const row = { "Size (Inch)": inchName, "Size (mm)": `${dimensions.width} x ${dimensions.height}` };
    wallThicknesses.forEach(wt => {
      const weight = calculateRectangularWeight(dimensions.width, dimensions.height, wt);
      row[wt] = Math.round(calculatePrice(weight) * 100) / 100; // Round to 2 decimal places
    });
    return row;
  });

  // Calculate individual pipe
  const calculateIndividual = () => {
    if (!selectedSize || !selectedThickness) return null;

    const size = selectedSize;
    const wt = parseFloat(selectedThickness);
    const isRound = selectedSize.includes("round");
    const actualSize = isRound ? roundPipeSizes[size.replace(" (round)", "")] : squarePipeSizes[size.replace(" (square)", "")];

    if (!actualSize) return null;

    // Base weight for 6 meters
    const baseWeight = isRound ? calculateRoundWeight(actualSize, wt) : calculateSquareWeight(actualSize, wt);

    // Adjust for custom length if enabled
    let weightPerPipe = baseWeight;
    if (useCustomLength) {
      const lengthInMeters = customLengthInches * 0.0254; // Convert inches to meters
      weightPerPipe = (baseWeight / PIPE_LENGTH_METERS) * lengthInMeters;
    }

    const pricePerPipe = calculatePrice(weightPerPipe);
    const totalWeight = weightPerPipe * quantity;
    const totalPrice = pricePerPipe * quantity;

    return {
      size: selectedSize,
      thickness: wt,
      weightPerPipe: weightPerPipe,
      pricePerPipe: pricePerPipe,
      quantity: quantity,
      totalWeight: totalWeight,
      totalPrice: totalPrice,
      customLength: useCustomLength ? customLengthInches : null
    };
  };

  const individualResult = calculateIndividual();

  // Save/Load calculation functions
  const saveCalculation = () => {
    if (pipes.length === 0) {
      toast({
        title: "No pipes to save",
        description: "Add some pipes before saving the calculation.",
        variant: "destructive",
      });
      return;
    }

    const name = calculationName.trim() || `Calculation ${new Date().toLocaleString()}`;
    const newCalculation = {
      name,
      pipes: [...pipes],
      pricePerKg,
      material,
      date: new Date().toISOString(),
    };

    const updatedCalculations = [...savedCalculations, newCalculation];
    setSavedCalculations(updatedCalculations);
    localStorage.setItem("msCalc_savedCalculations", JSON.stringify(updatedCalculations));

    toast({
      title: "Calculation saved",
      description: `"${name}" has been saved successfully.`,
    });

    setCalculationName("");
    setShowSaveDialog(false);
  };

  const loadCalculation = (calc) => {
    setPipes(calc.pipes);
    setPricePerKg(calc.pricePerKg);
    setMaterial(calc.material || "carbon-steel");
    setCalculationName(calc.name);
    setShowLoadDialog(false);

    toast({
      title: "Calculation loaded",
      description: `"${calc.name}" has been loaded successfully.`,
    });
  };

  const deleteCalculation = (index) => {
    const updatedCalculations = savedCalculations.filter((_, i) => i !== index);
    setSavedCalculations(updatedCalculations);
    localStorage.setItem("msCalc_savedCalculations", JSON.stringify(updatedCalculations));

    toast({
      title: "Calculation deleted",
      description: "The calculation has been removed.",
    });
  };

  // PDF Export function
  const exportToPDF = () => {
    // This would require a PDF library like jsPDF
    // For now, we'll create a detailed text export
    let content = `PIPE WEIGHT CALCULATION REPORT\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    content += `MATERIAL SUMMARY\n`;
    content += `Material: ${material.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`;
    content += `Price per kg: ₹${pricePerKg}\n`;
    content += `Coating Cost: ₹${paintCostPerSqM}/m²\n\n`;

    content += `PIPE DETAILS\n`;
    pipes.forEach((pipe, index) => {
      content += `${index + 1}. ${pipe.size} (${pipe.thickness}mm) - ${pipe.quantity} pcs\n`;
      content += `   Length: ${pipe.customLength ? `${pipe.customLength}"` : `${PIPE_LENGTH_METERS}m`}\n`;
      content += `   Weight per pipe: ${pipe.weightPerPipe.toFixed(3)} kg\n`;
      content += `   Price per pipe: ₹${pipe.pricePerPipe.toFixed(2)}\n`;
      content += `   Subtotal weight: ${(pipe.weightPerPipe * pipe.quantity).toFixed(2)} kg\n`;
      content += `   Subtotal price: ₹${((pipe.weightPerPipe * pipe.quantity) * pricePerKg).toFixed(2)}\n\n`;
    });

    content += `TOTALS\n`;
    content += `Total Weight: ${getTotalWeight().toFixed(2)} kg\n`;
    content += `Total Material Cost: ₹${getTotalPrice().toFixed(2)}\n`;
    content += `Total Surface Area: ${getTotalSurfaceArea().toFixed(2)} m²\n`;
    content += `Total Coating Cost: ₹${getTotalCoatingCost().toFixed(2)}\n`;
    content += `GRAND TOTAL: ₹${(getTotalPrice() + getTotalCoatingCost()).toFixed(2)}\n\n`;

    if (showWasteOptimizer) {
      content += `CUTTING OPTIMIZATION\n`;
      content += `Stock Length: ${stockLengths[0]}mm\n`;
      content += `Stock Pieces Needed: ${showWasteOptimizer.totalStockNeeded}\n`;
      content += `Total Waste: ${showWasteOptimizer.totalWaste.toFixed(0)}mm\n`;
      content += `Average Utilization: ${(100 - showWasteOptimizer.averageWastePercentage).toFixed(1)}%\n\n`;

      showWasteOptimizer.stockUtilization.forEach((stock, index) => {
        content += `Stock Piece ${stock.stockNumber}:\n`;
        content += `  Cuts: ${stock.cuts.join('mm, ')}mm\n`;
        content += `  Waste: ${stock.wasteLength}mm (${stock.wastePercentage}%)\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipe-calculation-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Detailed calculation report has been downloaded.",
    });
  };

  const exportToCSV = (type) => {
    let csv = "";
    if (type === "round") {
      csv = "MS Round Pipe Weight List (Oru Pipe ku - 6 Meter Length)\n";
      csv += "Ellam weights um Oru 'Full Pipe' (6 meter) ku Kilogram (kg) la iruku.\n\n";
      csv += "Size (Inch),Size (mm)," + wallThicknesses.map(wt => weightHeaders[wt]).join(",") + "\n";
      roundWeightData.forEach(row => {
        csv += `${row["Size (Inch)"]},${row["Size (mm)"]},${wallThicknesses.map(wt => row[wt]).join(",")}\n`;
      });
      csv += "\n\nMS Round Pipe Price List (Oru Pipe ku - 6 Meter Length)\n";
      csv += `Oru Kilo MS = ₹${pricePerKg} vachi, Oru 'Full Pipe' (6 meter) oda rate.\n\n`;
      csv += "Size (Inch),Size (mm)," + wallThicknesses.map(wt => priceHeaders[wt]).join(",") + "\n";
      roundPriceData.forEach(row => {
        csv += `${row["Size (Inch)"]},${row["Size (mm)"]},${wallThicknesses.map(wt => row[wt]).join(",")}\n`;
      });
    } else if (type === "rectangular") {
      csv = "MS Rectangular Pipe Weight List (Gauge vachi)\n";
      csv += "Ellam weights um Oru 'Full Pipe' (6 meter) ku Kilogram (kg) la iruku.\n\n";
      csv += "Size (Inch),Size (mm)," + wallThicknesses.map(wt => weightHeaders[wt]).join(",") + "\n";
      rectangularWeightData.forEach(row => {
        csv += `${row["Size (Inch)"]},${row["Size (mm)"]},${wallThicknesses.map(wt => row[wt]).join(",")}\n`;
      });
      csv += "\n\nMS Rectangular Pipe Price List (Gauge vachi)\n";
      csv += `Oru Kilo MS = ₹${pricePerKg} vachi, Oru 'Full Pipe' (6 meter) oda rate.\n\n`;
      csv += "Size (Inch),Size (mm)," + wallThicknesses.map(wt => priceHeaders[wt]).join(",") + "\n";
      rectangularPriceData.forEach(row => {
        csv += `${row["Size (Inch)"]},${row["Size (mm)"]},${wallThicknesses.map(wt => row[wt]).join(",")}\n`;
      });
    } else {
      csv = "MS Square Pipe Weight List (Gauge vachi)\n";
      csv += "Ellam weights um Oru 'Full Pipe' (6 meter) ku Kilogram (kg) la iruku.\n\n";
      csv += "Size (Inch),Size (mm)," + wallThicknesses.map(wt => weightHeaders[wt]).join(",") + "\n";
      squareWeightData.forEach(row => {
        csv += `${row["Size (Inch)"]},${row["Size (mm)"]},${wallThicknesses.map(wt => row[wt]).join(",")}\n`;
      });
      csv += "\n\nMS Square Pipe Price List (Gauge vachi)\n";
      csv += `Oru Kilo MS = ₹${pricePerKg} vachi, Oru 'Full Pipe' (6 meter) oda rate.\n\n`;
      csv += "Size (Inch),Size (mm)," + wallThicknesses.map(wt => priceHeaders[wt]).join(",") + "\n";
      squarePriceData.forEach(row => {
        csv += `${row["Size (Inch)"]},${row["Size (mm)"]},${wallThicknesses.map(wt => row[wt]).join(",")}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ms-${type}-pipe-data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pipe management functions
  const addPipe = () => {
    if (!selectedSize || !selectedThickness) {
      toast({
        title: "Invalid input",
        description: "Please select pipe size and thickness.",
        variant: "destructive",
      });
      return;
    }

    const size = selectedSize;
    const wt = parseFloat(selectedThickness);
    const isRound = selectedSize.includes("round");
    const isRectangular = selectedSize.includes("rectangular");

    let actualSize, weight;
    if (isRound) {
      actualSize = roundPipeSizes[size.replace(" (round)", "")];
      weight = calculateRoundWeight(actualSize, wt, useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS);
    } else if (isRectangular) {
      actualSize = rectangularPipeSizes[size.replace(" (rectangular)", "")];
      weight = calculateRectangularWeight(actualSize.width, actualSize.height, wt, useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS);
    } else {
      actualSize = squarePipeSizes[size.replace(" (square)", "")];
      weight = calculateSquareWeight(actualSize, wt, useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS);
    }

    if (!actualSize) return;

    const lengthMeters = useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS;
    const price = calculatePrice(weight);

    const newPipe = {
      id: Date.now().toString(),
      size: selectedSize,
      thickness: wt,
      weightPerPipe: weight,
      pricePerPipe: price,
      quantity: quantity,
      customLength: useCustomLength ? customLengthInches : null,
      lengthMeters: lengthMeters
    };

    setPipes([...pipes, newPipe]);

    toast({
      title: "Pipe added",
      description: `${selectedSize} pipe added successfully.`,
    });
  };

  const removePipe = (id) => {
    setPipes(pipes.filter(pipe => pipe.id !== id));
  };

  const duplicatePipe = (pipe) => {
    const duplicatedPipe = { ...pipe, id: Date.now().toString() };
    setPipes([...pipes, duplicatedPipe]);

    toast({
      title: "Pipe duplicated",
      description: "A copy of the pipe has been added.",
    });
  };

  const editPipe = (pipe) => {
    setEditingPipe(pipe);
    setSelectedSize(pipe.size);
    setSelectedThickness(pipe.thickness.toString());
    setQuantity(pipe.quantity);
    if (pipe.customLength) {
      setUseCustomLength(true);
      setCustomLengthInches(pipe.customLength);
    } else {
      setUseCustomLength(false);
    }
  };

  const updatePipe = () => {
    if (!editingPipe) return;

    const size = selectedSize;
    const wt = parseFloat(selectedThickness);
    const isRound = selectedSize.includes("round");
    const isRectangular = selectedSize.includes("rectangular");

    let actualSize, weight;
    if (isRound) {
      actualSize = roundPipeSizes[size.replace(" (round)", "")];
      weight = calculateRoundWeight(actualSize, wt, useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS);
    } else if (isRectangular) {
      actualSize = rectangularPipeSizes[size.replace(" (rectangular)", "")];
      weight = calculateRectangularWeight(actualSize.width, actualSize.height, wt, useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS);
    } else {
      actualSize = squarePipeSizes[size.replace(" (square)", "")];
      weight = calculateSquareWeight(actualSize, wt, useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS);
    }

    if (!actualSize) return;

    const lengthMeters = useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS;
    const price = calculatePrice(weight);

    const updatedPipe = {
      ...editingPipe,
      size: selectedSize,
      thickness: wt,
      weightPerPipe: weight,
      pricePerPipe: price,
      quantity: quantity,
      customLength: useCustomLength ? customLengthInches : null,
      lengthMeters: lengthMeters
    };

    setPipes(pipes.map(p => p.id === editingPipe.id ? updatedPipe : p));
    setEditingPipe(null);

    toast({
      title: "Pipe updated",
      description: "The pipe has been updated successfully.",
    });
  };

  const clearAllPipes = () => {
    setPipes([]);
    toast({
      title: "Cleared",
      description: "All pipes have been removed.",
    });
  };

  // Add template function
  const addTemplate = (template) => {
    const newPipes = template.components.map(component => {
      let actualSize, weight;
      const lengthMeters = component.length * 0.0254; // Convert inches to meters

      if (component.type === "round") {
        actualSize = roundPipeSizes[component.size];
        weight = calculateRoundWeight(actualSize, component.thickness, lengthMeters);
      } else if (component.type === "rectangular") {
        actualSize = rectangularPipeSizes[component.size];
        weight = calculateRectangularWeight(actualSize.width, actualSize.height, component.thickness, lengthMeters);
      } else {
        actualSize = squarePipeSizes[component.size];
        weight = calculateSquareWeight(actualSize, component.thickness, lengthMeters);
      }

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        size: `${component.size} (${component.type})`,
        thickness: component.thickness,
        weightPerPipe: weight,
        pricePerPipe: calculatePrice(weight),
        quantity: component.quantity,
        customLength: component.length,
        lengthMeters: lengthMeters,
        description: component.description
      };
    });

    setPipes([...pipes, ...newPipes]);

    toast({
      title: "Template added",
      description: `${template.name} components have been added to your pipe list.`,
    });
  };

  // Calculate totals
  const getTotalWeight = () => {
    return pipes.reduce((total, pipe) => total + pipe.weightPerPipe * pipe.quantity, 0);
  };

  const getTotalPrice = () => {
    return getTotalWeight() * pricePerKg;
  };

  // Calculate total surface area for painting
  const getTotalSurfaceArea = () => {
    return pipes.reduce((total, pipe) => {
      const isRound = pipe.size.includes("round");
      const isRectangular = pipe.size.includes("rectangular");
      let size, type;

      if (isRound) {
        size = roundPipeSizes[pipe.size.replace(" (round)", "")];
        type = "round";
      } else if (isRectangular) {
        size = rectangularPipeSizes[pipe.size.replace(" (rectangular)", "")];
        type = "rectangular";
      } else {
        size = squarePipeSizes[pipe.size.replace(" (square)", "")];
        type = "square";
      }

      const surfaceArea = calculateSurfaceArea(size, pipe.thickness, pipe.lengthMeters, type);
      return total + (surfaceArea * pipe.quantity);
    }, 0);
  };

  const getTotalCoatingCost = () => {
    return getTotalSurfaceArea() * paintCostPerSqM;
  };

  // Cutting waste optimization function
  const optimizeCutting = (requiredLengths, stockLength = 6000) => {
    // Sort lengths in descending order (first-fit decreasing algorithm)
    const sortedLengths = [...requiredLengths].sort((a, b) => b - a);
    const stockPieces = [];
    const wasteReport = [];

    sortedLengths.forEach(length => {
      let placed = false;

      // Try to fit in existing stock pieces
      for (let i = 0; i < stockPieces.length; i++) {
        if (stockPieces[i].remaining >= length) {
          stockPieces[i].cuts.push(length);
          stockPieces[i].remaining -= length;
          placed = true;
          break;
        }
      }

      // If not placed, start a new stock piece
      if (!placed) {
        stockPieces.push({
          length: stockLength,
          remaining: stockLength - length,
          cuts: [length]
        });
      }
    });

    // Calculate waste
    stockPieces.forEach((piece, index) => {
      wasteReport.push({
        stockNumber: index + 1,
        totalLength: piece.length,
        usedLength: piece.length - piece.remaining,
        wasteLength: piece.remaining,
        wastePercentage: ((piece.remaining / piece.length) * 100).toFixed(1),
        cuts: piece.cuts
      });
    });

    return {
      totalStockNeeded: stockPieces.length,
      totalWaste: wasteReport.reduce((sum, piece) => sum + piece.wasteLength, 0),
      averageWastePercentage: (wasteReport.reduce((sum, piece) => sum + parseFloat(piece.wastePercentage), 0) / wasteReport.length).toFixed(1),
      stockUtilization: wasteReport,
      totalRequiredLength: requiredLengths.reduce((sum, len) => sum + len, 0)
    };
  };

  // Generate comparison data
  const generateComparison = () => {
    if (!comparisonBaseSize || !comparisonType) return;

    const lengthMeters = comparisonLength * 0.0254; // Convert inches to meters
    const data = [];

    wallThicknesses.forEach(thickness => {
      let weight = 0;
      let surfaceArea = 0;

      if (comparisonType === "round") {
        const size = roundPipeSizes[comparisonBaseSize];
        weight = calculateRoundWeight(size, thickness, lengthMeters);
        surfaceArea = calculateSurfaceArea(size, thickness, lengthMeters, "round");
      } else if (comparisonType === "square") {
        const size = squarePipeSizes[comparisonBaseSize];
        weight = calculateSquareWeight(size, thickness, lengthMeters);
        surfaceArea = calculateSurfaceArea(size, thickness, lengthMeters, "square");
      } else if (comparisonType === "rectangular") {
        const size = rectangularPipeSizes[comparisonBaseSize];
        weight = calculateRectangularWeight(size.width, size.height, thickness, lengthMeters);
        surfaceArea = calculateSurfaceArea(size, thickness, lengthMeters, "rectangular");
      }

      const cost = calculatePrice(weight);

      data.push({
        thickness,
        weight,
        cost,
        surfaceArea,
        costPerKg: cost / weight
      });
    });

    setComparisonData(data);
  };

  // Load saved calculations on mount
  useState(() => {
    const saved = localStorage.getItem("msCalc_savedCalculations");
    if (saved) {
      try {
        setSavedCalculations(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading saved calculations:", error);
      }
    }
  });

  return (
    <div className="flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-6xl shadow-[var(--shadow-elevated)]">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">
                  Pipe Weight Calculator
                </CardTitle>
                <CardDescription className="text-base">
                  Calculate weight and price for pipes with gauge specifications
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Save className="mr-2 h-4 w-4" />
                    Save Calc
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Calculation</DialogTitle>
                    <DialogDescription>
                      Enter a name for your calculation.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={calculationName}
                    onChange={(e) => setCalculationName(e.target.value)}
                    placeholder="Calculation name"
                  />
                  <DialogFooter>
                    <Button onClick={saveCalculation}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Load Calc
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Load Calculation</DialogTitle>
                    <DialogDescription>
                      Select a saved calculation to load.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {savedCalculations.map((calc, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{calc.name}</p>
                          <p className="text-sm text-muted-foreground">{new Date(calc.date).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" onClick={() => loadCalculation(calc)}>
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={exportToPDF} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="pricePerKg" className="text-sm font-medium">
                Price per kg (₹):
              </Label>
              <Input
                id="pricePerKg"
                type="number"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Number(e.target.value))}
                className="w-24"
              />
              <Label htmlFor="material" className="text-sm font-medium">
                Material:
              </Label>
              <div className="flex items-center gap-2">
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carbon-steel">Carbon Steel</SelectItem>
                    <SelectItem value="stainless-steel">Stainless Steel</SelectItem>
                    <SelectItem value="aluminum">Aluminum</SelectItem>
                    <SelectItem value="copper">Copper</SelectItem>
                    <SelectItem value="brass">Brass</SelectItem>
                    <SelectItem value="titanium">Titanium</SelectItem>
                    {customMaterials.map((mat, index) => (
                      <SelectItem key={index} value={mat.name}>{mat.name} ({mat.density} g/cm³)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={showCustomMaterialDialog} onOpenChange={setShowCustomMaterialDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Material</DialogTitle>
                      <DialogDescription>
                        Enter the name and density of your custom material.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="materialName">Material Name</Label>
                        <Input
                          id="materialName"
                          value={newMaterialName}
                          onChange={(e) => setNewMaterialName(e.target.value)}
                          placeholder="e.g., Bronze"
                        />
                      </div>
                      <div>
                        <Label htmlFor="materialDensity">Density (g/cm³)</Label>
                        <Input
                          id="materialDensity"
                          type="number"
                          step="0.01"
                          value={newMaterialDensity}
                          onChange={(e) => setNewMaterialDensity(e.target.value)}
                          placeholder="e.g., 8.8"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addCustomMaterial}>Add Material</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="paintCost" className="text-sm font-medium">
                Coating Cost (₹/m²):
              </Label>
              <Input
                id="paintCost"
                type="number"
                value={paintCostPerSqM}
                onChange={(e) => setPaintCostPerSqM(Number(e.target.value))}
                className="w-24"
              />
              <Label htmlFor="coatingType" className="text-sm font-medium">
                Coating Type:
              </Label>
              <Select value={coatingType} onValueChange={setCoatingType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paint">Paint</SelectItem>
                  <SelectItem value="powder-coat">Powder Coat</SelectItem>
                  <SelectItem value="galvanize">Galvanize</SelectItem>
                  <SelectItem value="primer">Primer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="round-pipes" className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="round-pipes">Round Pipes</TabsTrigger>
              <TabsTrigger value="square-pipes">Square Pipes</TabsTrigger>
              <TabsTrigger value="rectangular-pipes">Rectangular Pipes</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="comparison">Compare</TabsTrigger>
              <TabsTrigger value="waste-optimizer">Waste Optimizer</TabsTrigger>
              <TabsTrigger value="individual-calc">Individual Calc</TabsTrigger>
              <TabsTrigger value="pipe-list">Pipe List</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="round-pipes" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Round Pipe Weight List (Oru Pipe ku - 6 Meter Length)</h3>
                  <p className="text-sm text-muted-foreground">
                    Ellam weights um Oru 'Full Pipe' (6 meter) ku Kilogram (kg) la iruku.
                  </p>
                </div>
                <Button onClick={() => exportToCSV("round")} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size (Inch)</TableHead>
                      <TableHead>Size (mm)</TableHead>
                      {wallThicknesses.map(wt => (
                        <TableHead key={wt}>{weightHeaders[wt]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roundWeightData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row["Size (Inch)"]}</TableCell>
                        <TableCell>{row["Size (mm)"]}</TableCell>
                        {wallThicknesses.map(wt => (
                          <TableCell key={wt}>{row[wt]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Round Pipe Price List (Oru Pipe ku - 6 Meter Length)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Oru Kilo {material.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} = ₹{pricePerKg} vachi, Oru 'Full Pipe' (6 meter) oda rate.
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Size (Inch)</TableHead>
                        <TableHead>Size (mm)</TableHead>
                        {wallThicknesses.map(wt => (
                          <TableHead key={wt}>{priceHeaders[wt]}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roundPriceData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row["Size (Inch)"]}</TableCell>
                          <TableCell>{row["Size (mm)"]}</TableCell>
                          {wallThicknesses.map(wt => (
                            <TableCell key={wt}>₹{row[wt]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="square-pipes" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">MS Square Pipe Weight List (Gauge vachi)</h3>
                  <p className="text-sm text-muted-foreground">
                    Ellam weights um Oru 'Full Pipe' (6 meter) ku Kilogram (kg) la iruku.
                  </p>
                </div>
                <Button onClick={() => exportToCSV("square")} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size (Inch)</TableHead>
                      <TableHead>Size (mm)</TableHead>
                      {wallThicknesses.map(wt => (
                        <TableHead key={wt}>{weightHeaders[wt]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {squareWeightData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row["Size (Inch)"]}</TableCell>
                        <TableCell>{row["Size (mm)"]}</TableCell>
                        {wallThicknesses.map(wt => (
                          <TableCell key={wt}>{row[wt]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">MS Square Pipe Price List (Gauge vachi)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Oru Kilo MS = ₹{pricePerKg} vachi, Oru 'Full Pipe' (6 meter) oda rate.
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Size (Inch)</TableHead>
                        <TableHead>Size (mm)</TableHead>
                        {wallThicknesses.map(wt => (
                          <TableHead key={wt}>{priceHeaders[wt]}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {squarePriceData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row["Size (Inch)"]}</TableCell>
                          <TableCell>{row["Size (mm)"]}</TableCell>
                          {wallThicknesses.map(wt => (
                            <TableCell key={wt}>₹{row[wt]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rectangular-pipes" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">MS Rectangular Pipe Weight List (Gauge vachi)</h3>
                  <p className="text-sm text-muted-foreground">
                    Ellam weights um Oru 'Full Pipe' (6 meter) ku Kilogram (kg) la iruku.
                  </p>
                </div>
                <Button onClick={() => exportToCSV("rectangular")} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size (Inch)</TableHead>
                      <TableHead>Size (mm)</TableHead>
                      {wallThicknesses.map(wt => (
                        <TableHead key={wt}>{weightHeaders[wt]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rectangularWeightData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row["Size (Inch)"]}</TableCell>
                        <TableCell>{row["Size (mm)"]}</TableCell>
                        {wallThicknesses.map(wt => (
                          <TableCell key={wt}>{row[wt]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">MS Rectangular Pipe Price List (Gauge vachi)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Oru Kilo MS = ₹{pricePerKg} vachi, Oru 'Full Pipe' (6 meter) oda rate.
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Size (Inch)</TableHead>
                        <TableHead>Size (mm)</TableHead>
                        {wallThicknesses.map(wt => (
                          <TableHead key={wt}>{priceHeaders[wt]}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rectangularPriceData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row["Size (Inch)"]}</TableCell>
                          <TableCell>{row["Size (mm)"]}</TableCell>
                          {wallThicknesses.map(wt => (
                            <TableCell key={wt}>₹{row[wt]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Chair and Table Templates</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a template to automatically add all required pipes for that furniture piece.
                </p>

                <Tabs defaultValue="chairs" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chairs">Chair Templates</TabsTrigger>
                    <TabsTrigger value="tables">Table Templates</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chairs" className="space-y-4 mt-6">
                    {Object.entries(chairTemplates).map(([key, template]) => (
                      <Card key={key} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                            <div className="space-y-1">
                              {template.components.map((component, index) => (
                                <div key={index} className="text-sm flex justify-between">
                                  <span>{component.quantity}x {component.size} {component.type} ({component.length}" {component.description})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => addTemplate(template)}
                            className="ml-4"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Template
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="tables" className="space-y-4 mt-6">
                    {Object.entries(tableTemplates).map(([key, template]) => (
                      <Card key={key} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                            <div className="space-y-1">
                              {template.components.map((component, index) => (
                                <div key={index} className="text-sm flex justify-between">
                                  <span>{component.quantity}x {component.size} {component.type} ({component.length}" {component.description})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => addTemplate(template)}
                            className="ml-4"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Template
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Pipe Options Comparison</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Compare different pipe sizes and thicknesses to find the best option for your needs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Comparison Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Pipe Type</Label>
                        <Select value={comparisonType} onValueChange={setComparisonType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round">Round Pipes</SelectItem>
                            <SelectItem value="square">Square Pipes</SelectItem>
                            <SelectItem value="rectangular">Rectangular Pipes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Base Size</Label>
                        <Select value={comparisonBaseSize} onValueChange={setComparisonBaseSize}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {comparisonType === "round" && Object.keys(roundPipeSizes).map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                            {comparisonType === "square" && Object.keys(squarePipeSizes).map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                            {comparisonType === "rectangular" && Object.keys(rectangularPipeSizes).map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Length (inches)</Label>
                        <Input
                          type="number"
                          value={comparisonLength}
                          onChange={(e) => setComparisonLength(Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <Button onClick={generateComparison} className="w-full">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Generate Comparison
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Comparison Results</h4>
                    {comparisonData.length > 0 ? (
                      <div className="space-y-2">
                        {comparisonData.map((item, index) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{item.thickness}mm thickness</span>
                              <span className="text-sm text-muted-foreground">{item.weight.toFixed(3)} kg</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Cost: ₹{item.cost.toFixed(2)} | Surface: {item.surfaceArea.toFixed(2)} m²
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select options and generate comparison</p>
                    )}
                  </Card>
                </div>

                {comparisonData.length > 0 && (
                  <Card className="p-6 mt-6">
                    <h4 className="font-semibold mb-4">Cost vs Weight Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {comparisonData.reduce((min, item) => item.cost < min.cost ? item : min, comparisonData[0]).thickness}mm
                        </div>
                        <div className="text-sm text-green-600">Lowest Cost</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {comparisonData.reduce((min, item) => item.weight < min.weight ? item : min, comparisonData[0]).thickness}mm
                        </div>
                        <div className="text-sm text-blue-600">Lightest Weight</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {comparisonData.reduce((best, item) => (item.cost / item.weight) < (best.cost / best.weight) ? item : best, comparisonData[0]).thickness}mm
                        </div>
                        <div className="text-sm text-purple-600">Best Value</div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="waste-optimizer" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Cutting Waste Optimization</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Optimize your pipe cutting to minimize waste and reduce material costs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Current Pipe Requirements</h4>
                    <div className="space-y-2">
                      {pipes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No pipes in list</p>
                      ) : (
                        pipes.map((pipe, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{pipe.size} ({pipe.thickness}mm)</span>
                            <span>{(pipe.lengthMeters * 1000).toFixed(0)}mm x {pipe.quantity}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Stock Length Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Stock Length (mm)</Label>
                        <Input
                          type="number"
                          value={stockLengths[0]}
                          onChange={(e) => setStockLengths([Number(e.target.value)])}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          const requiredLengths = [];
                          pipes.forEach(pipe => {
                            for (let i = 0; i < pipe.quantity; i++) {
                              requiredLengths.push(pipe.lengthMeters * 1000);
                            }
                          });
                          const optimization = optimizeCutting(requiredLengths, stockLengths[0]);
                          setShowWasteOptimizer(optimization);
                        }}
                        disabled={pipes.length === 0}
                        className="w-full"
                      >
                        Optimize Cutting
                      </Button>
                    </div>
                  </Card>
                </div>

                {showWasteOptimizer && (
                  <Card className="p-6 mt-6">
                    <h4 className="font-semibold mb-4">Optimization Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{showWasteOptimizer.totalStockNeeded}</div>
                        <div className="text-sm text-blue-600">Stock Pieces Needed</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{showWasteOptimizer.totalWaste.toFixed(0)}mm</div>
                        <div className="text-sm text-red-600">Total Waste</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{(100 - showWasteOptimizer.averageWastePercentage).toFixed(1)}%</div>
                        <div className="text-sm text-green-600">Average Utilization</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium">Cutting Plan:</h5>
                      {showWasteOptimizer.stockUtilization.map((stock, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Stock Piece #{stock.stockNumber}</span>
                            <span className="text-sm text-muted-foreground">
                              Waste: {stock.wasteLength}mm ({stock.wastePercentage}%)
                            </span>
                          </div>
                          <div className="text-sm">
                            Cuts: {stock.cuts.join('mm, ')}mm
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="individual-calc" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Individual Pipe Calculation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="pipeSize">Pipe Size</Label>
                    <select
                      id="pipeSize"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select Size</option>
                      {Object.keys(roundPipeSizes).map(size => (
                        <option key={`round-${size}`} value={`${size} (round)`}>{size} (Round)</option>
                      ))}
                      {Object.keys(squarePipeSizes).map(size => (
                        <option key={`square-${size}`} value={`${size} (square)`}>{size} (Square)</option>
                      ))}
                      {Object.keys(rectangularPipeSizes).map(size => (
                        <option key={`rectangular-${size}`} value={`${size} (rectangular)`}>{size} (Rectangular)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="thickness">Wall Thickness (mm)</Label>
                    <select
                      id="thickness"
                      value={selectedThickness}
                      onChange={(e) => setSelectedThickness(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select Thickness</option>
                      {wallThicknesses.map(wt => (
                        <option key={wt} value={wt}>{wt} mm</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="useCustomLength">Use Custom Length</Label>
                    <input
                      id="useCustomLength"
                      type="checkbox"
                      checked={useCustomLength}
                      onChange={(e) => setUseCustomLength(e.target.checked)}
                      className="ml-2"
                    />
                  </div>
                  {useCustomLength && (
                    <div>
                      <Label htmlFor="customLengthInches">Length (inches)</Label>
                      <Input
                        id="customLengthInches"
                        type="number"
                        value={customLengthInches}
                        onChange={(e) => setCustomLengthInches(Number(e.target.value))}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-6">
                  <Button onClick={editingPipe ? updatePipe : addPipe} className="bg-gradient-to-r from-primary to-accent">
                    {editingPipe ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {editingPipe ? "Update Pipe" : "Add Pipe"}
                  </Button>
                  {editingPipe && (
                    <Button variant="outline" onClick={() => setEditingPipe(null)}>
                      Cancel Edit
                    </Button>
                  )}
                </div>

                {individualResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Calculation Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Size</p>
                          <p className="font-medium">{individualResult.size}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Thickness</p>
                          <p className="font-medium">{individualResult.thickness} mm</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Weight per Pipe</p>
                          <p className="font-medium">{individualResult.weightPerPipe.toFixed(3)} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price per Pipe</p>
                          <p className="font-medium">₹{individualResult.pricePerPipe.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium">{individualResult.quantity}</p>
                        </div>
                        {individualResult.customLength && (
                          <div>
                            <p className="text-sm text-muted-foreground">Custom Length</p>
                            <p className="font-medium">{individualResult.customLength} inches</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Total Weight</p>
                          <p className="font-medium">{individualResult.totalWeight.toFixed(3)} kg</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Total Price</p>
                          <p className="font-medium text-lg">₹{individualResult.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2 mt-4 p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Additional Features</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Weight per Inch</p>
                              <p className="font-medium">{(individualResult.weightPerPipe / (individualResult.customLength || (PIPE_LENGTH_METERS * 39.37))).toFixed(4)} kg/inch</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Price per Inch</p>
                              <p className="font-medium">₹{(individualResult.pricePerPipe / (individualResult.customLength || (PIPE_LENGTH_METERS * 39.37))).toFixed(2)}/inch</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pipe-list" className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Added Pipes</h3>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search pipes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 w-48"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground self-center">{pipes.length} item(s)</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {pipes.filter(pipe =>
                    pipe.size.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((pipe) => (
                    <div key={pipe.id} className="p-4 bg-muted/50 rounded-lg border border-border flex justify-between items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold capitalize">{pipe.size}</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm">{pipe.thickness}mm</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Length: {pipe.customLength ? `${pipe.customLength}"` : `${PIPE_LENGTH_METERS}m`} | Qty: {pipe.quantity} | {pipe.weightPerPipe.toFixed(3)}kg each
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          Subtotal: {(pipe.weightPerPipe * pipe.quantity).toFixed(2)} kg
                        </div>
                        <div className="text-sm font-semibold text-primary">
                          Price: ₹{((pipe.weightPerPipe * pipe.quantity) * pricePerKg).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicatePipe(pipe)}
                          className="h-8 w-8"
                          title="Duplicate pipe"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editPipe(pipe)}
                          className="h-8 w-8"
                          title="Edit pipe"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePipe(pipe.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Remove pipe"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {pipes.length > 0 && (
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-primary/20">
                    <h3 className="text-lg font-bold text-foreground mb-3">Total Summary</h3>
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center p-3 bg-card/80 rounded-md">
                        <span className="text-sm font-medium text-muted-foreground">Price per kg:</span>
                        <span className="text-base font-semibold">₹{pricePerKg}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary to-accent rounded-md">
                        <span className="text-base font-bold text-primary-foreground">Total Weight:</span>
                        <span className="text-xl font-bold text-primary-foreground">{getTotalWeight().toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-accent to-primary rounded-md">
                        <span className="text-base font-bold text-primary-foreground">Total Price:</span>
                        <span className="text-xl font-bold text-primary-foreground">₹{getTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-card/80 rounded-md">
                        <span className="text-sm font-medium text-muted-foreground">Total Surface Area:</span>
                        <span className="text-base font-semibold">{getTotalSurfaceArea().toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-card/80 rounded-md">
                        <span className="text-sm font-medium text-muted-foreground">Coating Cost (₹{paintCostPerSqM}/m²):</span>
                        <span className="text-base font-semibold">₹{getTotalCoatingCost().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-md">
                        <span className="text-base font-bold text-white">Grand Total:</span>
                        <span className="text-xl font-bold text-white">₹{(getTotalPrice() + getTotalCoatingCost()).toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Settings</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Select value={material} onValueChange={setMaterial}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carbon-steel">Carbon Steel</SelectItem>
                        <SelectItem value="stainless-steel">Stainless Steel</SelectItem>
                        <SelectItem value="aluminum">Aluminum</SelectItem>
                        <SelectItem value="copper">Copper</SelectItem>
                        <SelectItem value="brass">Brass</SelectItem>
                        <SelectItem value="titanium">Titanium</SelectItem>
                        {customMaterials.map((mat, index) => (
                          <SelectItem key={index} value={mat.name}>{mat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="unitSystem">Unit System</Label>
                    <Select value={unitSystem} onValueChange={setUnitSystem}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric</SelectItem>
                        <SelectItem value="imperial">Imperial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="weightUnit">Weight Unit</Label>
                    <Select value={weightUnit} onValueChange={setWeightUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold">Saved Calculations</h4>
                  <div className="space-y-2">
                    {savedCalculations.map((calc, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{calc.name}</p>
                          <p className="text-sm text-muted-foreground">{new Date(calc.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => loadCalculation(calc)}>
                            <Upload className="h-4 w-4 mr-1" />
                            Load
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteCalculation(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}