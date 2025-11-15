import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const MAX_LOG_FILES = 10;

/**
 * Ensure the log directory exists
 */
function ensureLogDirectory(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Get the current log file path
 */
function getCurrentLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `diskpart-${date}.log`);
}

/**
 * Format a log message with timestamp
 */
function formatLogMessage(level: string, message: string, details?: any): string {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (details) {
    if (typeof details === 'string') {
      logMessage += `\n  Details: ${details}`;
    } else {
      logMessage += `\n  Details: ${JSON.stringify(details, null, 2)}`;
    }
  }
  
  return logMessage + '\n';
}

/**
 * Write a log message to file
 */
function writeLog(level: string, message: string, details?: any): void {
  try {
    ensureLogDirectory();
    const logFilePath = getCurrentLogFilePath();
    const logMessage = formatLogMessage(level, message, details);
    
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage.trim());
    }
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

/**
 * Rotate log files - keep only the last MAX_LOG_FILES
 */
export function rotateLogFiles(): void {
  try {
    ensureLogDirectory();
    
    const files = fs.readdirSync(LOG_DIR)
      .filter(file => file.startsWith('diskpart-') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(LOG_DIR, file),
        time: fs.statSync(path.join(LOG_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first
    
    // Delete old log files
    if (files.length > MAX_LOG_FILES) {
      files.slice(MAX_LOG_FILES).forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted old log file: ${file.name}`);
        } catch (error) {
          console.error(`Failed to delete log file ${file.name}:`, error);
        }
      });
    }
  } catch (error) {
    console.error('Failed to rotate log files:', error);
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, details?: any): void {
  writeLog('INFO', message, details);
}

/**
 * Log a warning message
 */
export function logWarning(message: string, details?: any): void {
  writeLog('WARN', message, details);
}

/**
 * Log an error message
 */
export function logError(message: string, details?: any): void {
  writeLog('ERROR', message, details);
}

/**
 * Log a command execution
 */
export function logCommand(command: string, result?: any): void {
  writeLog('COMMAND', `Executing: ${command}`, result);
}

/**
 * Log a command result
 */
export function logCommandResult(command: string, success: boolean, output?: string, error?: string): void {
  const level = success ? 'INFO' : 'ERROR';
  const message = `Command ${success ? 'succeeded' : 'failed'}: ${command}`;
  const details = {
    success,
    output: output?.substring(0, 500), // Limit output length
    error
  };
  writeLog(level, message, details);
}

/**
 * Get the log directory path
 */
export function getLogDirectory(): string {
  return LOG_DIR;
}

/**
 * Get all log files
 */
export function getLogFiles(): string[] {
  try {
    ensureLogDirectory();
    return fs.readdirSync(LOG_DIR)
      .filter(file => file.startsWith('diskpart-') && file.endsWith('.log'))
      .map(file => path.join(LOG_DIR, file));
  } catch (error) {
    console.error('Failed to get log files:', error);
    return [];
  }
}

/**
 * Read a log file
 */
export function readLogFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Failed to read log file:', error);
    return '';
  }
}

/**
 * Initialize the logger (call this on app startup)
 */
export function initializeLogger(): void {
  ensureLogDirectory();
  rotateLogFiles();
  logInfo('Logger initialized');
}