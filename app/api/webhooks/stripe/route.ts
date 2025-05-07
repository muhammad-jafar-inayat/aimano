// app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createTransaction } from "@/lib/actions/transaction.action";
import { getUserById } from "@/lib/actions/user.actions";
import User from "@/lib/database/models/user.model";
import { connectToDatabase } from "@/lib/database/mongoose";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Process checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const { plan, buyerId } = session.metadata!;
      const amount = Number(session.amount_total) / 100;
      
      // Determine credits based on amount
      let newCredits = 10;
      if (amount === 7.5) newCredits = 10;
      else if (amount === 37.5) newCredits = 50;
      
      console.log(`Payment of $${amount} received for ${buyerId}: ${newCredits} credits`);
      
      try {
        // 1. Connect to the database
        await connectToDatabase();
        
        // 2. Get the user
        const user = await getUserById(buyerId);
        
        if (!user) {
          console.error(`User not found: ${buyerId}`);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        // 3. Get current credit balance
        const currentCredits = user.creditBalance || 0;
        
        // 4. Update the credit balance (add new credits to existing balance)
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          { 
            $set: { 
              creditBalance: currentCredits + newCredits 
            } 
          },
          { new: true }
        );
        
        // 5. Create a transaction record
        await createTransaction({
          plan,
          amount,
          credits: newCredits,
          buyerId,
          status: "completed"
        });
        
        console.log(`Credits updated successfully for ${buyerId}. Previous balance: ${currentCredits}, New balance: ${updatedUser.creditBalance}`);
      } catch (error: any) {
        console.error(`Error processing payment: ${error.message}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}