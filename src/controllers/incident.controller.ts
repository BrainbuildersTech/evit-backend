
import { Request, Response } from 'express';
import Incident from '../models/Incident';
import { isEmail, isMobilePhone   } from 'validator';
import cloudinary from '../lib/cloudinary';

export const createIncident = async (req: Request, res: Response) => {
  const { title, incidentType, state, location, specificArea, selectedLocation: { latitude, longitude, address }, evidence, description, tags, reporterName, reporterEmail, reporterPhone, isAnonymous, date, otherIncidentType } = req.body;

  if (!title || !incidentType || !state || !location || !specificArea || !latitude || !longitude || !description) {
    return res.status(400).json({ message: 'Missing required fields. (Title, Incident Type, State, Location, Specific Area, Latitude, Longitude, Description)' });
  }

  if (incidentType === 'Other' && !otherIncidentType) {
    return res.status(400).json({ message: 'Other incident type must be specified when "Other" is selected.' });
  }

  if (!isAnonymous && (!reporterName || !reporterEmail || !reporterPhone)) {
    return res.status(400).json({ message: 'Reporter information is required for non-anonymous reports.' });
  }

  if (!isEmail(reporterEmail)) {
    return res.status(400).json({ message: 'Invalid reporter email format.' });
  }

  if (!isMobilePhone(reporterPhone)) {
    return res.status(400).json({ message: 'Invalid reporter phone number format.' });
  }

  if (evidence && !Array.isArray(evidence)) {
    return res.status(400).json({ message: 'Evidence must be an array of media URLs.' });
  }

  let evidenceUrls: string[] = [];
  if (evidence) {
    for (const file of evidence) {
      cloudinary.uploader.upload(file.path, { folder: 'evit' }, (error: any, result: { secure_url: string; }) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Failed to upload evidence.' });
        }
        evidenceUrls.push(result.secure_url);
      });
    }
  }

  const incident = await Incident.create({
    title, incidentType, state, location, specificArea, selectedLocation: { latitude, longitude, address }, description, tags, reporterName, reporterEmail, reporterPhone, isAnonymous, date, media: evidenceUrls
  });

  res.status(201).json(incident);
};

export const getIncidents = async (_req: Request, res: Response) => {
  const incidents = await Incident.find().sort({ createdAt: -1 });
  res.json(incidents);
};

export const updateVerification = async (req: Request, res: Response) => {
  const incident = await Incident.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(incident);
};
