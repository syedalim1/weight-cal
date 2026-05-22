import jsPDF from "jspdf";

export function exportPricingQuote(product, pipes = [], image = null) {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = 15;

    // Helper: Draw text with automatic sizing and alignments
    const printText = (text, x, yPos, options = {}) => {
      const { size = 10, style = "normal", color = "#27272a", align = "left" } = options;
      pdf.setFont("helvetica", style);
      pdf.setFontSize(size);
      
      // Parse hex color to RGB
      if (color.startsWith("#")) {
        const hex = color.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        pdf.setTextColor(r, g, b);
      } else {
        pdf.setTextColor(39, 39, 42); // zinc-800 default
      }
      
      pdf.text(String(text), x, yPos, { align });
    };

    // Helper: Draw horizontal line
    const drawLine = (x1, yPos, x2, color = "#e4e4e7", width = 0.2) => {
      pdf.setDrawColor(color);
      pdf.setLineWidth(width);
      pdf.line(x1, yPos, x2, yPos);
    };

    // Helper: format currency
    const fmt = (val) => {
      const num = parseFloat(val) || 0;
      return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 1 });
    };

    // Helper: format weight
    const fmtWt = (val) => {
      const num = parseFloat(val) || 0;
      return num.toFixed(2) + " kg";
    };

    // Title / Company Header
    printText("STEEL FURNITURE QUOTATION", margin, y, { size: 16, style: "bold", color: "#18181b" });
    printText("Factory Costing & Pricing Spec Sheet", margin, y + 5, { size: 9, style: "normal", color: "#71717a" });
    
    // Date
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    printText(`Date: ${todayStr}`, pageWidth - margin, y + 2, { size: 9, style: "normal", color: "#71717a", align: "right" });

    drawLine(margin, y + 9, pageWidth - margin, "#18181b", 0.5);
    y += 15;

    // Header Metadata & Product Image Side-by-side
    const metaRightEdge = image ? 130 : pageWidth - margin;
    
    // Left column: Product Metadata
    printText("PRODUCT PROFILE", margin, y, { size: 9, style: "bold", color: "#71717a" });
    y += 5;
    
    const labelX = margin;
    const valueX = margin + 35;
    
    const metadataRows = [
      ["Model Number:", product.model_number || "N/A"],
      ["Product Category:", (product.product_type || "Furniture").toUpperCase()],
      ["Material Build:", product.material_type === "ss" ? "Stainless Steel (SS)" : "Mild Steel (MS)"],
      ["Dimensions (W x L):", product.width && product.length ? `${product.width}" × ${product.length}"` : "Custom Dimensions"],
      ["Total Calculated Weight:", fmtWt(product.total_pipe_weight)],
    ];

    metadataRows.forEach(([lbl, val]) => {
      printText(lbl, labelX, y, { size: 9.5, style: "bold", color: "#3f3f46" });
      printText(val, valueX, y, { size: 9.5, style: "normal", color: "#18181b" });
      y += 5;
    });

    // Right column: Product Image (if provided)
    if (image) {
      const imgSize = 32;
      const imgX = pageWidth - margin - imgSize;
      const imgY = y - 30; // Align with metadata
      try {
        pdf.setFillColor(250, 250, 250);
        pdf.setDrawColor(228, 228, 231);
        pdf.roundedRect(imgX - 2, imgY - 2, imgSize + 4, imgSize + 4, 1, 1, "FD");
        pdf.addImage(image, "JPEG", imgX, imgY, imgSize, imgSize);
      } catch (err) {
        console.error("Could not embed image in PDF: ", err);
      }
    }

    y += 4;
    drawLine(margin, y, pageWidth - margin, "#e4e4e7", 0.3);
    y += 6;

    // PIPES SPECIFICATION TABLE (Only show if pipes are provided)
    if (pipes.length > 0) {
      printText("PIPE & RAW MATERIAL SPECIFICATIONS", margin, y, { size: 9, style: "bold", color: "#71717a" });
      y += 5;

      // Table Header
      const colWidths = { idx: 8, name: 45, shape: 22, size: 28, thick: 20, len: 17, qty: 10, wt: 15, cost: 15 };
      const colX = {
        idx: margin,
        name: margin + 8,
        shape: margin + 53,
        size: margin + 75,
        thick: margin + 103,
        len: margin + 123,
        qty: margin + 140,
        wt: margin + 150,
        cost: margin + 165
      };

      // Header background
      pdf.setFillColor(244, 244, 245);
      pdf.rect(margin, y - 4, pageWidth - (margin * 2), 6, "F");

      printText("#", colX.idx, y, { size: 7.5, style: "bold", color: "#71717a" });
      printText("Part Name", colX.name, y, { size: 7.5, style: "bold", color: "#71717a" });
      printText("Shape", colX.shape, y, { size: 7.5, style: "bold", color: "#71717a" });
      printText("Dimensions", colX.size, y, { size: 7.5, style: "bold", color: "#71717a" });
      printText("Thick (mm)", colX.thick, y, { size: 7.5, style: "bold", color: "#71717a" });
      printText("Len (In)", colX.len, y, { size: 7.5, style: "bold", color: "#71717a" });
      printText("Qty", colX.qty, y, { size: 7.5, style: "bold", color: "#71717a", align: "center" });
      printText("Wt (kg)", colX.wt, y, { size: 7.5, style: "bold", color: "#71717a", align: "right" });
      printText("Cost (INR)", colX.cost, y, { size: 7.5, style: "bold", color: "#71717a", align: "right" });
      
      y += 4;
      drawLine(margin, y - 2, pageWidth - margin, "#a1a1aa", 0.3);

      // Rows
      pipes.forEach((row, i) => {
        // Page break if table hits near page bottom
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = 20;
          // Re-draw table header
          pdf.setFillColor(244, 244, 245);
          pdf.rect(margin, y - 4, pageWidth - (margin * 2), 6, "F");
          printText("#", colX.idx, y, { size: 7.5, style: "bold", color: "#71717a" });
          printText("Part/Pipe Name", colX.name, y, { size: 7.5, style: "bold", color: "#71717a" });
          printText("Shape", colX.shape, y, { size: 7.5, style: "bold", color: "#71717a" });
          printText("Dimensions", colX.size, y, { size: 7.5, style: "bold", color: "#71717a" });
          printText("Thick (mm)", colX.thick, y, { size: 7.5, style: "bold", color: "#71717a" });
          printText("Len (In)", colX.len, y, { size: 7.5, style: "bold", color: "#71717a" });
          printText("Qty", colX.qty, y, { size: 7.5, style: "bold", color: "#71717a", align: "center" });
          printText("Wt (kg)", colX.wt, y, { size: 7.5, style: "bold", color: "#71717a", align: "right" });
          printText("Cost (INR)", colX.cost, y, { size: 7.5, style: "bold", color: "#71717a", align: "right" });
          y += 4;
          drawLine(margin, y - 2, pageWidth - margin, "#a1a1aa", 0.3);
        }

        // Calculations per row
        const density = product.material_type === "ms" ? 7.85 : 7.95;
        const wt = parseFloat(row.thickness) || 0;
        const len = parseFloat(row.length) || 0;
        const qty = parseFloat(row.quantity) || 0;
        
        let rowWeight = 0;
        if (wt && len) {
          if (row.shape === "sheet") {
            const w = parseFloat(row.width) || 0;
            rowWeight = (w * 0.0265) * (len * 0.0265) * (wt / 1000) * density * 1000;
          } else if (row.shape === "round") {
            const od = (parseFloat(row.size) || 0) * 25.4;
            const id = od - 2 * wt;
            const crossSectionArea = (Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2))) / 1000000;
            rowWeight = crossSectionArea * density * 1000 * (len * 0.0254);
          } else if (row.shape === "square") {
            const side = (parseFloat(row.size) || 0) * 25.4;
            const innerSide = side - 2 * wt;
            const crossSectionArea = (Math.pow(side, 2) - Math.pow(innerSide, 2)) / 1000000;
            rowWeight = crossSectionArea * density * 1000 * (len * 0.0254);
          } else if (row.shape === "rectangular") {
            const w = (parseFloat(row.width) || 0) * 25.4;
            const h = (parseFloat(row.height) || 0) * 25.4;
            const innerWidth = w - 2 * wt;
            const innerHeight = h - 2 * wt;
            const crossSectionArea = (w * h - innerWidth * innerHeight) / 1000000;
            rowWeight = crossSectionArea * density * 1000 * (len * 0.0254);
          }
        }
        
        const rowTotalWt = rowWeight * qty;
        const ratePerKg = product.material_type === "ms" ? parseFloat(product.ms_price_per_kg) : parseFloat(product.ss_price_per_kg);
        const rowCost = rowTotalWt * (ratePerKg || 260);

        let dimLabel = "";
        if (row.shape === "rectangular") {
          dimLabel = `${row.width}"×${row.height}"`;
        } else if (row.shape === "sheet") {
          dimLabel = `Width: ${row.width}"`;
        } else {
          dimLabel = `${row.size}"`;
        }

        printText(i + 1, colX.idx, y, { size: 8, color: "#52525b" });
        printText(row.name || "Pipe Part", colX.name, y, { size: 8, style: "medium", color: "#18181b" });
        printText(row.shape.charAt(0).toUpperCase() + row.shape.slice(1), colX.shape, y, { size: 8, color: "#52525b" });
        printText(dimLabel, colX.size, y, { size: 8, color: "#52525b" });
        printText(row.thickness + " mm", colX.thick, y, { size: 8, color: "#52525b" });
        printText(row.length + '"', colX.len, y, { size: 8, color: "#52525b" });
        printText(row.quantity, colX.qty, y, { size: 8, color: "#18181b", align: "center" });
        printText(rowTotalWt > 0 ? rowTotalWt.toFixed(2) : "0.00", colX.wt, y, { size: 8, color: "#18181b", align: "right" });
        printText(rowCost > 0 ? rowCost.toFixed(0) : "0", colX.cost, y, { size: 8, color: "#18181b", align: "right" });

        y += 4.5;
        drawLine(margin, y - 1, pageWidth - margin, "#f4f4f5", 0.2);
      });

      y += 2;
    }

    // ITEMISED COST BREAKDOWN TABLE
    if (y > pageHeight - 75) {
      pdf.addPage();
      y = 20;
    }

    printText("COST & FABRICATION ITEMISATION", margin, y, { size: 9, style: "bold", color: "#71717a" });
    y += 5;

    // Define items to show
    const costBreakdown = [
      ["Raw Pipe Material Cost", fmt(product.pipe_cost)],
      ["Sheet Metal Cost", fmt(product.sheet_cost)],
      [`Top Selection (${product.top_type || "None"})`, fmt(product.top_cost)],
      [`Seating / Cushion Type`, fmt(product.seat_cost)],
      [`Finishing / Coating (${product.finish_type || "None"})`, fmt(product.finish_cost)],
      ["Labour Charge", fmt(product.labour_cost)],
      ["Welding Consumables", fmt(product.welding_cost)],
      ["Electricity / Power Cost", fmt(product.electricity_cost)],
      ["Machine & Setup Wear", fmt(product.machine_cost)],
    ];

    pdf.setFillColor(250, 250, 250);
    pdf.rect(margin, y - 2, pageWidth - (margin * 2), 48, "F");

    let subY = y + 2;
    costBreakdown.forEach(([label, costVal]) => {
      printText(label, margin + 4, subY, { size: 8, color: "#3f3f46" });
      printText(costVal, pageWidth - margin - 4, subY, { size: 8, style: "medium", color: "#18181b", align: "right" });
      subY += 4.5;
    });

    drawLine(margin + 4, subY - 1, pageWidth - margin - 4, "#d4d4d8", 0.3);
    subY += 4;
    printText("TOTAL BASE MANUFACTURING COST", margin + 4, subY, { size: 9, style: "bold", color: "#18181b" });
    printText(fmt(product.total_cost), pageWidth - margin - 4, subY, { size: 9.5, style: "bold", color: "#18181b", align: "right" });

    y = subY + 12;

    // PRICING TIERS
    if (y > pageHeight - 50) {
      pdf.addPage();
      y = 20;
    }

    printText("QUOTATION PRICING TIERS", margin, y, { size: 9, style: "bold", color: "#71717a" });
    y += 5;

    const isSS = product.material_type === "ss";
    const wholesalePrice = isSS ? product.ss_wholesale_price : product.ms_wholesale_price;
    const retailPrice = isSS ? product.ss_retail_price : product.ms_retail_price;
    const showroomPrice = isSS ? product.ss_showroom_price : product.ms_showroom_price;
    
    const wholesalePct = isSS ? product.ss_wholesale_percent : product.ms_wholesale_percent;
    const retailPct = isSS ? product.ss_retail_percent : product.ms_retail_percent;
    const showroomPct = isSS ? product.ss_showroom_percent : product.ms_showroom_percent;

    const cardWidth = 56;
    const cardGap = 6;
    const themeColor = isSS ? "#0ea5e9" : "#f97316"; // sky blue for SS, orange for MS
    const themeRGB = isSS ? [14, 165, 233] : [249, 115, 22];

    const drawPriceCard = (title, price, markup, startX) => {
      // Draw border card
      pdf.setFillColor(252, 252, 252);
      pdf.setDrawColor(themeRGB[0], themeRGB[1], themeRGB[2]);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(startX, y, cardWidth, 24, 1.5, 1.5, "FD");

      // Draw header accent line
      pdf.setFillColor(themeRGB[0], themeRGB[1], themeRGB[2]);
      pdf.rect(startX, y, cardWidth, 1.5, "F");

      printText(title.toUpperCase(), startX + cardWidth / 2, y + 6, { size: 7.5, style: "bold", color: "#52525b", align: "center" });
      printText(fmt(price), startX + cardWidth / 2, y + 14, { size: 14, style: "bold", color: "#18181b", align: "center" });
      printText(`+${markup}% margin`, startX + cardWidth / 2, y + 20, { size: 7.5, style: "medium", color: themeColor, align: "center" });
    };

    drawPriceCard("Wholesale", wholesalePrice, wholesalePct, margin);
    drawPriceCard("Retail Dealer", retailPrice, retailPct, margin + cardWidth + cardGap);
    drawPriceCard("Showroom Spec", showroomPrice, showroomPct, margin + (cardWidth + cardGap) * 2);

    // Footer signature blocks
    y += 40;
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = 30;
    }

    drawLine(margin, y, margin + 45, "#a1a1aa", 0.3);
    printText("Prepared By (Factory Supervisor)", margin, y + 4, { size: 8, color: "#71717a" });

    drawLine(pageWidth - margin - 45, y, pageWidth - margin, "#a1a1aa", 0.3);
    printText("Authorized Signatory", pageWidth - margin, y + 4, { size: 8, color: "#71717a", align: "right" });

    // Download PDF
    const filename = `Quote_${product.model_number || "Furniture"}_${product.material_type.toUpperCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);

    return { success: true, filename };
  } catch (err) {
    console.error("Error generating PDF:", err);
    return { success: false, error: err.message };
  }
}
