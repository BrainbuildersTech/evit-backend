
import { Request, Response } from 'express';
import Incident from '../models/Incident';
import { isEmail, isMobilePhone } from 'validator';
import multer from 'multer';
import cloudinary from '../lib/cloudinary';

export const upload = multer({ storage: multer.memoryStorage() });

export const createIncident = async (req: Request, res: Response) => {
  const {
    title,
    incidentType,
    state,
    ward,
    pollingUnit,
    latitude,
    longitude,
    address,
    description,
    tags,
    reporterName,
    reporterEmail,
    reporterPhone,
    isAnonymous,
    otherIncidentType,
    lga,
    date
  } = req.body;

  if (
    !title?.trim() ||
    !incidentType?.trim() ||
    !state?.trim() ||
    !pollingUnit?.trim() ||
    !ward?.trim() ||
    !lga?.trim() ||
    !address?.trim() ||
    !description?.trim() ||
    !date
  ) {
    return res.status(400).json({
      message: 'Missing required fields.'
    });
  }

  
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      message: 'Invalid date format.'
    });
  }

  if (incidentType === 'Other' && !otherIncidentType) return res.status(400).json({ message: 'Other incident type must be specified when "Other" is selected.' });

  if (!isAnonymous && (!reporterName || !reporterEmail || !reporterPhone)) return res.status(400).json({ message: 'Reporter information is required for non-anonymous reports.' });

  // if ((reporterEmail && reporterEmail.length > 0) && !isEmail(reporterEmail)) return res.status(400).json({ message: 'Invalid reporter email format.' });

  // if ((reporterPhone && reporterPhone.length > 0) && !isMobilePhone(reporterPhone)) return res.status(400).json({ message: 'Invalid reporter phone number format.' });

  let evidenceUrls: string[] = [];
  if (req.files) {
    for (const file of req.files as Express.Multer.File[]) {
      try {
        const result = await cloudinary.uploader.upload(file.path);
        evidenceUrls.push(result.secure_url);
      } catch (error) {
        console.log('Error uploading file to Cloudinary:', error);
        return res.status(400).json(error);
      }
    }
  }

  const incident = new Incident({
    title,
    incidentType: incidentType === 'Other' ? otherIncidentType : incidentType,
    state,
    ward,
    pollingUnit,
    selectedLocation: {
      latitude,
      longitude,
      address
    },
    date,
    description,
    tags: Array.isArray(tags)
      ? tags
      : tags
        ? tags.split(',').map((tag: string) => tag.trim())
        : [],
    lga,
    reporterName,
    reporterEmail,
    reporterPhone,
    isAnonymous,
    media: evidenceUrls
  });

  const savedIncident = await incident.save();

  res.status(201).json(savedIncident);
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
