
import { Router } from 'express';
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  updateBlog,
  upload
} from '../controllers/blog.controller';

const router = Router();

router.post('/', upload.single("file"), createBlog);
router.get('/', getBlogs);
router.route('/:id').get(getBlogById).patch(upload.single("file"), updateBlog).delete(deleteBlog);

export default router;
