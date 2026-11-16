"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  product,
  className,
  size = "md",
  buyNow = false,
}: {
  product: Product;
  className?: string;
  size?: "sm" | "md" | "lg";
  buyNow?: boolean;
}) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  if (buyNow) {
    return (
      <Button
        variant="buy"
        size={size}
        className={className}
        onClick={() => {
          add(product);
          router.push("/checkout");
        }}
      >
        Comprar agora
      </Button>
    );
  }

  return (
    <Button
      variant={added ? "pix" : "outline"}
      size={size}
      className={className}
      onClick={() => {
        add(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
      {added ? "Adicionado!" : "Adicionar ao carrinho"}
    </Button>
  );
}
