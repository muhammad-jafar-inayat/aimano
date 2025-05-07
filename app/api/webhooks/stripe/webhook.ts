import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Make sure we have a fallback URL if the environment variable is not set
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(req: Request) {
  const { plan, amount, credits, buyerId } = await req.json();

  try {
    // Verify we have a valid site URL
    if (!SITE_URL) {
      throw new Error("NEXT_PUBLIC_SITE_URL environment variable is not set");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100), // Amount in cents (ensure it's an integer)
            product_data: {
              name: `${plan} Plan - ${credits} Credits`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        credits: credits.toString(), // Convert to string to be safe
        buyerId,
      },
      success_url: `${SITE_URL}?success=true`,
      cancel_url: `${SITE_URL}?canceled=true`,
    });
    
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}