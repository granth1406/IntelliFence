const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');

const db_var = require('./config/db_connection');
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const zoneRoutes = require("./routes/zoneRoutes.js");
const authMiddleware = require('./middleware/authMiddleware');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "http://localhost:8080";

const FRONTEND_DIST_PATH =
    process.env.FRONTEND_DIST_PATH ||
    path.resolve(__dirname, "../frontend/app-companion-main/dist");

const FRONTEND_INDEX_PATH = path.join(
    FRONTEND_DIST_PATH,
    "index.html"
);

// Configure Socket.IO
const io = new Server(server, {
    cors: {
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set("io", io);

// Middleware
app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/zones", zoneRoutes);

// Serve React build if available
if (fs.existsSync(FRONTEND_DIST_PATH)) {

    app.use(express.static(FRONTEND_DIST_PATH));

    app.get(/^(?!\/api).*/, (req, res, next) => {

        if (req.path.startsWith("/api/")) {
            return next();
        }

        if (fs.existsSync(FRONTEND_INDEX_PATH)) {
            return res.sendFile(FRONTEND_INDEX_PATH);
        }

        return next();
    });
}

const PORT = process.env.PORT;

async function startServer() {

    try {
        console.log("[STARTUP] IntelliFence backend booting...");
        await db_var.db_connection();
        console.log("[CRON] Loading news and AI jobs...");
        require("./cron-job/newsCron.js");
        require("./cron-job/aiCron.js");
        console.log("[CRON] Jobs loaded.");

        io.on("connection", (socket) => {

            socket.on("disconnect", () => {
            });

        });

        server.listen(PORT, () => {
            console.log(`[SERVER] Listening on http://localhost:${PORT}`);
        });

    } catch (err) {

        console.error("[STARTUP] Startup Failed:", err);
        process.exit(1);

    }
}

startServer();