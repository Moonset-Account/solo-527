import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import campRoutes from './camp.routes';
import courseRoutes from './course.routes';
import memberRoutes from './member.routes';
import checkInRoutes from './checkin.routes';
import conversionRoutes from './conversion.routes';
import todoRoutes from './todo.routes';
import laggingRoutes from './lagging.routes';
import reportRoutes from './report.routes';
import logRoutes from './log.routes';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use(authMiddleware);
router.use('/users', userRoutes);
router.use('/camps', campRoutes);
router.use('/courses', courseRoutes);
router.use('/members', memberRoutes);
router.use('/checkins', checkInRoutes);
router.use('/conversions', conversionRoutes);
router.use('/todos', todoRoutes);
router.use('/lagging', laggingRoutes);
router.use('/reports', reportRoutes);
router.use('/logs', logRoutes);

export default router;
