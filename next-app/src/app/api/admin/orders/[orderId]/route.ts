import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";

type RouteContext = {
  params: {
    orderId: string;
  };
};

type OrderUpdateBody = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDays?: number;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const body = (await request.json()) as OrderUpdateBody;

    const order = await prisma.$transaction(async (tx) => {
      if (body.status) {
        await tx.order.update({
          where: { id: params.orderId },
          data: { status: body.status },
        });
      }

      if (body.paymentStatus) {
        await tx.payment.updateMany({
          where: { orderId: params.orderId },
          data: { status: body.paymentStatus },
        });
      }

      if (
        body.trackingNumber !== undefined ||
        body.carrier !== undefined ||
        body.estimatedDays !== undefined
      ) {
        await tx.shipment.upsert({
          where: { orderId: params.orderId },
          update: {
            trackingNumber: body.trackingNumber,
            carrier: body.carrier,
            estimatedDays: body.estimatedDays,
            shippedAt: body.status === "SHIPPED" ? new Date() : undefined,
            deliveredAt: body.status === "DELIVERED" ? new Date() : undefined,
          },
          create: {
            orderId: params.orderId,
            trackingNumber: body.trackingNumber,
            carrier: body.carrier,
            estimatedDays: body.estimatedDays,
            shippedAt: body.status === "SHIPPED" ? new Date() : undefined,
            deliveredAt: body.status === "DELIVERED" ? new Date() : undefined,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Order",
          entityId: params.orderId,
          userId: user.id,
          changes: body,
        },
      });

      return tx.order.findUnique({
        where: { id: params.orderId },
        include: {
          user: true,
          items: {
            include: { product: true },
          },
          payment: true,
          shipment: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}
