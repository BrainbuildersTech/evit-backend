
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

// Strip HTML tags so word counting works whether content is rich HTML (new
// editor) or legacy plain text. Backward compatible with existing posts.
const stripHtml = (html: string): string =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, ' ');

const calculateReadingTime = (content: string): number => {
  const words = stripHtml(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

// Produce a URL-safe slug and guarantee uniqueness by appending a short suffix
// when a collision exists. Keeps the unique index happy on rapid re-titling.
const generateUniqueSlug = async (title: string, currentId?: string): Promise<string> => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'post';

  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Blog.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId)) {
      return slug;
    }
    slug = `${base}-${counter++}`;
  }
};

// Tags arrive from FormData as a JSON string (or CSV as a fallback). Normalise
// to a clean string array; never throw on malformed input.
const parseTags = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
    } catch {
      return raw.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
};

const toBool = (v: unknown): boolean => v === true || v === 'true' || v === '1';

export const createBlog = async (req: Request, res: Response) => {
  const { title, content, author, published, category, subtitle, excerpt, featured } = req.body;
  if (!title?.trim() || !content?.trim() || !author?.trim() || !category?.trim()) {
    return res.status(400).json({
      message: 'Missing required fields.'
    });
  }

  const blogSlug = await generateUniqueSlug(title);

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
    coverImage,
    subtitle: subtitle || '',
    excerpt: excerpt || '',
    tags: parseTags(req.body.tags),
    featured: toBool(featured),
    readingTime: calculateReadingTime(content)
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
  const id = String(req.params.id);
  const { title, content, author, published, category, subtitle, excerpt, featured } = req.body;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    // Only overwrite fields that were actually provided so partial updates never
    // clobber existing data (fixes the previous bug that wiped coverImage).
    if (title !== undefined) {
      const newTitle = String(title);
      const titleChanged = newTitle !== blog.title;
      blog.title = newTitle;
      if (newTitle.trim() && titleChanged) {
        blog.slug = await generateUniqueSlug(newTitle, id);
      }
    }
    if (content !== undefined) {
      const newContent = String(content);
      blog.content = newContent;
      blog.readingTime = calculateReadingTime(newContent);
    }
    if (author !== undefined) blog.author = author;
    if (published !== undefined) blog.published = toBool(published);
    if (category !== undefined) blog.category = category;
    if (subtitle !== undefined) blog.subtitle = subtitle;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (featured !== undefined) blog.featured = toBool(featured);
    if (req.body.tags !== undefined) blog.tags = parseTags(req.body.tags);

    // Only replace the cover image when a new file is uploaded; otherwise keep it.
    if (req.file) {
      blog.coverImage = await uploadToCloudinary(req.file);
    }

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

// Inline image upload for the rich text editor body. Reuses the existing
// Cloudinary storage implementation and simply returns the hosted URL.
export const uploadBlogImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }
    const url = await uploadToCloudinary(req.file);
    res.status(201).json({ url });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image.' });
  }
};
