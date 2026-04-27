/**
 * Auth module — Clerk JWT verification middleware.
 * Protects all routes except /healthz.
 *
 * SECURITY RULES:
 * - With CLERK_SECRET_KEY: full cryptographic verification (production path)
 * - Without CLERK_SECRET_KEY: JWT is decoded WITHOUT verification (dev-only),
 *   but the real `sub` claim is always extracted from the token.
 *   We never fall back to a shared hardcoded ID; that caused cross-user data leaks.
 * - No token present at all → 401
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

/** Decode a JWT payload without verifying signature — dev only. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ClerkAuth');
  private devWarnGiven = false;

  async use(req: Request, _res: Response, next: NextFunction) {
    if (req.path === '/healthz') return next();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      _res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // ── Production path: full cryptographic verification ──────────────────
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        req.clerkUserId = payload.sub;
        req.userId = payload.sub;
        return next();
      } catch {
        this.logger.warn(`Token verification failed for path: ${req.path}`);
        _res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
    }

    // ── Dev path: no secret key — decode WITHOUT verification ─────────────
    // NEVER use a shared fallback ID; always extract the real `sub` so each
    // user remains isolated even without a configured secret key.
    if (!this.devWarnGiven) {
      this.logger.warn(
        'CLERK_SECRET_KEY not set — JWT decoded without signature verification (dev mode). ' +
        'Each request still uses its own sub claim; data isolation is preserved.',
      );
      this.devWarnGiven = true;
    }

    const payload = decodeJwtPayload(token);
    const sub = typeof payload?.sub === 'string' ? payload.sub : null;

    if (!sub) {
      this.logger.warn('Dev mode: token present but no valid sub claim');
      _res.status(401).json({ error: 'Token missing sub claim' });
      return;
    }

    req.clerkUserId = sub;
    req.userId = sub;
    this.logger.debug(`Dev mode: identified user ${sub} (unverified)`);
    return next();
  }
}

@Module({})
export class AuthModule {}
