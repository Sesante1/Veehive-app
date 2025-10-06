import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_intent_id, amount, reason } = body;

    if (!payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "Payment intent ID is required" }),
        { status: 400 }
      );
    }

    // Create refund parameters
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment_intent_id,
      reason: reason || "requested_by_customer",
    };

    // If amount is specified, do partial refund, otherwise full refund
    if (amount && amount > 0) {
      refundParams.amount = Math.round(amount * 100);
    }

    // Create the refund
    const refund = await stripe.refunds.create(refundParams);

    if (refund.status !== "succeeded" && refund.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: "Refund processing failed",
          status: refund.status,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Refund processed successfully",
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          currency: refund.currency,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing refund:", error);
    return new Response(
      JSON.stringify({
        error: "Refund processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}