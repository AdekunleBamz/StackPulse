import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'stack-pulse-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'stack-pulse-refresh-key';

/**
 * Authentication Middleware
 * Handles JWT verification and refresh token logic
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired', true); // identifiable as refreshable
    }
    throw new UnauthorizedError('Invalid token');
  }
};

/**
 * Generate a new set of tokens
 */
export const generateTokens = (user: any) => {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

export default { authenticate, generateTokens };
