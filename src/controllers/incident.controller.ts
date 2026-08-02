
import { Request, Response } from 'express';
import Incident from '../models/Incident';
import { addFactcheckJob } from '../queues/factcheck.queue';
import { isEmail, isMobilePhone, isURL } from 'validator';
import multer from 'multer';
import { uploadToCloudinary } from '../lib/cloudinary';

export const upload = multer({ storage: multer.memoryStorage() });

class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

const generateIncidentId = async (year: number) => {
  const prefix = `EV-${year}-`;
  const latestIncident = await Incident.findOne({ reportId: { $regex: `^${prefix}` } })
    .sort({ createdAt: -1 })
    .select('reportId');

  const lastNumber = latestIncident?.reportId ? Number(latestIncident.reportId.split('-').pop()) : 0;
  return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
};

const buildIncidentPayload = async (
  req: Request,
  res: Response,
  reporterOverrides?: { reporterName?: string; reporterEmail?: string; reporterPhone?: string; isAnonymous?: boolean }
): Promise<InstanceType<typeof Incident> | null> => {
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
    date,
    time,
    electionYear,
    electionType,
    violenceCategory,
    fatalities,
    injuries,
    propertyDamage,
    source,
    sourceLink,
    verificationStatus
  } = req.body;

  if (!title?.trim() || !incidentType?.trim() || !state?.trim() || !description?.trim() || !date || !time?.trim() || !electionYear?.toString().trim() || !electionType?.trim() || !violenceCategory?.trim() || !source?.trim()) {
    throw new HttpError('Missing required fields.', 400);
  }

  const parsedDate = new Date(date);
  const parsedElectionYear = Number(electionYear);

  if (isNaN(parsedDate.getTime())) {
    throw new HttpError('Invalid date format.', 400);
  }

  if (!Number.isInteger(parsedElectionYear) || parsedElectionYear < 1999 || parsedElectionYear > 2100) {
    throw new HttpError('Election year must be a valid 4-digit year.', 400);
  }

  if (incidentType === 'Other' && !otherIncidentType?.trim()) {
    throw new HttpError('Other incident type must be specified when "Other" is selected.', 400);
  }

  const normalizedReporterName = reporterOverrides?.reporterName ?? reporterName;
  const normalizedReporterEmail = reporterOverrides?.reporterEmail ?? reporterEmail;
  const normalizedReporterPhone = reporterOverrides?.reporterPhone ?? reporterPhone;
  const normalizedIsAnonymous = reporterOverrides?.isAnonymous ?? (isAnonymous === 'true' || isAnonymous === true);

  if (!normalizedIsAnonymous && (!normalizedReporterName?.trim() || !normalizedReporterEmail?.trim())) {
    throw new HttpError('Reporter information is required for non-anonymous reports.', 400);
  }

  if (!normalizedIsAnonymous && normalizedReporterEmail && !isEmail(normalizedReporterEmail)) {
    throw new HttpError('Reporter email must be a valid email address.', 400);
  }

  if (normalizedReporterPhone && !isMobilePhone(normalizedReporterPhone, ['en-NG'])) {
    throw new HttpError('Reporter phone number must be a valid phone number.', 400);
  }

  // Source link is optional, but when provided it must be a valid URL.
  const normalizedSourceLink = typeof sourceLink === 'string' ? sourceLink.trim() : '';
  if (normalizedSourceLink && !isURL(normalizedSourceLink, { require_protocol: true, protocols: ['http', 'https'] })) {
    throw new HttpError('Source link must be a valid URL (including http:// or https://).', 400);
  }

  const parsedFatalities = fatalities === '' || fatalities === undefined ? undefined : Number(fatalities);
  const parsedInjuries = injuries === '' || injuries === undefined ? undefined : Number(injuries);

  if ((fatalities !== '' && fatalities !== undefined && Number.isNaN(parsedFatalities)) || (fatalities !== '' && fatalities !== undefined && parsedFatalities! < 0)) {
    throw new HttpError('Fatalities must be a non-negative number.', 400);
  }

  if ((injuries !== '' && injuries !== undefined && Number.isNaN(parsedInjuries)) || (injuries !== '' && injuries !== undefined && parsedInjuries! < 0)) {
    throw new HttpError('Injuries must be a non-negative number.', 400);
  }

  const files = (req.files as Express.Multer.File[]) || [];
  let evidenceUrls: string[] = [];

  if (files.length > 0) {
    try {
      evidenceUrls = await Promise.all(files.map((file) => uploadToCloudinary(file)));
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      throw new HttpError('Failed to upload media files. Please ensure they are valid images or videos.', 400);
    }
  }

  let parsedTags: string[] = [];
  if (tags) {
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (e) {
      parsedTags = [];
    }
  }

  const latitudeValue = latitude ? parseFloat(latitude) : undefined;
  const longitudeValue = longitude ? parseFloat(longitude) : undefined;
  const selectedLocation = {
    ...(latitudeValue !== undefined && !Number.isNaN(latitudeValue) ? { latitude: latitudeValue } : {}),
    ...(longitudeValue !== undefined && !Number.isNaN(longitudeValue) ? { longitude: longitudeValue } : {}),
    ...(address?.trim() ? { address: address.trim() } : {})
  };

  const normalizedVerificationStatus = verificationStatus?.toString().trim() || 'pending';
  const validStatuses = ['pending', 'investigating', 'verified', 'rejected'];
  if (!validStatuses.includes(normalizedVerificationStatus)) {
    throw new HttpError('Verification status is invalid.', 400);
  }

  const reportId = await generateIncidentId(parsedElectionYear);

  const incident = new Incident({
    reportId,
    title: title.trim(),
    incidentType: incidentType === 'Other' ? otherIncidentType : incidentType,
    electionYear: parsedElectionYear,
    electionType: electionType.trim(),
    state: state.trim(),
    ward: ward?.trim(),
    pollingUnit: pollingUnit?.trim(),
    selectedLocation,
    date: parsedDate,
    time: time.trim(),
    violenceCategory: violenceCategory.trim(),
    fatalities: parsedFatalities,
    injuries: parsedInjuries,
    propertyDamage: propertyDamage?.trim() || undefined,
    source: source.trim(),
    sourceLink: normalizedSourceLink || undefined,
    description: description.trim(),
    tags: parsedTags,
    lga: lga?.trim(),
    reporterName: normalizedReporterName?.trim(),
    reporterEmail: normalizedReporterEmail?.trim(),
    reporterPhone: normalizedReporterPhone?.trim(),
    isAnonymous: normalizedIsAnonymous,
    verificationStatus: normalizedVerificationStatus,
    media: evidenceUrls
  });

  return incident;
};

