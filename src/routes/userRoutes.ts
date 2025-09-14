import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateParams } from '../middleware/validationMiddleware';
import { userIdSchema } from '../utils/validation';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

router.get(
  '/:id',
  validateParams(userIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            polls: true,
            votes: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({ user });
  })
);

export default router;
