import { Router } from 'express';
import { z } from 'zod';
import { VoteController } from '../controllers/voteController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validationMiddleware';
import {
  submitVoteSchema,
  pollIdSchema,
  paginationSchema
} from '../utils/validation';

const router = Router();

router.post(
  '/polls/:pollId/vote',
  authenticateToken,
  validateParams(z.object({ pollId: z.string().min(1, 'Poll ID is required') })),
  validateBody(submitVoteSchema),
  VoteController.submitVote
);

router.get(
  '/polls/:pollId/my-vote',
  authenticateToken,
  validateParams(z.object({ pollId: z.string().min(1, 'Poll ID is required') })),
  VoteController.getMyVoteForPoll
);

router.get(
  '/votes/my-votes',
  authenticateToken,
  validateQuery(paginationSchema),
  VoteController.getMyVotes
);

export default router;
