
import { Request, Response } from 'express';
import Blog from '../models/Blog';

export const createBlog = async (req: Request, res: Response) => {
  const { title, content, author, published, category } = req.body;
  if (!title?.trim() || !content?.trim() || !author?.trim() || !category?.trim()) {
    return res.status(400).json({
      message: 'Missing required fields.'
    });
  }

  const blogSlug = title.toLowerCase().replace(/\s+/g, '-');

  const newBlog = new Blog({
    title,
    slug: blogSlug,
    content,
    author,
    published,
    category
  });

  const savedBlog = await newBlog.save();

  res.status(201).json(savedBlog);
};

export const getBlogs = async (_req: Request, res: Response) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
};

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

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        content,
        author,
        published,
        category
      },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }
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

