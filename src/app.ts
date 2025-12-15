import type {FastifyInstance} from 'fastify';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import type {Logger} from 'pino';

import metricsPlugin from './plugins/metrics.js';
import anthropicRoutes from './routes/anthropic.js';
import openaiRoutes from './routes/openai.js';
import systemRoutes from './routes/system.js';
import type {AppConfig} from './types/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

export interface BuildAppOptions {
  config: AppConfig;
  logger?: boolean | Logger;
}

/** Creates and configures the Fastify application. */
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const {config, logger = true} = options;

  const app = Fastify({
    logger,
    bodyLimit: 50 * 1024 * 1024, // 50MB for base64 images
  });

  app.decorate('config', config);

  await app.register(cors, {origin: true});
  await app.register(metricsPlugin);
  await app.register(systemRoutes);
  await app.register(anthropicRoutes);
  await app.register(openaiRoutes);

  return app;
}
