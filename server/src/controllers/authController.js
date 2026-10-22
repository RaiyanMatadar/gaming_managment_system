import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../storage/index.js';
import { JWT_SECRET, ADMIN_REGISTRATION_SECRET } from '../middleware/authMiddleware.js';

/**
 * Register a new user (Strict Admin Only via Postman/cURL)
 * Public self-registration is explicitly blocked.
 * Requires header `x-admin-key` or body field `adminSecret`.
 */
export async function register(req, res, next) {
  try {
    const adminKey = req.headers['x-admin-key'] || req.body.adminSecret;
    if (!adminKey || adminKey !== ADMIN_REGISTRATION_SECRET) {
      return res.status(403).json({
        success: false,
        error: 'Public registration is disabled. A valid admin registration key (x-admin-key) is required.'
      });
    }

    const { username, password, name, centerName, email, role } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username is required and must be at least 3 characters long.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password is required and must be at least 6 characters long.'
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Check for existing user
    const existing = await store.getUserByUsername(normalizedUsername);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `User with username '${normalizedUsername}' already exists.`
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await store.createUser({
      username: normalizedUsername,
      password: hashedPassword,
      name: (name && name.trim()) || 'Gaming Center Staff',
      centerName: (centerName && centerName.trim()) || 'GameDash Arena',
      email: (email && email.trim()) || '',
      role: role && ['admin', 'manager', 'cashier'].includes(role) ? role : 'manager'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        centerName: newUser.centerName,
        role: newUser.role
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A user with this username already exists.'
      });
    }
    next(err);
  }
}

/**
 * User Login
 * Validates credentials and returns JWT token
 */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.'
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const user = await store.getUserByUsername(normalizedUsername);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.'
      });
    }

    const tokenPayload = {
      id: user._id,
      username: user.username,
      name: user.name,
      centerName: user.centerName,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        centerName: user.centerName,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Current Authenticated User Info
 */
export async function getMe(req, res, next) {
  try {
    const user = await store.getUserById(req.user.id);
    if (!user) {
      // Return user info from token payload if in memory / test environment
      return res.json({
        success: true,
        user: req.user
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        centerName: user.centerName,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}
