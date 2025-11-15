import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { initializeLogger, logInfo, logError } from './utils/logger';
import { isRunningAsAdmin } from './utils/privileges';
import { executeDiskpartCommand, executeAndParse, executeDestructiveCommand } from './diskpart/executor';
import {
  buildListDisksCommand,
  buildListVolumesCommand,
  buildListPartitionsCommand,
  buildDetailDiskScript,
  buildSelectDiskCommand,
  buildCleanDiskCommand,
  buildCleanAllCommand,
  buildCreatePartitionCommand,
  buildDeletePartitionCommand,
  buildFormatPartitionScript,
  buildAssignLetterCommand,
  buildRemoveLetterCommand,
  buildCommandScript,
  buildSelectPartitionCommand
} from './diskpart/commands';
import {
  parseListDisk,
  parseListVolume,
  parseListPartition,
  parseDetailDisk
} from './diskpart/parser';
import { IPCResponse } from '../shared/types';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    title: 'Diskpart GUI',
    icon: path.join(__dirname, '../../resources/icons/icon.png')
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize logger
  initializeLogger();
  logInfo('Application started');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logInfo('Application closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers - Real implementations

/**
 * List all disks
 */
ipcMain.handle('diskpart:list-disks', async (): Promise<IPCResponse> => {
  try {
    logInfo('Listing disks');
    const command = buildListDisksCommand();
    const result = await executeAndParse(command, parseListDisk);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logError('Failed to list disks', error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to list disks',
        details: error.stack
      }
    };
  }
});

/**
 * List all volumes
 */
ipcMain.handle('diskpart:list-volumes', async (): Promise<IPCResponse> => {
  try {
    logInfo('Listing volumes');
    const command = buildListVolumesCommand();
    const result = await executeAndParse(command, parseListVolume);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logError('Failed to list volumes', error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to list volumes',
        details: error.stack
      }
    };
  }
});

/**
 * List partitions on a disk
 */
ipcMain.handle('diskpart:list-partitions', async (_event, diskId: number): Promise<IPCResponse> => {
  try {
    logInfo(`Listing partitions for disk ${diskId}`);
    const script = buildCommandScript([
      buildSelectDiskCommand(diskId),
      buildListPartitionsCommand()
    ]);
    const result = await executeAndParse(script, parseListPartition);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logError(`Failed to list partitions for disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to list partitions',
        details: error.stack
      }
    };
  }
});

/**
 * Select a disk
 */
ipcMain.handle('diskpart:select-disk', async (_event, diskId: number): Promise<IPCResponse> => {
  try {
    logInfo(`Selecting disk ${diskId}`);
    const command = buildSelectDiskCommand(diskId);
    const result = await executeDiskpartCommand(command);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: `Disk ${diskId} selected successfully` }
    };
  } catch (error: any) {
    logError(`Failed to select disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to select disk',
        details: error.stack
      }
    };
  }
});

/**
 * Get detailed disk information
 */
ipcMain.handle('diskpart:detail-disk', async (_event, diskId: number): Promise<IPCResponse> => {
  try {
    logInfo(`Getting details for disk ${diskId}`);
    const script = buildDetailDiskScript(diskId);
    const result = await executeAndParse(script, parseDetailDisk);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    logError(`Failed to get details for disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to get disk details',
        details: error.stack
      }
    };
  }
});

/**
 * Clean a disk (remove all partitions)
 */
ipcMain.handle('diskpart:clean-disk', async (_event, diskId: number): Promise<IPCResponse> => {
  try {
    logInfo(`Cleaning disk ${diskId}`);
    const script = buildCommandScript([
      buildSelectDiskCommand(diskId),
      buildCleanDiskCommand()
    ]);
    const result = await executeDestructiveCommand(script);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: `Disk ${diskId} cleaned successfully` }
    };
  } catch (error: any) {
    logError(`Failed to clean disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to clean disk',
        details: error.stack
      }
    };
  }
});

/**
 * Clean all data from a disk (secure erase)
 */
