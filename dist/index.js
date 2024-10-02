"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const middleware_1 = require("./service/middleware");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: "http://localhost:3000",
}));
app.use("/api/user", userRoutes_1.default);
app.use("/api/task", taskRoutes_1.default);
app.get("/example", (req, res) => {
    res.status(200).json({ success: "Successful" });
});
app.get("/check", middleware_1.isAuthenticated, (req, res) => {
    res.status(200).json({ message: "checked" });
});
app.listen(port, () => {
    console.log("server is running on port " + port);
});
