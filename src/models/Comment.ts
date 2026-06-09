import { Schema, model } from "mongoose";

const commentSchema = new Schema({
  comment: String,
  commenterName: {
    type: String,
    null: true
  },
  incident: { type: Schema.Types.ObjectId, ref: 'Comment' }
}, {
  timestamps: true
});

export default model('Comment', commentSchema);