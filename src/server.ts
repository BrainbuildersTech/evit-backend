
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();

  // initialize background processors that require DB
  await import('./queues/factcheck.processor');

  app.listen(Number(PORT), () => {
    console.log(`Server running on port ${PORT}`);
  });
};

bootstrap();
