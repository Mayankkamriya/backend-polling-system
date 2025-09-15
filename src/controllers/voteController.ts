import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { asyncHandler, createError } from '../middleware/errorHandler';
import type { SubmitVoteInput } from '../utils/validation';

const prisma = new PrismaClient();

export class VoteController {
  private static io: Server;

  static setSocketIO(io: Server) {
    this.io = io;
  }

  static submitVote = asyncHandler(async (req: Request, res: Response) => {
    const { pollId } = req.params;
    const { pollOptionId }: SubmitVoteInput = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId, isPublished: true },
      include: {
        options: {
          where: { id: pollOptionId }
        }
      }
    });

    if (!poll) {
      throw createError('Poll not found or not published', 404);
    }

    if (poll.options.length === 0) {
      throw createError('Invalid poll option', 400);
    }

    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        pollOption: {
          pollId
        }
      },
      include: {
        pollOption: true
      }
    });

    let vote;
    let message;

    if (existingVote) {
      if (existingVote.pollOptionId === pollOptionId) {
        throw createError('You have already voted for this option', 409);
      }

      vote = await prisma.vote.update({
        where: { id: existingVote.id },
        data: { pollOptionId },
        include: {
          pollOption: {
            include: {
              poll: true
            }
          }
        }
      });
      message = 'Vote updated successfully';
    } else {
      vote = await prisma.vote.create({
        data: {
          userId,
          pollOptionId
        },
        include: {
          pollOption: {
            include: {
              poll: true
            }
          }
        }
      });
      message = 'Vote submitted successfully';
    }

    if (this.io && this.io.broadcastVoteUpdate) {
      await this.io.broadcastVoteUpdate(pollId);
    }

    res.json({
      message,
      vote: {
        id: vote.id,
        pollOptionId: vote.pollOptionId,
        optionText: vote.pollOption.text,
        pollQuestion: vote.pollOption.poll.question,
        createdAt: vote.createdAt
      }
    });
  });

  static getMyVotes = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [votes, totalCount] = await Promise.all([
      prisma.vote.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          pollOption: {
            include: {
              poll: {
                select: {
                  id: true,
                  question: true,
                  isPublished: true
                }
              }
            }
          }
        }
      }),
      prisma.vote.count({
        where: { userId }
      })
    ]);

    const formattedVotes = votes.map(vote => ({
      id: vote.id,
      createdAt: vote.createdAt,
      option: {
        id: vote.pollOption.id,
        text: vote.pollOption.text
      },
      poll: vote.pollOption.poll
    }));

    res.json({
      votes: formattedVotes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  });

  static getMyVoteForPoll = asyncHandler(async (req: Request, res: Response) => {
    const { pollId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const vote = await prisma.vote.findFirst({
      where: {
        userId,
        pollOption: {
          pollId
        }
      },
      include: {
        pollOption: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });

    res.json({
      hasVoted: !!vote,
      vote: vote ? {
        id: vote.id,
        option: vote.pollOption,
        createdAt: vote.createdAt
      } : null
    });
  });
}
