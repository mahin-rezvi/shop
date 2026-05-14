import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { cache } from "@/lib/redis";

type RouteContext = {
  params: {
    productId: string;
  };
};

type ProductUpdateBody = {
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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const body = (await request.json()) as ProductUpdateBody;
    const data: ProductUpdateBody = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Name cannot be empty" },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (body.description !== undefined) {
      data.description = body.description.trim();
    }

    if (body.image !== undefined) {
      data.image = body.image.trim();
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isInteger(price) || price < 0) {
        return NextResponse.json(
          { success: false, message: "Price must be zero or greater" },
          { status: 400 }
        );
      }
      data.price = price;
    }

    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          { success: false, message: "Stock must be zero or greater" },
          { status: 400 }
        );
      }
      data.stock = stock;
    }

    if (body.featured !== undefined) data.featured = Boolean(body.featured);
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;

    const product = await prisma.product.update({
      where: { id: params.productId },
      data,
      include: { category: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Product",
        entityId: product.id,
        userId: user.id,
        changes: data,
      },
    });

    await clearProductCaches();

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const orderItemCount = await prisma.orderItem.count({
      where: { productId: params.productId },
    });

    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Products with order history cannot be deleted. Set stock to 0 instead.",
        },
        { status: 409 }
      );
    }

    await prisma.product.delete({
      where: { id: params.productId },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Product",
        entityId: params.productId,
        userId: user.id,
      },
    });

    await clearProductCaches();

    return NextResponse.json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
