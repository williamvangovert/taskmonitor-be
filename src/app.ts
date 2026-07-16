import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import {
  errorHandler,
  notFound,
} from './middleware/errorHandler';
import routes from './routes';
import { snakeCaseKeys } from './utils/case';

/** Builds and configures the Express application. */
export function createApp() {
  const app = express();

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Mengizinkan curl, Postman, mobile app,
      // dan komunikasi server-to-server.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin
        .trim()
        .replace(/\/+$/, '');

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

      // Jangan melempar Error karena akan menjadi status 500.
      return callback(null, false);
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

  /*
   * Penting:
   * app.use(cors(...)) sudah menangani OPTIONS untuk semua route.
   * Jangan tambahkan app.options('*', ...).
   */
  app.use(cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mengubah response camelCase Prisma menjadi snake_case
  // agar tetap kompatibel dengan frontend lama.
  app.use((_req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) =>
      originalJson(
        snakeCaseKeys(body),
      )) as typeof res.json;

    next();
  });

  // Semua endpoint tersedia di bawah /api.
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}