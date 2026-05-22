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
    <div className="flex flex-wrap gap-2">
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-zinc-900/60 border border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all font-mono text-xs uppercase tracking-wider h-8"
          >
            <Save className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent className="border border-white/10 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Save Calculation</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter a name for your calculation to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Calculation name"
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
              className="bg-zinc-900 border-white/10 text-white"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowSaveDialog(false)}
                className="bg-transparent border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button 
                onClick={onSaveCalculation}
                className="bg-sky-600 hover:bg-sky-500 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-zinc-900/60 border border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all font-mono text-xs uppercase tracking-wider h-8"
          >
            <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
            Load
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl border border-white/10 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Load Calculation</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Select a previously saved calculation to load.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto pt-2 steel-scrollbar">
            {savedCalculations.length === 0 ? (
              <p className="text-zinc-500 text-center py-8 font-mono text-xs">No saved calculations found.</p>
            ) : (
              savedCalculations.map((calc, index) => (
                <div key={index} className="p-4 border border-white/5 bg-zinc-900/40 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white">{calc.name}</h4>
                      <p className="text-xs font-mono text-zinc-400 mt-1">
                        {calc.tubes.length} tubes • ₹{calc.pricePerKg}/kg • {new Date(calc.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => onLoadCalculation(calc)}
                        className="bg-sky-600 hover:bg-sky-500 text-white h-7 text-xs font-mono px-3"
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteCalculation(index)}
                        className="h-7 text-xs font-mono px-3"
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

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onExportToCSV}
        className="bg-zinc-900/60 border border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all font-mono text-xs uppercase tracking-wider h-8"
      >
        <Download className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
        Export CSV
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onExportToPDF}
        className="bg-zinc-900/60 border border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all font-mono text-xs uppercase tracking-wider h-8"
      >
        <FileText className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
        Export PDF
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearAll}
        className="bg-zinc-900/60 border border-white/10 hover:border-red-950 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 transition-all font-mono text-xs uppercase tracking-wider h-8"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
        Clear All
      </Button>
    </div>
  );
}
