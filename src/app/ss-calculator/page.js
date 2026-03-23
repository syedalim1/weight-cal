import Calculator from "../components/Calculator";

export default function SSCalculator() {
  return (
    <div className="">
      <Calculator 
        defaultMaterial="stainless-steel"
        title="SS Weight Calculator"
        description="Calculate accurate stainless steel weight and rates."
      />
    </div>
  );
}