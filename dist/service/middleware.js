"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const isAuthenticated = (req, res, next) => {
    try {
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
    }
    catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
exports.isAuthenticated = isAuthenticated;
