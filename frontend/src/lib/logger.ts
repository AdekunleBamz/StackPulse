/**
 * Available log levels for the frontend logger.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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
      // eslint-disable-next-line no-console -- centralized debug logging is gated by shouldLog().
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

export default logger;
