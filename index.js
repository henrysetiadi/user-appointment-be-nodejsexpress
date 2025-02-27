require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("User Appointment Management System API is running...");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
