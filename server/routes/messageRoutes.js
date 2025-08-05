import express from "express";
import {
  getChatMessages,
  sendMessage,
  sseControler,
} from "../controllers/messageController.js";
import { upload } from "../config/multer.js";
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseControler);
messageRouter.post("/send", upload.single("image"), protect, sendMessage);
messageRouter.post("/get", protect, getChatMessages);

export default messageRouter;
