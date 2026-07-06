import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';
import { snakeCaseKeys } from './utils/case';

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
}
