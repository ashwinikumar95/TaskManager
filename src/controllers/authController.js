const crypto = require('crypto');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const {
  normalizeEmail,
  normalizeName,
  validatePassword,
  validateEmailFormat,
} = require('../utils/userInput');

const register = async (req, res) => {
  try {
    const { name: rawName, email: rawEmail, password } = req.body;
    const name = normalizeName(rawName);
    const email = normalizeEmail(rawEmail);

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.ok) {
      return res.status(400).json({ message: emailCheck.message });
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      return res.status(400).json({ message: pwCheck.message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: `${user.name} registered successfully` });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = normalizeEmail(rawEmail);

    const user = await User.findOne({ email });
    const passwordOk =
      user != null && (await bcrypt.compare(password || '', user.password));

    if (!passwordOk) {
      return res
        .status(401)
        .json({ message: 'Invalid email or password' });
    }

    const jti = crypto.randomUUID();
    const token = jwt.sign({ id: user._id, jti }, config.jwtSecret, {
      expiresIn: '1d',
    });

    res.json({
      message: 'Login successful',
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const { jti, exp } = req.user;
    if (jti && typeof exp === 'number') {
      await RevokedToken.findOneAndUpdate(
        { jti },
        { jti, expiresAt: new Date(exp * 1000) },
        { upsert: true }
      );
    }
    // Auth is header-based: send JWT in Authorization: Bearer <token>. Client must delete it on logout.
    // clearCookie only matters if you also set a 'token' cookie on login — use the same options here.
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.status(200).json({
      message:
        jti != null
          ? 'Logout successful. Token invalidated on server.'
          : 'Logout successful. Remove token on client (re-login for server revoke).',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
};
