"use client";
import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase.js";

export function usePricing() {
  // Product Details
  const [productType, setProductType] = useState("chair");
  const [materialType, setMaterialType] = useState("ss");
  const [modelNumber, setModelNumber] = useState("");

  // Size Configuration
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");

  // Cost Inputs
  const [sheetCost, setSheetCost] = useState("");
  const [pipeCost, setPipeCost] = useState("");

  // Top Selection
  const [topType, setTopType] = useState("steel");
  const [topCost, setTopCost] = useState("");
  const [graniteColor, setGraniteColor] = useState("black");

  // Seating
  const [seatType, setSeatType] = useState("cushion");
  const [seatCost, setSeatCost] = useState("");

  // Finishing
  const [finishType, setFinishType] = useState("polish");
  const [finishCost, setFinishCost] = useState("");
  const [coatingColor, setCoatingColor] = useState("black");

  // Labour & Fabrication
  const [labourCost, setLabourCost] = useState("");
  const [weldingCost, setWeldingCost] = useState("");
  const [electricityCost, setElectricityCost] = useState("");
  const [machineCost, setMachineCost] = useState("");

  // Profit Percentages
  const [wholesalePercent, setWholesalePercent] = useState("10");
  const [retailPercent, setRetailPercent] = useState("20");
  const [showroomPercent, setShowroomPercent] = useState("35");

  // Custom Price Validation
  const [customPrice, setCustomPrice] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);

  // Parse a value to number, defaulting to 0
  const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  // Derived calculations
  const totalCost = useMemo(() => {
    return (
      num(pipeCost) +
      num(sheetCost) +
      num(topCost) +
      num(seatCost) +
      num(finishCost) +
      num(labourCost) +
      num(weldingCost) +
      num(electricityCost) +
      num(machineCost)
    );
  }, [pipeCost, sheetCost, topCost, seatCost, finishCost, labourCost, weldingCost, electricityCost, machineCost]);

  const wholesalePrice = useMemo(() => {
    return totalCost + totalCost * (num(wholesalePercent) / 100);
  }, [totalCost, wholesalePercent]);

  const retailPrice = useMemo(() => {
    return totalCost + totalCost * (num(retailPercent) / 100);
  }, [totalCost, retailPercent]);

  const showroomPrice = useMemo(() => {
    return totalCost + totalCost * (num(showroomPercent) / 100);
  }, [totalCost, showroomPercent]);

  const priceStatus = useMemo(() => {
    const cp = num(customPrice);
    if (cp <= 0) return null;
    if (cp < wholesalePrice) return "LOSS";
    if (cp < retailPrice) return "LOW PROFIT";
    return "OK";
  }, [customPrice, wholesalePrice, retailPrice]);

  // Save product to Supabase
  const saveProduct = useCallback(async () => {
    if (!supabase) {
      return { success: false, error: "Supabase not configured. Please add your credentials to .env.local and restart the server." };
    }
    if (totalCost <= 0) {
      return { success: false, error: "Total cost must be greater than 0" };
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("product_pricing")
        .insert([
          {
            product_type: productType,
            material_type: materialType,
            model_number: modelNumber || null,
            width: num(width) || null,
            length: num(length) || null,
            sheet_cost: num(sheetCost),
            pipe_cost: num(pipeCost),
            top_type: topType,
            top_cost: num(topCost),
            granite_color: topType === "granite" ? graniteColor : null,
            seat_type: seatType,
            seat_cost: num(seatCost),
            finish_type: finishType,
            finish_cost: num(finishCost),
            coating_color: finishType === "powder_coating" ? coatingColor : null,
            labour_cost: num(labourCost),
            welding_cost: num(weldingCost),
            electricity_cost: num(electricityCost),
            machine_cost: num(machineCost),
            total_cost: totalCost,
            wholesale_percent: num(wholesalePercent),
            retail_percent: num(retailPercent),
            showroom_percent: num(showroomPercent),
            wholesale_price: wholesalePrice,
            retail_price: retailPrice,
            showroom_price: showroomPrice,
          },
        ])
        .select();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [
    productType, materialType, modelNumber, width, length,
    sheetCost, pipeCost, topType, topCost, graniteColor,
    seatType, seatCost, finishType, finishCost, coatingColor,
    labourCost, weldingCost, electricityCost, machineCost,
    totalCost, wholesalePercent, retailPercent, showroomPercent,
    wholesalePrice, retailPrice, showroomPrice,
  ]);

  return {
    // Product Details
    productType, setProductType,
    materialType, setMaterialType,
    modelNumber, setModelNumber,
    // Size
    width, setWidth,
    length, setLength,
    // Cost Inputs
    sheetCost, setSheetCost,
    pipeCost, setPipeCost,
    // Top
    topType, setTopType,
    topCost, setTopCost,
    graniteColor, setGraniteColor,
    // Seating
    seatType, setSeatType,
    seatCost, setSeatCost,
    // Finishing
    finishType, setFinishType,
    finishCost, setFinishCost,
    coatingColor, setCoatingColor,
    // Labour
    labourCost, setLabourCost,
    weldingCost, setWeldingCost,
    electricityCost, setElectricityCost,
    machineCost, setMachineCost,
    // Profit
    wholesalePercent, setWholesalePercent,
    retailPercent, setRetailPercent,
    showroomPercent, setShowroomPercent,
    // Custom Price
    customPrice, setCustomPrice,
    // Derived
    totalCost,
    wholesalePrice,
    retailPrice,
    showroomPrice,
    priceStatus,
    // Save
    saveProduct,
    saving,
  };
}
