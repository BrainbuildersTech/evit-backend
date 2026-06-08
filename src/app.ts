
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import incidentRoutes from './routes/incident.routes';
import authRoutes from './routes/auth.routes';
import blogRoutes from './routes/blog.routes';
import dashboardRoutes from './routes/dashboard.routes';
import contactRoutes from './routes/contact.routes';

const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
// Parse URL-encoded bodies (form data)
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(cookieParser());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.get('/api/health', (_req, res) => {
  res.json({ success: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact', contactRoutes);

export default app;
