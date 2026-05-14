import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type OrderSuccessPageProps = {
  params: {
    orderId: string;
  };
};

export default async function OrderSuccessPage({
  params,
}: OrderSuccessPageProps) {
  const user = await getAuthenticatedDbUser();
  const order = user
    ? await prisma.order
        .findFirst({
          where: { id: params.orderId, userId: user.id },
          include: {
            items: {
              include: { product: true },
            },
            payment: true,
          },
        })
        .catch(() => null)
    : null;

  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
      <h1 className="mb-3 text-3xl font-bold">Order placed</h1>
      <p className="mb-8 text-muted-foreground">
        {order
          ? `Order ${order.orderNumber} is confirmed.`
          : "Your order has been received."}
      </p>

      {order ? (
        <div className="mb-8 rounded-lg border bg-card p-4 text-left">
          <div className="mb-4 flex justify-between gap-4 border-b pb-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-semibold">${(order.total / 100).toFixed(2)}</span>
          </div>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {item.product.name} x {item.quantity}
                </span>
                <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/account"
          className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          View Account
        </Link>
        <Link
          href="/shop"
          className="rounded-md border px-5 py-3 text-sm font-semibold hover:bg-muted"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
