import { Router } from 'express';
import { PollController } from '../controllers/pollController';
import { authenticateToken, requirePollOwnership } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validationMiddleware';
import {
  createPollSchema,
  updatePollSchema,
  pollIdSchema,
  paginationSchema,
  pollQuerySchema
} from '../utils/validation';

const router = Router();

router.post(
  '/',
  authenticateToken,
  validateBody(createPollSchema),
  PollController.createPoll
);

router.get(
  '/',
  validateQuery(paginationSchema.merge(pollQuerySchema)),
  PollController.getAllPolls
);

router.get(
  '/:id',
  validateParams(pollIdSchema),
  PollController.getPollById
);

router.put(
  '/:id',
  authenticateToken,
  validateParams(pollIdSchema),
  validateBody(updatePollSchema),
  requirePollOwnership,
  PollController.updatePoll
);

router.delete(
  '/:id',
  authenticateToken,
  validateParams(pollIdSchema),
  requirePollOwnership,
  PollController.deletePoll
);

router.put(
  '/:id/publish',
  authenticateToken,
  validateParams(pollIdSchema),
  requirePollOwnership,
  PollController.publishPoll
);

router.get(
  '/:id/results',
  validateParams(pollIdSchema),
  PollController.getPollResults
);

export default router;
