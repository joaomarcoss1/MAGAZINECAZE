"use client";
import { useEffect, useState } from "react";

/** Evita divergência de hidratação com o carrinho salvo no localStorage. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
