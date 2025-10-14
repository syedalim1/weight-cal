import { useToast } from "./use-toast.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const useExports = (tubes, pricePerKg, calculationName) => {
  const { toast } = useToast();

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
        tube.shape === "rectangular" ? `${tube.width}" × ${tube.height}"` : `${tube.size}"`,
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
        tubes.reduce((total, tube) => total + tube.weightPerTube * tube.quantity, 0).toFixed(2),
        (tubes.reduce((total, tube) => total + tube.weightPerTube * tube.quantity, 0) * pricePerKg).toFixed(2),
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `steel_calculation_${new Date().toISOString().split("T")[0]}.csv`;
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
          tube.shape === "rectangular" ? `${tube.width}" × ${tube.height}"` : `${tube.size}"`,
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
      const totalWeight = tubes.reduce((total, tube) => total + tube.weightPerTube * tube.quantity, 0);
      const totalPrice = totalWeight * pricePerKg;
      const totalData = [
        "",
        "",
        "",
        "",
        "TOTAL:",
        "",
        totalWeight.toFixed(2),
        totalPrice.toFixed(2),
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

  return {
    exportToCSV,
    exportToPDF,
  };
};
