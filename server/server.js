import express from "express";

import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
await connectDB();

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/user", userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
