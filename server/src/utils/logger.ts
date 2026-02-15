import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // Add stack trace for errors
  if (stack) {
    log += `\n${stack}`;
  }
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  
  return log;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'stackpulse-server' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
  
  // Error log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Combined log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Webhook log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'webhooks.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    })
  );
}

// Helper for logging webhooks
export const webhookLogger = {
  received: (hookId: string, data: any) => {
    logger.info(`Webhook received: ${hookId}`, { type: 'webhook', hookId, ...data });
  },
  processed: (hookId: string, duration: number) => {
    logger.info(`Webhook processed: ${hookId} (${duration}ms)`, { type: 'webhook', hookId, duration });
  },
  error: (hookId: string, error: Error) => {
    logger.error(`Webhook error: ${hookId}`, { type: 'webhook', hookId, error: error.message });
  },
};

// Helper for logging alerts
export const alertLogger = {
  triggered: (alertId: string, userId: string, data: any) => {
    logger.info(`Alert triggered: ${alertId}`, { type: 'alert', alertId, userId, ...data });
  },
  sent: (alertId: string, channel: string) => {
    logger.info(`Alert notification sent: ${alertId} via ${channel}`, { type: 'alert', alertId, channel });
  },
  failed: (alertId: string, error: Error) => {
    logger.error(`Alert failed: ${alertId}`, { type: 'alert', alertId, error: error.message });
  },
};

// Helper for logging API requests
export const apiLogger = {
  request: (method: string, path: string, ip: string) => {
    logger.debug(`${method} ${path}`, { type: 'api', ip });
  },
  response: (method: string, path: string, status: number, duration: number) => {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'debug';
    logger[level](`${method} ${path} ${status} (${duration}ms)`, { type: 'api', status, duration });
  },
};

export default logger;
