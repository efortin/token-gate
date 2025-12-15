import 'dotenv/config';

import {buildApp} from './app.js';
import {loadConfig} from './config.js';
import {discoverModels, checkHealth} from './services/backend.js';
import {createLogger, setLogger} from './utils/logger.js';
import type {AppConfig} from './types/index.js';

async function main(): Promise<void> {
  const rawConfig = loadConfig();

  // Initialize logger with config
  const logger = createLogger({
    level: rawConfig.logLevel,
    pretty: rawConfig.logPretty,
    filePath: rawConfig.logFilePath,
  });
  setLogger(logger);

  const config: AppConfig = {
    port: rawConfig.port,
    host: rawConfig.host,
    apiKey: rawConfig.apiKey,
    defaultBackend: {
      name: rawConfig.defaultBackend.name,
      url: rawConfig.defaultBackend.url,
      apiKey: rawConfig.defaultBackend.apiKey,
      model: rawConfig.defaultBackend.model,
    },
    logLevel: rawConfig.logLevel,
  };

  const healthy = await checkHealth(config.defaultBackend.url);
  if (!healthy) {
    logger.warn({url: config.defaultBackend.url}, 'Backend health check failed');
  }

  if (!config.defaultBackend.model) {
    const models = await discoverModels(
      config.defaultBackend.url,
      config.defaultBackend.apiKey,
    );
    if (models.length > 0) {
      config.defaultBackend.model = models[0];
      logger.info({model: config.defaultBackend.model}, 'Using discovered model');
    }
  }

  const app = await buildApp({config, logger});
  await app.listen({host: config.host, port: config.port});

  logger.info(
    {
      host: config.host,
      port: config.port,
      backend: config.defaultBackend.url,
      model: config.defaultBackend.model,
      logFile: rawConfig.logFilePath,
    },
    'Server started',
  );
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
