import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { JWTService } from '../utils/jwt';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required'
      });
      return;
    }

    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
      return;
    }

    const payload = JWTService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

export const requirePollOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pollId = req.params.id || req.params.pollId;
    const userId = req.user?.id;

    if (!pollId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Poll ID is required'
      });
      return;
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        creatorId: true
      }
    });

    if (!poll) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
      return;
    }

    if (poll.creatorId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only modify your own polls'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Poll ownership check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify poll ownership'
    });
  }
};
