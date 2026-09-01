import { LOG_LEVELS, type LogLevel } from '../core/logger/logger.js';

export interface Environment {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: LogLevel;
}

const DEFAULTS = {
  PORT: 3002,
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
} as const;

let cached: Environment | undefined;

function readPort(raw: string | undefined): number {
  if (raw === undefined) return DEFAULTS.PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, received "${raw}"`);
  }
  return port;
}

function readLogLevel(raw: string | undefined): LogLevel {
  if (raw === undefined) return DEFAULTS.LOG_LEVEL;
  if (!(raw in LOG_LEVELS)) {
    throw new Error(`LOG_LEVEL must be one of ${Object.keys(LOG_LEVELS).join(', ')}`);
  }
  return raw as LogLevel;
}

export function loadEnvironment(): Environment {
  cached = {
    PORT: readPort(process.env['PORT']),
    NODE_ENV: process.env['NODE_ENV'] ?? DEFAULTS.NODE_ENV,
    LOG_LEVEL: readLogLevel(process.env['LOG_LEVEL']),
  };
  return cached;
}

export function env(): Environment {
  return cached ?? loadEnvironment();
}
