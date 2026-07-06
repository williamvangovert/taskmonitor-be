import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, typed access to environment variables.
 * Keeps the rest of the codebase free of raw process.env lookups.
 */
export const env = {
  port: parseInt(process.env.PORT ?? '8000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
};

export const isProduction = env.nodeEnv === 'production';
