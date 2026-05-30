/**
 * @module logger
 * Lightweight structured logger for the StackPulse frontend.
 * In production, only warnings and errors are emitted.
 */

/**
 * Available log levels for the frontend logger.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger interface with methods for each log level.
 */
type Logger = Record<LogLevel, (...args: unknown[]) => void>;

/** True when running in a production build. Disables debug/info logs. */
const isProduction = process.env.NODE_ENV === 'production';
/** Enable verbose logs in production when NEXT_PUBLIC_DEBUG_LOGS=true. */
const debugLogsEnabled = !isProduction || process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';

/** Returns whether the requested log level should be emitted in this environment. */
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
      // eslint-disable-next-line no-console -- centralized info logging is gated by shouldLog().
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
