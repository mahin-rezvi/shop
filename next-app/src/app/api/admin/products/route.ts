import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { cache } from "@/lib/redis";
import { createUniqueSlug } from "@/lib/slug";

type ProductBody = {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  stock?: number;
  featured?: boolean;
  categoryId?: string;
};

async function clearProductCaches() {
  await Promise.all([
    cache.clear("products:*"),
    cache.clear("api:products:*"),
    cache.delete("featured-products"),
  ]);
}

export async function GET() {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Failed to load admin products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const body = (await request.json()) as ProductBody;
    const name = body.name?.trim();
    const price = Number(body.price);
    const stock = Number(body.stock ?? 0);

    if (!name || !Number.isInteger(price) || price < 0 || !body.categoryId) {
      return NextResponse.json(
        { success: false, message: "Name, price, and category are required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { success: false, message: "Stock must be zero or greater" },
        { status: 400 }
      );
    }

    const slug = await createUniqueSlug(name, async (candidate) => {
      const existing = await prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return Boolean(existing);
    });

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description: body.description?.trim() || null,
        price,
        image: body.image?.trim() || null,
        stock,
        featured: Boolean(body.featured),
        categoryId: body.categoryId,
      },
      include: { category: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Product",
        entityId: product.id,
        userId: user.id,
        changes: {
          name: product.name,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
        },
      },
    });

    await clearProductCaches();

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create product" },
      { status: 500 }
    );
  }
}
