import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';

/** Builds and configures the Express application. */
export function createApp() {
  const app = express();

  // The frontend talks to this API from a different origin using Bearer tokens
  // (no cookies), so CORS must explicitly allow the configured origins and the
  // Authorization header. Laravel handled this automatically; Express does not.
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: false,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(express.json());

  // The frontend axios baseURL ends in /api, so every route lives under /api.
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
