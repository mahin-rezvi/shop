"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";

type AddToCartButtonProps = {
  productId: string;
  stock: number;
  quantity?: number;
  className?: string;
};

export function AddToCartButton({
  productId,
  stock,
  quantity = 1,
  className = "",
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddToCart = async () => {
    setMessage("");
    setIsAdding(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.status === 401) {
        router.push("/sign-in");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Could not add this product");
      }

      setMessage("Added to cart");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding || stock < 1}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {stock > 0 ? "Add to Cart" : "Out of Stock"}
      </button>
      <p className="mt-2 min-h-5 text-center text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
