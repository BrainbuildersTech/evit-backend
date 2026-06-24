import Bull from 'bull';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const factcheckQueue = new Bull('factcheck', REDIS_URL);

export const addFactcheckJob = (incidentId: string, query: string) => {
  return factcheckQueue.add(
    { incidentId, query },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );
};

export default factcheckQueue;
