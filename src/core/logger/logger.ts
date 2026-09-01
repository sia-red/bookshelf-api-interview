export const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export type LogMeta = Record<string, unknown>;

export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  child(prefix: string): Logger;
}

function format(level: LogLevel, prefix: string, message: string, meta?: LogMeta): string {
  const stamp = new Date().toISOString();
  const tail = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${stamp} ${level.toUpperCase().padEnd(5)} ${prefix}${message}${tail}`;
}

export function createLogger(level: LogLevel, prefix = ''): Logger {
  const threshold = LOG_LEVELS[level];

  const write = (at: LogLevel, message: string, meta?: LogMeta): void => {
    if (LOG_LEVELS[at] < threshold) return;
    const line = format(at, prefix, message, meta);
    if (at === 'error' || at === 'warn') process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
    child: (childPrefix) => createLogger(level, `${prefix}${childPrefix} `),
  };
}
