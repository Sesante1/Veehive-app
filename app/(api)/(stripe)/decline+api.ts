import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_intent_id, booking_id, reason } = body;

    if (!payment_intent_id || !booking_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Cancel the payment intent (release the hold)
    const paymentIntent = await stripe.paymentIntents.cancel(
      payment_intent_id,
      {
        cancellation_reason: reason || "requested_by_customer",
      }
    );

    if (paymentIntent.status !== "canceled") {
      return new Response(
        JSON.stringify({
          error: "Payment cancellation failed",
          status: paymentIntent.status,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment cancelled successfully",
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error cancelling payment:", error);
    return new Response(
      JSON.stringify({
        error: "Payment cancellation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}