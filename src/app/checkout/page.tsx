import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-page py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Finalizar compra</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-mandacaru-50 px-3 py-1.5 text-xs font-semibold text-mandacaru-700">
          <Lock className="size-3.5" /> Ambiente seguro
        </span>
      </div>
      <CheckoutForm />
    </div>
  );
}
