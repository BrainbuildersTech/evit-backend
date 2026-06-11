
import { Schema, model } from 'mongoose';

const incidentSchema = new Schema({
  title: String,
  incidentType: String,
  pollingUnit: String,
  lga: String,
  selectedLocation: {
    latitude: Number,
    longitude: Number,
    address: { type: String, null: true }
  },
  tags: [String],
  reporterName: { type: String, null: true },
  reporterEmail: { type: String, null: true },
  reporterPhone: { type: String, null: true },
  description: String,
  state: String,
  ward: String,
  date: Date,
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  electionPhase: { type: String, null: true },
  isAnonymous: { type: Boolean, default: true },
  media: [String],
  verificationStatus: {
    type: String,
    enum: ['pending', 'investigating', 'verified', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export default model('Incident', incidentSchema);