ipcMain.handle('diskpart:clean-all', async (_event, diskId: number): Promise<IPCResponse> => {
  try {
    logInfo(`Cleaning all data from disk ${diskId}`);
    const script = buildCommandScript([
      buildSelectDiskCommand(diskId),
      buildCleanAllCommand()
    ]);
    const result = await executeDestructiveCommand(script);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: `Disk ${diskId} cleaned (all) successfully` }
    };
  } catch (error: any) {
    logError(`Failed to clean all data from disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to clean disk',
        details: error.stack
      }
    };
  }
});

/**
 * Create a partition
 */
ipcMain.handle('diskpart:create-partition', async (_event, diskId: number, size?: number): Promise<IPCResponse> => {
  try {
    logInfo(`Creating partition on disk ${diskId}`, { size });
    const script = buildCommandScript([
      buildSelectDiskCommand(diskId),
      buildCreatePartitionCommand(size)
    ]);
    const result = await executeDiskpartCommand(script);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: 'Partition created successfully' }
    };
  } catch (error: any) {
    logError(`Failed to create partition on disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to create partition',
        details: error.stack
      }
    };
  }
});

/**
 * Delete a partition
 */
ipcMain.handle('diskpart:delete-partition', async (_event, diskId: number, partitionId: number): Promise<IPCResponse> => {
  try {
    logInfo(`Deleting partition ${partitionId} on disk ${diskId}`);
    const script = buildCommandScript([
      buildSelectDiskCommand(diskId),
      buildSelectPartitionCommand(partitionId),
      buildDeletePartitionCommand()
    ]);
    const result = await executeDestructiveCommand(script);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: 'Partition deleted successfully' }
    };
  } catch (error: any) {
    logError(`Failed to delete partition ${partitionId} on disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to delete partition',
        details: error.stack
      }
    };
  }
});

/**
 * Format a volume
 */
ipcMain.handle('diskpart:format-volume', async (_event, diskId: number, partitionId: number, fileSystem: string, label?: string): Promise<IPCResponse> => {
  try {
    logInfo(`Formatting partition ${partitionId} on disk ${diskId}`, { fileSystem, label });
    const script = buildFormatPartitionScript(diskId, partitionId, fileSystem, label);
    const result = await executeDestructiveCommand(script);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: 'Volume formatted successfully' }
    };
  } catch (error: any) {
    logError(`Failed to format partition ${partitionId} on disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to format volume',
        details: error.stack
      }
    };
  }
});

/**
 * Assign a drive letter
 */
ipcMain.handle('diskpart:assign-letter', async (_event, diskId: number, partitionId: number, letter: string): Promise<IPCResponse> => {
  try {
    logInfo(`Assigning letter ${letter} to partition ${partitionId} on disk ${diskId}`);
    const script = buildCommandScript([
      buildSelectDiskCommand(diskId),
      buildSelectPartitionCommand(partitionId),
      buildAssignLetterCommand(letter)
    ]);
    const result = await executeDiskpartCommand(script);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: `Drive letter ${letter} assigned successfully` }
    };
  } catch (error: any) {
    logError(`Failed to assign letter ${letter} to partition ${partitionId} on disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to assign drive letter',
        details: error.stack
      }
    };
  }
});

/**
 * Remove a drive letter
 */
ipcMain.handle('diskpart:remove-letter', async (_event, diskId: number, partitionId: number, letter: string): Promise<IPCResponse> => {
  try {
    logInfo(`Removing letter ${letter} from partition ${partitionId} on disk ${diskId}`);
    const script = buildCommandScript([
      buildSelectDiskCommand(diskId),
      buildSelectPartitionCommand(partitionId),
      buildRemoveLetterCommand(letter)
    ]);
    const result = await executeDiskpartCommand(script);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.message,
          details: result.details
        }
      };
    }

    return {
      success: true,
      data: { message: `Drive letter ${letter} removed successfully` }
    };
  } catch (error: any) {
    logError(`Failed to remove letter ${letter} from partition ${partitionId} on disk ${diskId}`, error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error.message || 'Failed to remove drive letter',
        details: error.stack
      }
    };
  }
});

/**
 * Check administrator privileges
 */
ipcMain.handle('system:check-admin', async (): Promise<boolean> => {
  try {
    const isAdmin = await isRunningAsAdmin();
    logInfo(`Admin check: ${isAdmin}`);
    return isAdmin;
  } catch (error: any) {
    logError('Failed to check admin privileges', error);
    return false;
  }
});

/**
 * Get system information
 */
ipcMain.handle('system:get-info', async () => {
  try {
    const isAdmin = await isRunningAsAdmin();
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      isAdmin
    };
  } catch (error: any) {
    logError('Failed to get system info', error);
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      isAdmin: false
    };
  }
});