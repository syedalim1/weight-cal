import Calculator from "../components/Calculator";

export default function MSPipeCalculatorPage() {
  return (
    <div className="">
      <Calculator 
        defaultMaterial="carbon-steel"
        defaultPrice={120}
        title="MS Weight Calculator"
        description="Calculate accurate mild steel (MS) weight and rates."
      />
    </div>
  );
}