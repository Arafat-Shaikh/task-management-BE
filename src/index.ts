import express, { NextFunction, Request, Response } from "express";
import prisma from "./lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import { signinSchema, signupSchema, taskSchema } from "./service/types";
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

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

app.use("/api/user", userRoutes);
app.use("/api/task", taskRoutes);

app.get("/api/v1/user/me", async (req, res) => {
  const id = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    res.status(404).json({
      message: "can't find user",
    });
  }
});

app.get("/check", isAuthenticated, (req, res) => {
  res.status(200).json({ message: "checked" });
});

// model Task {
//   id          String    @id @default(auto()) @map("_id") @db.ObjectId
//   title       String
//   description String?
//   status      String
//   priority    String
//   dueDate     DateTime?
// }

app.listen(8080, () => {
  console.log("server is running on port 8080");
});
