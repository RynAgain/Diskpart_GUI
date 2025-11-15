import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if the application is running with administrator privileges on Windows
 * @returns Promise<boolean> - true if running as admin, false otherwise
 */
export async function isRunningAsAdmin(): Promise<boolean> {
  if (process.platform !== 'win32') {
    // Non-Windows platforms - assume we have necessary privileges
    return true;
  }

  try {
    // Try to execute a command that requires admin privileges
    // The 'net session' command requires admin rights
    await execAsync('net session', { timeout: 5000 });
    return true;
  } catch (error) {
    // If the command fails, we don't have admin privileges
    return false;
  }
}

/**
 * Check if the application is running with administrator privileges (synchronous version)
 * Note: This uses a different approach that checks the process token
 * @returns boolean - true if running as admin, false otherwise
 */
export function isRunningAsAdminSync(): boolean {
  if (process.platform !== 'win32') {
    return true;
  }

  try {
    // Try to access a system directory that requires admin privileges
    const { execSync } = require('child_process');
    execSync('net session', { timeout: 5000, stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get a user-friendly message about privilege status
 * @returns Promise<string> - Message describing privilege status
 */
export async function getPrivilegeStatus(): Promise<string> {
  const isAdmin = await isRunningAsAdmin();
  
  if (isAdmin) {
    return 'Running with administrator privileges';
  } else {
    return 'Not running with administrator privileges. Some operations may fail.';
  }
}

/**
 * Throw an error if not running as admin
 * @throws PrivilegeError if not running with admin privileges
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await isRunningAsAdmin();
  
  if (!isAdmin) {
    const { PrivilegeError } = await import('../diskpart/errors');
    throw new PrivilegeError(
      'Administrator privileges required',
      'Please restart the application as administrator to perform this operation.'
    );
  }
}