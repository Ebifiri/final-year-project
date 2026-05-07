import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy }    from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import User from '../models/User.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Helper: find or create an OAuth user ─────────────────────────────────────
async function findOrCreateOAuthUser({ provider, oauthId, name, email }) {
  // Try to find by OAuth ID first
  let user = await User.findOne({ oauthProvider: provider, oauthId });
  if (user) return user;

  // Then try by email (link existing account)
  user = await User.findOne({ email });
  if (user) {
    user.oauthProvider = provider;
    user.oauthId       = oauthId;
    await user.save();
    return user;
  }

  // Create brand new user
  return User.create({ name, email, oauthProvider: provider, oauthId });
}

// ── Passport: Google ──────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (_at, _rt, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser({
          provider: 'google',
          oauthId:  profile.id,
          name:     profile.displayName,
          email:    profile.emails?.[0]?.value ?? '',
        });
        done(null, user);
      } catch (err) { done(err); }
    }
  ));
}

// ── Passport: Microsoft ───────────────────────────────────────────────────────
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy(
    {
      clientID:     process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL:  `${process.env.BACKEND_URL}/api/auth/microsoft/callback`,
      scope:        ['openid', 'profile', 'email'],
    },
    async (_at, _rt, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser({
          provider: 'microsoft',
          oauthId:  profile.id,
          name:     profile.displayName,
          email:    profile.emails?.[0]?.value ?? profile._json?.mail ?? '',
        });
        done(null, user);
      } catch (err) { done(err); }
    }
  ));
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user  = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// ── Google OAuth routes ───────────────────────────────────────────────────────
const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google', (req, res, next) => {
  if (!googleConfigured) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleConfigured) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
  }
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth`,
  })(req, res, next);
}, (req, res) => {
  const token = signToken(req.user._id);
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
});

// ── Microsoft OAuth routes ────────────────────────────────────────────────────
const microsoftConfigured = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);

router.get('/microsoft', (req, res, next) => {
  if (!microsoftConfigured) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
  }
  passport.authenticate('microsoft', { session: false })(req, res, next);
});

router.get('/microsoft/callback', (req, res, next) => {
  if (!microsoftConfigured) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
  }
  passport.authenticate('microsoft', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth`,
  })(req, res, next);
}, (req, res) => {
  const token = signToken(req.user._id);
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
});

export default router;
