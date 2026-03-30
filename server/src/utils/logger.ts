/**
 * Logger Utility
 * Configured logger for the StackPulse server
 */

import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG_FILE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * The primary Winston logger instance for StackPulse.
 * Configured with console and file transports, supporting JSON formatting and timestamping.
 */
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
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      )
    }),
    // Error log file
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: LOG_FILE_MAX_SIZE_BYTES,
      maxFiles: 5
    }),
    // Combined log file
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: LOG_FILE_MAX_SIZE_BYTES,
      maxFiles: 5
    })
  ]
});

export default logger;
