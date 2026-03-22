/**
 * Logger Utility
 * Configured logger for the StackPulse server
 */

import { createLogger, format, transports } from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// Create the logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'stackpulse' },
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const { service, ...rest } = meta;
          const metaStr = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      )
    }),
    // Error logs with rotation
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 7,
      tailable: true,
      zippedArchive: true
    }),
    // Combined logs with rotation
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 7,
      tailable: true,
      zippedArchive: true
    })
  ]
});

export default logger;
