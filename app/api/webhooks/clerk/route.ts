/* eslint-disable camelcase */
import { clerkClient } from "@clerk/nextjs";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { createUser, deleteUser, updateUser } from "@/lib/actions/user.actions";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Error: Missing svix headers");
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  let payload;
  try {
    payload = await req.json();
    console.log("Webhook payload received:", JSON.stringify(payload).substring(0, 100) + "...");
  } catch (error) {
    console.error("Error parsing webhook payload:", error);
    return new Response("Error parsing request body", { status: 400 });
  }
  
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("Webhook verified successfully, event type:", evt.type);
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Processing webhook: ${eventType} for user ${id}`);

  // CREATE
  if (eventType === "user.created") {
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

    if (!email_addresses || email_addresses.length === 0) {
      console.error("No email addresses found in user data");
      return new Response("Error: No email addresses found", { status: 400 });
    }

    // Add default values for new users
    const user = {
      clerkId: id,
      email: email_addresses[0].email_address,
      username: username || email_addresses[0].email_address.split('@')[0], // Fallback if username is null
      firstName: first_name || "",
      lastName: last_name || "",
      photo: image_url || "",
      planId: 1, // Default plan
      creditBalance: 10 // Default credits
    };

    console.log("Creating user with data:", JSON.stringify(user));

    try {
      const newUser = await createUser(user);
      console.log("User created successfully:", newUser?._id ? newUser._id.toString() : "unknown");

      // Set public metadata
      if (newUser) {
        try {
          await clerkClient.users.updateUserMetadata(id, {
            publicMetadata: {
              userId: newUser._id,
            },
          });
          console.log("User metadata updated");
        } catch (metadataError) {
          console.error("Error updating user metadata:", metadataError);
        }
      }

      return NextResponse.json({ message: "OK", user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: "Error creating user" }, { status: 500 });
    }
  }

  // UPDATE
  if (eventType === "user.updated") {
    const { id, image_url, first_name, last_name, username } = evt.data;

    const user = {
      firstName: first_name || "",
      lastName: last_name || "",
      username: username || "",
      photo: image_url || "",
    };

    console.log("Updating user:", id);

    try {
      const updatedUser = await updateUser(id!, user);
      console.log("User updated successfully");
      return NextResponse.json({ message: "OK", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: "Error updating user" }, { status: 500 });
    }
  }

  // DELETE
  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    if (!id) {
      console.error("No user ID provided for deletion");
      return NextResponse.json({ error: "No user ID provided" }, { status: 400 });
    }

    console.log("Deleting user:", id);

    try {
      const deletedUser = await deleteUser(id);
      console.log("User deleted successfully");
      return NextResponse.json({ message: "OK", user: deletedUser });
    } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
    }
  }

  console.log(`Webhook processed: ${eventType}`);
  return NextResponse.json({ message: "Webhook processed", type: eventType });
}