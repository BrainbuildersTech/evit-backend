
import { Schema, model } from 'mongoose';

const incidentSchema = new Schema({
  title: String,
  description: String,
  state: String,
  location: String,
  date: Date,
  electionPhase: String,
  violenceType: String,
  severity: String,
  media: [String],
  verificationStatus: {
    type: String,
    enum: ['pending', 'under-review', 'verified', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export default model('Incident', incidentSchema);
