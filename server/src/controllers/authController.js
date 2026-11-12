import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../storage/index.js';
import { JWT_SECRET, ADMIN_REGISTRATION_SECRET } from '../middleware/authMiddleware.js';
import { formatPhoneNumber } from '../utils/phoneUtils.js';
import { whatsappService } from '../services/whatsappService.js';

function serializeUser(user) {
  return {
    id: user._id,
    username: user.username,
    name: user.name,
    centerName: user.centerName,
    whatsappNumber: user.whatsappNumber || '',
    whatsappLinkedNumber: user.whatsappLinkedNumber || '',
    role: user.role
  };
}

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

    const {
      username,
      password,
      name,
      centerName,
      email,
      whatsappNumber,
      managerPhone,
      whatsappLinkedNumber,
      linkedWhatsappNumber,
      role
    } = req.body;

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

    // Validate & enforce account-exclusive Manager Phone Number (if provided)
    const rawManagerPhone = whatsappNumber !== undefined ? whatsappNumber : managerPhone;
    const trimmedManagerPhone = rawManagerPhone !== undefined && rawManagerPhone !== null
      ? String(rawManagerPhone).trim()
      : '';
    let normalizedManagerPhone = '';
    if (trimmedManagerPhone) {
      const formatted = formatPhoneNumber(trimmedManagerPhone);
      if (!formatted) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Manager Phone Number. Please enter a valid 10-digit or international phone number.'
        });
      }
      const existingManagerOwner = await store.findUserByPhoneField('whatsappNumber', formatted);
      if (existingManagerOwner) {
        return res.status(409).json({
          success: false,
          error: 'This Manager Phone Number is already assigned to another account.'
        });
      }
      normalizedManagerPhone = formatted;
    }

    // Validate & enforce account-exclusive WhatsApp Linked Number (if provided)
    const rawLinkedPhone = whatsappLinkedNumber !== undefined ? whatsappLinkedNumber : linkedWhatsappNumber;
    const trimmedLinkedPhone = rawLinkedPhone !== undefined && rawLinkedPhone !== null
      ? String(rawLinkedPhone).trim()
      : '';
    let normalizedLinkedPhone = '';
    if (trimmedLinkedPhone) {
      const formatted = formatPhoneNumber(trimmedLinkedPhone);
      if (!formatted) {
        return res.status(400).json({
          success: false,
          error: 'Invalid WhatsApp Linked Number. Please enter a valid 10-digit or international phone number.'
        });
      }
      const existingLinkedOwner = await store.findUserByPhoneField('whatsappLinkedNumber', formatted);
      if (existingLinkedOwner) {
        return res.status(409).json({
          success: false,
          error: 'This WhatsApp Linked Number is already linked to another account.'
        });
      }
      normalizedLinkedPhone = formatted;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await store.createUser({
      username: normalizedUsername,
      password: hashedPassword,
      name: (name && name.trim()) || 'Gaming Center Staff',
      centerName: (centerName && centerName.trim()) || 'GameDash Arena',
      email: (email && email.trim()) || '',
      whatsappNumber: normalizedManagerPhone,
      whatsappLinkedNumber: normalizedLinkedPhone,
      role: role && ['admin', 'manager', 'cashier'].includes(role) ? role : 'manager'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: serializeUser(newUser)
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

    const tokenPayload = serializeUser(user);
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: serializeUser(user)
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
      user: serializeUser(user)
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update User Profile & Account-Specific WhatsApp Settings
 */
export async function updateProfile(req, res, next) {
  try {
    const {
      name,
      centerName,
      whatsappNumber,
      managerPhone,
      whatsappLinkedNumber,
      linkedWhatsappNumber
    } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (centerName !== undefined) updates.centerName = String(centerName).trim();

    const rawManagerPhone = whatsappNumber !== undefined ? whatsappNumber : managerPhone;
    if (rawManagerPhone !== undefined) {
      const trimmed = rawManagerPhone === null ? '' : String(rawManagerPhone).trim();
      if (!trimmed) {
        updates.whatsappNumber = '';
      } else {
        const formatted = formatPhoneNumber(trimmed);
        if (!formatted) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Manager Phone Number. Please enter a valid 10-digit or international phone number.'
          });
        }
        const existingOwner = await store.findUserByPhoneField('whatsappNumber', formatted, req.user.id);
        if (existingOwner) {
          return res.status(409).json({
            success: false,
            error: 'This Manager Phone Number is already assigned to another account.'
          });
        }
        updates.whatsappNumber = formatted;
      }
    }

    const rawLinkedPhone = whatsappLinkedNumber !== undefined ? whatsappLinkedNumber : linkedWhatsappNumber;
    let linkedNumberUpdated = false;
    if (rawLinkedPhone !== undefined) {
      const trimmed = rawLinkedPhone === null ? '' : String(rawLinkedPhone).trim();
      linkedNumberUpdated = true;
      if (!trimmed) {
        updates.whatsappLinkedNumber = '';
      } else {
        const formatted = formatPhoneNumber(trimmed);
        if (!formatted) {
          return res.status(400).json({
            success: false,
            error: 'Invalid WhatsApp Linked Number. Please enter a valid 10-digit or international phone number.'
          });
        }
        const existingOwner = await store.findUserByPhoneField('whatsappLinkedNumber', formatted, req.user.id);
        if (existingOwner) {
          return res.status(409).json({
            success: false,
            error: 'This WhatsApp Linked Number is already linked to another account.'
          });
        }
        updates.whatsappLinkedNumber = formatted;
      }
    }

    const updated = await store.updateUser(req.user.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (linkedNumberUpdated) {
      await whatsappService.syncUserLinkedNumber(req.user.id, updated.whatsappLinkedNumber || '');
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: serializeUser(updated)
    });
  } catch (err) {
    next(err);
  }
}
