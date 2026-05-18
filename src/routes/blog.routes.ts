
import { Router } from 'express';
import {
  createBlog,
  getBlogs
} from '../controllers/blog.controller';

const router = Router();

router.post('/', createBlog);
router.get('/', getBlogs);

export default router;
