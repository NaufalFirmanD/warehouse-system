import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import { checkDatabaseConnection } from './config/db';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health & Readiness Endpoint
app.get('/health', async (req, res) => {
  const isDbConnected = await checkDatabaseConnection();
  if (isDbConnected) {
    res.status(200).json({
      status: 'ok',
      service: 'warehouse-receiving-api',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } else {
    res.status(503).json({
      status: 'error',
      service: 'warehouse-receiving-api',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// API Routes
app.use('/api', apiRouter);

// Centralized Error Handling
app.use(errorHandler);
