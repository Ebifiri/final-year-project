import mongoose from 'mongoose';

/**
 * Validate that a value is a valid MongoDB ObjectId.
 */
export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

/**
 * Validate email format.
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validate password strength.
 * At least 8 chars, 1 uppercase, 1 lowercase, 1 number.
 */
export function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Sanitise a string: trim and enforce max length.
 */
export function sanitiseString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

/**
 * Express middleware: validate registration input.
 */
export function validateRegistration(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email and password' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number',
    });
  }

  // Sanitise string fields
  req.body.name  = sanitiseString(req.body.name, 100);
  req.body.email = sanitiseString(req.body.email, 254);

  next();
}

/**
 * Express middleware: validate login input.
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  next();
}

/**
 * Express middleware: validate that a route param is a valid ObjectId.
 * Usage: router.get('/:id', validateObjectIdParam('id'), handler)
 */
export function validateObjectIdParam(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (value && !isValidObjectId(value)) {
      return res.status(400).json({ message: `Invalid ${paramName} format` });
    }
    next();
  };
}
