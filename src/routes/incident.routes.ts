
import { Router } from 'express';
import {
  createIncident,
  getIncidents,
  updateVerification
} from '../controllers/incident.controller';

const router = Router();

router.post('/', createIncident);
router.get('/', getIncidents);
router.patch('/:id/verification', updateVerification);

export default router;
