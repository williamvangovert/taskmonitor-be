import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`\u{1F680} TaskMonitor API (Express) listening on http://127.0.0.1:${env.port}/api`);
  console.log(`   Health check: http://127.0.0.1:${env.port}/api/health`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
