import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Save, FolderOpen, Download, Trash2, FileText } from "lucide-react";

export default function CalculatorToolbar({
  calculationName,
  setCalculationName,
  savedCalculations,
  showSaveDialog,
  setShowSaveDialog,
  showLoadDialog,
  setShowLoadDialog,
  tubes,
  pricePerKg,
  onSaveCalculation,
  onLoadCalculation,
  onDeleteCalculation,
  onExportToCSV,
  onExportToPDF,
  onClearAll
}) {
  return (
    <div className="flex gap-2">
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Calculation</DialogTitle>
            <DialogDescription>
              Enter a name for your calculation to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Calculation name"
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={onSaveCalculation}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Calculation</DialogTitle>
            <DialogDescription>
              Select a previously saved calculation to load.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {savedCalculations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No saved calculations found.</p>
            ) : (
              savedCalculations.map((calc, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{calc.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {calc.tubes.length} tubes • ₹{calc.pricePerKg}/kg • {new Date(calc.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onLoadCalculation(calc)}>
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteCalculation(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" onClick={onExportToCSV}>
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>

      <Button variant="outline" size="sm" onClick={onExportToPDF}>
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>

      <Button variant="outline" size="sm" onClick={onClearAll}>
        <Trash2 className="h-4 w-4 mr-2" />
        Clear All
      </Button>
    </div>
  );
}
