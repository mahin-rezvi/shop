import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

type RouteContext = {
  params: {
    itemId: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    const { quantity } = await request.json();
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: params.itemId, userId: user.id },
      include: { product: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(quantity, item.product.stock) },
      include: { product: { include: { category: true } } },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Failed to update cart item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    const item = await prisma.cartItem.findFirst({
      where: { id: params.itemId, userId: user.id },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: item.id },
    });

    return NextResponse.json({
      success: true,
      message: "Removed from cart",
    });
  } catch (error) {
    console.error("Failed to remove cart item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove cart item" },
      { status: 500 }
    );
  }
}
