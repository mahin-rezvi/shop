import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

type RouteContext = {
  params: {
    orderId: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { user, response } = await requireDbUser();
    if (!user) return response;

    const order = await prisma.order.findFirst({
      where: { id: params.orderId, userId: user.id },
      include: {
        items: {
          include: { product: true },
        },
        payment: true,
        shipment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
