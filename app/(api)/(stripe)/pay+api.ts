// app/(api)/(stripe)/pay+api.ts
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id, client_secret } = body;

    if (!payment_method_id || !payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Confirm the payment intent (this authorizes the payment without capturing)
    const paymentIntent = await stripe.paymentIntents.confirm(
      payment_intent_id,
      {
        payment_method: payment_method_id,
        return_url: "carrentalapp://book-car", // Required for some payment methods
      }
    );

    // Check if payment is in the correct state for manual capture
    if (paymentIntent.status !== "requires_capture") {
      console.error("Unexpected payment status:", paymentIntent.status);
      
      // If it's already succeeded, that might be okay depending on your flow
      if (paymentIntent.status === "succeeded") {
        return new Response(
          JSON.stringify({
            success: true,
            result: {
              id: paymentIntent.id,
              client_secret: paymentIntent.client_secret,
              status: paymentIntent.status,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: "Payment authorization failed",
          status: paymentIntent.status,
          message: `Expected status 'requires_capture', got '${paymentIntent.status}'`,
        }),
        { status: 400 }
      );
    }

    // Payment successfully authorized, ready to be captured later
    return new Response(
      JSON.stringify({
        success: true,
        result: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error confirming payment:", error);
    
    // Check if it's a Stripe error with more details
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Payment confirmation failed",
          message: error.message,
          type: (error as any).type,
          code: (error as any).code,
        }),
        { status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: "Payment confirmation failed",
        message: "Unknown error occurred",
      }),
      { status: 500 }
    );
  }
}