import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validationMiddleware';
import {
  registerUserSchema,
  loginUserSchema,
  refreshTokenSchema
} from '../utils/validation';

const router = Router();

router.post(
  '/register',
  validateBody(registerUserSchema),
  AuthController.register
);

router.post(
  '/login',
  validateBody(loginUserSchema),
  AuthController.login
);

router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  AuthController.refresh
);

router.post(
  '/logout',
  authenticateToken,
  AuthController.logout
);

router.get(
  '/me',
  authenticateToken,
  AuthController.getProfile
);

export default router;
