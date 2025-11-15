/**
 * Output parser module for parsing Diskpart command outputs
 */

import { DiskInfo, VolumeInfo, PartitionInfo } from '../../shared/types';
import { ParseError } from './errors';

/**
 * Example output from "list disk":
 * 
 *   Disk ###  Status         Size     Free     Dyn  Gpt
 *   --------  -------------  -------  -------  ---  ---
 *   Disk 0    Online          238 GB      0 B        *
 *   Disk 1    Online          931 GB   931 GB
 *   Disk 2    No Media           0 B      0 B
 * 
 * Parse the output of "list disk" command
 */
export function parseListDisk(output: string): DiskInfo[] {
  const disks: DiskInfo[] = [];
  const lines = output.split('\n').map(line => line.trim());
  
  // Find the header line (contains "Disk ###")
  const headerIndex = lines.findIndex(line => line.includes('Disk ###'));
  if (headerIndex === -1) {
    throw new ParseError('Could not find disk list header in output');
  }
  
  // Skip header and separator lines
  const dataLines = lines.slice(headerIndex + 2);
  
  for (const line of dataLines) {
    if (!line || !line.startsWith('Disk ')) continue;
    
    try {
      // Parse disk line: "Disk 0    Online          238 GB      0 B        *"
      const match = line.match(/Disk\s+(\d+)\s+(\S+(?:\s+\S+)*?)\s+(\d+\s+[KMGT]?B)\s+(\d+\s+[KMGT]?B)(?:\s+(\*))?\s*(?:\s+(\*))?/);
      
      if (!match) continue;
      
      const [, diskNum, status, sizeStr, freeStr, dynMarker, gptMarker] = match;
      
      const disk: DiskInfo = {
        id: parseInt(diskNum, 10),
        status: normalizeStatus(status),
        size: parseSize(sizeStr),
        free: parseSize(freeStr),
        isSystemDisk: false, // Will be determined from detail disk
        isBootDisk: false,   // Will be determined from detail disk
        diskType: dynMarker === '*' ? 'Dynamic' : 'Basic',
        partitionStyle: gptMarker === '*' ? 'GPT' : 'MBR',
        partitions: []
      };
      
      disks.push(disk);
    } catch (error) {
      console.warn(`Failed to parse disk line: ${line}`, error);
    }
  }
  
  return disks;
}

/**
 * Example output from "list volume":
 * 
 *   Volume ###  Ltr  Label        Fs     Type        Size     Status     Info
 *   ----------  ---  -----------  -----  ----------  -------  ---------  --------
 *   Volume 0     D   Data         NTFS   Partition    100 GB  Healthy
 *   Volume 1     C   System       NTFS   Partition    138 GB  Healthy    System
 *   Volume 2         Recovery     NTFS   Partition    499 MB  Healthy    Hidden
 *   Volume 3     E                FAT32  Removable     14 GB  Healthy
 * 
 * Parse the output of "list volume" command
 */
export function parseListVolume(output: string): VolumeInfo[] {
  const volumes: VolumeInfo[] = [];
  const lines = output.split('\n').map(line => line.trim());
  
  // Find the header line
  const headerIndex = lines.findIndex(line => line.includes('Volume ###'));
  if (headerIndex === -1) {
    throw new ParseError('Could not find volume list header in output');
  }
  
  // Skip header and separator lines
  const dataLines = lines.slice(headerIndex + 2);
  
  for (const line of dataLines) {
    if (!line || !line.startsWith('Volume ')) continue;
    
    try {
      // Parse volume line - more flexible regex to handle varying spacing
      const parts = line.split(/\s+/);
      
      if (parts.length < 7) continue;
      
      // Volume 0     D   Data         NTFS   Partition    100 GB  Healthy
      const volumeNum = parts[1];
      const letter = parts[2] !== '' && parts[2].length === 1 ? parts[2] : undefined;
      
      // Find the file system (NTFS, FAT32, etc.)
      let fsIndex = parts.findIndex(p => ['NTFS', 'FAT32', 'FAT', 'exFAT', 'RAW'].includes(p.toUpperCase()));
      if (fsIndex === -1) fsIndex = 4; // Default position
      
      const label = fsIndex > 3 ? parts.slice(3, fsIndex).join(' ') : undefined;
      const fileSystem = parts[fsIndex] || 'Unknown';
      const type = parts[fsIndex + 1] || 'Partition';
      const sizeStr = parts[fsIndex + 2] + ' ' + parts[fsIndex + 3];
      const status = parts[fsIndex + 4] || 'Unknown';
      const info = parts.slice(fsIndex + 5).join(' ');
      
      const volume: VolumeInfo = {
        letter,
        label: label || undefined,
        fileSystem,
        type: normalizeVolumeType(type),
        size: parseSize(sizeStr),
        status: status === 'Healthy' ? 'Healthy' : 'Failed',
        info
      };
      
      volumes.push(volume);
    } catch (error) {
      console.warn(`Failed to parse volume line: ${line}`, error);
    }
  }
  
  return volumes;
}

/**
 * Example output from "list partition":
 * 
 *   Partition ###  Type              Size     Offset
 *   -------------  ----------------  -------  -------
 *   Partition 1    Primary            100 MB  1024 KB
 *   Partition 2    Primary            137 GB   101 MB
 *   Partition 3    Recovery           499 MB   137 GB
 * 
 * Parse the output of "list partition" command
 */
