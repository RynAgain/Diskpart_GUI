/**
 * Command builder module for creating Diskpart command scripts
 */

import { InvalidCommandError } from './errors';

/**
 * Build a command to list all disks
 */
export function buildListDisksCommand(): string {
  return 'list disk';
}

/**
 * Build a command to list all volumes
 */
export function buildListVolumesCommand(): string {
  return 'list volume';
}

/**
 * Build a command to list partitions on a selected disk
 * Note: This requires the disk to be selected first
 */
export function buildListPartitionsCommand(): string {
  return 'list partition';
}

/**
 * Build a command to select a disk
 * @param diskNumber - The disk number to select (0-based)
 */
export function buildSelectDiskCommand(diskNumber: number): string {
  if (!Number.isInteger(diskNumber) || diskNumber < 0) {
    throw new InvalidCommandError(`Invalid disk number: ${diskNumber}`);
  }
  return `select disk ${diskNumber}`;
}

/**
 * Build a command to get detailed information about the selected disk
 * Note: This requires the disk to be selected first
 */
export function buildDetailDiskCommand(): string {
  return 'detail disk';
}

/**
 * Build a command to select a partition
 * @param partitionNumber - The partition number to select (1-based)
 */
export function buildSelectPartitionCommand(partitionNumber: number): string {
  if (!Number.isInteger(partitionNumber) || partitionNumber < 1) {
    throw new InvalidCommandError(`Invalid partition number: ${partitionNumber}`);
  }
  return `select partition ${partitionNumber}`;
}

/**
 * Build a command to clean a disk (removes all partitions)
 * Note: This requires the disk to be selected first
 */
export function buildCleanDiskCommand(): string {
  return 'clean';
}

/**
 * Build a command to clean all data from a disk (secure erase)
 * Note: This requires the disk to be selected first
 */
export function buildCleanAllCommand(): string {
  return 'clean all';
}

/**
 * Build a command to create a primary partition
 * @param size - Optional size in MB. If not specified, uses all available space
 */
export function buildCreatePartitionCommand(size?: number): string {
  if (size !== undefined) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new InvalidCommandError(`Invalid partition size: ${size}`);
    }
    return `create partition primary size=${size}`;
  }
  return 'create partition primary';
}

/**
 * Build a command to delete the selected partition
 * Note: This requires the partition to be selected first
 */
export function buildDeletePartitionCommand(): string {
  return 'delete partition';
}

/**
 * Build a command to format a volume
 * @param fileSystem - The file system to use (NTFS, FAT32, exFAT)
 * @param label - Optional volume label
 * @param quick - Whether to perform a quick format (default: true)
 */
export function buildFormatVolumeCommand(
  fileSystem: string,
  label?: string,
  quick: boolean = true
): string {
  const validFileSystems = ['NTFS', 'FAT32', 'exFAT', 'FAT'];
  const fsUpper = fileSystem.toUpperCase();
  
  if (!validFileSystems.includes(fsUpper)) {
    throw new InvalidCommandError(
      `Invalid file system: ${fileSystem}. Must be one of: ${validFileSystems.join(', ')}`
    );
  }
  
  let command = `format fs=${fsUpper}`;
  
  if (label) {
    // Validate label (no special characters, max 32 chars for NTFS, 11 for FAT)
    const maxLength = fsUpper === 'NTFS' ? 32 : 11;
    if (label.length > maxLength) {
      throw new InvalidCommandError(
        `Label too long: ${label.length} characters (max ${maxLength} for ${fsUpper})`
      );
    }
    command += ` label="${label}"`;
  }
  
  if (quick) {
    command += ' quick';
  }
  
  return command;
}

/**
 * Build a command to assign a drive letter
 * @param letter - The drive letter to assign (A-Z)
 */
export function buildAssignLetterCommand(letter: string): string {
  const upperLetter = letter.toUpperCase();
  
  if (!/^[A-Z]$/.test(upperLetter)) {
    throw new InvalidCommandError(`Invalid drive letter: ${letter}. Must be A-Z`);
  }
  
  return `assign letter=${upperLetter}`;
}

/**
 * Build a command to remove a drive letter
 * @param letter - The drive letter to remove (A-Z)
 */
export function buildRemoveLetterCommand(letter: string): string {
  const upperLetter = letter.toUpperCase();
  
  if (!/^[A-Z]$/.test(upperLetter)) {
    throw new InvalidCommandError(`Invalid drive letter: ${letter}. Must be A-Z`);
  }
  
  return `remove letter=${upperLetter}`;
}

/**
 * Build a command to set a partition as active (bootable)
 * Note: This requires the partition to be selected first
 */
export function buildSetActiveCommand(): string {
  return 'active';
}

/**
 * Build a command to extend a partition
 * @param size - Optional size in MB to extend by. If not specified, uses all available space
 */
export function buildExtendPartitionCommand(size?: number): string {
  if (size !== undefined) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new InvalidCommandError(`Invalid extend size: ${size}`);
    }
    return `extend size=${size}`;
  }
  return 'extend';
}

/**
 * Build a command to shrink a partition
 * @param desired - The amount in MB to shrink by
 * @param minimum - Optional minimum amount in MB that can be shrunk
 */
export function buildShrinkPartitionCommand(desired: number, minimum?: number): string {
  if (!Number.isInteger(desired) || desired <= 0) {
    throw new InvalidCommandError(`Invalid shrink size: ${desired}`);
  }
  
  let command = `shrink desired=${desired}`;
  
  if (minimum !== undefined) {
    if (!Number.isInteger(minimum) || minimum <= 0) {
      throw new InvalidCommandError(`Invalid minimum shrink size: ${minimum}`);
    }
    command += ` minimum=${minimum}`;
  }
  
  return command;
}

/**
 * Build a multi-command script for diskpart
 * @param commands - Array of commands to execute
 */
export function buildCommandScript(commands: string[]): string {
  if (!commands || commands.length === 0) {
    throw new InvalidCommandError('No commands provided');
  }
  
  return commands.join('\n');
}

/**
 * Build a command script to get detailed disk information
 * @param diskNumber - The disk number to query
 */
export function buildDetailDiskScript(diskNumber: number): string {
  return buildCommandScript([
    buildSelectDiskCommand(diskNumber),
    buildDetailDiskCommand(),
    buildListPartitionsCommand()
  ]);
}

/**
 * Build a command script to format a partition
 * @param diskNumber - The disk number
 * @param partitionNumber - The partition number
 * @param fileSystem - The file system to use
 * @param label - Optional volume label
 */
export function buildFormatPartitionScript(
  diskNumber: number,
  partitionNumber: number,
  fileSystem: string,
  label?: string
): string {
  return buildCommandScript([
    buildSelectDiskCommand(diskNumber),
    buildSelectPartitionCommand(partitionNumber),
    buildFormatVolumeCommand(fileSystem, label)
  ]);
}