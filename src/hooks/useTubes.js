import { useState } from "react";
import { useToast } from "./use-toast.js";
import { getRoundPipeWeightPer20ft, getSquarePipeWeightPer20ft, convert20ftToPerMeter } from "../data/roundPipeWeights.js";

const standardSizes = {
  round: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  square: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  rectangular: {
    width: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"],
    height: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"],
  },
  sheet: {
    width: ["12", "24", "36", "48", "60", "72"],
    length: ["12", "24", "36", "48", "60", "72", "96", "120"],
  },
};

const thicknessOptions = {
  tube: ["1.0", "1.2", "1.5","2.0","3.0"],
  sheet: ["0.5","0.8", "1.0", "1.5", "2.0", "3.0", "4.0", "5.0", "6.0"],
};

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

export const useTubes = (material) => {
  const { toast } = useToast();
  const [tubes, setTubes] = useState([]);
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
  const [editingTube, setEditingTube] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getTubeDescription = (tube) => {
    if (tube.shape === "rectangular") {
      return `${tube.width}" × ${tube.height}"`;
    } else if (tube.shape === "sheet") {
      return `${tube.width}" × ${tube.length}"`;
    }
    return `${tube.size}"`;
  };

  const isUsingStandardWeight = (tube) => {
    if (tube.shape === "round") {
      return getRoundPipeWeightPer20ft(tube.size, tube.thickness) !== null;
    } else if (tube.shape === "square") {
      return getSquarePipeWeightPer20ft(tube.size, tube.thickness) !== null;
    }
    return false;
  };

  const calculateWeight = (tubeData) => {
    const { shape, size, width, height, thickness: wt, length: lengthInInches } = tubeData;
    const density = getMaterialDensity(material);

    if (shape === "sheet") {
      // For sheets, calculate area in square meters and multiply by thickness in meters
      const sheetWidth = width * 0.0265; // Convert inches to meters
      const sheetLength = lengthInInches * 0.0265; // Convert inches to meters
      const sheetThickness = wt / 1000; // Convert mm to meters
      const volume = sheetWidth * sheetLength * sheetThickness; // m³
      return volume * density * 1000; // kg
    }

    // Check if we have standard weight data for round or square pipes
    if (shape === "round") {
      const standardWeightPer20ft = getRoundPipeWeightPer20ft(size, wt);
      if (standardWeightPer20ft !== null) {
        // Convert 20ft weight to per meter, then multiply by actual length
        const weightPerMeter = convert20ftToPerMeter(standardWeightPer20ft);
        const tubeLength = lengthInInches * 0.0254; // Convert inches to meters
        return weightPerMeter * tubeLength;
      }
    } else if (shape === "square") {
      const standardWeightPer20ft = getSquarePipeWeightPer20ft(size, wt);
      if (standardWeightPer20ft !== null) {
        // Convert 20ft weight to per meter, then multiply by actual length
        const weightPerMeter = convert20ftToPerMeter(standardWeightPer20ft);
        const tubeLength = lengthInInches * 0.0254; // Convert inches to meters
        return weightPerMeter * tubeLength;
      }
    }

    const tubeLength = lengthInInches * 0.0254; // Convert inches to meters
    let weightPerMeter = 0;

    if (shape === "round") {
      const od = size * 25.4; // Convert to mm
      const id = od - 2 * wt;
      const crossSectionArea =
        (Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2))) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    } else if (shape === "square") {
      const side = size * 25.4; // Convert to mm
      const innerSide = side - 2 * wt;
      const crossSectionArea =
        (Math.pow(side, 2) - Math.pow(innerSide, 2)) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    } else if (shape === "rectangular") {
      const widthMm = width * 25.4; // Convert to mm
      const heightMm = height * 25.4; // Convert to mm
      const innerWidth = widthMm - 2 * wt;
      const innerHeight = heightMm - 2 * wt;
      const crossSectionArea =
        (widthMm * heightMm - innerWidth * innerHeight) / 1000000; // Convert mm² to m²
      weightPerMeter = crossSectionArea * density * 1000; // kg/m
    }

    return weightPerMeter * tubeLength;
  };

  const validateTubeData = (data) => {
    const { quantity: qty, length: lengthInInches, thickness: wt, shape, customSize, standardSize, customWidth, standardWidth, customHeight, standardHeight } = data;

    const qtyNum = parseFloat(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than 0.",
        variant: "destructive",
      });
      return false;
    }

    const lengthNum = parseFloat(lengthInInches);
    if (isNaN(lengthNum) || lengthNum <= 0) {
      toast({
        title: "Invalid length",
        description: "Please enter a valid length in inches greater than 0.",
        variant: "destructive",
      });
      return false;
    }

    if (lengthNum > 10000) {
      toast({
        title: "Length too large",
        description: "Please enter a length less than 10,000 inches.",
        variant: "destructive",
      });
      return false;
    }

    const wtNum = parseFloat(wt);
    if (isNaN(wtNum) || wtNum <= 0) {
      toast({
        title: "Invalid thickness",
        description: "Please select a valid thickness.",
        variant: "destructive",
      });
      return false;
    }

    if (shape === "round" || shape === "square") {
      const sizeInInches = customSize ? parseFloat(customSize) : parseFloat(standardSize);
      if (isNaN(sizeInInches) || sizeInInches <= 0) {
        toast({
          title: "Invalid tube size",
          description: `Please select or enter a valid tube ${shape === "round" ? "diameter" : "side length"}.`,
          variant: "destructive",
        });
        return false;
      }
      if (sizeInInches < 0.1 || sizeInInches > 20) {
        toast({
          title: "Size out of range",
          description: `Tube ${shape === "round" ? "diameter" : "side length"} should be between 0.1 and 20 inches.`,
          variant: "destructive",
        });
        return false;
      }
    } else if (shape === "rectangular") {
      const widthInInches = customWidth ? parseFloat(customWidth) : parseFloat(standardWidth);
      const heightInInches = customHeight ? parseFloat(customHeight) : parseFloat(standardHeight);

      if (isNaN(widthInInches) || widthInInches <= 0 || isNaN(heightInInches) || heightInInches <= 0) {
        toast({
          title: "Invalid dimensions",
          description: "Please select or enter valid width and height.",
          variant: "destructive",
        });
        return false;
      }

      if (widthInInches < 0.1 || widthInInches > 20 || heightInInches < 0.1 || heightInInches > 20) {
        toast({
          title: "Dimensions out of range",
          description: "Width and height should be between 0.1 and 20 inches.",
          variant: "destructive",
        });
        return false;
      }
    } else if (shape === "sheet") {
      const widthInInches = customWidth ? parseFloat(customWidth) : parseFloat(standardWidth);

      if (isNaN(widthInInches) || widthInInches <= 0) {
        toast({
          title: "Invalid sheet width",
          description: "Please select or enter a valid sheet width.",
          variant: "destructive",
        });
        return false;
      }

      if (widthInInches < 1 || widthInInches > 120) {
        toast({
          title: "Width out of range",
          description: "Sheet width should be between 1 and 120 inches.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const addTube = () => {
    const tubeData = {
      quantity,
      length,
      thickness,
      shape,
      customSize,
      standardSize,
      customWidth,
      standardWidth,
      customHeight,
      standardHeight,
    };

    if (!validateTubeData(tubeData)) return;

    let size = 0;
    let width = 0;
    let height = 0;

    if (shape === "round" || shape === "square") {
      size = customSize ? parseFloat(customSize) : parseFloat(standardSize);
    } else if (shape === "rectangular") {
      width = customWidth ? parseFloat(customWidth) : parseFloat(standardWidth);
      height = customHeight ? parseFloat(customHeight) : parseFloat(standardHeight);
    } else if (shape === "sheet") {
      width = customWidth ? parseFloat(customWidth) : parseFloat(standardWidth);
    }

    const weightPerTube = calculateWeight({
      shape,
      size,
      width,
      height,
      thickness: parseFloat(thickness),
      length: parseFloat(length),
    });

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
      thickness: parseFloat(thickness),
      length: parseFloat(length),
      quantity: parseFloat(quantity),
      weightPerTube: parseFloat(weightPerTube.toFixed(2)),
    };

    setTubes([...tubes, newTube]);

    toast({
      title: "Tube added",
      description: `${shape} tube (${getTubeDescription(newTube)}) added successfully.`,
    });

    // Reset form only if not editing
    if (!editingTube) {
      resetForm();
    }
  };

  const updateTube = () => {
    if (!editingTube) return;

    const tubeData = {
      quantity,
      length,
      thickness,
      shape,
      customSize,
      standardSize,
      customWidth,
      standardWidth,
      customHeight,
      standardHeight,
    };

    if (!validateTubeData(tubeData)) return;

    const updatedTube = { ...editingTube };
    updatedTube.shape = shape;
    updatedTube.thickness = parseFloat(thickness);

    if (shape === "rectangular") {
      updatedTube.width = parseFloat(customWidth || standardWidth);
      updatedTube.height = parseFloat(customHeight || standardHeight);
    } else if (shape === "sheet") {
      updatedTube.width = parseFloat(customWidth || standardWidth);
    } else {
      updatedTube.size = parseFloat(customSize || standardSize);
    }

    updatedTube.length = parseFloat(length);
    updatedTube.quantity = parseFloat(quantity);

    const weightPerTube = calculateWeight(updatedTube);
    updatedTube.weightPerTube = parseFloat(weightPerTube.toFixed(2));

    setTubes(tubes.map((t) => (t.id === editingTube.id ? updatedTube : t)));
    setEditingTube(null);
    resetForm();

    toast({
      title: "Tube updated",
      description: "The tube has been updated successfully.",
    });
  };

  const removeTube = (id) => {
    setTubes(tubes.filter((tube) => tube.id !== id));
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
    setShape(tube.shape);
    setThickness(tube.thickness.toString());
    setLength(tube.length.toString());
    setQuantity(tube.quantity.toString());

    if (tube.shape === "rectangular") {
      setCustomWidth(tube.width?.toString() || "");
      setCustomHeight(tube.height?.toString() || "");
    } else if (tube.shape === "sheet") {
      setCustomWidth(tube.width?.toString() || "");
    } else {
      setCustomSize(tube.size.toString());
    }
  };

  const resetForm = () => {
    setStandardSize("");
    setCustomSize("");
    setStandardWidth("");
    setCustomWidth("");
    setStandardHeight("");
    setCustomHeight("");
    setLength("");
    setQuantity("1");
  };

  const handleShapeChange = (value) => {
    setShape(value);
    resetForm();
  };

  const clearAll = () => {
    setTubes([]);
    toast({
      title: "Cleared",
      description: "All tubes have been removed.",
    });
  };

  const getTotalWeight = () => {
    return tubes.reduce((total, tube) => total + tube.weightPerTube * tube.quantity, 0);
  };

  const filteredTubes = tubes.filter(
    (tube) =>
      tube.shape.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTubeDescription(tube).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    // State
    tubes,
    shape,
    standardSize,
    customSize,
    standardWidth,
    customWidth,
    standardHeight,
    customHeight,
    thickness,
    length,
    quantity,
    editingTube,
    searchTerm,
    filteredTubes,

    // Constants
    standardSizes,
    thicknessOptions,

    // Setters
    setShape,
    setStandardSize,
    setCustomSize,
    setStandardWidth,
    setCustomWidth,
    setStandardHeight,
    setCustomHeight,
    setThickness,
    setLength,
    setQuantity,
    setSearchTerm,

    // Actions
    addTube,
    updateTube,
    removeTube,
    duplicateTube,
    editTube,
    handleShapeChange,
    clearAll,
    getTotalWeight,
    getTubeDescription,
    isUsingStandardWeight,
  };
};
