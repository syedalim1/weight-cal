import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Calculator as CalculatorIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import TubeForm from "./TubeForm.jsx";
import TubeList from "./TubeList.jsx";
import CalculationSummary from "./CalculationSummary.jsx";
import CalculatorToolbar from "./CalculatorToolbar.jsx";
import SettingsTab from "./SettingsTab.jsx";


const standardSizes = {
  round: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  square: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  rectangular: {
    width: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"],
    height: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"],
  },
};

const thicknessOptions = ["1.0", "1.2", "1.5"];

const getMaterialDensity = (material) => {
  const densities = {
    "stainless-steel": 7.85,
    "carbon-steel": 7.85,
    aluminum: 2.7,
    copper: 8.96,
    brass: 8.5,
    titanium: 4.51,
  };
  return densities[material] || 7.85; // Default to stainless steel density
};

export default function Calculator() {
  const { toast } = useToast();
  const [shape, setShape] = useState("round");
  const [standardSize, setStandardSize] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [standardWidth, setStandardWidth] = useState("");
  const [customWidth, setCustomWidth] = useState("");
  const [standardHeight, setStandardHeight] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [thickness, setThickness] = useState("1.0");
  const [length, setLength] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [tubes, setTubes] = useState([]);

  // New features state
  const [pricePerKg, setPricePerKg] = useState(260);
  const [material, setMaterial] = useState("stainless-steel");
  const [calculationName, setCalculationName] = useState("");
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [editingTube, setEditingTube] = useState(null);

  const addTube = () => {
    // Enhanced validation with toast notifications
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const lengthInInches = parseFloat(length);
    if (isNaN(lengthInInches) || lengthInInches <= 0) {
      toast({
        title: "Invalid length",
        description: "Please enter a valid length in inches greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (lengthInInches > 10000) {
      toast({
        title: "Length too large",
        description: "Please enter a length less than 10,000 inches.",
        variant: "destructive",
      });
      return;
    }

    const wt = parseFloat(thickness);
    if (isNaN(wt) || wt <= 0) {
      toast({
        title: "Invalid thickness",
        description: "Please select a valid thickness.",
        variant: "destructive",
      });
      return;
    }

    const tubeLength = lengthInInches * 0.0254; // Convert inches to meters
    const density = getMaterialDensity(material);

    let weightPerMeter = 0;
    let size = 0;
    let width = 0;
    let height = 0;

    if (shape === "round") {
      const sizeInInches = customSize
        ? parseFloat(customSize)
        : parseFloat(standardSize);
      if (isNaN(sizeInInches) || sizeInInches <= 0) {
        toast({
          title: "Invalid tube size",
          description: "Please select or enter a valid tube diameter.",
          variant: "destructive",
        });
        return;
      }
      if (sizeInInches < 0.1 || sizeInInches > 20) {
        toast({
          title: "Size out of range",
          description: "Tube diameter should be between 0.1 and 20 inches.",
          variant: "destructive",
        });
        return;
      }
      size = sizeInInches;
      const od = sizeInInches * 25.4; // Convert to mm
      const id = od - 2 * wt;
      const crossSectionArea =
        (Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2))) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    } else if (shape === "square") {
      const sizeInInches = customSize
        ? parseFloat(customSize)
        : parseFloat(standardSize);
      if (isNaN(sizeInInches) || sizeInInches <= 0) {
        toast({
          title: "Invalid tube size",
          description: "Please select or enter a valid tube side length.",
          variant: "destructive",
        });
        return;
      }
      if (sizeInInches < 0.1 || sizeInInches > 20) {
        toast({
          title: "Size out of range",
          description: "Tube side length should be between 0.1 and 20 inches.",
          variant: "destructive",
        });
        return;
      }
      size = sizeInInches;
      const side = sizeInInches * 25.4; // Convert to mm
      const innerSide = side - 2 * wt;
      const crossSectionArea =
        (Math.pow(side, 2) - Math.pow(innerSide, 2)) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    } else if (shape === "rectangular") {
      const widthInInches = customWidth
        ? parseFloat(customWidth)
        : parseFloat(standardWidth);
      const heightInInches = customHeight
        ? parseFloat(customHeight)
        : parseFloat(standardHeight);

      if (
        isNaN(widthInInches) ||
        widthInInches <= 0 ||
        isNaN(heightInInches) ||
        heightInInches <= 0
      ) {
        toast({
          title: "Invalid dimensions",
          description: "Please select or enter valid width and height.",
          variant: "destructive",
        });
        return;
      }

      if (
        widthInInches < 0.1 ||
        widthInInches > 20 ||
        heightInInches < 0.1 ||
        heightInInches > 20
      ) {
        toast({
          title: "Dimensions out of range",
          description: "Width and height should be between 0.1 and 20 inches.",
          variant: "destructive",
        });
        return;
      }

      width = widthInInches;
      height = heightInInches;
      const widthMm = widthInInches * 25.4; // Convert to mm
      const heightMm = heightInInches * 25.4; // Convert to mm
      const innerWidth = widthMm - 2 * wt;
      const innerHeight = heightMm - 2 * wt;
      const crossSectionArea =
        (widthMm * heightMm - innerWidth * innerHeight) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    }

    const weightPerTube = weightPerMeter * tubeLength;

    if (weightPerTube <= 0 || !isFinite(weightPerTube)) {
      toast({
        title: "Calculation error",
        description: "Unable to calculate weight with the given parameters.",
        variant: "destructive",
      });
      return;
    }

    const newTube = {
      id: Date.now().toString(),
      shape,
      size,
      width,
      height,
      thickness: wt,
      length: lengthInInches,
      quantity: qty,
      weightPerTube: parseFloat(weightPerTube.toFixed(2)),
    };

    setTubes([...tubes, newTube]);

    toast({
      title: "Tube added",
      description: `${shape} tube (${getTubeDescription(
        newTube
      )}) added successfully.`,
    });

    // Reset form only if not editing
    if (!editingTube) {
      setStandardSize("");
      setCustomSize("");
      setStandardWidth("");
      setCustomWidth("");
      setStandardHeight("");
      setCustomHeight("");
      setLength("");
      setQuantity("1");
    }
  };

  const removeTube = (id) => {
    setTubes(tubes.filter((tube) => tube.id !== id));
  };

  const getTotalWeight = () => {
    return tubes.reduce(
      (total, tube) => total + tube.weightPerTube * tube.quantity,
      0
    );
  };

  const getTotalPrice = () => {
    return getTotalWeight() * pricePerKg;
  };

  const getTubeDescription = (tube) => {
    if (tube.shape === "rectangular") {
      return `${tube.width}" × ${tube.height}"`;
    }
    return `${tube.size}"`;
  };

  const handleShapeChange = (value) => {
    setShape(value);
    setStandardSize("");
    setCustomSize("");
    setStandardWidth("");
    setCustomWidth("");
    setStandardHeight("");
    setCustomHeight("");
    setLength("");
    setQuantity("1");
  };

  // Load saved calculations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("steelCalc_savedCalculations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old calculations to include material field
        const migrated = parsed.map(
          (calc) => ({
            ...calc,
            material: calc.material || "stainless-steel",
          })
        );
        setSavedCalculations(migrated);
      } catch (error) {
        console.error("Error loading saved calculations:", error);
      }
    }
  }, []);

  // Auto-save current calculation
  useEffect(() => {
    if (tubes.length > 0) {
      const currentCalc = {
        name: calculationName || `Calculation ${new Date().toLocaleString()}`,
        tubes,
        pricePerKg,
        date: new Date().toISOString(),
      };
      localStorage.setItem("steelCalc_current", JSON.stringify(currentCalc));
    }
  }, [tubes, pricePerKg, calculationName]);

  // New feature functions
  const saveCalculation = () => {
    if (tubes.length === 0) {
      toast({
        title: "No tubes to save",
        description: "Add some tubes before saving the calculation.",
        variant: "destructive",
      });
      return;
    }

    const name =
      calculationName.trim() || `Calculation ${new Date().toLocaleString()}`;
    const newCalculation = {
      name,
      tubes: [...tubes],
      pricePerKg,
      material,
      date: new Date().toISOString(),
    };

    const updatedCalculations = [...savedCalculations, newCalculation];
    setSavedCalculations(updatedCalculations);
    localStorage.setItem(
      "steelCalc_savedCalculations",
      JSON.stringify(updatedCalculations)
    );

    toast({
      title: "Calculation saved",
      description: `"${name}" has been saved successfully.`,
    });

    setCalculationName("");
    setShowSaveDialog(false);
  };

  const loadCalculation = (calc) => {
    setTubes(calc.tubes);
    setPricePerKg(calc.pricePerKg);
    setMaterial(calc.material || "stainless-steel");
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
    localStorage.setItem(
      "steelCalc_savedCalculations",
      JSON.stringify(updatedCalculations)
    );

    toast({
      title: "Calculation deleted",
      description: "The calculation has been removed.",
    });
  };

  const exportToCSV = () => {
    if (tubes.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some tubes before exporting.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      [
        "Shape",
        "Size",
        "Thickness (mm)",
        "Length (inches)",
        "Quantity",
        "Weight per Tube (kg)",
        "Total Weight (kg)",
        "Price (₹)",
      ],
      ...tubes.map((tube) => [
        tube.shape,
        getTubeDescription(tube),
        tube.thickness,
        tube.length,
        tube.quantity,
        tube.weightPerTube,
        (tube.weightPerTube * tube.quantity).toFixed(2),
        (tube.weightPerTube * tube.quantity * pricePerKg).toFixed(2),
      ]),
      [
        "",
        "",
        "",
        "",
        "Total:",
        "",
        getTotalWeight().toFixed(2),
        getTotalPrice().toFixed(2),
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `steel_calculation_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "CSV file has been downloaded.",
    });
  };

  const exportToPDF = async () => {
    if (tubes.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some tubes before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(18);
      pdf.text("Steel Tube Weight Calculation", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Date and calculation name
      pdf.setFontSize(12);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 10;
      if (calculationName) {
        pdf.text(`Calculation: ${calculationName}`, 20, yPosition);
        yPosition += 10;
      }
      pdf.text(`Price per kg: ₹${pricePerKg}`, 20, yPosition);
      yPosition += 15;

      // Table headers
      pdf.setFontSize(10);
      const headers = [
        "Shape",
        "Size",
        "Thick(mm)",
        "Length(in)",
        "Qty",
        "Wt/Tube(kg)",
        "Total Wt(kg)",
        "Price(₹)",
      ];
      const columnWidths = [25, 25, 20, 25, 15, 25, 25, 25];
      let xPosition = 20;

      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 8;

      // Draw header line
      pdf.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
      yPosition += 5;

      // Table data
      tubes.forEach((tube) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        xPosition = 20;
        const rowData = [
          tube.shape,
          getTubeDescription(tube),
          tube.thickness.toString(),
          tube.length.toString(),
          tube.quantity.toString(),
          tube.weightPerTube.toFixed(2),
          (tube.weightPerTube * tube.quantity).toFixed(2),
          (tube.weightPerTube * tube.quantity * pricePerKg).toFixed(2),
        ];

        rowData.forEach((data, index) => {
          pdf.text(data, xPosition, yPosition);
          xPosition += columnWidths[index];
        });
        yPosition += 8;
      });

      // Total row
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      yPosition += 5;
      pdf.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
      yPosition += 8;

      xPosition = 20;
      const totalData = [
        "",
        "",
        "",
        "",
        "TOTAL:",
        "",
        getTotalWeight().toFixed(2),
        getTotalPrice().toFixed(2),
      ];
      totalData.forEach((data, index) => {
        if (data) pdf.text(data, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      // Save the PDF
      pdf.save(
        `steel_calculation_${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast({
        title: "Export successful",
        description: "PDF file has been downloaded.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const duplicateTube = (tube) => {
    const duplicatedTube = { ...tube, id: Date.now().toString() };
    setTubes([...tubes, duplicatedTube]);

    toast({
      title: "Tube duplicated",
      description: "A copy of the tube has been added.",
    });
  };

  const editTube = (tube) => {
    setEditingTube(tube);
    // Populate form with tube data
    setShape(tube.shape);
    setThickness(tube.thickness.toString());
    setLength(tube.length.toString());
    setQuantity(tube.quantity.toString());

    if (tube.shape === "rectangular") {
      setCustomWidth(tube.width?.toString() || "");
      setCustomHeight(tube.height?.toString() || "");
    } else {
      setCustomSize(tube.size.toString());
    }
  };

  const updateTube = () => {
    if (!editingTube) return;

    const updatedTube = { ...editingTube };
    // Update tube with current form values
    updatedTube.shape = shape;
    updatedTube.thickness = parseFloat(thickness);

    if (shape === "rectangular") {
      updatedTube.width = parseFloat(customWidth || standardWidth);
      updatedTube.height = parseFloat(customHeight || standardHeight);
    } else {
      updatedTube.size = parseFloat(customSize || standardSize);
    }

    updatedTube.length = parseFloat(length);
    updatedTube.quantity = parseFloat(quantity);

    // Recalculate weight
    const tubeLength = updatedTube.length * 0.0254;
    const density = getMaterialDensity(material);
    let weightPerMeter = 0;

    if (updatedTube.shape === "round") {
      const od = updatedTube.size * 25.4; // Convert to mm
      const id = od - 2 * updatedTube.thickness;
      const crossSectionArea =
        (Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2))) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    } else if (updatedTube.shape === "square") {
      const side = updatedTube.size * 25.4; // Convert to mm
      const innerSide = side - 2 * updatedTube.thickness;
      const crossSectionArea =
        (Math.pow(side, 2) - Math.pow(innerSide, 2)) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    } else if (updatedTube.shape === "rectangular") {
      const widthMm = updatedTube.width * 25.4; // Convert to mm
      const heightMm = updatedTube.height * 25.4; // Convert to mm
      const innerWidth = widthMm - 2 * updatedTube.thickness;
      const innerHeight = heightMm - 2 * updatedTube.thickness;
      const crossSectionArea =
        (widthMm * heightMm - innerWidth * innerHeight) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    }

    updatedTube.weightPerTube = parseFloat(
      (weightPerMeter * tubeLength).toFixed(2)
    );

    setTubes(tubes.map((t) => (t.id === editingTube.id ? updatedTube : t)));
    setEditingTube(null);

    // Reset form
    setStandardSize("");
    setCustomSize("");
    setStandardWidth("");
    setCustomWidth("");
    setStandardHeight("");
    setCustomHeight("");
    setLength("");
    setQuantity("1");

    toast({
      title: "Tube updated",
      description: "The tube has been updated successfully.",
    });
  };

  const clearAll = () => {
    setTubes([]);
    setCalculationName("");
    localStorage.removeItem("steelCalc_current");

    toast({
      title: "Cleared",
      description: "All tubes have been removed.",
    });
  };

  const filteredTubes = tubes.filter(
    (tube) =>
      tube.shape.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTubeDescription(tube).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-4xl shadow-[var(--shadow-elevated)]">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <CalculatorIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Advanced SS Tube Weight Calculator
                </CardTitle>
                <CardDescription className="text-base">
                  Calculate weight for stainless steel tubes with precision
                </CardDescription>
              </div>
            </div>

            <CalculatorToolbar
              calculationName={calculationName}
              setCalculationName={setCalculationName}
              savedCalculations={savedCalculations}
              showSaveDialog={showSaveDialog}
              setShowSaveDialog={setShowSaveDialog}
              showLoadDialog={showLoadDialog}
              setShowLoadDialog={setShowLoadDialog}
              tubes={tubes}
              pricePerKg={pricePerKg}
              onSaveCalculation={saveCalculation}
              onLoadCalculation={loadCalculation}
              onDeleteCalculation={deleteCalculation}
              onExportToCSV={exportToCSV}
              onExportToPDF={exportToPDF}
              onClearAll={clearAll}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-6">
              <TubeForm
                shape={shape}
                setShape={setShape}
                standardSize={standardSize}
                setStandardSize={setStandardSize}
                customSize={customSize}
                setCustomSize={setCustomSize}
                standardWidth={standardWidth}
                setStandardWidth={setStandardWidth}
                customWidth={customWidth}
                setCustomWidth={setCustomWidth}
                standardHeight={standardHeight}
                setStandardHeight={setStandardHeight}
                customHeight={customHeight}
                setCustomHeight={setCustomHeight}
                thickness={thickness}
                setThickness={setThickness}
                length={length}
                setLength={setLength}
                quantity={quantity}
                setQuantity={setQuantity}
                pricePerKg={pricePerKg}
                setPricePerKg={setPricePerKg}
                editingTube={editingTube}
                onAddTube={addTube}
                onUpdateTube={updateTube}
                onShapeChange={handleShapeChange}
              />

              <TubeList
                tubes={tubes}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                pricePerKg={pricePerKg}
                onRemoveTube={removeTube}
                onDuplicateTube={duplicateTube}
                onEditTube={editTube}
              />

              <CalculationSummary tubes={tubes} pricePerKg={pricePerKg} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <SettingsTab
                pricePerKg={pricePerKg}
                setPricePerKg={setPricePerKg}
                material={material}
                setMaterial={setMaterial}
                savedCalculations={savedCalculations}
                onClearSavedCalculations={() => {
                  localStorage.removeItem("steelCalc_savedCalculations");
                  setSavedCalculations([]);
                  toast({
                    title: "Calculations cleared",
                    description: "All saved calculations have been removed.",
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
