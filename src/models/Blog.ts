
import { Schema, model } from 'mongoose';

const blogSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  coverImage: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  published: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default model('Blog', blogSchema);
