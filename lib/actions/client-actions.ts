"use client";

import { CheckoutTransactionParams } from '../types/transaction.types';

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
  try {
    // Make a POST request to the API route that creates Stripe checkout sessions
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    
    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}