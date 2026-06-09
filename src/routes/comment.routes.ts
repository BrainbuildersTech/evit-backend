import { Router } from "express";
import { commentOnReport, getReportComments } from "../controllers/comment.controller";

const router = Router();

router.post('/:reportId', commentOnReport);
router.get('/:reportId', getReportComments)

export default router;