/**
 * Auth module — Clerk JWT verification middleware.
 * Protects all routes except /healthz.
 */
import {
  Injectable,
  NestMiddleware,
  Module,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

// Extend Express Request with userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      clerkUserId?: string;
    }
  }
}

@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ClerkAuth');
  private devBypassWarned = false;

  async use(req: Request, _res: Response, next: NextFunction) {
    // Skip auth for health check
    if (req.path === '/healthz') {
      return next();
    }

    // In development without Clerk keys, allow bypass
    if (!process.env.CLERK_SECRET_KEY) {
      if (!this.devBypassWarned) {
        this.logger.warn('CLERK_SECRET_KEY not set — auth bypassed (dev mode)');
        this.devBypassWarned = true;
      }
      req.userId = 'dev-user-001';
      req.clerkUserId = 'dev-clerk-001';
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      _res.status(401).json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      req.clerkUserId = payload.sub;
      req.userId = payload.sub; // Will be mapped to internal user ID in the service layer
      next();
    } catch (err) {
      this.logger.warn('Token verification failed');
      _res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}

@Module({})
export class AuthModule {}
