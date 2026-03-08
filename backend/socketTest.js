const { io } =  require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to socket server");
});

socket.on("location-update", (data) => {
  console.log("Location update:", data);
});

socket.on("near-zone-alert", (data) => {
  console.log("⚠ Near zone alert:", data);
});

socket.on("zone-entered", (data) => {
  console.log("🚨 Zone entered:", data);
});