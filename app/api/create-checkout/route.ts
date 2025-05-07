import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Make sure we have a fallback URL if the environment variable is not set
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const { plan, amount, credits, buyerId } = await req.json();

    // Validate the required fields
    if (!plan || !amount || !credits || !buyerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`Creating checkout session for: ${buyerId}, ${plan}, $${amount}, ${credits} credits`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100), // Amount in cents
            product_data: {
              name: `${plan} Plan - ${credits} Credits`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        credits: credits.toString(),
        buyerId,
      },
      success_url: `${SITE_URL}?success=true`,
      cancel_url: `${SITE_URL}?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}