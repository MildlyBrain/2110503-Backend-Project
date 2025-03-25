const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("../config/db");
const cors = require("cors");

// route files
const auth = require("../routes/auth");
const reservations = require("../routes/reservations");
const coworkingSpace = require("../routes/coworkingSpace");
const meetingRooms = require("../routes/meetingRooms");

dotenv.config({ path: "./config/config.env" });

connectDB();

const app = express();

// vercel template
app.get("/", (req, res) => res.send("Express on Vercel"));

// use libs
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// use routes
app.use("/api/meetingrooms", meetingRooms);
app.use("/api/coworkingspace", coworkingSpace);
app.use("/api/reservations", reservations);
app.use("/api/auth", auth);

// configs
const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log("Server running in", process.env.NODE_ENV, "mode on port", PORT),
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);

  server.close(() => process.exit(1));
});

module.exports = app;
