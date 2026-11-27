import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { z } from 'zod';

import { createSchoolData } from './data/schoolData.js';

const demoPasswordHash = '$2b$12$hAMvkH4mVG9e7Jr0hjcwWuy56zQs48n8vIrT/R6QomFrF3EnnhyCu';

const loginForm = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const actionForm = z.object({
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

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

function requireLogin(request, response, next) {
  if (!request.session.actorId) {
    return response.status(401).json({
      error: {
        code: 'LOGIN_REQUIRED',
        message: 'Please log in to continue.',
      },
    });
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

  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000,
    },
  }));

  app.get('/api/auth/session', (request, response) => {
    const actor = schoolData.actors.find(
      (item) => item.id === request.session.actorId,
    );

    return response.json({ user: actor ? publicUser(actor) : null });
  });

  app.post('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response) => response.status(429).json({
      error: {
        code: 'TOO_MANY_LOGIN_ATTEMPTS',
        message: 'Too many login attempts. Try again later.',
      },
    }),
  }), async (request, response) => {
    const result = loginForm.safeParse(request.body);

    if (!result.success) {
      return response.status(400).json({
        error: {
          code: 'INVALID_LOGIN',
          message: 'Enter a valid email address and password.',
        },
      });
    }

    const email = result.data.email.trim().toLowerCase();
    const actor = schoolData.actors.find(
      (item) => item.email.toLowerCase() === email,
    );
    const passwordMatches = await bcrypt.compare(
      result.data.password,
      demoPasswordHash,
    );

    if (!actor || !passwordMatches) {
      return response.status(401).json({
        error: {
          code: 'LOGIN_FAILED',
          message: 'Email or password is incorrect.',
        },
      });
    }

    await new Promise((resolve, reject) => {
      request.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    request.session.actorId = actor.id;

    return response.json({ user: publicUser(actor) });
  });

  app.post('/api/auth/logout', (request, response, next) => {
    request.session.destroy((error) => {
      if (error) return next(error);

      response.clearCookie('connect.sid', {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
      });
      return response.json({ message: 'You are logged out.' });
    });
  });

  app.get('/api/school-data', requireLogin, (request, response) => {
    return response.json({ data: schoolData });
  });

  app.post('/api/actions', requireLogin, (request, response) => {
    if (!actionForm.safeParse(request.body).success) {
      return response.status(400).json({
        error: {
          code: 'INVALID_ACTION',
          message: 'Send an action with a type and an object payload.',
        },
      });
    }

    return response.status(501).json({
      error: {
        code: 'ACTION_NOT_IMPLEMENTED',
        message: 'This action is not handled by the demo backend yet.',
      },
    });
  });

  app.use((request, response) => {
    return response.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'This API route does not exist.',
      },
    });
  });

  app.use((error, request, response, next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({
        error: {
          code: 'INVALID_JSON',
          message: 'Send a valid JSON request body.',
        },
      });
    }

    if (error.type === 'entity.too.large') {
      return response.status(413).json({
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: 'The request body is too large.',
        },
      });
    }

    console.error(error);
    return response.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'The server could not complete the request.',
      },
    });
  });

  return app;
}
