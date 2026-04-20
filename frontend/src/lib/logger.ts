/**
 * Available log levels for the frontend logger.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Ordered log levels from least to most severe.
 */
export const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'] as const;

/**
 * Logger interface with methods for each log level.
 */
type Logger = Record<LogLevel, (...args: unknown[]) => void>;

const isProduction = process.env.NODE_ENV === 'production';
const debugLogsEnabled = !isProduction || process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';

function shouldLog(level: LogLevel): boolean {
  if (level === 'warn' || level === 'error') {
    return true;
  }
  return debugLogsEnabled;
}

function writeLog(level: LogLevel, ...args: unknown[]): void {
  if (!shouldLog(level)) {
    return;
  }

  switch (level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

export const logger: Readonly<Logger> = Object.freeze({
  debug: (...args: unknown[]) => writeLog('debug', ...args),
  info: (...args: unknown[]) => writeLog('info', ...args),
  warn: (...args: unknown[]) => writeLog('warn', ...args),
  error: (...args: unknown[]) => writeLog('error', ...args),
});

/**
 * Creates a logger that automatically prepends a fixed prefix to every message.
 * Useful for scoping log output to a component or module name.
 *
 * @param prefix - The prefix string shown before every log message.
 * @returns A logger-compatible object with the prefix applied.
 *
 * @example
 * ```ts
 * const log = createPrefixedLogger('[WalletContext]');
 * log.info('connected'); // logs: "[WalletContext] connected"
 * ```
 */
export function createPrefixedLogger(prefix: string): Readonly<Logger> {
  return Object.freeze({
    debug: (...args: unknown[]) => writeLog('debug', prefix, ...args),
    info: (...args: unknown[]) => writeLog('info', prefix, ...args),
    warn: (...args: unknown[]) => writeLog('warn', prefix, ...args),
    error: (...args: unknown[]) => writeLog('error', prefix, ...args),
  });
}

export default logger;
