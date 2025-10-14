import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Edit, Search, CheckCircle } from "lucide-react";

export default function TubeList({
  tubes,
  searchTerm,
  setSearchTerm,
  pricePerKg,
  onRemoveTube,
  onDuplicateTube,
  onEditTube,
  isUsingStandardWeight
}) {
  const getTubeDescription = (tube) => {
    if (tube.shape === "rectangular") {
      return `${tube.width}" × ${tube.height}"`;
    }
    return `${tube.size}"`;
  };

  const filteredTubes = tubes.filter(tube =>
    tube.shape.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTubeDescription(tube).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (tubes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Added Tubes</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tubes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-48"
            />
          </div>
          <span className="text-sm text-muted-foreground">{filteredTubes.length} item(s)</span>
        </div>
      </div>

      <div className="space-y-2">
        {filteredTubes.map((tube) => (
          <div key={tube.id} className="p-4 bg-muted/50 rounded-lg border border-border flex justify-between items-start gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">{tube.shape}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm">{getTubeDescription(tube)}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm">{tube.thickness}mm</span>
                {isUsingStandardWeight && isUsingStandardWeight(tube) && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Standard
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Length: {tube.length}" | Qty: {tube.quantity} | {tube.weightPerTube}kg each
              </div>
              <div className="text-sm font-semibold text-foreground">
                Subtotal: {(tube.weightPerTube * tube.quantity).toFixed(2)} kg
              </div>
              <div className="text-sm font-semibold text-primary">
                Price: ₹{((tube.weightPerTube * tube.quantity) * pricePerKg).toFixed(2)}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicateTube(tube)}
                className="h-8 w-8"
                title="Duplicate tube"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditTube(tube)}
                className="h-8 w-8"
                title="Edit tube"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveTube(tube.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Remove tube"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
