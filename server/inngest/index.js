import { Inngest } from "inngest";
import User from "../models/user.js";
import sendEmail from "../config/nodeMailer.js";
import Connection from "../models/Connections.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

// Inngest client
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

//inngest function to send remainder when new connection request is added

const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    // Pehli email: new request
    await step.run("send-connection-request-mail", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );
      if (!connection) throw new Error("Connection not found");

      const subject = "👋 New Connection Request";
      const body = `
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Hi ${connection.to_user_id.full_name},</h2>
  <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
  <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #1b981;">here</a> to accept or reject the request</p>
  <br/>
  <p>Thanks,<br/>Chatter-box - Yash Rana</p>
</div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });

    // 24 ghante baad reminder
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    await step.run("send-connection-request-reminder", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );
      if (!connection) throw new Error("Connection not found");

      if (connection.status === "accepted") {
        return {
          message: "Already accepted",
        };
      }

      const subject = "👋 Reminder: Connection Request Pending";
      const body = `
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Hi ${connection.to_user_id.full_name},</h2>
  <p>This is a reminder: you have a pending connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
  <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #1b981;">here</a> to accept or reject the request</p>
  <br/>
  <p>Thanks,<br/>Chatter-box - Yash Rana</p>
</div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });

    return { message: "Reminder send" };
  }
);

//inngest function to delte story after 24 hours

const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story.delete" },

  async ({ event, step }) => {
    const { storyId } = event.data;

    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 10000);

    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story deleted" };
    });
  }
);

//send notification of unseen messages

const sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=Asia/Kolkata 0 9 * * *" },
  async ({ step }) => {
    const messages = await Message.find({ seen: false }).populate("to_user_id");

    const unseenCount = {};
    messages.map((message) => {
      unseenCount[message.to_user_id._id] =
        (unseenCount[message.to_user_id._id] || 0) + 1;
    });

    for (const userId in unseenCount) {
      const user = await User.findById(userId);

      const subject = `📩 You have ${unseenCount[userId]} unseen messages`;

      const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hi ${user.full_name}</h2>
        <p>You have ${unseenCount[userId]} unseen messages</p>
        <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color: #10b981;">here</a> to view them</p>
        <br/>
        <p>Thanks,<br/>Chatter-Box - Yash Rana</p>
      </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }

    return {
      message: "All notifications sent",
    };
  }
);

// Export functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationOfUnseenMessages,
];
