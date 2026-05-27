
import { Router } from 'express';
import {
  createIncident,
  getIncidents,
  updateVerification,
  upload
} from '../controllers/incident.controller';

const router = Router();

router.post('/', upload.array('media'), createIncident);
router.get('/', getIncidents);
router.patch('/:id/verification', updateVerification);

export default router;
