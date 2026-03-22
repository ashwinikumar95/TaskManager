const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const config = require("../config");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);

mongoose
  .connect(config.mongodbUri)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server listening on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
