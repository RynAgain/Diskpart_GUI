/**
 * Custom error classes for Diskpart operations
 */

export class DiskpartError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string
  ) {
    super(message);
    this.name = 'DiskpartError';
    Object.setPrototypeOf(this, DiskpartError.prototype);
  }
}

export class PrivilegeError extends DiskpartError {
  constructor(message: string = 'Administrator privileges required', details?: string) {
    super(message, 'PRIVILEGE_ERROR', details);
    this.name = 'PrivilegeError';
    Object.setPrototypeOf(this, PrivilegeError.prototype);
  }
}

export class DiskNotFoundError extends DiskpartError {
  constructor(diskId: number, details?: string) {
    super(`Disk ${diskId} not found`, 'DISK_NOT_FOUND', details);
    this.name = 'DiskNotFoundError';
    Object.setPrototypeOf(this, DiskNotFoundError.prototype);
  }
}

export class PartitionNotFoundError extends DiskpartError {
  constructor(partitionId: number, details?: string) {
    super(`Partition ${partitionId} not found`, 'PARTITION_NOT_FOUND', details);
    this.name = 'PartitionNotFoundError';
    Object.setPrototypeOf(this, PartitionNotFoundError.prototype);
  }
}

export class CommandExecutionError extends DiskpartError {
  constructor(message: string, details?: string) {
    super(message, 'COMMAND_EXECUTION_ERROR', details);
    this.name = 'CommandExecutionError';
    Object.setPrototypeOf(this, CommandExecutionError.prototype);
  }
}

export class CommandTimeoutError extends DiskpartError {
  constructor(timeout: number, details?: string) {
    super(`Command timed out after ${timeout}ms`, 'COMMAND_TIMEOUT', details);
    this.name = 'CommandTimeoutError';
    Object.setPrototypeOf(this, CommandTimeoutError.prototype);
  }
}

export class ParseError extends DiskpartError {
  constructor(message: string, details?: string) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

export class InvalidCommandError extends DiskpartError {
  constructor(message: string, details?: string) {
    super(message, 'INVALID_COMMAND', details);
    this.name = 'InvalidCommandError';
    Object.setPrototypeOf(this, InvalidCommandError.prototype);
  }
}

export class AccessDeniedError extends DiskpartError {
  constructor(message: string = 'Access denied to disk or partition', details?: string) {
    super(message, 'ACCESS_DENIED', details);
    this.name = 'AccessDeniedError';
    Object.setPrototypeOf(this, AccessDeniedError.prototype);
  }
}

/**
 * Helper function to convert errors to user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof DiskpartError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Helper function to get error code
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof DiskpartError) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}