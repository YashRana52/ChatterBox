import fs from "fs";
import imagekit from "../config/imageKit.js";
import Message from "../models/Message.js";
import { err } from "inngest/types";

// Ye ek empty object hai jisme hum har connected user ki SSE connection ko store karenge
const connections = {};

// Ye function Server-Sent Events (SSE) ke liye endpoint ka kaam karta hai
export const sseControler = async (req, res) => {
  const { userId } = req.params;
  console.log("New client connected:", userId);

  //  Set SSE  headers
  // Client ko batana ki hum continuous text data bhejenge
  res.setHeader("Content-Type", "text/event-stream");
  // Cache disable kar diya taaki purana data na aaye
  res.setHeader("Cache-Control", "no-cache");
  // Connection ko open rakhne ke liye
  res.setHeader("Connection", "keep-alive");

  res.setHeader("Access-Control-Allow-Origin", "*");

  // userId ke basis pe uska response (connection) object save kar liya
  connections[userId] = res;

  // Initial message bhej rahe hain client ko (optional hota hai)
  res.write("log:Connected to SSE stream\n\n");

  // Jab client disconnect ho jaye
  res.on("close", () => {
    // client ke response object ko delete kar dena connections se
    delete connections[userId];
    console.log("Client disconnected");
  });
};

//send message

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;

    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";
    if (message_type === "image") {
      const fileBuffer = fs.readFileSync(image.path);

      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });
      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }
    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    res.json({
      success: true,
      message,
    });

    //send message to to_user_id using SSE

    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id"
    );

    if (connections[to_user_id]) {
      connections[to_user_id].write(
        `data:${JSON.stringify(messageWithUserData)}\n\n`
      );
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        {
          from_user_id: userId,
          to_user_id,
        },
        {
          from_user_id: to_user_id,
          to_user_id: userId,
        },
      ],
    }).sort({ createdAt: -1 });
    //mark message as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true }
    );
    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//get recent message

export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id to_user_id")
      .sort({ created_at: -1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
