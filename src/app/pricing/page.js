import { Suspense } from "react";
import PricingCalculator from "../components/PricingCalculator";

export default function PricingPage() {
  return (
    <div className="">
      <Suspense fallback={<div className="flex justify-center p-10">Loading calculator...</div>}>
        <PricingCalculator />
      </Suspense>
    </div>
  );
}
