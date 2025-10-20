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
import { Calculator as CalculatorIcon, Download, Plus, Save, Upload, Trash2, Copy, Edit, Search } from "lucide-react";
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

  // Calculate price for a given weight
  const calculatePrice = (weight) => {
    return weight * pricePerKg;
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
    const actualSize = isRound ? roundPipeSizes[size.replace(" (round)", "")] : squarePipeSizes[size.replace(" (square)", "")];

    if (!actualSize) return;

    const lengthMeters = useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS;
    const weight = isRound ? calculateRoundWeight(actualSize, wt, lengthMeters) : calculateSquareWeight(actualSize, wt, lengthMeters);
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
    const actualSize = isRound ? roundPipeSizes[size.replace(" (round)", "")] : squarePipeSizes[size.replace(" (square)", "")];

    if (!actualSize) return;

    const lengthMeters = useCustomLength ? customLengthInches * 0.0254 : PIPE_LENGTH_METERS;
    const weight = isRound ? calculateRoundWeight(actualSize, wt, lengthMeters) : calculateSquareWeight(actualSize, wt, lengthMeters);
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

  // Calculate totals
  const getTotalWeight = () => {
    return pipes.reduce((total, pipe) => total + pipe.weightPerPipe * pipe.quantity, 0);
  };

  const getTotalPrice = () => {
    return getTotalWeight() * pricePerKg;
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

              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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
                  <SelectItem key={index} value={mat.name}>{mat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="round-pipes" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="round-pipes">Round Pipes</TabsTrigger>
              <TabsTrigger value="square-pipes">Square Pipes</TabsTrigger>
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