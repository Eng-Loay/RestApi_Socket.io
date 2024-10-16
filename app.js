const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const path = require("path");
const app = express();
const http = require("http");
const server = http.createServer(app);

// Configure multer for file upload
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); // Save files in the 'images' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-";
    cb(null, uniqueSuffix + file.originalname); // Generate unique file name
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Middleware to parse incoming JSON data
app.use(express.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// Serve static files from "images" directory
app.use("/images", express.static(path.join(__dirname, "images")));

// CORS setup
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Routes
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

// MongoDB connection and starting the server
mongoose
  .connect(
    "mongodb+srv://essamloay2:6CaQc4fDj3SaEDMu@cluster0.dsl45.mongodb.net/messages"
  )
  .then(() => {
    // Start the server on port 8000
    server.listen(8000, () => {
      console.log("Server is running on port 8000");
    });

    // Initialize Socket.IO
    const io = require("./socket").init(server, {
      cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"], // Allow GET and POST methods
        credentials: true, // Allow credentials if needed
      },
    });

    // Handle Socket.IO connections
    io.on("connection", (socket) => {
      console.log("Client connected");

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });
