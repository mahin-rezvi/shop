import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/redis";
import { ProductCard } from "@/components/product-card";
import { SearchProducts } from "@/components/search-products";
import { FeaturedSection } from "@/components/featured-section";

export const dynamic = "force-dynamic";

async function getFeaturedProducts() {
  const cacheKey = "featured-products";
  const cached = await cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const products = await prisma.product.findMany({
      where: { featured: true },
      take: 8,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    await cache.set(cacheKey, products, 3600);
    return products;
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="space-y-12 py-4">
      <section className="rounded-lg bg-slate-950 px-4 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-normal sm:text-5xl">
            Dealhaven Pro
          </h1>
          <p className="mb-8 text-lg text-slate-200 sm:text-xl">
            Discover amazing deals on quality products
          </p>
          <SearchProducts />
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No featured products yet. Seed the database or add products in Admin.
          </div>
        )}
      </section>

      <FeaturedSection />

      <section className="rounded-lg border bg-muted px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Shop?</h2>
          <p className="text-muted-foreground mb-8">
            Browse our full collection of products and find exactly what you need
          </p>
          <a
            href="/shop"
            className="inline-block rounded-md bg-primary px-8 py-3 font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            Shop Now
          </a>
        </div>
      </section>
    </div>
  );
}
