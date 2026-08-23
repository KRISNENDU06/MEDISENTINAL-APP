import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'MediSentinel-Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  MediSentinel Backend Server Active!        `);
  console.log(`  Port: http://localhost:${PORT}             `);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`=============================================`);
});

