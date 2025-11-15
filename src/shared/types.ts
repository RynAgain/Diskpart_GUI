// Core Disk Types
export interface DiskInfo {
  id: number;
  status: 'Online' | 'Offline' | 'No Media';
  size: number; // in bytes
  free: number; // in bytes
  isSystemDisk: boolean;
  isBootDisk: boolean;
  diskType: 'Basic' | 'Dynamic';
  partitionStyle: 'MBR' | 'GPT';
  partitions: PartitionInfo[];
}

export interface PartitionInfo {
  id: number;
  type: 'Primary' | 'Extended' | 'Logical';
  size: number;
  offset: number;
  status: 'Healthy' | 'Active' | 'System' | 'Boot';
  fileSystem?: 'NTFS' | 'FAT32' | 'exFAT' | 'RAW';
  label?: string;
  driveLetter?: string;
}

export interface VolumeInfo {
  letter?: string;
  label?: string;
  fileSystem: string;
  type: 'Partition' | 'Removable' | 'CD-ROM';
  size: number;
  status: 'Healthy' | 'Failed';
  info: string;
}

// Operation Types
export type OperationType = 
  | 'list_disks'
  | 'list_volumes'
  | 'list_partitions'
  | 'select_disk'
  | 'detail_disk'
  | 'clean_disk'
  | 'clean_all'
  | 'create_partition'
  | 'delete_partition'
  | 'format_volume'
  | 'assign_letter'
  | 'remove_letter'
  | 'extend_partition'
  | 'shrink_partition'
  | 'set_active';

export interface DiskpartCommand {
  id: string;
  type: OperationType;
  targetDisk?: number;
  targetPartition?: number;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
  result?: CommandResult;
}

export interface CommandResult {
  success: boolean;
  message: string;
  errorCode?: string;
  details?: string;
  data?: any;
}

// IPC Message Types
export interface IPCRequest {
  channel: string;
  operation: OperationType;
  payload: any;
}

export interface IPCResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

// UI State Types
export interface ConfirmationDialogState {
  open: boolean;
  type: 'simple' | 'detailed' | 'type-to-confirm';
  operation: DiskpartCommand | null;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  description?: string;
  duration?: number;
}

// Electron API exposed to renderer
export interface ElectronAPI {
  // Diskpart operations
  listDisks: () => Promise<IPCResponse>;
  listVolumes: () => Promise<IPCResponse>;
  listPartitions: (diskId: number) => Promise<IPCResponse>;
  selectDisk: (diskId: number) => Promise<IPCResponse>;
  detailDisk: (diskId: number) => Promise<IPCResponse>;
  cleanDisk: (diskId: number) => Promise<IPCResponse>;
  cleanAll: (diskId: number) => Promise<IPCResponse>;
  createPartition: (diskId: number, size?: number) => Promise<IPCResponse>;
  deletePartition: (diskId: number, partitionId: number) => Promise<IPCResponse>;
  formatVolume: (diskId: number, partitionId: number, fileSystem: string, label?: string) => Promise<IPCResponse>;
  assignLetter: (diskId: number, partitionId: number, letter: string) => Promise<IPCResponse>;
  removeLetter: (diskId: number, partitionId: number, letter: string) => Promise<IPCResponse>;
  
  // System operations
  checkAdminPrivileges: () => Promise<boolean>;
  getSystemInfo: () => Promise<any>;
  
  // Event listeners
  onCommandOutput: (callback: (output: string) => void) => void;
  onOperationProgress: (callback: (progress: number) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}