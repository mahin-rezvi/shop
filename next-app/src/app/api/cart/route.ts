import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: { include: { category: true } } },
      orderBy: { updatedAt: "desc" },
    });

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid product or quantity" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    if (product.stock < 1) {
      return NextResponse.json(
        { success: false, message: "Product is out of stock" },
        { status: 400 }
      );
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: Math.min(existingItem.quantity + quantity, product.stock),
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          quantity: Math.min(quantity, product.stock),
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "Added to cart" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Failed to clear cart:", error);
    return NextResponse.json(
      { success: false, message: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
