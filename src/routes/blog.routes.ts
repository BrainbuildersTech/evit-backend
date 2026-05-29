
import { Router } from 'express';
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  updateBlog
} from '../controllers/blog.controller';

const router = Router();

router.post('/', createBlog);
router.get('/', getBlogs);
router.route('/:id').get(getBlogById).patch(updateBlog).delete(deleteBlog);

export default router;
