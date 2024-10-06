import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const taskSchema = z.object({
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
