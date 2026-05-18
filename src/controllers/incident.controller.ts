
import { Request, Response } from 'express';
import Incident from '../models/Incident';

export const createIncident = async (req: Request, res: Response) => {
  const incident = await Incident.create(req.body);
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
