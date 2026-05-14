"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const priceInDollars = (product.price / 100).toFixed(2);

  const handleAddToCart = async () => {
    setMessage("");
    setIsAdding(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (response.status === 401) {
        router.push("/sign-in");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Could not add this product");
      }

      setMessage("Added");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative h-48 overflow-hidden bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-4xl dark:from-slate-800 dark:to-slate-900">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {product.featured && (
            <div className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">
              Featured
            </div>
          )}

          <span className="absolute left-2 top-2 rounded-full bg-background/85 p-2 shadow-sm opacity-0 transition group-hover:opacity-100">
            <Heart className="h-5 w-5 text-red-500" />
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/shop/${product.slug}`} className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            {product.category?.name}
          </p>

          <h3 className="font-semibold text-sm line-clamp-2 mb-2">
            {product.name}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
        </Link>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${priceInDollars}</span>
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${
              product.stock > 0
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || product.stock < 1}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
        {message ? (
          <p className="mt-2 min-h-4 text-center text-xs text-muted-foreground">
            {message}
          </p>
        ) : (
          <span className="mt-2 min-h-4" />
        )}
      </div>
    </article>
  );
}
