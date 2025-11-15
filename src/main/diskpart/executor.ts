/**
 * Diskpart command executor module
 * Handles execution of Diskpart commands with proper error handling and timeout management
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CommandResult } from '../../shared/types';
import {
  CommandExecutionError,
  CommandTimeoutError,
  AccessDeniedError,
  PrivilegeError
} from './errors';
import { logCommand, logCommandResult, logError } from '../utils/logger';
import { isRunningAsAdmin } from '../utils/privileges';

const execAsync = promisify(exec);

// Default timeout for commands (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Timeout for destructive operations (60 seconds)
const DESTRUCTIVE_TIMEOUT = 60000;

/**
 * Execute a Diskpart command
 * @param command - The Diskpart command or script to execute
 * @param timeout - Optional timeout in milliseconds
 * @returns Promise<CommandResult>
 */
export async function executeDiskpartCommand(
  command: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<CommandResult> {
  // Check for admin privileges
  const isAdmin = await isRunningAsAdmin();
  if (!isAdmin) {
    const error = new PrivilegeError(
      'Administrator privileges required to execute Diskpart commands',
      'Please restart the application as administrator'
    );
    logError('Privilege check failed', { command, error: error.message });
    return {
      success: false,
      message: error.message,
      errorCode: error.code,
      details: error.details
    };
  }

  // Log the command
  logCommand(command);

  try {
    // Create a temporary script file
    const scriptPath = await createTempScript(command);

    try {
      // Execute diskpart with the script file
      const { stdout, stderr } = await execAsync(
        `diskpart /s "${scriptPath}"`,
        {
          timeout,
          windowsHide: true,
          encoding: 'utf8'
        }
      );

      // Clean up the script file
      await deleteTempScript(scriptPath);

      // Parse the output
      const output = stdout || stderr || '';
      const success = isCommandSuccessful(output);

      // Log the result
      logCommandResult(command, success, output, stderr);

      if (!success) {
        const errorMessage = extractErrorFromOutput(output);
        return {
          success: false,
          message: errorMessage || 'Command failed',
          errorCode: 'COMMAND_FAILED',
          details: output,
          data: { stdout, stderr }
        };
      }

      return {
        success: true,
        message: 'Command executed successfully',
        data: { output, stdout, stderr }
      };
    } catch (execError: any) {
      // Clean up the script file on error
      await deleteTempScript(scriptPath);
      throw execError;
    }
  } catch (error: any) {
    // Handle specific error types
    if (error.killed || error.signal === 'SIGTERM') {
      const timeoutError = new CommandTimeoutError(timeout);
      logError('Command timeout', { command, timeout, error: error.message });
      return {
        success: false,
        message: timeoutError.message,
        errorCode: timeoutError.code,
        details: `Command exceeded timeout of ${timeout}ms`
      };
    }

    if (error.message?.toLowerCase().includes('access is denied')) {
      const accessError = new AccessDeniedError();
      logError('Access denied', { command, error: error.message });
      return {
        success: false,
        message: accessError.message,
        errorCode: accessError.code,
        details: error.message
      };
    }

    // Generic execution error
    const execError = new CommandExecutionError(
      'Failed to execute Diskpart command',
      error.message
    );
    logError('Command execution failed', { command, error: error.message });
    return {
      success: false,
      message: execError.message,
      errorCode: execError.code,
      details: error.message
    };
  }
}

/**
 * Execute a Diskpart command with extended timeout for destructive operations
 */
export async function executeDestructiveCommand(command: string): Promise<CommandResult> {
  return executeDiskpartCommand(command, DESTRUCTIVE_TIMEOUT);
}

/**
 * Create a temporary script file for Diskpart
 */
async function createTempScript(command: string): Promise<string> {
  const tempDir = os.tmpdir();
  const scriptName = `diskpart_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`;
  const scriptPath = path.join(tempDir, scriptName);

  try {
    await fs.promises.writeFile(scriptPath, command, 'utf8');
    return scriptPath;
  } catch (error) {
    throw new CommandExecutionError(
      'Failed to create temporary script file',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Delete a temporary script file
 */
async function deleteTempScript(scriptPath: string): Promise<void> {
  try {
    if (fs.existsSync(scriptPath)) {
      await fs.promises.unlink(scriptPath);
    }
  } catch (error) {
    // Log but don't throw - cleanup failure is not critical
    console.warn(`Failed to delete temp script: ${scriptPath}`, error);
  }
}

/**
 * Check if command output indicates success
 */
function isCommandSuccessful(output: string): boolean {
  const lowerOutput = output.toLowerCase();

  // Check for explicit success messages
  if (lowerOutput.includes('diskpart successfully')) return true;
  if (lowerOutput.includes('completed successfully')) return true;

  // Check for error indicators
  if (lowerOutput.includes('error')) return false;
  if (lowerOutput.includes('failed')) return false;
  if (lowerOutput.includes('access is denied')) return false;
  if (lowerOutput.includes('cannot')) return false;
  if (lowerOutput.includes('invalid')) return false;
  if (lowerOutput.includes('not found')) return false;

  // For list commands, success is having output
  if (lowerOutput.includes('disk ###') || 
      lowerOutput.includes('volume ###') || 
      lowerOutput.includes('partition ###')) {
    return true;
  }

  // If no clear indicator, check if output is not empty and doesn't contain common error patterns
  return output.trim().length > 0;
}

/**
 * Extract error message from command output
 */
function extractErrorFromOutput(output: string): string | null {
  const lines = output.split('\n').map(line => line.trim());

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Look for lines containing error indicators
    if (lowerLine.includes('error') ||
        lowerLine.includes('failed') ||
        lowerLine.includes('denied') ||
        lowerLine.includes('cannot') ||
        lowerLine.includes('invalid') ||
        lowerLine.includes('not found')) {
      return line;
    }
  }

  return null;
}

/**
 * Execute a command and parse the output with a parser function
 */
export async function executeAndParse<T>(
  command: string,
  parser: (output: string) => T,
  timeout?: number
): Promise<CommandResult> {
  const result = await executeDiskpartCommand(command, timeout);

  if (!result.success) {
    return result;
  }

  try {
    const output = result.data?.output || result.data?.stdout || '';
    const parsedData = parser(output);

    return {
      success: true,
      message: 'Command executed and parsed successfully',
      data: parsedData
    };
  } catch (error) {
    logError('Failed to parse command output', {
      command,
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      message: 'Failed to parse command output',
      errorCode: 'PARSE_ERROR',
      details: error instanceof Error ? error.message : String(error),
      data: result.data
    };
  }
}

/**
 * Validate that Diskpart is available on the system
 */
export async function validateDiskpartAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('where diskpart', {
      timeout: 5000,
      windowsHide: true
    });
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get Diskpart version information
 */
export async function getDiskpartVersion(): Promise<string> {
  try {
    // Diskpart doesn't have a version command, so we'll just confirm it exists
    const available = await validateDiskpartAvailable();
    return available ? 'Available' : 'Not Found';
  } catch (error) {
    return 'Unknown';
  }
}