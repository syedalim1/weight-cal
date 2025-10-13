export default function CalculationSummary({ tubes, pricePerKg }) {
  const getTotalWeight = () => {
    return tubes.reduce((total, tube) => total + (tube.weightPerTube * tube.quantity), 0);
  };

  const getTotalPrice = () => {
    return getTotalWeight() * pricePerKg;
  };

  if (tubes.length === 0) {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-primary/20 space-y-3">
      <h3 className="text-lg font-bold text-foreground">Total Summary</h3>
      <div className="grid gap-3">
        <div className="flex justify-between items-center p-3 bg-card/80 rounded-md">
          <span className="text-sm font-medium text-muted-foreground">Price per kg:</span>
          <span className="text-base font-semibold">₹{pricePerKg}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary to-accent rounded-md">
          <span className="text-base font-bold text-primary-foreground">Total Weight:</span>
          <span className="text-xl font-bold text-primary-foreground">{getTotalWeight().toFixed(2)} kg</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-accent to-primary rounded-md">
          <span className="text-base font-bold text-primary-foreground">Total Price:</span>
          <span className="text-xl font-bold text-primary-foreground">₹{getTotalPrice().toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