export const createIncident = async (req: Request, res: Response) => {
  try {
    const incident = await buildIncidentPayload(req, res);
    if (!incident) {
      return;
    }

    const savedIncident = await incident.save();

    try {
      addFactcheckJob(savedIncident._id?.toString(), savedIncident.description || '');
    } catch (e) {
      console.error('Failed to enqueue factcheck job', e);
    }

    res.status(201).json(savedIncident);
  } catch (error) {
    console.error('createIncident error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createIncidentAdmin = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    req.body.verificationStatus = 'verified';
    const incident = await buildIncidentPayload(req, res, {
      reporterName: authUser?.name || authUser?.email || 'Admin',
      reporterEmail: authUser?.email || '',
      reporterPhone: '',
      isAnonymous: false
    });

    if (!incident) {
      return;
    }

    const savedIncident = await incident.save();

    try {
      addFactcheckJob(savedIncident._id?.toString(), savedIncident.description || '');
    } catch (e) {
      console.error('Failed to enqueue factcheck job', e);
    }

    res.status(201).json(savedIncident);
  } catch (error) {
    console.error('createIncidentAdmin error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateIncidentAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const whitelist = [
      'title', 'incidentType', 'otherIncidentType', 'state', 'lga', 'ward',
      'pollingUnit', 'description', 'date', 'time', 'source', 'sourceLink', 'violenceCategory',
      'electionYear', 'electionType', 'fatalities', 'injuries', 'propertyDamage', 'verificationStatus'
    ];
    // Validate the source link only when the client sends a non-empty value; an
    // omitted or blank field preserves whatever is already stored.
    if (typeof req.body.sourceLink === 'string' && req.body.sourceLink.trim() &&
        !isURL(req.body.sourceLink.trim(), { require_protocol: true, protocols: ['http', 'https'] })) {
      return res.status(400).json({ message: 'Source link must be a valid URL (including http:// or https://).' });
    }
    for (const field of whitelist) {
      if (req.body[field] !== undefined) {
        (incident as any)[field] = field === 'sourceLink'
          ? (typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field])
          : req.body[field];
      }
    }

    // Address / location
    if (req.body.address !== undefined || req.body.latitude !== undefined || req.body.longitude !== undefined) {
      incident.selectedLocation = {
        address: req.body.address ?? incident.selectedLocation?.address,
        latitude: req.body.latitude !== undefined ? parseFloat(req.body.latitude) : incident.selectedLocation?.latitude,
        longitude: req.body.longitude !== undefined ? parseFloat(req.body.longitude) : incident.selectedLocation?.longitude,
      };
    }

    // Append new media without replacing existing
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length > 0) {
      const newUrls = await Promise.all(files.map((f) => uploadToCloudinary(f)));
      incident.media = [...(incident.media || []), ...newUrls];
    }

    // reportId is never changed on edit — preserved from original save
    const saved = await incident.save();
    res.json(saved);
  } catch (error) {
    console.error('updateIncidentAdmin error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
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
