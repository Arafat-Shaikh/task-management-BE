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
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const types_1 = require("../service/types");
const middleware_1 = require("../service/middleware");
const router = (0, express_1.Router)();
router.post("/", middleware_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { success, error } = types_1.taskSchema.safeParse(req.body);
    const id = req.userId;
    if (!success) {
        console.log(error.message);
        return res.status(403).json({ message: "Invalid input" });
    }
    let date = new Date(req.body.dueDate.toString());
    try {
        const task = yield prisma_1.default.task.create({
            data: {
                userId: id,
                title: req.body.title,
                description: req.body.description,
                status: req.body.status,
                priority: req.body.priority,
                dueDate: date,
            },
        });
        res.status(200).json(task);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Please try again, Something went wrong" });
    }
}));
router.put("/:id", middleware_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    let reqTask = req.body;
    if (reqTask.id) {
        delete reqTask.id;
    }
    try {
        const updatedTask = yield prisma_1.default.task.update({
            where: {
                id: id.toString(),
            },
            data: reqTask,
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
            },
        });
        return res.status(200).json(updatedTask);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "could not found the task" });
    }
}));
router.delete("/:id", middleware_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma_1.default.task.delete({
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
router.get("/", middleware_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.userId;
    console.log(req.query);
    let queryObj = { OR: [] }; // Initialize OR as an empty array
    // Always include the userId in the final query
    const finalQueryObj = {
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
        const startDate = new Date(req.query.startDate.toString());
        const endDate = new Date(req.query.endDate.toString());
        const utcStartDate = new Date(startDate.getTime() - 5.5 * 60 * 60 * 1000);
        const utcEndDate = new Date(endDate.getTime() - 5.5 * 60 * 60 * 1000);
        queryObj.OR.push({
            dueDate: {
                gte: utcStartDate, // Compare just dates
                lte: utcEndDate, // Compare just dates
            },
        });
    }
    // If there are any OR conditions, merge them with userId
    if (queryObj.OR.length > 0) {
        finalQueryObj.OR = queryObj.OR;
    }
    const tasks = yield prisma_1.default.task.findMany({
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
}));
exports.default = router;
