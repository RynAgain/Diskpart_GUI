import { DiskInfo, PartitionInfo } from '../../shared/types';

export interface SafetyCheckResult {
  safe: boolean;
  warnings: string[];
  requiresTypeToConfirm: boolean;
}

/**
 * Check if a disk is a system or boot disk
 */
export function isSystemDisk(disk: DiskInfo | null): boolean {
  if (!disk) return false;
  return disk.isSystemDisk || disk.isBootDisk;
}

/**
 * Check if an operation on a disk is safe
 */
export function checkDiskOperationSafety(
  operation: string,
  disk: DiskInfo | null
): SafetyCheckResult {
  const warnings: string[] = [];
  let requiresTypeToConfirm = false;

  if (!disk) {
    return {
      safe: false,
      warnings: ['No disk selected'],
      requiresTypeToConfirm: false,
    };
  }

  // Check if it's a system disk
  if (isSystemDisk(disk)) {
    warnings.push('⚠️ This is a SYSTEM or BOOT disk');
    warnings.push('Operating on this disk may make your system unbootable');
    requiresTypeToConfirm = true;
  }

  // Check disk status
  if (disk.status === 'Offline') {
    warnings.push('Disk is currently offline');
  }

  // Operation-specific checks
  switch (operation) {
    case 'clean':
    case 'clean_all':
      warnings.push('ALL DATA on this disk will be PERMANENTLY DELETED');
      warnings.push('All partitions will be removed');
      requiresTypeToConfirm = true;
      break;

    case 'delete_partition':
      warnings.push('The selected partition and ALL its data will be deleted');
      requiresTypeToConfirm = true;
      break;

    case 'format':
      warnings.push('ALL DATA on the partition will be erased');
      requiresTypeToConfirm = true;
      break;

    case 'offline':
      if (isSystemDisk(disk)) {
        warnings.push('Taking the system disk offline will crash your system');
        requiresTypeToConfirm = true;
      }
      break;
  }

  return {
    safe: warnings.length === 0 || !requiresTypeToConfirm,
    warnings,
    requiresTypeToConfirm,
  };
}

/**
 * Check if a partition operation is safe
 */
export function checkPartitionOperationSafety(
  operation: string,
  disk: DiskInfo | null,
  partition: PartitionInfo | null
): SafetyCheckResult {
  const warnings: string[] = [];
  let requiresTypeToConfirm = false;

  if (!disk) {
    return {
      safe: false,
      warnings: ['No disk selected'],
      requiresTypeToConfirm: false,
    };
  }

  if (!partition) {
    return {
      safe: false,
      warnings: ['No partition selected'],
      requiresTypeToConfirm: false,
    };
  }

  // Check if partition is on system disk
  if (isSystemDisk(disk)) {
    warnings.push('⚠️ This partition is on a SYSTEM or BOOT disk');
  }

  // Check partition status
  if (partition.status === 'System' || partition.status === 'Boot') {
    warnings.push(`⚠️ This is a ${partition.status} partition`);
    warnings.push('Modifying this partition may make your system unbootable');
    requiresTypeToConfirm = true;
  }

  // Operation-specific checks
  switch (operation) {
    case 'delete_partition':
      warnings.push('The partition and ALL its data will be permanently deleted');
      if (partition.driveLetter) {
        warnings.push(`Drive ${partition.driveLetter}: will be removed`);
      }
      requiresTypeToConfirm = true;
      break;

    case 'format':
      warnings.push('ALL DATA on this partition will be erased');
      if (partition.driveLetter) {
        warnings.push(`Drive ${partition.driveLetter}: will be formatted`);
      }
      requiresTypeToConfirm = true;
      break;

    case 'shrink':
      warnings.push('Shrinking may fail if there are unmovable files');
      warnings.push('Backup important data before shrinking');
      break;

    case 'extend':
      if (disk.free === 0) {
        warnings.push('No free space available on disk');
        return {
          safe: false,
          warnings,
          requiresTypeToConfirm: false,
        };
      }
      break;
  }

  return {
    safe: warnings.length === 0 || !requiresTypeToConfirm,
    warnings,
    requiresTypeToConfirm,
  };
}

/**
 * Validate partition size
 */
export function validatePartitionSize(
  size: number,
  disk: DiskInfo | null
): { valid: boolean; error?: string } {
  if (!disk) {
    return { valid: false, error: 'No disk selected' };
  }

  if (size <= 0) {
    return { valid: false, error: 'Size must be greater than 0' };
  }

  if (size > disk.free) {
    return {
      valid: false,
      error: `Size exceeds available free space (${formatBytes(disk.free)})`,
    };
  }

  // Minimum partition size (1 MB)
  const minSize = 1024 * 1024;
  if (size < minSize) {
    return { valid: false, error: 'Partition size must be at least 1 MB' };
  }

  return { valid: true };
}

/**
 * Validate drive letter
 */
export function validateDriveLetter(letter: string): { valid: boolean; error?: string } {
  if (!letter) {
    return { valid: false, error: 'Drive letter is required' };
  }

  const upperLetter = letter.toUpperCase();
  
  // Check if it's a single letter
  if (upperLetter.length !== 1) {
    return { valid: false, error: 'Drive letter must be a single character' };
  }

  // Check if it's A-Z
  if (!/^[A-Z]$/.test(upperLetter)) {
    return { valid: false, error: 'Drive letter must be A-Z' };
  }

  // Reserved letters
  const reserved = ['A', 'B', 'C']; // A, B are floppy, C is typically system
  if (reserved.includes(upperLetter)) {
    return {
      valid: false,
      error: `Drive letter ${upperLetter}: is typically reserved`,
    };
  }

  return { valid: true };
}

/**
 * Validate file system
 */
export function validateFileSystem(
  fileSystem: string
): { valid: boolean; error?: string } {
  const validFileSystems = ['NTFS', 'FAT32', 'exFAT'];
  
  if (!fileSystem) {
    return { valid: false, error: 'File system is required' };
  }

  if (!validFileSystems.includes(fileSystem.toUpperCase())) {
    return {
      valid: false,
      error: `File system must be one of: ${validFileSystems.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get confirmation type based on operation and safety check
 */
export function getConfirmationType(
  safetyCheck: SafetyCheckResult
): 'simple' | 'detailed' | 'type-to-confirm' {
  if (safetyCheck.requiresTypeToConfirm) {
    return 'type-to-confirm';
  }
  if (safetyCheck.warnings.length > 0) {
    return 'detailed';
  }
  return 'simple';
}