"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase.js";

export function usePricing() {
  // Edit mode
  const [editId, setEditId] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Product Details
  const [productType, setProductType] = useState("chair");
  const [materialType, setMaterialType] = useState("ss");
  const [modelNumber, setModelNumber] = useState("");

  // Pipes and Image Details (Saved in LocalStorage)
  const [pipes, setPipes] = useState([]);
  const [image, setImage] = useState(null);

  // Size Configuration
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");

  // Cost Inputs
  const [sheetCost, setSheetCost] = useState("");
  const [pipeCost, setPipeCost] = useState("");
  const [totalPipeWeight, setTotalPipeWeight] = useState("");
  const [ssPricePerKg, setSsPricePerKg] = useState("260");
  const [msPricePerKg, setMsPricePerKg] = useState("120");

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

  // Profit Percentages (SS)
  const [ssWholesalePercent, setSsWholesalePercent] = useState("15");
  const [ssRetailPercent, setSsRetailPercent] = useState("25");
  const [ssShowroomPercent, setSsShowroomPercent] = useState("45");

  // Profit Percentages (MS)
  const [msWholesalePercent, setMsWholesalePercent] = useState("12");
  const [msRetailPercent, setMsRetailPercent] = useState("20");
  const [msShowroomPercent, setMsShowroomPercent] = useState("28");

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
    setTotalPipeWeight(toStr(data.total_pipe_weight));
    setSsPricePerKg(toStr(data.ss_price_per_kg));
    setMsPricePerKg(toStr(data.ms_price_per_kg));
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
    setSsWholesalePercent(toStr(data.ss_wholesale_percent) || "15");
    setSsRetailPercent(toStr(data.ss_retail_percent) || "25");
    setSsShowroomPercent(toStr(data.ss_showroom_percent) || "45");
    setMsWholesalePercent(toStr(data.ms_wholesale_percent) || "12");
    setMsRetailPercent(toStr(data.ms_retail_percent) || "20");
    setMsShowroomPercent(toStr(data.ms_showroom_percent) || "28");

    // Load LocalStorage items
    try {
      const storedPipes = localStorage.getItem(`product_pipes_${data.id}`);
      if (storedPipes) {
        setPipes(JSON.parse(storedPipes));
      } else {
        setPipes([]);
      }
    } catch (e) {
      console.error("Failed to load pipes from localStorage", e);
      setPipes([]);
    }

    try {
      const storedImage = localStorage.getItem(`product_image_${data.id}`);
      setImage(storedImage || null);
    } catch (e) {
      console.error("Failed to load image from localStorage", e);
      setImage(null);
    }

    setLoadingProduct(false);
    return { success: true };
  }, []);

  // Auto-calculate Total Pipe Weight from pipes array
  useEffect(() => {
    if (pipes && pipes.length > 0) {
      const density = materialType === "ms" ? 7.85 : 7.95;
      const wt = pipes.reduce((sum, row) => {
        const wtVal = parseFloat(row.thickness) || 0;
        const lenVal = parseFloat(row.length) || 0;
        if (!wtVal || !lenVal) return sum;
        
        let rowWeight = 0;
        if (row.shape === "sheet") {
          const w = parseFloat(row.width) || 0;
          rowWeight = (w * 0.0265) * (lenVal * 0.0265) * (wtVal / 1000) * density * 1000;
        } else if (row.shape === "round") {
          const od = (parseFloat(row.size) || 0) * 25.4;
          const id = od - 2 * wtVal;
          const crossSectionArea = (Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2))) / 1000000;
          rowWeight = crossSectionArea * density * 1000 * (lenVal * 0.0254);
        } else if (row.shape === "square") {
          const side = (parseFloat(row.size) || 0) * 25.4;
          const innerSide = side - 2 * wtVal;
          const crossSectionArea = (Math.pow(side, 2) - Math.pow(innerSide, 2)) / 1000000;
          rowWeight = crossSectionArea * density * 1000 * (lenVal * 0.0254);
        } else if (row.shape === "rectangular") {
          const w = (parseFloat(row.width) || 0) * 25.4;
          const h = (parseFloat(row.height) || 0) * 25.4;
          const innerWidth = w - 2 * wtVal;
          const innerHeight = h - 2 * wtVal;
          const crossSectionArea = (w * h - innerWidth * innerHeight) / 1000000;
          rowWeight = crossSectionArea * density * 1000 * (lenVal * 0.0254);
        }
        
        const qty = parseFloat(row.quantity) || 0;
        return sum + (rowWeight * qty);
      }, 0);
      
      setTotalPipeWeight(wt > 0 ? wt.toFixed(2) : "");
    }
  }, [pipes, materialType]);

  // Auto-calculate Pipe Cost based on active material type
  const ssPipeCost = useMemo(() => {
    const w = num(totalPipeWeight);
    const r = num(ssPricePerKg);
    return w > 0 && r > 0 ? w * r : 0;
  }, [totalPipeWeight, ssPricePerKg]);

  const msPipeCost = useMemo(() => {
    const w = num(totalPipeWeight);
    const r = num(msPricePerKg);
    return w > 0 && r > 0 ? w * r : 0;
  }, [totalPipeWeight, msPricePerKg]);

  // Auto-fill pipeCost from active material selection
  useEffect(() => {
    if (num(totalPipeWeight) > 0) {
      if (materialType === "ss" && num(ssPricePerKg) > 0) {
        setPipeCost(ssPipeCost.toFixed(2));
      } else if (materialType === "ms" && num(msPricePerKg) > 0) {
        setPipeCost(msPipeCost.toFixed(2));
      }
    } else {
      setPipeCost("");
    }
  }, [totalPipeWeight, ssPricePerKg, msPricePerKg, materialType, ssPipeCost, msPipeCost]);

  // Helper: compute total cost for a given pipe cost
  const computeTotal = (pipeCostVal) => {
    return (
      pipeCostVal +
      num(sheetCost) +
      num(topCost) +
      num(seatCost) +
      num(finishCost) +
      num(labourCost) +
      num(weldingCost) +
      num(electricityCost) +
      num(machineCost)
    );
  };
  // Derived calculations
  const totalCost = useMemo(() => computeTotal(num(pipeCost)),
    [pipeCost, sheetCost, topCost, seatCost, finishCost, labourCost, weldingCost, electricityCost, machineCost]);

  // SS Total
  const ssTotalCost = useMemo(() => {
    const ssPipe = ssPipeCost > 0 ? ssPipeCost : num(pipeCost);
    return computeTotal(ssPipe);
  }, [ssPipeCost, pipeCost, sheetCost, topCost, seatCost, finishCost, labourCost, weldingCost, electricityCost, machineCost]);

  // MS Total
  const msTotalCost = useMemo(() => {
    const msPipe = msPipeCost > 0 ? msPipeCost : num(pipeCost);
    return computeTotal(msPipe);
  }, [msPipeCost, pipeCost, sheetCost, topCost, seatCost, finishCost, labourCost, weldingCost, electricityCost, machineCost]);

  // Helper for tier pricing
  const tierPrice = (total, pct) => total + total * (num(pct) / 100);

  // General total pricing (uses SS percentages as default)
  const wholesalePrice = useMemo(() => tierPrice(totalCost, ssWholesalePercent), [totalCost, ssWholesalePercent]);
  const retailPrice = useMemo(() => tierPrice(totalCost, ssRetailPercent), [totalCost, ssRetailPercent]);
  const showroomPrice = useMemo(() => tierPrice(totalCost, ssShowroomPercent), [totalCost, ssShowroomPercent]);

  // SS Tier pricing
  const ssWholesalePrice = useMemo(() => tierPrice(ssTotalCost, ssWholesalePercent), [ssTotalCost, ssWholesalePercent]);
  const ssRetailPrice = useMemo(() => tierPrice(ssTotalCost, ssRetailPercent), [ssTotalCost, ssRetailPercent]);
  const ssShowroomPrice = useMemo(() => tierPrice(ssTotalCost, ssShowroomPercent), [ssTotalCost, ssShowroomPercent]);

  // MS Tier pricing
  const msWholesalePrice = useMemo(() => tierPrice(msTotalCost, msWholesalePercent), [msTotalCost, msWholesalePercent]);
  const msRetailPrice = useMemo(() => tierPrice(msTotalCost, msRetailPercent), [msTotalCost, msRetailPercent]);
  const msShowroomPrice = useMemo(() => tierPrice(msTotalCost, msShowroomPercent), [msTotalCost, msShowroomPercent]);

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
    total_pipe_weight: num(totalPipeWeight),
    ss_price_per_kg: num(ssPricePerKg),
    ms_price_per_kg: num(msPricePerKg),
    ss_pipe_cost: ssPipeCost,
    ms_pipe_cost: msPipeCost,
    ss_total_cost: ssTotalCost,
    ms_total_cost: msTotalCost,
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
    ss_wholesale_percent: num(ssWholesalePercent),
    ss_retail_percent: num(ssRetailPercent),
    ss_showroom_percent: num(ssShowroomPercent),
    ms_wholesale_percent: num(msWholesalePercent),
    ms_retail_percent: num(msRetailPercent),
    ms_showroom_percent: num(msShowroomPercent),
    wholesale_price: wholesalePrice,
    retail_price: retailPrice,
    showroom_price: showroomPrice,
  });

  // Save (insert) or Update product
  const saveProduct = useCallback(async () => {
    if (!supabase) {
      return { success: false, error: "Supabase not configured. Please add your credentials to .env.local and restart the server." };
    }
    if (totalCost <= 0 && ssTotalCost <= 0 && msTotalCost <= 0) {
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

      // Save LocalStorage items
      const savedId = result.data?.[0]?.id || editId;
      if (savedId) {
        try {
          localStorage.setItem(`product_pipes_${savedId}`, JSON.stringify(pipes));
          if (image) {
            localStorage.setItem(`product_image_${savedId}`, image);
          } else {
            localStorage.removeItem(`product_image_${savedId}`);
          }
        } catch (e) {
          console.error("Failed to save pipes/image to localStorage", e);
        }
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
    totalCost, ssTotalCost, msTotalCost,
    ssPricePerKg, msPricePerKg, ssPipeCost, msPipeCost,
    totalPipeWeight,
    ssWholesalePercent, ssRetailPercent, ssShowroomPercent,
    msWholesalePercent, msRetailPercent, msShowroomPercent,
    wholesalePrice, retailPrice, showroomPrice,
    pipes, image,
  ]);

  // Reset Form
  const resetForm = useCallback(() => {
    setEditId(null);
    setProductType("chair");
    setMaterialType("ss");
    setModelNumber("");
    setWidth("");
    setLength("");
    setSheetCost("");
    setPipeCost("");
    setTotalPipeWeight("");
    setSsPricePerKg("260");
    setMsPricePerKg("120");
    setTopType("steel");
    setTopCost("");
    setGraniteColor("black");
    setSeatType("cushion");
    setSeatCost("");
    setFinishType("polish");
    setFinishCost("");
    setCoatingColor("black");
    setLabourCost("");
    setWeldingCost("");
    setElectricityCost("");
    setMachineCost("");
    setSsWholesalePercent("15");
    setSsRetailPercent("25");
    setSsShowroomPercent("45");
    setMsWholesalePercent("12");
    setMsRetailPercent("20");
    setMsShowroomPercent("28");
    setCustomPrice("");
    setPipes([]);
    setImage(null);
  }, []);

  return {
    // Edit mode
    editId,
    loadProduct,
    loadingProduct,
    resetForm,
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
    totalPipeWeight, setTotalPipeWeight,
    ssPricePerKg, setSsPricePerKg,
    msPricePerKg, setMsPricePerKg,
    ssPipeCost,
    msPipeCost,
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
    ssWholesalePercent, setSsWholesalePercent,
    ssRetailPercent, setSsRetailPercent,
    ssShowroomPercent, setSsShowroomPercent,
    msWholesalePercent, setMsWholesalePercent,
    msRetailPercent, setMsRetailPercent,
    msShowroomPercent, setMsShowroomPercent,
    // Custom Price
    customPrice, setCustomPrice,
    // Pipes & Image
    pipes, setPipes,
    image, setImage,
    // Derived
    totalCost,
    ssTotalCost,
    msTotalCost,
    wholesalePrice,
    retailPrice,
    showroomPrice,
    ssWholesalePrice, ssRetailPrice, ssShowroomPrice,
    msWholesalePrice, msRetailPrice, msShowroomPrice,
    priceStatus,
    // Save
    saveProduct,
    saving,
  };
}
