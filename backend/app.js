import { promisify } from 'node:util';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';

import { createSchoolData } from './data/schoolData.js';

const DEMO_PASSWORD_HASH = '$2b$12$hAMvkH4mVG9e7Jr0hjcwWuy56zQs48n8vIrT/R6QomFrF3EnnhyCu';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const actionSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function publicUser(actor) {
  return {
    id: actor.id,
    actorId: actor.id,
    role: actor.role,
    name: actor.name,
    title: actor.title,
    email: actor.email,
  };
}

function requireLogin(req, res, next) {
  if (!req.session.actorId) {
    return sendError(res, 401, 'LOGIN_REQUIRED', 'Please log in to continue.');
  }
  return next();
}

export function createApp(sessionSecret = process.env.SESSION_SECRET) {
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('Set SESSION_SECRET to a value with at least 32 characters.');
  }

  const app = express();
  const schoolData = createSchoolData();
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Security, CORS, JSON parsing, and cookie sessions
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000,
    },
  }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      sendError(res, 429, 'TOO_MANY_LOGIN_ATTEMPTS', 'Too many login attempts. Try again later.'),
  });

  // 2. Authentication routes
  app.get('/api/auth/session', (req, res) => {
    const actor = schoolData.actors.find((item) => item.id === req.session.actorId);
    return res.json({ user: actor ? publicUser(actor) : null });
  });

  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'INVALID_LOGIN', 'Enter a valid email address and password.');
    }

    const email = parsed.data.email.trim().toLowerCase();
    const actor = schoolData.actors.find((item) => item.email.toLowerCase() === email);
    const passwordMatches = await bcrypt.compare(parsed.data.password, DEMO_PASSWORD_HASH);

    if (!actor || !passwordMatches) {
      return sendError(res, 401, 'LOGIN_FAILED', 'Email or password is incorrect.');
    }

    await promisify(req.session.regenerate.bind(req.session))();
    req.session.actorId = actor.id;

    return res.json({ user: publicUser(actor) });
  });

  app.post('/api/auth/logout', async (req, res, next) => {
    try {
      await promisify(req.session.destroy.bind(req.session))();
      res.clearCookie('connect.sid', {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
      });
      return res.json({ message: 'You are logged out.' });
    } catch (error) {
      return next(error);
    }
  });

  // 3. School data and actions
  app.get('/api/school-data', requireLogin, (req, res) => {
    return res.json({ data: schoolData });
  });

  app.post('/api/actions', requireLogin, (req, res) => {
    if (!actionSchema.safeParse(req.body).success) {
      return sendError(res, 400, 'INVALID_ACTION', 'Send an action with a type and an object payload.');
    }
    return sendError(res, 501, 'ACTION_NOT_IMPLEMENTED', 'This action is not handled by the demo backend yet.');
  });

  // 4. Fallback 404 and error handler
  app.use((req, res) => {
    return sendError(res, 404, 'NOT_FOUND', 'This API route does not exist.');
  });

  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      return sendError(res, 400, 'INVALID_JSON', 'Send a valid JSON request body.');
    }
    if (error.type === 'entity.too.large') {
      return sendError(res, 413, 'REQUEST_TOO_LARGE', 'The request body is too large.');
    }
    console.error(error);
    return sendError(res, 500, 'SERVER_ERROR', 'The server could not complete the request.');
  });

  return app;
}
