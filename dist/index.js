"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
// import { prisma } from "./lib/db";
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const JWT_SECRET = process.env.JWT_SECRET_KEY || "secret_key";
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
const signinSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const decodedToken = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    if (!decodedToken) {
        return res.status(401).json({ message: "Login required" });
    }
    req.userId = decodedToken.id;
    next();
};
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { success, error } = signupSchema.safeParse(req.body);
        if (!success) {
            return res.status(401).json({
                message: error.message,
            });
        }
        const userExists = yield prisma.user.findFirst({
            where: {
                email: req.body.email,
            },
        });
        if (userExists) {
            return res.status(403).json({
                message: "User already exists",
            });
        }
        const hashedPassword = yield bcrypt_1.default.hash(req.body.password, 10);
        const user = yield prisma.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 604800000, // 7 days in milliseconds
            sameSite: "lax",
        });
        res.status(200).json({ message: "Signup successful" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "something went wrong" });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { success, error } = signinSchema.safeParse(req.body);
    if (!success) {
        return res.status(403).json({
            message: error.message,
        });
    }
    const user = yield prisma.user.findFirst({
        where: {
            email: req.body.email,
        },
    });
    if (!user) {
        return res.status(403).json({ message: "User not found" });
    }
    const inputPassword = req.body.password;
    const hashedPassword = user.password;
    const isMatched = yield bcrypt_1.default.compare(inputPassword, hashedPassword);
    if (!isMatched) {
        return res.status(403).json({ message: "User not found" });
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 604800000, // 7 days in milliseconds
    });
    res.status(200).json({ message: "Login Successful" });
}));
app.post("/api/v1/logout", isAuthenticated, (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Successfully logout" });
});
const taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title is required" }), // Required string for title
    description: zod_1.z.string().optional(), // Optional string for description
    status: zod_1.z.enum(["ToDo", "InProgress", "Completed"]), // Enum for status
    priority: zod_1.z.enum(["Low", "Medium", "High"]), // Enum for priority
    dueDate: zod_1.z.string().optional(), // Optional date for due date
});
app.post("/api/v1/task", isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { success, error } = taskSchema.safeParse(req.body);
    const id = req.userId;
    if (!success) {
        return res.status(403).json({ message: "Invalid input" });
    }
    try {
        const task = yield prisma.task.create({
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
    }
    catch (error) {
        res.status(500).json({ message: "Please try again, Something went wrong" });
    }
}));
app.put("/api/v1/task/:id", isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { success } = taskSchema.safeParse(req.body);
    if (!success) {
        return res.status(403).json({ message: "Invalid input" });
    }
    try {
        const updatedTask = yield prisma.task.update({
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
    }
    catch (error) {
        res.status(404).json({ message: "could not found the task" });
    }
}));
app.delete("/api/v1/task/:id", isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.task.delete({
            where: {
                id,
            },
        });
        res.status(200).json({ message: "Successfully delete the task" });
    }
    catch (error) {
        res
            .status(404)
            .json({ message: "Task is not found or could not be deleted" });
    }
}));
app.get("/api/v1/task", isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.userId;
    const tasks = yield prisma.task.findMany({
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
}));
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
