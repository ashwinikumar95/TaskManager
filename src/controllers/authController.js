const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 1. Check user exists
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
  
      // 2. Compare password
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }
  
      // 3. Generate token
      const token = jwt.sign({ id: user._id }, config.jwtSecret, {
        expiresIn: "1d",
      });
  
      // 4. Send token
      res.json({
        message: "Login successful",
        token
      });
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };