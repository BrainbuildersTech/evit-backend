
import { Request, Response } from 'express';
import Incident from '../models/Incident';

export const getDashboardStats = async (_req: Request, res: Response) => {
  const totalIncidents = await Incident.countDocuments({ deletedAt: null });
  const verified = await Incident.countDocuments({
    verificationStatus: 'verified',
    deletedAt: null
  });

  res.json({
    totalIncidents,
    verified,
    pending: totalIncidents - verified
  });
};
