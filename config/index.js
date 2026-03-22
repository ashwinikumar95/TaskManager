const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  uploadsDir: path.join(__dirname, "..", "uploads"),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
};
