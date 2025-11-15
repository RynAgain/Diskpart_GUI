import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  // Diskpart operations
  listDisks: () => ipcRenderer.invoke('diskpart:list-disks'),
  listVolumes: () => ipcRenderer.invoke('diskpart:list-volumes'),
  listPartitions: (diskId: number) => ipcRenderer.invoke('diskpart:list-partitions', diskId),
  selectDisk: (diskId: number) => ipcRenderer.invoke('diskpart:select-disk', diskId),
  detailDisk: (diskId: number) => ipcRenderer.invoke('diskpart:detail-disk', diskId),
  cleanDisk: (diskId: number) => ipcRenderer.invoke('diskpart:clean-disk', diskId),
  cleanAll: (diskId: number) => ipcRenderer.invoke('diskpart:clean-all', diskId),
  createPartition: (diskId: number, size?: number) => 
    ipcRenderer.invoke('diskpart:create-partition', diskId, size),
  deletePartition: (diskId: number, partitionId: number) => 
    ipcRenderer.invoke('diskpart:delete-partition', diskId, partitionId),
  formatVolume: (diskId: number, partitionId: number, fileSystem: string, label?: string) => 
    ipcRenderer.invoke('diskpart:format-volume', diskId, partitionId, fileSystem, label),
  assignLetter: (diskId: number, partitionId: number, letter: string) => 
    ipcRenderer.invoke('diskpart:assign-letter', diskId, partitionId, letter),
  removeLetter: (diskId: number, partitionId: number, letter: string) => 
    ipcRenderer.invoke('diskpart:remove-letter', diskId, partitionId, letter),
  
  // System operations
  checkAdminPrivileges: () => ipcRenderer.invoke('system:check-admin'),
  getSystemInfo: () => ipcRenderer.invoke('system:get-info'),
  
  // Event listeners
  onCommandOutput: (callback: (output: string) => void) => {
    ipcRenderer.on('command:output', (_event, output: string) => callback(output));
  },
  onOperationProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('operation:progress', (_event, progress: number) => callback(progress));
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);