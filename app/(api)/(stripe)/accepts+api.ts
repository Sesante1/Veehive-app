import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_intent_id, booking_id } = body;

    if (!payment_intent_id || !booking_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Capture the payment (charge the customer)
    const paymentIntent =
      await stripe.paymentIntents.capture(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({
          error: "Payment capture failed",
          status: paymentIntent.status,
        }),
        { status: 400 }
      );
    }

    // After successful capture, attach the PaymentMethod to the customer for future use
    if (paymentIntent.payment_method && paymentIntent.customer) {
      const paymentMethodId =
        typeof paymentIntent.payment_method === "string"
          ? paymentIntent.payment_method
          : paymentIntent.payment_method.id;

      const customerId =
        typeof paymentIntent.customer === "string"
          ? paymentIntent.customer
          : paymentIntent.customer.id;

      try {
        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
        console.log(
          `PaymentMethod ${paymentMethodId} attached to customer ${customerId}`
        );
      } catch (attachError) {
        // If it's already attached, that's fine - just log and continue
        if (
          attachError instanceof Stripe.errors.StripeError &&
          attachError.message.includes("already been attached")
        ) {
          console.log("PaymentMethod already attached to customer");
        } else {
          // Log the error but don't fail the request since payment was successful
          console.error("Error attaching payment method:", attachError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment captured successfully",
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
    console.error("Error capturing payment:", error);
    return new Response(
      JSON.stringify({
        error: "Payment capture failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
