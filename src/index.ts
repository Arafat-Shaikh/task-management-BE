import express, { Request, Response } from "express";
import prisma from "./lib/prisma";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import { isAuthenticated } from "./service/middleware";
import userRoutes from "./routes/userRoutes";
import taskRoutes from "./routes/taskRoutes";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}
const port = process.env.PORT || 3000;
const url = process.env.ORIGIN_URL || "http://localhost:3000";
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: url,
  })
);

app.use("/api/user", userRoutes);
app.use("/api/task", taskRoutes);

app.get("/example", (req: Request, res: Response) => {
  res.status(200).json({ success: "Successful" });
});

app.get("/check", isAuthenticated, (req: Request, res: Response) => {
  res.status(200).json({ message: "checked" });
});

app.listen(port, () => {
  console.log("server is running on port " + port);
});
