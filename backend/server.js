const express = require('express');
const http = require('http');
const cors = require('cors');
const {Server} = require("socket.io");

const db_var = require('./config/db_connection');
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const zoneRoutes = require("./routes/zoneRoutes.js");
const authMiddleware = require('./middleware/authMiddleware');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app)

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8080";

// Configure Socket.IO CORS to match the frontend origin (no trailing slash)
const io = new Server(server, {
    cors: {
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set("io", io);

// Configure Express CORS to allow the frontend origin during development
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Public auth routes
app.use('/api/auth', authRoutes);

// Do NOT apply `authMiddleware` globally — protect only routes that require authentication
app.use("/api/location", locationRoutes);
app.use("/api/zones", zoneRoutes);

db_var.db_connection();

io.on("connection", (socket)=>{
    console.log("User Connected: ",socket.id);

    socket.on("disconnect", ()=>{
        console.log("User disconnected:",socket.id)
    });
});

const PORT = process.env.PORT;

server.listen(PORT, ()=>{
    console.log(`Running at http://localhost:${PORT}`);
});



