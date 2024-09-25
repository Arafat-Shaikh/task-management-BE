import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
// import { prisma } from "./lib/db";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY as string;

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

interface JWT_PAYLOAD {
  id: string;
}

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const app = express();

app.use(cookieParser());
app.use(express.json());

const prisma = new PrismaClient();

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const decodedToken = jwt.verify(token, JWT_SECRET) as JWT_PAYLOAD;

  if (!decodedToken) {
    return res.status(401).json({ message: "Login required" });
  }

  req.userId = decodedToken.id;

  next();
};

app.post("/api/v1/signup", async (req, res) => {
  try {
    const { success, error } = signupSchema.safeParse(req.body);

    if (!success) {
      return res.status(401).json({
        message: error.message,
      });
    }

    const userExists = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });

    if (userExists) {
      return res.status(403).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 604800000, // 7 days in milliseconds
      sameSite: "lax",
    });

    res.status(200).json({ message: "Signup successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "something went wrong" });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const { success, error } = signinSchema.safeParse(req.body);

  if (!success) {
    return res.status(403).json({
      message: error.message,
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: req.body.email,
    },
  });

  if (!user) {
    return res.status(403).json({ message: "User not found" });
  }

  const inputPassword = req.body.password;
  const hashedPassword = user.password;

  const isMatched = await bcrypt.compare(inputPassword, hashedPassword);

  if (!isMatched) {
    return res.status(403).json({ message: "User not found" });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 604800000, // 7 days in milliseconds
  });

  res.status(200).json({ message: "Login Successful" });
});

app.post("/api/v1/logout", isAuthenticated, (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Successfully logout" });
});

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }), // Required string for title
  description: z.string().optional(), // Optional string for description
  status: z.enum(["ToDo", "InProgress", "Completed"]), // Enum for status
  priority: z.enum(["Low", "Medium", "High"]), // Enum for priority
  dueDate: z.string().optional(), // Optional date for due date
});

app.post("/api/v1/task", isAuthenticated, async (req, res) => {
  const { success, error } = taskSchema.safeParse(req.body);
  const id = req.userId;

  if (!success) {
    return res.status(403).json({ message: "Invalid input" });
  }

  try {
    const task = await prisma.task.create({
      data: {
        userId: id,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        dueDate: req.body.dueDate,
      },
    });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Please try again, Something went wrong" });
  }
});

app.put("/api/v1/task/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { success } = taskSchema.safeParse(req.body);

  if (!success) {
    return res.status(403).json({ message: "Invalid input" });
  }

  try {
    const updatedTask = await prisma.task.update({
      where: {
        id,
      },
      data: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        dueDate: req.body.dueDate,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    res.status(404).json({ message: "could not found the task" });
  }
});

app.delete("/api/v1/task/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({
      where: {
        id,
      },
    });

    res.status(200).json({ message: "Successfully delete the task" });
  } catch (error) {
    res
      .status(404)
      .json({ message: "Task is not found or could not be deleted" });
  }
});

app.get("/api/v1/task", isAuthenticated, async (req, res) => {
  const id = req.userId;

  const tasks = await prisma.task.findMany({
    where: {
      userId: id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
    },
  });

  res.status(200).json(tasks);
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
