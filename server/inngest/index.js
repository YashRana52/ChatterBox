import { Inngest } from "inngest";
import User from "../models/user.js";

// Inngest client (tumhara original ID)
export const inngest = new Inngest({ id: "Chatter-Box" });

// Helper to safely get email from Clerk payload
function getEmail(emailAddresses) {
  const emailObj = emailAddresses?.[0] || {};
  return emailObj?.email_address || emailObj?.email || "";
}

// Helper to build full name
function getFullName(first, last) {
  return [first, last].filter(Boolean).join(" ").trim() || "Unnamed User";
}

// --- create user ---
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      console.log(
        "clerk/user.created event:",
        JSON.stringify(event.data, null, 2)
      );

      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      const email = getEmail(email_addresses);
      if (!email) {
        console.error("Email missing, skipping creation.");
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
        full_name: getFullName(first_name, last_name),
        profile_picture: image_url || "",
        username,
      };

      console.log("Creating user with:", userData);
      await User.create(userData);

      const saved = await User.findById(id).lean();
      console.log("Saved in DB:", saved);
    } catch (err) {
      console.error("Error in syncUserCreation:", err);
      throw err;
    }
  }
);

// --- update user ---
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      console.log(
        "clerk/user.updated event:",
        JSON.stringify(event.data, null, 2)
      );

      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      const email = getEmail(email_addresses);
      if (!email) {
        console.error("Email missing, skipping update.");
        return;
      }

      const updatedUserData = {
        email,
        full_name: getFullName(first_name, last_name),
        profile_picture: image_url || "",
      };

      console.log("Updating user:", { id, ...updatedUserData });
      await User.findByIdAndUpdate(id, updatedUserData, {
        new: true,
        runValidators: true,
      });

      const updated = await User.findById(id).lean();
      console.log("Updated in DB:", updated);
    } catch (err) {
      console.error("Error in syncUserUpdation:", err);
      throw err;
    }
  }
);

// --- delete user ---
const syncUserDeletion = inngest.createFunction(
  { id: "Delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      console.log(
        "clerk/user.deleted event:",
        JSON.stringify(event.data, null, 2)
      );

      const { id } = event.data;
      if (!id) {
        console.error("ID missing, skipping deletion.");
        return;
      }

      await User.findByIdAndDelete(id);
      console.log("Deleted user:", id);
    } catch (err) {
      console.error("Error in syncUserDeletion:", err);
      throw err;
    }
  }
);

// Export functions
export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion];
