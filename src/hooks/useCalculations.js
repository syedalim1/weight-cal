import { useState, useEffect } from "react";
import { useToast } from "./use-toast.js";

export const useCalculations = (tubes, pricePerKg, material) => {
  const { toast } = useToast();
  const [calculationName, setCalculationName] = useState("");
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

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
        material,
        date: new Date().toISOString(),
      };
      localStorage.setItem("steelCalc_current", JSON.stringify(currentCalc));
    }
  }, [tubes, pricePerKg, calculationName, material]);

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

  const loadCalculation = (calc, setTubes, setPricePerKg, setMaterial) => {
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

  const clearSavedCalculations = () => {
    localStorage.removeItem("steelCalc_savedCalculations");
    setSavedCalculations([]);
    toast({
      title: "Calculations cleared",
      description: "All saved calculations have been removed.",
    });
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

  return {
    // State
    calculationName,
    savedCalculations,
    showSaveDialog,
    showLoadDialog,

    // Setters
    setCalculationName,
    setShowSaveDialog,
    setShowLoadDialog,

    // Actions
    saveCalculation,
    loadCalculation,
    deleteCalculation,
    clearSavedCalculations,
    getTotalWeight,
    getTotalPrice,
  };
};
