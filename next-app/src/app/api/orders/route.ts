import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { cache } from "@/lib/redis";
import { requireDbUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    const body = await request.json();
    const { paymentMethodId, paymentMethod = "COD", notes } = body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 }
      );
    }

    const outOfStockItem = cartItems.find(
      (item) => item.product.stock < item.quantity
    );
    if (outOfStockItem) {
      return NextResponse.json(
        {
          success: false,
          message: `${outOfStockItem.product.name} does not have enough stock`,
        },
        { status: 400 }
      );
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: user.id,
          total,
          notes,
          status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          payment: true,
        },
      });

      await Promise.all(
        cartItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          method: paymentMethod === "CARD" ? "CARD" : "COD",
          status: paymentMethod === "COD" ? "PENDING" : "PENDING",
          amount: total,
        },
      });

      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return createdOrder;
    });

    if (stripe && paymentMethod === "CARD" && paymentMethodId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          orderId: order.id,
        },
      });

      await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          method: "CARD",
          status:
            paymentIntent.status === "succeeded" ? "COMPLETED" : "PENDING",
          stripeId: paymentIntent.id,
          amount: total,
        },
      });

      if (paymentIntent.status === "succeeded") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CONFIRMED",
          },
        });
      }
    }

    await cache.clear("products:*");
    await cache.clear("api:products:*");
    await cache.delete("featured-products");

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}
