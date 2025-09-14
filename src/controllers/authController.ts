import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JWTService } from '../utils/jwt';
import { PasswordService } from '../utils/password';
import { asyncHandler, createError } from '../middleware/errorHandler';
import type { RegisterUserInput, LoginUserInput, RefreshTokenInput } from '../utils/validation';

const prisma = new PrismaClient();

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password }: RegisterUserInput = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    const passwordHash = await PasswordService.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    const tokens = JWTService.generateTokens(user);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      tokens
    });
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginUserInput = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true
      }
    });

    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    const isValidPassword = await PasswordService.comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw createError('Invalid email or password', 401);
    }

    const tokens = JWTService.generateTokens(user);
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      tokens
    });
  });

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken }: RefreshTokenInput = req.body;

    const payload = JWTService.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw createError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    const newTokens = JWTService.generateTokens(user);

    res.json({
      message: 'Tokens refreshed successfully',
      tokens: newTokens
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: 'Logged out successfully'
    });
  });

  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            polls: true,
            votes: true
          }
        }
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({ user });
  });
}
