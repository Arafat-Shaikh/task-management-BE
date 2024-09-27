import express, { NextFunction, query, Request, Response } from "express";
import { z } from "zod";
// import { prisma } from "./lib/db";
import { PrismaClient } from "@prisma/client";
import prisma from "./lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

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
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET) as JWT_PAYLOAD;

    if (!decodedToken) {
      return res.status(401).json({ message: "Login required" });
    }

    req.userId = decodedToken.id;

    console.log("above is the middleware");

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
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
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ userId: user.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "something went wrong" });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const { success, error } = signinSchema.safeParse(req.body);

  console.log(req.body);

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
    maxAge: 5 * 24 * 60 * 60 * 1000,
  });

  console.log("successful");

  res.status(200).json({ userId: user.id });
});

app.post("/api/v1/logout", isAuthenticated, (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Successfully logout" });
});

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  status: z
    .string()
    .refine((val) => ["To do", "In Progress", "Completed"].includes(val), {
      message: "Status must be 'To do', 'In Progress', or 'Completed'",
    }),
  priority: z
    .string()
    .refine((val) => ["Low", "Medium", "High"].includes(val), {
      message: "Priority must be 'Low', 'Medium', or 'High'",
    }),
  dueDate: z.string().optional(),
});

app.post("/api/v1/task", isAuthenticated, async (req, res) => {
  const { success, error } = taskSchema.safeParse(req.body);
  const id = req.userId;

  if (!success) {
    console.log(error.message);
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
        dueDate: new Date(req.body.dueDate.toString()),
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
        dueDate: new Date(req.body.dueDate.toString()),
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
  console.log(req.query);
  let queryObj: any = { OR: [] }; // Initialize OR as an empty array

  // Always include the userId in the final query
  const finalQueryObj: any = {
    userId: id, // Ensure userId is always included
  };

  // Check for status in the query and add to the OR condition
  if (req.query.status) {
    queryObj.OR.push({ status: req.query.status });
  }

  // Check for priority in the query and add to the OR condition
  if (req.query.priority) {
    queryObj.OR.push({ priority: req.query.priority });
  }

  // Check for date range in the query
  if (req.query.startDate && req.query.endDate) {
    const startDate = new Date(req.query.startDate.toString())
      .toISOString()
      .split("T")[0]; // YYYY-MM-DD format
    const endDate = new Date(req.query.endDate.toString())
      .toISOString()
      .split("T")[0]; // YYYY-MM-DD format

    queryObj.OR.push({
      dueDate: {
        gte: new Date(startDate), // Compare just dates
        lte: new Date(endDate), // Compare just dates
      },
    });
  }

  // If there are any OR conditions, merge them with userId
  if (queryObj.OR.length > 0) {
    finalQueryObj.OR = queryObj.OR;
  }

  const tasks = await prisma.task.findMany({
    where: finalQueryObj,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
    },
  });

  res.status(200).json(tasks);
});

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
