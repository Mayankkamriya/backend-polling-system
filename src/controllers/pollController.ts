import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { asyncHandler, createError } from '../middleware/errorHandler';
import type { CreatePollInput, UpdatePollInput, PaginationInput, PollQueryInput } from '../utils/validation';

const prisma = new PrismaClient();

export class PollController {
  private static io: Server;

  static setSocketIO(io: Server) {
    this.io = io;
  }

  static createPoll = asyncHandler(async (req: Request, res: Response) => {
    const { question, options, isPublished = false }: CreatePollInput = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const poll = await prisma.$transaction(async (tx) => {
      const createdPoll = await tx.poll.create({
        data: {
          question,
          isPublished,
          creatorId: userId
        }
      });

      await tx.pollOption.createMany({
        data: options.map(option => ({
          text: option.text,
          pollId: createdPoll.id
        }))
      });

      return await tx.poll.findUnique({
        where: { id: createdPoll.id },
        include: {
          options: true,
          creator: {
            select: { id: true, name: true }
          }
        }
      });
    });

    if (isPublished && this.io && this.io.broadcastNewPoll) {
      await this.io.broadcastNewPoll(poll!.id);
    }

    res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  });

  static getAllPolls = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 }: PaginationInput = req.query as any;
    const { published, creator, search }: PollQueryInput = req.query as any;

    const skip = (page - 1) * limit;
    const where: any = {};

    // By default, only show published polls for public consumption
    // Set to false explicitly or provide 'all' to see unpublished polls
 if (published !== undefined) {
      let publishedValue: boolean;
     
      // Convert string 'true'/'false' to boolean
      if (typeof published === 'string') {
        publishedValue = published.toLowerCase() === 'true';
      } else if (typeof published === 'boolean') {
        publishedValue = published;
      } else {
        publishedValue = Boolean(published);
      }
     
      where.isPublished = publishedValue;
    } else {
      // No isPublished filter added, so returns all polls
    }

    if (creator) {
      where.creatorId = creator;
    }

    if (search) {
      where.question = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [polls, totalCount] = await Promise.all([
      prisma.poll.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true }
              }
            }
          },
          creator: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.poll.count({ where })
    ]);

    const pollsWithStats = polls.map(poll => ({
      ...poll,
      totalVotes: poll.options.reduce((sum, option) => sum + option._count.votes, 0),
      options: poll.options.map(({ _count, ...option }) => ({
        ...option,
        voteCount: _count.votes
      }))
    }));

    res.json({
      polls: pollsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  });

  static getPollById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    if (!poll) {
      throw createError('Poll not found', 404);
    }

    const pollWithStats = {
      ...poll,
      totalVotes: poll.options.reduce((sum, option) => sum + option._count.votes, 0),
      options: poll.options.map(({ _count, ...option }) => ({
        ...option,
        voteCount: _count.votes
      }))
    };

    res.json({ poll: pollWithStats });
  });

  static updatePoll = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { question, isPublished }: UpdatePollInput = req.body;

    const poll = await prisma.poll.update({
      where: { id },
      data: {
        ...(question && { question }),
        ...(isPublished !== undefined && { isPublished })
      },
      include: {
        options: true,
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    if (isPublished && this.io && this.io.broadcastNewPoll) {
      await this.io.broadcastNewPoll(poll.id);
    }

    res.json({
      message: 'Poll updated successfully',
      poll
    });
  });

  static deletePoll = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.poll.delete({
      where: { id }
    });

    res.json({
      message: 'Poll deleted successfully'
    });
  });

  static publishPoll = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const poll = await prisma.poll.update({
      where: { id },
      data: { isPublished: true },
      include: {
        options: true,
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    if (this.io && this.io.broadcastNewPoll) {
      await this.io.broadcastNewPoll(poll.id);
    }

    res.json({
      message: 'Poll published successfully',
      poll
    });
  });

  static getPollResults = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    });

    if (!poll) {
      throw createError('Poll not found', 404);
    }

    const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0);

    const results = {
      pollId: poll.id,
      question: poll.question,
      totalVotes,
      options: poll.options.map(option => ({
        id: option.id,
        text: option.text,
        voteCount: option._count.votes,
        percentage: totalVotes > 0 ? ((option._count.votes / totalVotes) * 100).toFixed(1) : '0'
      }))
    };

    res.json({ results });
  });
}
