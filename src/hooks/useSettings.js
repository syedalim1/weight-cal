import { useState, useEffect } from "react";

export const useSettings = () => {
  const [pricePerKg, setPricePerKg] = useState(260);
  const [material, setMaterial] = useState("stainless-steel");
  const [unitSystem, setUnitSystem] = useState("imperial");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [customMaterials, setCustomMaterials] = useState([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedUnitSystem = localStorage.getItem("steelCalc_unitSystem");
    if (savedUnitSystem) {
      setUnitSystem(savedUnitSystem);
    }

    const savedWeightUnit = localStorage.getItem("steelCalc_weightUnit");
    if (savedWeightUnit) {
      setWeightUnit(savedWeightUnit);
    }

    const customMats = localStorage.getItem("steelCalc_customMaterials");
    if (customMats) {
      try {
        setCustomMaterials(JSON.parse(customMats));
      } catch (error) {
        console.error("Error loading custom materials:", error);
      }
    }
  }, []);

  // Save unit settings to localStorage
  useEffect(() => {
    localStorage.setItem("steelCalc_unitSystem", unitSystem);
  }, [unitSystem]);

  useEffect(() => {
    localStorage.setItem("steelCalc_weightUnit", weightUnit);
  }, [weightUnit]);

  useEffect(() => {
    localStorage.setItem("steelCalc_customMaterials", JSON.stringify(customMaterials));
  }, [customMaterials]);

  return {
    pricePerKg,
    setPricePerKg,
    material,
    setMaterial,
    unitSystem,
    setUnitSystem,
    weightUnit,
    setWeightUnit,
    customMaterials,
    setCustomMaterials,
  };
};
