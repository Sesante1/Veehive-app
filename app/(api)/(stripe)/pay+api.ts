import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id } = body;

    if (!payment_method_id || !payment_intent_id || !customer_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      { customer: customer_id }
    );

    // Set as default payment method
    await stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Confirm the payment intent
    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment confirmed successfully",
        result: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error confirming payment:", error);
    return new Response(
      JSON.stringify({
        error: "Payment confirmation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}