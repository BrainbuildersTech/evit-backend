
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

bootstrap();
