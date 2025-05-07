"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs";
import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";

// CREATE
export async function createUser(user: CreateUserParams) {
  try {
    await connectToDatabase();

    const newUser = await User.create(user);

    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    handleError(error);
  }
}

// READ
export async function getUserById(userId: string) {
  try {
    await connectToDatabase();

    console.log("Looking for user with clerk ID:", userId);
    
    let user = await User.findOne({ clerkId: userId });

    // If user does not exist in MongoDB but exists in Clerk, create them
    if (!user && userId) {
      console.log("User not found in MongoDB. Creating user from Clerk data...");
      
      try {
        // Get user details from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);
        
        // Create a new user record
        const newUser = {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "unknown@example.com",
          username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || `user${Date.now()}`,
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          photo: clerkUser.imageUrl || "",
          planId: 1, // Default plan
          creditBalance: 10, // Default credits
        };
        
        console.log("Creating new user with data:", JSON.stringify(newUser));
        
        user = await User.create(newUser);
        console.log("User created successfully:", user._id.toString());
        
        // Update Clerk metadata to link the accounts
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            userId: user._id,
          },
        });
        
      } catch (createError) {
        console.error("Error creating user from Clerk data:", createError);
        throw new Error("Failed to create user from Clerk data");
      }
    }

    if (!user) {
      throw new Error("User not found and could not be created");
    }

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error in getUserById:", error);
    handleError(error);
  }
}

// UPDATE
export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, {
      new: true,
    });

    if (!updatedUser) throw new Error("User update failed");
    
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteUser(clerkId: string) {
  try {
    await connectToDatabase();

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id);
    revalidatePath("/");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
}

// UPDATE CREDITS (for both adding and using credits)
export async function updateCredits(userId: string, creditFee: number) {
  try {
    await connectToDatabase();

    console.log(`Updating credits for user ${userId}: ${creditFee > 0 ? 'Adding' : 'Using'} ${Math.abs(creditFee)} credits`);

    const updatedUserCredits = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { creditBalance: creditFee }},
      { new: true }
    );

    if(!updatedUserCredits) throw new Error("User credits update failed");

    console.log(`Credits updated successfully. New balance: ${updatedUserCredits.creditBalance}`);

    return JSON.parse(JSON.stringify(updatedUserCredits));
  } catch (error) {
    console.error("Error updating credits:", error);
    handleError(error);
  }
}

// ADD PURCHASED CREDITS - specifically for adding credits from purchases
export async function addPurchasedCredits(userId: string, credits: number) {
  try {
    await connectToDatabase();

    console.log(`Adding ${credits} purchased credits to user ${userId}`);

    const updatedUserCredits = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { creditBalance: credits }}, // Increment by the purchased amount
      { new: true }
    );

    if(!updatedUserCredits) throw new Error("Failed to add purchased credits");
    
    console.log(`Credits added successfully. New balance: ${updatedUserCredits.creditBalance}`);

    return JSON.parse(JSON.stringify(updatedUserCredits));
  } catch (error) {
    console.error("Error adding purchased credits:", error);
    handleError(error);
  }
}