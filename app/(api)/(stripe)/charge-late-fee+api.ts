import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, payment_intent_id, late_fee } = body;
    console.log(booking_id + " " + payment_intent_id + " " + late_fee);

    if (!booking_id || !payment_intent_id || !late_fee) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Validate late fee amount
    const lateFeeNumber = Number(late_fee);
    if (!Number.isFinite(lateFeeNumber) || lateFeeNumber <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid late fee amount" }),
        { status: 400 }
      );
    }

    // Retrieve the original PaymentIntent to get the Customer
    const originalPaymentIntent =
      await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!originalPaymentIntent.customer) {
      return new Response(
        JSON.stringify({
          error: "No customer found on original payment",
        }),
        { status: 400 }
      );
    }

    const customerId =
      typeof originalPaymentIntent.customer === "string"
        ? originalPaymentIntent.customer
        : originalPaymentIntent.customer.id;

    // Get the customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    if (paymentMethods.data.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No payment method available",
          message: "Customer has no saved payment methods",
        }),
        { status: 400 }
      );
    }

    // Use the first available payment method
    const paymentMethodId = paymentMethods.data[0].id;

    // Create and immediately capture a payment intent for the late fee
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(lateFeeNumber * 100), // Convert to cents
        currency: "php",
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true, // Immediately confirm and charge
        off_session: true, // Allow charging without customer present
        metadata: {
          booking_id,
          charge_type: "late_fee",
          original_payment_intent: payment_intent_id,
        },
        description: `Late return fee for booking ${booking_id}`,
      },
      {
        idempotencyKey: `late_fee_${booking_id}_${payment_intent_id}_${Math.round(lateFeeNumber * 100)}`,
      }
    );

    // Check if charge was successful
    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({
          error: "Late fee charge failed",
          status: paymentIntent.status,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Late fee charged successfully",
        charge: {
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
    console.error("Error charging late fee:", error);

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return new Response(
        JSON.stringify({
          error: "Late fee charge failed",
          message: error.message,
          code: error.code,
          type: error.type,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Late fee charge failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
