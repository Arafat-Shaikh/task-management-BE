import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JWT_PAYLOAD {
  id: string;
}

const JWT_SECRET = process.env.JWT_SECRET_KEY as string;

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
