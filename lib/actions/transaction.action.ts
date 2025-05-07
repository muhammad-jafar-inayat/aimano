"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import Transaction from "../database/models/transaction.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";

// Define types if not imported from a separate file
type CreateTransactionParams = {
  buyerId: string;
  credits: number;
  plan: string;
  amount: number;
  status?: string;
};

type CheckoutTransactionParams = {
  plan: string;
  amount: number;
  credits: number;
  buyerId: string;
};

export async function createTransaction(transaction: CreateTransactionParams) {
  try {
    await connectToDatabase();

    // Create a new transaction with a default status of "pending" if not provided
    const newTransaction = await Transaction.create({
      ...transaction,
      status: transaction.status || "pending",
    });

    console.log(`Transaction created successfully: ${newTransaction._id}`);

    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    console.error("Error creating transaction:", error);
    handleError(error);
  }
}

export async function getTransactionsByUser(userId: string) {
  try {
    await connectToDatabase();

    const transactions = await Transaction.find({ buyerId: userId });

    return JSON.parse(JSON.stringify(transactions));
  } catch (error) {
    console.error("Error getting user transactions:", error);
    handleError(error);
  }
}

export async function createCheckoutSession(transaction: CheckoutTransactionParams) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });

  const { plan, amount, credits, buyerId } = transaction;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        credits: credits.toString(),
        buyerId,
      },
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile?canceled=true`,
    });

    redirect(session.url!);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    handleError(error);
  }
}