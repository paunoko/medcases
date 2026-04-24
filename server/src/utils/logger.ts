import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const logDir = path.join(__dirname, '../../logs');

// Ensure the log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define formats
const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom console formatting for local development readability
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// We define our Winston logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    json() // For files, JSON is preferred so that it can be scraped easily via Fluentd/ELK
  ),
  transports: [
    // 1. Console transport
    // Best practice for Docker: Docker captures STDOUT/STDERR automatically.
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? combine(timestamp(), json()) : consoleFormat,
    }),
    
    // 2. Daily rotated file transport
    // Stores history up to 14 days locally in 'logs/' volume, making them accessible to users who
    // do not have docker log drivers configured, or are running it via PM2.
    new DailyRotateFile({
      dirname: logDir,
      filename: 'medcases-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    
    // 3. Separate file for errors
    new DailyRotateFile({
      dirname: logDir,
      filename: 'error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    })
  ],
});
