import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      reviews: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!product) notFound();

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: { category: true },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-primary">
              {product.category.name}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-bold text-primary">
              ${(product.price / 100).toFixed(2)}
            </p>
          </div>

          <p className="leading-7 text-muted-foreground">
            {product.description || "No description available for this item."}
          </p>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Availability</span>
              <span
                className={`rounded px-2 py-1 text-sm font-medium ${
                  product.stock > 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>
          </div>

          <AddToCartButton productId={product.id} stock={product.stock} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Fast delivery</p>
                <p className="text-xs text-muted-foreground">Dhaka and nationwide</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Secure checkout</p>
                <p className="text-xs text-muted-foreground">Card or cash on delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Customer Reviews</h2>
        {product.reviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {product.reviews.map((review) => (
              <article key={review.id} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">{review.user.name}</p>
                  <p className="text-sm text-primary">{review.rating}/5</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {review.comment || "No written review."}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No reviews yet.
          </p>
        )}
      </section>

      {relatedProducts.length > 0 ? (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
