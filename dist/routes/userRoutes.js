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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../service/middleware");
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const router = (0, express_1.Router)();
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { success, error } = types_1.signupSchema.safeParse(req.body);
        if (!success) {
            return res.status(401).json({
                message: error.message,
            });
        }
        const userExists = yield prisma_1.default.user.findFirst({
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
        const user = yield prisma_1.default.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.cookie("token", token, {
            maxAge: 5 * 24 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true,
        });
        res.status(200).json({ userId: user.id });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "something went wrong" });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { success, error } = types_1.signinSchema.safeParse(req.body);
        console.log(req.body);
        if (!success) {
            return res.status(403).json({
                message: error.message,
            });
        }
        const user = yield prisma_1.default.user.findFirst({
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
        const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.cookie("token", token, {
            maxAge: 5 * 24 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true,
        });
        res.status(200).json({ userId: user.id });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
router.post("/logout", middleware_1.isAuthenticated, (req, res) => {
    res.clearCookie("token");
    console.log("token");
    res.status(200).json({ message: "Logged out successfully" });
});
exports.default = router;
