import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const [
      productCount,
      categoryCount,
      orderCount,
      userCount,
      revenue,
      lowStockCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        productCount,
        categoryCount,
        orderCount,
        userCount,
        revenue: revenue._sum.total ?? 0,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error("Failed to load admin stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load admin stats" },
      { status: 500 }
    );
  }
}
