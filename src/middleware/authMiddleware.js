const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};