
import { Router } from 'express';
import { createAdmin, login } from '../controllers/auth.controller';
import { adminInterceptor } from '../middleware/admin.middleware';

const router = Router();

router.post('/login', login);
router.post("/register", adminInterceptor, createAdmin);

export default router;
