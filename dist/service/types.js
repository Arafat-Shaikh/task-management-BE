"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = exports.signinSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
exports.signinSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title is required" }),
    description: zod_1.z.string().optional(),
    status: zod_1.z
        .string()
        .refine((val) => ["To do", "In Progress", "Completed"].includes(val), {
        message: "Status must be 'To do', 'In Progress', or 'Completed'",
    }),
    priority: zod_1.z
        .string()
        .refine((val) => ["Low", "Medium", "High"].includes(val), {
        message: "Priority must be 'Low', 'Medium', or 'High'",
    }),
    dueDate: zod_1.z.string().optional(),
});
