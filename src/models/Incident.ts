
import { Schema, model } from 'mongoose';

const incidentSchema = new Schema({
  reportId: { type: String, unique: true, sparse: true },
  title: String,
  incidentType: String,
  electionYear: Number,
  electionType: String,
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
  time: String,
  violenceCategory: String,
  fatalities: Number,
  injuries: Number,
  propertyDamage: { type: String, null: true },
  source: String,
  sourceLink: { type: String, null: true },
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  electionPhase: { type: String, null: true },
  isAnonymous: { type: Boolean, default: true },
  media: [String],
  aiReview: { type: String, null: true },
  verificationStatus: {
    type: String,
    enum: ['pending', 'investigating', 'verified', 'rejected'],
    default: 'pending'
  },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

export default model('Incident', incidentSchema);
