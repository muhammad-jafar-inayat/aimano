// lib/types/transaction.types.ts

// Define transaction status for better type safety
export type TransactionStatus = "pending" | "completed" | "failed";

// Base interface for transactions
export interface BaseTransactionParams {
  plan: string;
  amount: number;
  credits: number;
  buyerId: string;
}

// For creating checkout sessions
export interface CheckoutTransactionParams extends BaseTransactionParams {}

// For creating transaction records
export interface CreateTransactionParams extends BaseTransactionParams {
  status?: TransactionStatus;
}

// For transaction response object
export interface Transaction extends CreateTransactionParams {
  _id: string;
  createdAt: Date;
}

// For getting transactions with pagination
export interface GetTransactionsParams {
  limit?: number;
  page?: number;
  buyerId: string;
}

// For transaction response with pagination
export interface TransactionsResponse {
  data: Transaction[];
  totalPages: number;
  totalTransactions: number;
}