export function parseListPartition(output: string): PartitionInfo[] {
  const partitions: PartitionInfo[] = [];
  const lines = output.split('\n').map(line => line.trim());
  
  // Find the header line
  const headerIndex = lines.findIndex(line => line.includes('Partition ###'));
  if (headerIndex === -1) {
    throw new ParseError('Could not find partition list header in output');
  }
  
  // Skip header and separator lines
  const dataLines = lines.slice(headerIndex + 2);
  
  for (const line of dataLines) {
    if (!line || !line.startsWith('Partition ')) continue;
    
    try {
      // Parse partition line
      const parts = line.split(/\s+/);
      
      if (parts.length < 5) continue;
      
      const partNum = parseInt(parts[1], 10);
      const type = parts[2];
      const sizeStr = parts[3] + ' ' + parts[4];
      const offsetStr = parts[5] + ' ' + parts[6];
      
      const partition: PartitionInfo = {
        id: partNum,
        type: normalizePartitionType(type),
        size: parseSize(sizeStr),
        offset: parseSize(offsetStr),
        status: 'Healthy' // Default, will be updated from detail
      };
      
      partitions.push(partition);
    } catch (error) {
      console.warn(`Failed to parse partition line: ${line}`, error);
    }
  }
  
  return partitions;
}

/**
 * Example output from "detail disk":
 * 
 * HITACHI HTS54323 ATA Device
 * Disk ID: 12345678
 * Type   : SATA
 * Status : Online
 * Path   : 0
 * Target : 0
 * LUN ID : 0
 * Location Path : PCIROOT(0)#PCI(1F02)#ATA(C00T00L00)
 * Current Read-only State : No
 * Read-only  : No
 * Boot Disk  : Yes
 * Pagefile Disk  : Yes
 * Hibernation File Disk  : No
 * Crashdump Disk  : No
 * Clustered Disk  : No
 * 
 *   Volume ###  Ltr  Label        Fs     Type        Size     Status     Info
 *   ----------  ---  -----------  -----  ----------  -------  ---------  --------
 *   Volume 2     C   System       NTFS   Partition    137 GB  Healthy    System
 * 
 * Parse the output of "detail disk" command
 */
export function parseDetailDisk(output: string): Partial<DiskInfo> {
  const details: Partial<DiskInfo> = {};
  const lines = output.split('\n').map(line => line.trim());
  
  for (const line of lines) {
    if (line.includes('Boot Disk') && line.includes('Yes')) {
      details.isBootDisk = true;
    }
    if (line.includes('Pagefile Disk') && line.includes('Yes')) {
      details.isSystemDisk = true;
    }
    if (line.includes('Type') && line.includes('Dynamic')) {
      details.diskType = 'Dynamic';
    }
  }
  
  // Parse volumes from detail output
  const volumes = parseVolumesFromDetail(output);
  if (volumes.length > 0) {
    // Check if any volume has "System" or "Boot" in info
    const hasSystemVolume = volumes.some(v => 
      v.info.toLowerCase().includes('system') || 
      v.info.toLowerCase().includes('boot')
    );
    if (hasSystemVolume) {
      details.isSystemDisk = true;
    }
  }
  
  return details;
}

/**
 * Parse volumes from detail disk output
 */
function parseVolumesFromDetail(output: string): VolumeInfo[] {
  // Check if output contains volume list
  if (!output.includes('Volume ###')) {
    return [];
  }
  
  // Extract the volume list section
  const volumeSection = output.substring(output.indexOf('Volume ###'));
  return parseListVolume(volumeSection);
}

/**
 * Parse a size string (e.g., "238 GB", "1024 KB") to bytes
 */
function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/(\d+)\s*([KMGT]?B)/i);
  if (!match) return 0;
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toUpperCase();
  
  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };
  
  return value * (multipliers[unit] || 1);
}

/**
 * Normalize disk status string
 */
function normalizeStatus(status: string): 'Online' | 'Offline' | 'No Media' {
  const normalized = status.trim().toLowerCase();
  
  if (normalized.includes('online')) return 'Online';
  if (normalized.includes('offline')) return 'Offline';
  if (normalized.includes('no media')) return 'No Media';
  
  return 'Offline';
}

/**
 * Normalize volume type string
 */
function normalizeVolumeType(type: string): 'Partition' | 'Removable' | 'CD-ROM' {
  const normalized = type.trim().toLowerCase();
  
  if (normalized.includes('removable')) return 'Removable';
  if (normalized.includes('cd') || normalized.includes('dvd')) return 'CD-ROM';
  
  return 'Partition';
}

/**
 * Normalize partition type string
 */
function normalizePartitionType(type: string): 'Primary' | 'Extended' | 'Logical' {
  const normalized = type.trim().toLowerCase();
  
  if (normalized.includes('extended')) return 'Extended';
  if (normalized.includes('logical')) return 'Logical';
  
  return 'Primary';
}

/**
 * Check if output indicates success
 */
export function isSuccessOutput(output: string): boolean {
  const lowerOutput = output.toLowerCase();
  
  // Check for success indicators
  if (lowerOutput.includes('diskpart successfully')) return true;
  if (lowerOutput.includes('completed successfully')) return true;
  
  // Check for error indicators
  if (lowerOutput.includes('error')) return false;
  if (lowerOutput.includes('failed')) return false;
  if (lowerOutput.includes('access is denied')) return false;
  if (lowerOutput.includes('cannot')) return false;
  
  // If no clear indicator, assume success if output is not empty
  return output.trim().length > 0;
}

/**
 * Extract error message from output
 */
export function extractErrorMessage(output: string): string | null {
  const lines = output.split('\n').map(line => line.trim());
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('error') || 
        lowerLine.includes('failed') || 
        lowerLine.includes('denied') ||
        lowerLine.includes('cannot')) {
      return line;
    }
  }
  
  return null;
}