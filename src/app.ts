import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';
import { snakeCaseKeys } from './utils/case';

/** Builds and configures the Express application. */
export function createApp() {
  const app = express();

  const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Request dari curl, Postman, mobile app, atau server-to-server
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');

    console.log('CORS check:', {
      receivedOrigin: normalizedOrigin,
      allowedOrigins: env.corsOrigins,
    });

    if (env.corsOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error('CORS rejected:', {
      receivedOrigin: normalizedOrigin,
      allowedOrigins: env.corsOrigins,
    });

    return callback(
      new Error(`CORS: Origin ${normalizedOrigin} not allowed`)
    );
  },

  credentials: false,

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
  ],

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  preflightContinue: false,
  optionsSuccessStatus: 204,
};

  // Handle preflight OPTIONS for ALL routes before any other middleware.
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));

  app.use(express.json());

  // Parity: the old Laravel API emitted snake_case JSON keys, but Prisma models
  // use camelCase. Convert every JSON response back to snake_case so the React
  // frontend keeps working unchanged.
  app.use((_req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => originalJson(snakeCaseKeys(body))) as typeof res.json;
    next();
  });

  // The frontend axios baseURL ends in /api, so every route lives under /api.
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
