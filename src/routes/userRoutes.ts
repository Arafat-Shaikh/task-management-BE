import { Request, Response, Router } from "express";
import prisma from "../lib/prisma";
import { signinSchema, signupSchema } from "../service/types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../service/middleware";

const JWT_SECRET = process.env.JWT_SECRET_KEY as string;

const router = Router();

router.post("/signup", async (req: Request, res: Response): Promise<any> => {
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

router.post("/signin", async (req: Request, res: Response): Promise<any> => {
  try {
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

    res.status(200).json({ userId: user.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/logout", isAuthenticated, (req: Request, res: Response) => {
  res.clearCookie("token");
  console.log("token");
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
