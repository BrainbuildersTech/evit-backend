
import { Router } from 'express';
import {
  createIncident,
  getIncidents,
  getVerifiedIncidents,
  updateVerification,
  upload
} from '../controllers/incident.controller';
import { adminInterceptor } from '../middleware/admin.middleware';

const router = Router();

router.post('/', upload.array('media'), createIncident);
router.get('/', adminInterceptor, getIncidents);
router.get('/verified', getVerifiedIncidents);
router.patch('/:id/verification', adminInterceptor, updateVerification);

export default router;
