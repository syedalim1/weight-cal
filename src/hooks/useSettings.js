import { useState } from "react";

export const useSettings = () => {
  const [pricePerKg, setPricePerKg] = useState(260);
  const [material, setMaterial] = useState("stainless-steel");

  return {
    pricePerKg,
    setPricePerKg,
    material,
    setMaterial,
  };
};
