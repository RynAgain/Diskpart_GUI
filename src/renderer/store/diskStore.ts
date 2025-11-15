import { create } from 'zustand';
import { DiskInfo, VolumeInfo, PartitionInfo, CommandResult } from '../../shared/types';

interface CommandHistoryItem {
  id: string;
  timestamp: Date;
  command: string;
  output: string;
  success: boolean;
}

interface DiskStore {
  // Data state
  disks: DiskInfo[];
  volumes: VolumeInfo[];
  partitions: PartitionInfo[];
  selectedDiskId: number | null;
  selectedDisk: DiskInfo | null;
  selectedPartitionId: number | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  commandHistory: CommandHistoryItem[];
  
  // Actions
  setDisks: (disks: DiskInfo[]) => void;
  setVolumes: (volumes: VolumeInfo[]) => void;
  setPartitions: (partitions: PartitionInfo[]) => void;
  selectDisk: (diskId: number | null) => void;
  selectPartition: (partitionId: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  addCommandToHistory: (command: string, output: string, success: boolean) => void;
  clearCommandHistory: () => void;
  
  // Async actions (will call IPC)
  fetchDisks: () => Promise<void>;
  fetchVolumes: () => Promise<void>;
  fetchPartitions: (diskId: number) => Promise<void>;
  checkAdminStatus: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Disk operations
  cleanDisk: (diskId: number) => Promise<CommandResult>;
  cleanAllDisk: (diskId: number) => Promise<CommandResult>;
  onlineDisk: (diskId: number) => Promise<CommandResult>;
  offlineDisk: (diskId: number) => Promise<CommandResult>;
  detailDisk: (diskId: number) => Promise<CommandResult>;
  
  // Partition operations
  createPartition: (diskId: number, size?: number) => Promise<CommandResult>;
  deletePartition: (diskId: number, partitionId: number) => Promise<CommandResult>;
  formatPartition: (diskId: number, partitionId: number, fileSystem: string, label?: string) => Promise<CommandResult>;
  assignLetter: (diskId: number, partitionId: number, letter: string) => Promise<CommandResult>;
  removeLetter: (diskId: number, partitionId: number, letter: string) => Promise<CommandResult>;
}

export const useDiskStore = create<DiskStore>((set, get) => ({
  // Initial state
  disks: [],
  volumes: [],
  partitions: [],
  selectedDiskId: null,
  selectedDisk: null,
  selectedPartitionId: null,
  loading: false,
  error: null,
  isAdmin: false,
  commandHistory: [],
  
  // Setters
  setDisks: (disks) => set({ disks }),
  
  setVolumes: (volumes) => set({ volumes }),
  
  setPartitions: (partitions) => set({ partitions }),
  
  selectDisk: (diskId) => {
    const disk = diskId !== null ? get().disks.find(d => d.id === diskId) || null : null;
    set({ selectedDiskId: diskId, selectedDisk: disk, selectedPartitionId: null });
    
    // Fetch partitions for selected disk
    if (diskId !== null) {
      get().fetchPartitions(diskId);
    } else {
      set({ partitions: [] });
    }
  },
  
  selectPartition: (partitionId) => set({ selectedPartitionId: partitionId }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  
  addCommandToHistory: (command, output, success) => {
    const historyItem: CommandHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      command,
      output,
      success,
    };
    set((state) => ({
      commandHistory: [...state.commandHistory, historyItem],
    }));
  },
  
  clearCommandHistory: () => set({ commandHistory: [] }),
  
  // Async actions
  fetchDisks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.listDisks();
      if (response.success && response.data) {
        set({ disks: response.data, loading: false });
        get().addCommandToHistory('list disk', JSON.stringify(response.data, null, 2), true);
      } else {
        const errorMsg = response.error?.message || 'Failed to fetch disks';
        set({ error: errorMsg, loading: false });
        get().addCommandToHistory('list disk', errorMsg, false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory('list disk', errorMsg, false);
    }
  },
  
  fetchVolumes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.listVolumes();
      if (response.success && response.data) {
        set({ volumes: response.data, loading: false });
        get().addCommandToHistory('list volume', JSON.stringify(response.data, null, 2), true);
      } else {
        const errorMsg = response.error?.message || 'Failed to fetch volumes';
        set({ error: errorMsg, loading: false });
        get().addCommandToHistory('list volume', errorMsg, false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory('list volume', errorMsg, false);
    }
  },
  
  fetchPartitions: async (diskId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.listPartitions(diskId);
      if (response.success && response.data) {
        set({ partitions: response.data, loading: false });
        get().addCommandToHistory(`list partition (disk ${diskId})`, JSON.stringify(response.data, null, 2), true);
      } else {
        const errorMsg = response.error?.message || 'Failed to fetch partitions';
        set({ error: errorMsg, loading: false });
        get().addCommandToHistory(`list partition (disk ${diskId})`, errorMsg, false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`list partition (disk ${diskId})`, errorMsg, false);
    }
  },
  
  checkAdminStatus: async () => {
    try {
      const isAdmin = await window.electronAPI.checkAdminPrivileges();
      set({ isAdmin });
    } catch (error) {
      console.error('Failed to check admin status:', error);
      set({ isAdmin: false });
    }
  },
  
  refreshAll: async () => {
    await Promise.all([
      get().fetchDisks(),
      get().fetchVolumes(),
    ]);
    
    // Re-fetch partitions if a disk is selected
    const { selectedDiskId } = get();
    if (selectedDiskId !== null) {
      await get().fetchPartitions(selectedDiskId);
    }
  },
  
  // Disk operations
  cleanDisk: async (diskId: number): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.cleanDisk(diskId);
      const success = response.success;
      const message = success ? response.data?.message || 'Disk cleaned successfully' : response.error?.message || 'Failed to clean disk';
      
      get().addCommandToHistory(`clean disk ${diskId}`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`clean disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  cleanAllDisk: async (diskId: number): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.cleanAll(diskId);
      const success = response.success;
      const message = success ? response.data?.message || 'Disk cleaned (all) successfully' : response.error?.message || 'Failed to clean disk';
      
      get().addCommandToHistory(`clean all disk ${diskId}`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`clean all disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  onlineDisk: async (diskId: number): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.selectDisk(diskId);
      const success = response.success;
      const message = success ? `Disk ${diskId} brought online` : response.error?.message || 'Failed to bring disk online';
      
      get().addCommandToHistory(`online disk ${diskId}`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`online disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  offlineDisk: async (diskId: number): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.selectDisk(diskId);
      const success = response.success;
      const message = success ? `Disk ${diskId} taken offline` : response.error?.message || 'Failed to take disk offline';
      
      get().addCommandToHistory(`offline disk ${diskId}`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`offline disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  detailDisk: async (diskId: number): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.detailDisk(diskId);
      const success = response.success;
      const message = success ? JSON.stringify(response.data, null, 2) : response.error?.message || 'Failed to get disk details';
      
      get().addCommandToHistory(`detail disk ${diskId}`, message, success);
      set({ loading: false });
      
      return {
        success,
        message,
        data: response.data,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`detail disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  // Partition operations
  createPartition: async (diskId: number, size?: number): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.createPartition(diskId, size);
      const success = response.success;
      const message = success ? response.data?.message || 'Partition created successfully' : response.error?.message || 'Failed to create partition';
      
      get().addCommandToHistory(`create partition on disk ${diskId}`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`create partition on disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  deletePartition: async (diskId: number, partitionId: number): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.deletePartition(diskId, partitionId);
      const success = response.success;
      const message = success ? response.data?.message || 'Partition deleted successfully' : response.error?.message || 'Failed to delete partition';
      
      get().addCommandToHistory(`delete partition ${partitionId} on disk ${diskId}`, message, success);
      
      if (success) {
        set({ selectedPartitionId: null });
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`delete partition ${partitionId} on disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  formatPartition: async (diskId: number, partitionId: number, fileSystem: string, label?: string): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.formatVolume(diskId, partitionId, fileSystem, label);
      const success = response.success;
      const message = success ? response.data?.message || 'Partition formatted successfully' : response.error?.message || 'Failed to format partition';
      
      get().addCommandToHistory(`format partition ${partitionId} on disk ${diskId} (${fileSystem})`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`format partition ${partitionId} on disk ${diskId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  assignLetter: async (diskId: number, partitionId: number, letter: string): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.assignLetter(diskId, partitionId, letter);
      const success = response.success;
      const message = success ? response.data?.message || `Drive letter ${letter} assigned successfully` : response.error?.message || 'Failed to assign drive letter';
      
      get().addCommandToHistory(`assign letter ${letter} to partition ${partitionId} on disk ${diskId}`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`assign letter ${letter} to partition ${partitionId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  removeLetter: async (diskId: number, partitionId: number, letter: string): Promise<CommandResult> => {
    set({ loading: true, error: null });
    try {
      const response = await window.electronAPI.removeLetter(diskId, partitionId, letter);
      const success = response.success;
      const message = success ? response.data?.message || `Drive letter ${letter} removed successfully` : response.error?.message || 'Failed to remove drive letter';
      
      get().addCommandToHistory(`remove letter ${letter} from partition ${partitionId} on disk ${diskId}`, message, success);
      
      if (success) {
        await get().refreshAll();
      }
      
      set({ loading: false });
      return {
        success,
        message,
        errorCode: response.error?.code,
        details: response.error?.details,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMsg, loading: false });
      get().addCommandToHistory(`remove letter ${letter} from partition ${partitionId}`, errorMsg, false);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
}));