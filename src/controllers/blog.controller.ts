
import { Request, Response } from 'express';
import Blog from '../models/Blog';
import { uploadToCloudinary } from '../lib/cloudinary';
import multer from 'multer';

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

export const upload = multer({ storage: storage });

export const createBlog = async (req: Request, res: Response) => {
  const { title, content, author, published, category } = req.body;
  if (!title?.trim() || !content?.trim() || !author?.trim() || !category?.trim()) {
    return res.status(400).json({
      message: 'Missing required fields.'
    });
  }

  const blogSlug = title.toLowerCase().replace(/\s+/g, '-');

  let coverImage: string = '';
  if (req.file) {
    coverImage = await uploadToCloudinary(req.file);
  }

  const newBlog = new Blog({
    title,
    slug: blogSlug,
    content,
    author,
    published,
    category,
    coverImage
  });

  const savedBlog = await newBlog.save();

  res.status(201).json(savedBlog);
};

export const getBlogs = async (_req: Request, res: Response) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
};

export const getFilteredBlogs = async (req: Request, res: Response) => {
  const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });
  res.json(blogs);
}

export const getBlogById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: 'Invalid blog ID.' });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, author, published, category } = req.body;

  let coverImage: string = '';
  if (req.file) {
    coverImage = await uploadToCloudinary(req.file);
  }

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }
    blog.title = title;
    blog.content = content;
    blog.author = author;
    blog.published = published;
    blog.category = category;
    blog.coverImage = coverImage;
    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ message: 'Invalid blog ID.' });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }
    res.json({ message: 'Blog deleted successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid blog ID.' });
  }
};

