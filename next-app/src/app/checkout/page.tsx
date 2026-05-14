"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import Link from "next/link";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "CARD">(
    stripePromise ? "CARD" : "COD"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (paymentMethod === "CARD" && (!stripe || !elements)) {
      return;
    }

    setIsProcessing(true);

    try {
      let paymentMethodId: string | undefined;

      if (paymentMethod === "CARD") {
        const { error: stripeError, paymentMethod: stripePaymentMethod } =
          await stripe!.createPaymentMethod({
            type: "card",
            card: elements!.getElement(CardElement)!,
          });

        if (stripeError || !stripePaymentMethod) {
          setError(stripeError?.message || "An error occurred");
          return;
        }

        paymentMethodId = stripePaymentMethod.id;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const data = await response.json();

      window.location.href = `/order-success/${data.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="First Name"
                className="input-base"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="input-base"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              className="input-base"
              required
            />
            <input
              type="text"
              placeholder="Address"
              className="input-base"
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                type="text"
                placeholder="City"
                className="input-base"
                required
              />
              <input
                type="text"
                placeholder="State"
                className="input-base"
                required
              />
              <input
                type="text"
                placeholder="Zip Code"
                className="input-base"
                required
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              <span className="text-sm font-medium">Cash on delivery</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3">
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={paymentMethod === "CARD"}
                disabled={!stripePromise}
                onChange={() => setPaymentMethod("CARD")}
              />
              <span className="text-sm font-medium">
                Card {stripePromise ? "" : "(configure Stripe)"}
              </span>
            </label>
          </div>

          {paymentMethod === "CARD" ? (
            <div className="mb-4 rounded border bg-white p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#111827",
                      "::placeholder": {
                        color: "#6b7280",
                      },
                    },
                    invalid: {
                      color: "#dc2626",
                    },
                  },
                }}
              />
            </div>
          ) : null}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={(paymentMethod === "CARD" && !stripe) || isProcessing}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Complete Order"}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t text-center">
        <p className="text-muted-foreground mb-4">
          Want to continue shopping instead?
        </p>
        <Link href="/shop" className="text-primary hover:underline">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
