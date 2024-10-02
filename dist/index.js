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
const prisma_1 = __importDefault(require("./lib/prisma"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const middleware_1 = require("./service/middleware");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const url = process.env.ORIGIN_URL || "http://localhost:3000";
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: url,
}));
app.use("/api/user", userRoutes_1.default);
app.use("/api/task", taskRoutes_1.default);
app.get("/api/v1/user/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.userId;
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: {
                id,
            },
        });
        return res.status(200).json(user);
    }
    catch (error) {
        res.status(404).json({
            message: "can't find user",
        });
    }
}));
app.get("/check", middleware_1.isAuthenticated, (req, res) => {
    res.status(200).json({ message: "checked" });
});
app.listen(port, () => {
    console.log("server is running on port " + port);
});
