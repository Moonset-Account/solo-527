import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { login, logout, me, changePassword } from '../controllers/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', auth, logout);
router.get('/me', auth, me);
router.post('/change-password', auth, changePassword);

export default router;
