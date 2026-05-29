
import { Schema, model } from 'mongoose';

const blogSchema = new Schema({
  title: String,
  slug: String,
  content: String,
  author: String,
  coverImage: String,
  category: String,
  published: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default model('Blog', blogSchema);
