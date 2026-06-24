import factcheckQueue from './factcheck.queue';
import axios from 'axios';
import Incident from '../models/Incident';

factcheckQueue.process(async (job: any) => {
  const { incidentId, query } = job.data || {};
  const apiUrl = process.env.FACTCHECK_API;
  if (!apiUrl) {
    console.error('FACTCHECK_API not set; skipping factcheck job');
    return;
  }

  try {
    const resp = await axios.post(apiUrl, { query });
    const data = resp.data;
    let aiReview: string;

    if (typeof data === 'string') aiReview = data;
    else if (data && (data.result || data.review)) aiReview = data.result || data.review;
    else if (data && data.data) aiReview = JSON.stringify(data.data);
    else aiReview = JSON.stringify(data);

    if (incidentId) {
      await Incident.findByIdAndUpdate(incidentId, { aiReview }, { new: true });
    }
  } catch (err) {
    console.error('Factcheck job failed for incident', incidentId, err);
    throw err;
  }
});
