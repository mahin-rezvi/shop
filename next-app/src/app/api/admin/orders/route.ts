import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: { product: true },
        },
        payment: true,
        shipment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Failed to load admin orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load orders" },
      { status: 500 }
    );
  }
}
