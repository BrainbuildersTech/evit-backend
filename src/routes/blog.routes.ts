
import { Router } from 'express';
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  getFilteredBlogs,
  updateBlog,
  upload
} from '../controllers/blog.controller';
import { adminInterceptor } from '../middleware/admin.middleware';

const router = Router();

router.post('/', adminInterceptor, upload.single("file"), createBlog);
router.get('/', adminInterceptor, getBlogs);
router.get('/published', getFilteredBlogs);
router.route('/:id').get(getBlogById).patch(adminInterceptor, upload.single("file"), updateBlog).delete(adminInterceptor, deleteBlog);

export default router;
