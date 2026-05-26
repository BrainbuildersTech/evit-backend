
import { Schema, model } from 'mongoose';

const incidentSchema = new Schema({
  title: String,
  incidentType: String,
  specificArea: String,
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
  location: String,
  date: Date,
  electionPhase: String,
  isAnonymous: { type: Boolean, default: true },
  media: [String],
  verificationStatus: {
    type: String,
    enum: ['pending', 'under-review', 'verified', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export default model('Incident', incidentSchema);
