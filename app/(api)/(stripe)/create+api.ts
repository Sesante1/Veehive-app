import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, amount } = body;

    if (!name || !email || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Check if customer already exists
    let customer;
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        name,
        email,
      });
    }

    // Create ephemeral key for customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" }
    );

    // Create payment intent
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
      });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountNumber * 100),
      currency: "php",
      customer: customer.id,
      capture_method: "manual",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        integration: "car_rental_app",
      },
    });

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent,
        ephemeralKey: ephemeralKey,
        customer: customer.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
