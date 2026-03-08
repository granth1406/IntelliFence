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

const io = new Server(server, {
    cors: {
        origin : "*"
    }
});

app.set("io", io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/api/auth', authRoutes);
//other routes that require authentication can be added here
app.use("/api/location",authMiddleware, locationRoutes);
app.use("/api/zones", zoneRoutes);

db_var.db_connection();

io.on("connection", (socket)=>{
    console.log("User Connected: ",socket.id);

    socket.on("disconnect", ()=>{
        console.log("User disconnected:",socket.id)
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, ()=>{
    console.log(`Running at http://localhost:${PORT}`);
});



