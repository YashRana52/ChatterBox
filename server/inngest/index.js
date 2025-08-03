import { Inngest } from "inngest";
import User from "../models/user.js";

// Inngest client with AI in name
export const inngest = new Inngest({ id: "Chatter-AI" });

// Helper to extract email safely
function getEmail(emailAddresses) {
  const emailObj = emailAddresses?.[0];
  return emailObj?.email_address || emailObj?.email || "";
}

// sync user creation
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk-AI" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      console.log("clerk/user.created event:", event.data);
      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      const email = getEmail(email_addresses);
      if (!email) {
        console.error("No email in payload, skipping user creation.");
        return;
      }

      let username =
        email.split("@")[0] || `user_${Math.floor(Math.random() * 10000)}`;
      const baseUsername = username;
      let attempts = 0;
      while ((await User.findOne({ username })) && attempts < 5) {
        attempts += 1;
        username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
      }

      const userData = {
        _id: id,
        email,
        full_name: `${first_name || ""} ${last_name || ""}`.trim(),
        profile_picture: image_url,
        username,
      };

      await User.create(userData);
      console.log("User created:", userData);
    } catch (err) {
      console.error("Error in syncUserCreation:", err);
      throw err;
    }
  }
);

// sync user update
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk-AI" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      console.log("clerk/user.updated event:", event.data);
      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      const email = getEmail(email_addresses);
      if (!email) {
        console.error("No email in payload, skipping user update.");
        return;
      }

      const updatedUserData = {
        email,
        full_name: `${first_name || ""} ${last_name || ""}`.trim(),
        profile_picture: image_url,
      };

      await User.findByIdAndUpdate(id, updatedUserData, {
        new: true,
        runValidators: true,
      });
      console.log("User updated:", { id, ...updatedUserData });
    } catch (err) {
      console.error("Error in syncUserUpdation:", err);
      throw err;
    }
  }
);

// sync user deletion
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk-AI" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      console.log("clerk/user.deleted event:", event.data);
      const { id } = event.data;
      await User.findByIdAndDelete(id);
      console.log("User deleted:", id);
    } catch (err) {
      console.error("Error in syncUserDeletion:", err);
      throw err;
    }
  }
);

// Export functions
export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion];
