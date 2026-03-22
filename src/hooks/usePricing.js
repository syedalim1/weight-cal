"use client";
import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase.js";

export function usePricing() {
  // Edit mode
  const [editId, setEditId] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

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

  // Convert DB value to form string (keep empty if 0)
  const toStr = (v) => (v === null || v === undefined || v === 0 ? "" : String(v));

  // Load a product by ID for editing
  const loadProduct = useCallback(async (id) => {
    if (!supabase || !id) return;
    setLoadingProduct(true);

    const { data, error } = await supabase
      .from("product_pricing")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoadingProduct(false);
      return { success: false, error: error?.message || "Product not found" };
    }

    setEditId(data.id);
    setProductType(data.product_type || "chair");
    setMaterialType(data.material_type || "ss");
    setModelNumber(data.model_number || "");
    setWidth(toStr(data.width));
    setLength(toStr(data.length));
    setSheetCost(toStr(data.sheet_cost));
    setPipeCost(toStr(data.pipe_cost));
    setTopType(data.top_type || "steel");
    setTopCost(toStr(data.top_cost));
    setGraniteColor(data.granite_color || "black");
    setSeatType(data.seat_type || "cushion");
    setSeatCost(toStr(data.seat_cost));
    setFinishType(data.finish_type || "polish");
    setFinishCost(toStr(data.finish_cost));
    setCoatingColor(data.coating_color || "black");
    setLabourCost(toStr(data.labour_cost));
    setWeldingCost(toStr(data.welding_cost));
    setElectricityCost(toStr(data.electricity_cost));
    setMachineCost(toStr(data.machine_cost));
    setWholesalePercent(toStr(data.wholesale_percent) || "10");
    setRetailPercent(toStr(data.retail_percent) || "20");
    setShowroomPercent(toStr(data.showroom_percent) || "35");

    setLoadingProduct(false);
    return { success: true };
  }, []);

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

  // Build the row data object
  const buildRow = () => ({
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
  });

  // Save (insert) or Update product
  const saveProduct = useCallback(async () => {
    if (!supabase) {
      return { success: false, error: "Supabase not configured. Please add your credentials to .env.local and restart the server." };
    }
    if (totalCost <= 0) {
      return { success: false, error: "Total cost must be greater than 0" };
    }

    setSaving(true);
    try {
      const row = buildRow();
      let result;

      if (editId) {
        // Update existing
        result = await supabase
          .from("product_pricing")
          .update(row)
          .eq("id", editId)
          .select();
      } else {
        // Insert new
        result = await supabase
          .from("product_pricing")
          .insert([row])
          .select();
      }

      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true, data: result.data, isUpdate: !!editId };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [
    editId,
    productType, materialType, modelNumber, width, length,
    sheetCost, pipeCost, topType, topCost, graniteColor,
    seatType, seatCost, finishType, finishCost, coatingColor,
    labourCost, weldingCost, electricityCost, machineCost,
    totalCost, wholesalePercent, retailPercent, showroomPercent,
    wholesalePrice, retailPrice, showroomPrice,
  ]);

  return {
    // Edit mode
    editId,
    loadProduct,
    loadingProduct,
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
