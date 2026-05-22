"use client";
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Plus, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";

// Standard configurations matching useTubes.js
const standardSizes = {
  round: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  square: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "2.5", "3.0"],
  rectangular: ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"],
  sheet: ["12", "24", "36", "48", "60", "72"],
};

const thicknessOptions = {
  tube: ["1.0", "1.2", "1.5", "2.0", "3.0"],
  sheet: ["0.5", "0.8", "1.0", "1.5", "2.0", "3.0", "4.0", "5.0", "6.0"],
};

const getMaterialDensity = (material) => {
  return material === "ms" ? 7.85 : 7.95; // carbon steel (MS) = 7.85, stainless steel (SS) = 7.95
};

export const calculateRowWeight = (row, material = "ss") => {
  const density = getMaterialDensity(material);
  const wt = parseFloat(row.thickness) || 0;
  const len = parseFloat(row.length) || 0;
  
  if (!wt || !len) return 0;

  let weightPerUnit = 0;

  if (row.shape === "sheet") {
    const w = parseFloat(row.width) || 0;
    const sheetWidth = w * 0.0265;
    const sheetLength = len * 0.0265;
    const sheetThickness = wt / 1000;
    const volume = sheetWidth * sheetLength * sheetThickness;
    weightPerUnit = volume * density * 1000;
  } else if (row.shape === "round") {
    const od = (parseFloat(row.size) || 0) * 25.4;
    const id = od - 2 * wt;
    const crossSectionArea = (Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2))) / 1000000;
    const tubeLength = len * 0.0254;
    weightPerUnit = crossSectionArea * density * 1000 * tubeLength;
  } else if (row.shape === "square") {
    const side = (parseFloat(row.size) || 0) * 25.4;
    const innerSide = side - 2 * wt;
    const crossSectionArea = (Math.pow(side, 2) - Math.pow(innerSide, 2)) / 1000000;
    const tubeLength = len * 0.0254;
    weightPerUnit = crossSectionArea * density * 1000 * tubeLength;
  } else if (row.shape === "rectangular") {
    const w = (parseFloat(row.width) || 0) * 25.4;
    const h = (parseFloat(row.height) || 0) * 25.4;
    const innerWidth = w - 2 * wt;
    const innerHeight = h - 2 * wt;
    const crossSectionArea = (w * h - innerWidth * innerHeight) / 1000000;
    const tubeLength = len * 0.0254;
    weightPerUnit = crossSectionArea * density * 1000 * tubeLength;
  }

  return weightPerUnit;
};

