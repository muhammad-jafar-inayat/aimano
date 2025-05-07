import mongoose, { Schema } from "mongoose";

const TransactionSchema = new Schema({
  buyerId: { type: String, required: true },
  amount: { type: Number, required: true },
  credits: { type: Number, required: true },
  plan: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export default Transaction;