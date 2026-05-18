
import { Request, Response } from 'express';
import Incident from '../models/Incident';

export const getDashboardStats = async (_req: Request, res: Response) => {
  const totalIncidents = await Incident.countDocuments();
  const verified = await Incident.countDocuments({
    verificationStatus: 'verified'
  });

  res.json({
    totalIncidents,
    verified,
    pending: totalIncidents - verified
  });
};