export default function PipeTable({
  pipes = [],
  onChange,
  pricePerKg = 260,
  material = "ss", // ss or ms
}) {
  const tableRef = useRef(null);

  // Initialize with at least one row if empty
  useEffect(() => {
    if (pipes.length === 0) {
      addDefaultRow();
    }
  }, [pipes]);

  const addDefaultRow = () => {
    const newRow = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: "",
      shape: "round",
      size: "1.0",
      width: "",
      height: "",
      thickness: "1.5",
      length: "",
      quantity: "1",
    };
    onChange([...pipes, newRow]);
  };

  const updateRow = (id, field, value) => {
    const updated = pipes.map((row) => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value };
        // Reset specific fields when shape changes
        if (field === "shape") {
          newRow.size = value === "round" || value === "square" ? "1.0" : "";
          newRow.width = value === "rectangular" ? "1.0" : value === "sheet" ? "48" : "";
          newRow.height = value === "rectangular" ? "1.0" : "";
          newRow.thickness = value === "sheet" ? "1.0" : "1.5";
        }
        return newRow;
      }
      return row;
    });
    onChange(updated);
  };

  const deleteRow = (id) => {
    if (pipes.length === 1) {
      toast.error("At least one row is required.");
      return;
    }
    onChange(pipes.filter((row) => row.id !== id));
  };

  const duplicateRow = (row) => {
    const duplicate = {
      ...row,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: row.name ? `${row.name} (Copy)` : "Copy",
    };
    const index = pipes.findIndex((r) => r.id === row.id);
    const newPipes = [...pipes];
    newPipes.splice(index + 1, 0, duplicate);
    onChange(newPipes);
    toast.success("Row duplicated");
  };

  // Keyboard navigation helpers
  const handleKeyDown = (e, rowIndex, colName) => {
    const cellClass = `[data-row="${rowIndex}"][data-col="${colName}"]`;
    
    // Alt+N shortcut to add a new row
    if (e.altKey && e.key.toLowerCase() === "n") {
      e.preventDefault();
      addDefaultRow();
      setTimeout(() => {
        // Focus first cell of new row
        const newRowIndex = pipes.length;
        const firstInput = tableRef.current?.querySelector(`[data-row="${newRowIndex}"][data-col="name"]`);
        if (firstInput) firstInput.focus();
      }, 50);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      // Move to same cell in next row
      const nextInput = tableRef.current?.querySelector(`[data-row="${rowIndex + 1}"][data-col="${colName}"]`);
      if (nextInput) {
        nextInput.focus();
      } else {
        // We're at the last row, add a new row!
        addDefaultRow();
        setTimeout(() => {
          const newRowInput = tableRef.current?.querySelector(`[data-row="${rowIndex + 1}"][data-col="${colName}"]`);
          if (newRowInput) newRowInput.focus();
        }, 50);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = tableRef.current?.querySelector(`[data-row="${rowIndex + 1}"][data-col="${colName}"]`);
      if (nextInput) nextInput.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = tableRef.current?.querySelector(`[data-row="${rowIndex - 1}"][data-col="${colName}"]`);
      if (prevInput) prevInput.focus();
    } else if (e.key === "Tab") {
      // Auto add row if tabbing on the duplicate/delete of the last row
      if (rowIndex === pipes.length - 1 && colName === "qty" && !e.shiftKey) {
        // Don't prevent default tab behavior yet, let it tab to add button if desired, OR auto-add row:
        // We can just let tab flow, but if they tab out of quantity, maybe let it hit duplicate, then delete.
      }
    }
  };

  // Summaries
  const totalWeight = pipes.reduce((sum, row) => {
    const w = calculateRowWeight(row, material);
    const qty = parseFloat(row.quantity) || 0;
    return sum + (w * qty);
  }, 0);

  const totalCost = totalWeight * pricePerKg;

  return (
    <div className="space-y-4">
      {/* Spreadsheet Container */}
      <div className="w-full overflow-x-auto border border-white/10 rounded-lg bg-zinc-950/80 steel-scrollbar">
        <table ref={tableRef} className="w-full border-collapse text-sm text-left text-zinc-300 min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[11px] tracking-wider h-10">
              <th className="px-3 py-0 w-12 text-center align-middle">#</th>
              <th className="px-3 py-0 w-48 align-middle">Pipe/Part Name</th>
              <th className="px-3 py-0 w-32 align-middle">Shape</th>
              <th className="px-3 py-0 w-44 align-middle">Dimensions (Inch)</th>
              <th className="px-3 py-0 w-28 align-middle">Thickness</th>
              <th className="px-3 py-0 w-28 align-middle">Length (In)</th>
              <th className="px-3 py-0 w-24 align-middle">Qty</th>
              <th className="px-3 py-0 w-28 text-right align-middle">Weight (Kg)</th>
              <th className="px-3 py-0 w-28 text-right align-middle">Cost (₹)</th>
              <th className="px-3 py-0 w-24 text-center align-middle">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {pipes.map((row, index) => {
              const rowWeight = calculateRowWeight(row, material);
              const qty = parseFloat(row.quantity) || 0;
              const rowTotalWeight = rowWeight * qty;
              const rowCost = rowTotalWeight * pricePerKg;

              return (
                <tr key={row.id} className="spreadsheet-row group align-middle h-10">
                  {/* Row index */}
                  <td className="px-2 py-0 text-center text-zinc-500 font-mono text-xs h-10 align-middle">{index + 1}</td>
                  
                  {/* Name */}
                  <td className="p-0 border-r border-white/5 h-10">
                    <input
                      type="text"
                      className="spreadsheet-input text-zinc-200 h-10"
                      placeholder="e.g. Legs"
                      value={row.name}
                      data-row={index}
                      data-col="name"
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, "name")}
                    />
                  </td>

                  {/* Shape */}
                  <td className="p-0 border-r border-white/5 h-10">
                    <select
                      className="spreadsheet-input text-zinc-300 bg-zinc-950/40 font-medium capitalize h-10 w-full focus:bg-zinc-900/60 px-2.5 cursor-pointer border-0"
                      value={row.shape}
                      onChange={(e) => updateRow(row.id, "shape", e.target.value)}
                    >
                      <option value="round" className="bg-zinc-950 text-white">Round Pipe</option>
                      <option value="square" className="bg-zinc-950 text-white">Square Pipe</option>
                      <option value="rectangular" className="bg-zinc-950 text-white">Rectangular</option>
                      <option value="sheet" className="bg-zinc-950 text-white">Sheet Metal</option>
                    </select>
                  </td>

                  {/* Dynamic Dimension Inputs */}
                  <td className="p-0 border-r border-white/5 h-10">
                    <div className="flex items-stretch h-10 w-full">
                      {(row.shape === "round" || row.shape === "square") && (
                        <div className="flex w-full items-stretch h-10">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="Size"
                            className="spreadsheet-input text-zinc-200 font-mono h-10 flex-1 min-w-0 border-0"
                            value={row.size}
                            data-row={index}
                            data-col="size"
                            onChange={(e) => updateRow(row.id, "size", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, "size")}
                          />
                          {/* Standard sizing helper dropdown */}
                          <select
                            className="h-10 border-l border-white/5 bg-zinc-900/30 text-zinc-400 text-xs px-1.5 focus:outline-none focus:bg-zinc-900/60 cursor-pointer border-y-0 border-r-0"
                            value={row.size}
                            onChange={(e) => updateRow(row.id, "size", e.target.value)}
                          >
                            <option value="" className="bg-zinc-950">Std</option>
                            {standardSizes[row.shape]?.map((std) => (
                              <option key={std} value={std} className="bg-zinc-950 text-white">{std}"</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {row.shape === "rectangular" && (
                        <div className="flex w-full items-stretch h-10 divide-x divide-white/5">
                          <div className="flex items-stretch flex-1">
                            <input
                              type="number"
                              step="any"
                              placeholder="W"
                              className="spreadsheet-input text-zinc-200 font-mono text-center h-10 flex-1 min-w-0 border-0"
                              value={row.width}
                              data-row={index}
                              data-col="width"
                              onChange={(e) => updateRow(row.id, "width", e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, "width")}
                            />
                            <select
                              className="h-10 bg-zinc-900/30 text-zinc-500 text-[10px] px-1 focus:outline-none focus:bg-zinc-900/60 cursor-pointer border-0"
                              value={row.width}
                              onChange={(e) => updateRow(row.id, "width", e.target.value)}
                            >
                              <option value="" className="bg-zinc-950">W</option>
                              {standardSizes.rectangular.map((std) => (
                                <option key={std} value={std} className="bg-zinc-950 text-white">{std}"</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-stretch flex-1">
                            <input
                              type="number"
                              step="any"
                              placeholder="H"
                              className="spreadsheet-input text-zinc-200 font-mono text-center h-10 flex-1 min-w-0 border-0"
                              value={row.height}
                              data-row={index}
                              data-col="height"
                              onChange={(e) => updateRow(row.id, "height", e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, "height")}
                            />
                            <select
                              className="h-10 bg-zinc-900/30 text-zinc-500 text-[10px] px-1 focus:outline-none focus:bg-zinc-900/60 cursor-pointer border-0"
                              value={row.height}
                              onChange={(e) => updateRow(row.id, "height", e.target.value)}
                            >
                              <option value="" className="bg-zinc-950">H</option>
                              {standardSizes.rectangular.map((std) => (
                                <option key={std} value={std} className="bg-zinc-950 text-white">{std}"</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      {row.shape === "sheet" && (
                        <div className="flex w-full items-stretch h-10">
                          <input
                            type="number"
                            step="any"
                            placeholder="Width"
                            className="spreadsheet-input text-zinc-200 font-mono h-10 flex-1 min-w-0 border-0"
                            value={row.width}
                            data-row={index}
                            data-col="width"
                            onChange={(e) => updateRow(row.id, "width", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, "width")}
                          />
                          <select
                            className="h-10 border-l border-white/5 bg-zinc-900/30 text-zinc-400 text-xs px-1.5 focus:outline-none focus:bg-zinc-900/60 cursor-pointer border-y-0 border-r-0"
                            value={row.width}
                            onChange={(e) => updateRow(row.id, "width", e.target.value)}
                          >
                            <option value="" className="bg-zinc-950">Width</option>
                            {standardSizes.sheet.map((std) => (
                              <option key={std} value={std} className="bg-zinc-950 text-white">{std}"</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Thickness */}
                  <td className="p-0 border-r border-white/5 h-10">
                    <div className="flex w-full items-stretch h-10">
                      <input
                        type="number"
                        step="any"
                        placeholder="Thick"
                        className="spreadsheet-input text-zinc-200 font-mono h-10 flex-1 min-w-0 border-0"
                        value={row.thickness}
                        data-row={index}
                        data-col="thickness"
                        onChange={(e) => updateRow(row.id, "thickness", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "thickness")}
                      />
                      <select
                        className="h-10 border-l border-white/5 bg-zinc-900/30 text-zinc-400 text-xs px-1.5 focus:outline-none focus:bg-zinc-900/60 cursor-pointer border-y-0 border-r-0"
                        value={row.thickness}
                        onChange={(e) => updateRow(row.id, "thickness", e.target.value)}
                      >
                        <option value="" className="bg-zinc-950">mm</option>
                        {(row.shape === "sheet" ? thicknessOptions.sheet : thicknessOptions.tube).map((std) => (
                          <option key={std} value={std} className="bg-zinc-950 text-white">{std} mm</option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Length */}
                  <td className="p-0 border-r border-white/5 h-10">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="spreadsheet-input text-zinc-200 font-mono h-10 border-0"
                      placeholder="Length"
                      value={row.length}
                      data-row={index}
                      data-col="length"
                      onChange={(e) => updateRow(row.id, "length", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, "length")}
                    />
                  </td>

                  {/* Quantity */}
                  <td className="p-0 border-r border-white/5 h-10">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="spreadsheet-input text-zinc-200 font-mono text-center h-10 border-0"
                      value={row.quantity}
                      data-row={index}
                      data-col="qty"
                      onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, "qty")}
                    />
                  </td>

                  {/* Calculated Weight */}
                  <td className="px-3 text-right font-mono text-zinc-300 font-medium tabular-nums bg-white/[0.01] border-r border-white/5 h-10 align-middle">
                    {rowTotalWeight > 0 ? rowTotalWeight.toFixed(2) : "0.00"}
                  </td>

                  {/* Calculated Cost */}
                  <td className="px-3 text-right font-mono text-zinc-400 font-semibold tabular-nums bg-white/[0.02] border-r border-white/5 h-10 align-middle">
                    {rowCost > 0 ? `₹${rowCost.toLocaleString("en-IN", { maximumFractionDigits: 1 })}` : "₹0.0"}
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-0 text-center h-10 align-middle">
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => duplicateRow(row)}
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                        title="Duplicate Row"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4 items-center justify-between pt-1">
        <Button
          type="button"
          onClick={addDefaultRow}
          className="bg-zinc-900/60 border border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-all font-mono text-xs uppercase tracking-wider h-8 px-4 shadow-sm shadow-black/20"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Pipe Row
        </Button>
        
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono tracking-wide">
          <CornerDownLeft className="h-3 w-3 text-zinc-600" />
          <span>Press <span className="bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[9px] uppercase">Enter</span> to navigate/add row, or <span className="bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[9px] uppercase">Alt + N</span></span>
        </div>
      </div>
    </div>
  );
}
