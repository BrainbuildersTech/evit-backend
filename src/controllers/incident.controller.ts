
import { Request, Response } from 'express';
import Incident from '../models/Incident';
import { addFactcheckJob } from '../queues/factcheck.queue';
import { isEmail, isMobilePhone } from 'validator';
import multer from 'multer';
import { uploadToCloudinary } from '../lib/cloudinary';

export const upload = multer({ storage: multer.memoryStorage() });

export const createIncident = async (req: Request, res: Response) => {
  try {
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

    // Validation
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

    if (incidentType === 'Other' && !otherIncidentType) {
      return res.status(400).json({ message: 'Other incident type must be specified when "Other" is selected.' });
    }

    if (!isAnonymous && (!reporterName || !reporterEmail || !reporterPhone)) {
      return res.status(400).json({ message: 'Reporter information is required for non-anonymous reports.' });
    }

    // Handle media files upload
    const files = (req.files as Express.Multer.File[]) || [];
    let evidenceUrls: string[] = [];

    if (files.length > 0) {
      try {
        evidenceUrls = await Promise.all(
          files.map((file) => uploadToCloudinary(file))
        );
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(400).json({
          message: 'Failed to upload media files. Please ensure they are valid images or videos.'
        });
      }
    }

    // Parse tags if it's a string
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [];
      }
    }

    const incident = new Incident({
      title,
      incidentType: incidentType === 'Other' ? otherIncidentType : incidentType,
      state,
      ward,
      pollingUnit,
      selectedLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address
      },
      date,
      description,
      tags: parsedTags,
      lga,
      reporterName,
      reporterEmail,
      reporterPhone,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      media: evidenceUrls
    });

    const savedIncident = await incident.save();

    // enqueue background factcheck job (do not block response)
    try {
      addFactcheckJob(savedIncident._id?.toString(), description || savedIncident.description as string);
    } catch (e) {
      console.error('Failed to enqueue factcheck job', e);
    }

    res.status(201).json(savedIncident);
  } catch (error) {
    console.error('createIncident error:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getIncidents = async (_req: Request, res: Response) => {
  const incidents = await Incident.find().sort({ createdAt: -1 });
  res.json(incidents);
};

export const getVerifiedIncidents = async (_req: Request, res: Response) => {
  const incidents = await Incident.find({ verificationStatus: 'verified' }).sort({ createdAt: -1 });
  res.json(incidents);
};

export const updateVerification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body;
  try {
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (action === 'verify') {
      incident.verificationStatus = 'verified';
    } else if (action === 'reject') {
      incident.verificationStatus = 'rejected';
    } else if (action === 'investigate') {
      incident.verificationStatus = 'investigating';
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be "verify" or "reject".' });
    }

    const result = await incident.save();
    res.json({ message: `Incident ${result.verificationStatus} successfully` });
  } catch (error) {
    console.error('updateVerification error:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
