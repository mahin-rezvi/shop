import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })
  : null;

export const getCheckoutSession = async (sessionId: string) => {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.checkout.sessions.retrieve(sessionId);
};

export const getPaymentIntent = async (paymentIntentId: string) => {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.paymentIntents.retrieve(paymentIntentId);
};
