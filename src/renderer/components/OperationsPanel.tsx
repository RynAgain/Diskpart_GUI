import React, { useState } from 'react';
import { Card, Button, Space, Divider, Tooltip, Tag, message } from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  SelectOutlined,
  InfoCircleOutlined,
  PoweroffOutlined,
  SyncOutlined,
  DeleteOutlined,
  ClearOutlined,
  PlusOutlined,
  FormatPainterOutlined,
  ArrowsAltOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import { useDiskStore } from '../store/diskStore';
import ConfirmationDialog from './ConfirmationDialog';
import InputDialog, { InputDialogType } from './InputDialog';
import {
  checkDiskOperationSafety,
  checkPartitionOperationSafety,
  getConfirmationType,
} from '../utils/safetyChecks';

interface OperationButtonProps {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}

const OperationButton: React.FC<OperationButtonProps> = ({
  icon,
  label,
  tooltip,
  onClick,
  disabled = false,
  danger = false,
  loading = false,
}) => (
  <Tooltip title={tooltip}>
    <Button
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      danger={danger}
      loading={loading}
      style={{ width: '100%' }}
    >
      {label}
    </Button>
  </Tooltip>
);

interface ConfirmationState {
  open: boolean;
  type: 'simple' | 'detailed' | 'type-to-confirm';
  title: string;
  operation: string;
  description?: string;
  impact?: string[];
  onConfirm: () => void;
}

interface InputDialogState {
  open: boolean;
  type: InputDialogType;
  onConfirm: (values: any) => void;
}

const OperationsPanel: React.FC = () => {
  const {
    selectedDiskId,
    selectedDisk,
    selectedPartitionId,
    partitions,
    isAdmin,
    loading,
    fetchDisks,
    fetchVolumes,
    cleanDisk,
    cleanAllDisk,
    detailDisk,
    createPartition,
    deletePartition,
    formatPartition,
    assignLetter,
    refreshAll,
  } = useDiskStore();

  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    open: false,
    type: 'simple',
    title: '',
    operation: '',
    onConfirm: () => {},
  });

  const [inputDialogState, setInputDialogState] = useState<InputDialogState>({
    open: false,
    type: 'create_partition',
    onConfirm: () => {},
  });

  const selectedPartition = selectedPartitionId !== null
    ? partitions.find(p => p.id === selectedPartitionId) || null
    : null;

  const showConfirmation = (
    operation: string,
    title: string,
    description: string,
    impact: string[],
    onConfirm: () => void,
    type: 'simple' | 'detailed' | 'type-to-confirm' = 'simple'
  ) => {
    setConfirmationState({
      open: true,
      type,
      title,
      operation,
      description,
      impact,
      onConfirm,
    });
  };

  const closeConfirmation = () => {
    setConfirmationState({
      ...confirmationState,
      open: false,
    });
  };

  const showInputDialog = (type: InputDialogType, onConfirm: (values: any) => void) => {
    setInputDialogState({
      open: true,
      type,
      onConfirm,
    });
  };

  const closeInputDialog = () => {
    setInputDialogState({
      ...inputDialogState,
      open: false,
    });
  };

  // Operation handlers
  const handleRescan = async () => {
    try {
      await refreshAll();
      message.success('Disks rescanned successfully');
    } catch (error) {
      message.error('Failed to rescan disks');
    }
  };

  const handleListDisks = async () => {
    try {
      await fetchDisks();
      message.success('Disk list refreshed');
    } catch (error) {
      message.error('Failed to refresh disk list');
    }
  };

  const handleSelectDisk = () => {
    if (selectedDiskId !== null) {
      message.info(`Disk ${selectedDiskId} is already selected`);
    }
  };

  const handleDetailDisk = async () => {
    if (selectedDiskId === null) return;

    try {
      const result = await detailDisk(selectedDiskId);
      if (result.success) {
        message.success('Disk details retrieved');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('Failed to get disk details');
    }
  };

  const handleClean = () => {
    if (selectedDiskId === null || !selectedDisk) return;

    const safetyCheck = checkDiskOperationSafety('clean', selectedDisk);
    const confirmType = getConfirmationType(safetyCheck);

    showConfirmation(
      'clean',
      'Clean Disk',
      `Remove all partitions from Disk ${selectedDiskId}`,
      safetyCheck.warnings,
      async () => {
        closeConfirmation();
        try {
          const result = await cleanDisk(selectedDiskId);
          if (result.success) {
            message.success(result.message);
          } else {
            message.error(result.message);
          }
        } catch (error) {
          message.error('Failed to clean disk');
        }
      },
      confirmType
    );
  };

  const handleCleanAll = () => {
    if (selectedDiskId === null || !selectedDisk) return;

    const safetyCheck = checkDiskOperationSafety('clean_all', selectedDisk);
    const confirmType = getConfirmationType(safetyCheck);

    showConfirmation(
      'clean all',
      'Clean All (Secure Erase)',
      `Securely erase ALL data from Disk ${selectedDiskId}`,
      safetyCheck.warnings,
      async () => {
        closeConfirmation();
        try {
          const result = await cleanAllDisk(selectedDiskId);
          if (result.success) {
            message.success(result.message);
          } else {
            message.error(result.message);
          }
        } catch (error) {
          message.error('Failed to clean disk');
        }
      },
      confirmType
    );
  };

  const handleCreatePartition = () => {
    if (selectedDiskId === null) return;

    showInputDialog('create_partition', async (values) => {
      closeInputDialog();
      try {
        const result = await createPartition(selectedDiskId, values.size);
        if (result.success) {
          message.success(result.message);
        } else {
          message.error(result.message);
        }
      } catch (error) {
        message.error('Failed to create partition');
      }
    });
  };

  const handleDeletePartition = () => {
    if (selectedDiskId === null || selectedPartitionId === null || !selectedDisk) return;

    const safetyCheck = checkPartitionOperationSafety(
      'delete_partition',
      selectedDisk,
      selectedPartition
    );
    const confirmType = getConfirmationType(safetyCheck);

    showConfirmation(
      'delete partition',
      'Delete Partition',
      `Delete partition ${selectedPartitionId} from Disk ${selectedDiskId}`,
      safetyCheck.warnings,
      async () => {
        closeConfirmation();
        try {
          const result = await deletePartition(selectedDiskId, selectedPartitionId);
          if (result.success) {
            message.success(result.message);
          } else {
            message.error(result.message);
          }
        } catch (error) {
          message.error('Failed to delete partition');
        }
      },
      confirmType
    );
  };

  const handleFormat = () => {
    if (selectedDiskId === null || selectedPartitionId === null || !selectedDisk) return;

    const safetyCheck = checkPartitionOperationSafety(
      'format',
      selectedDisk,
      selectedPartition
    );

    showInputDialog('format', async (values) => {
      closeInputDialog();

      const confirmType = getConfirmationType(safetyCheck);
      showConfirmation(
        'format partition',
        'Format Partition',
        `Format partition ${selectedPartitionId} with ${values.fileSystem}`,
        safetyCheck.warnings,
        async () => {
          closeConfirmation();
          try {
            const result = await formatPartition(
              selectedDiskId,
              selectedPartitionId,
              values.fileSystem,
              values.label
            );
            if (result.success) {
              message.success(result.message);
            } else {
              message.error(result.message);
            }
          } catch (error) {
            message.error('Failed to format partition');
          }
        },
        confirmType
      );
    });
  };

  const handleAssignLetter = () => {
    if (selectedDiskId === null || selectedPartitionId === null) return;

    showInputDialog('assign_letter', async (values) => {
      closeInputDialog();
      try {
        const result = await assignLetter(selectedDiskId, selectedPartitionId, values.letter);
        if (result.success) {
          message.success(result.message);
        } else {
          message.error(result.message);
        }
      } catch (error) {
        message.error('Failed to assign drive letter');
      }
    });
  };

  const handleExtend = () => {
    if (selectedDiskId === null || selectedPartitionId === null) return;
    message.info('Extend partition feature coming soon');
  };

  const handleShrink = () => {
    if (selectedDiskId === null || selectedPartitionId === null) return;
    message.info('Shrink partition feature coming soon');
  };

  const handleOnline = () => {
    if (selectedDiskId === null) return;
    message.info('Online disk feature coming soon');
  };

  const handleOffline = () => {
    if (selectedDiskId === null || !selectedDisk) return;

    const safetyCheck = checkDiskOperationSafety('offline', selectedDisk);
    const confirmType = getConfirmationType(safetyCheck);

    showConfirmation(
      'offline',
      'Take Disk Offline',
      `Take Disk ${selectedDiskId} offline`,
      safetyCheck.warnings,
      async () => {
        closeConfirmation();
        message.info('Offline disk feature coming soon');
      },
      confirmType
    );
  };

  const handleAttributes = () => {
    if (selectedDiskId === null) return;
    message.info('Disk attributes feature coming soon');
  };

  return (
    <>
      <Card
        title="Operations"
        extra={!isAdmin && <Tag color="warning">Admin Required</Tag>}
      >
        {/* Safe Operations */}
        <div className="operation-group">
          <h4>
            <Tag color="green">Safe Operations</Tag>
          </h4>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <OperationButton
              icon={<ReloadOutlined />}
              label="Rescan"
              tooltip="Rescan all disks and update the list (F5)"
              onClick={handleRescan}
              loading={loading}
            />
            <OperationButton
              icon={<EyeOutlined />}
              label="List Disks"
              tooltip="Refresh the disk list"
              onClick={handleListDisks}
              loading={loading}
            />
            <OperationButton
              icon={<SelectOutlined />}
              label="Select Disk"
              tooltip="Select a disk for operations"
              onClick={handleSelectDisk}
              disabled={!selectedDiskId}
            />
            <OperationButton
              icon={<InfoCircleOutlined />}
              label="Detail"
              tooltip="Show detailed information about selected disk"
              onClick={handleDetailDisk}
              disabled={!selectedDiskId}
            />
          </Space>
        </div>

        <Divider />

        {/* Moderate Operations */}
        <div className="operation-group">
          <h4>
            <Tag color="orange">Moderate Operations</Tag>
          </h4>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <OperationButton
              icon={<PoweroffOutlined />}
              label="Online"
              tooltip="Bring the selected disk online"
              onClick={handleOnline}
              disabled={!selectedDiskId || !isAdmin}
            />
            <OperationButton
              icon={<PoweroffOutlined />}
              label="Offline"
              tooltip="Take the selected disk offline"
              onClick={handleOffline}
              disabled={!selectedDiskId || !isAdmin}
            />
            <OperationButton
              icon={<SyncOutlined />}
              label="Attributes"
              tooltip="View or modify disk attributes"
              onClick={handleAttributes}
              disabled={!selectedDiskId || !isAdmin}
            />
          </Space>
        </div>

        <Divider />

        {/* Destructive Operations */}
        <div className="operation-group">
          <h4>
            <Tag color="red">Destructive Operations</Tag>
          </h4>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <OperationButton
              icon={<ClearOutlined />}
              label="Clean"
              tooltip="Remove all partitions from the disk (DESTRUCTIVE)"
              onClick={handleClean}
              disabled={!selectedDiskId || !isAdmin}
              danger
            />
            <OperationButton
              icon={<DeleteOutlined />}
              label="Clean All"
              tooltip="Remove all partitions and zero all sectors (VERY DESTRUCTIVE)"
              onClick={handleCleanAll}
              disabled={!selectedDiskId || !isAdmin}
              danger
            />
            <OperationButton
              icon={<PlusOutlined />}
              label="Create Partition"
              tooltip="Create a new partition on the selected disk"
              onClick={handleCreatePartition}
              disabled={!selectedDiskId || !isAdmin}
            />
            <OperationButton
              icon={<DeleteOutlined />}
              label="Delete Partition"
              tooltip="Delete a partition from the selected disk (Delete key)"
              onClick={handleDeletePartition}
              disabled={!selectedDiskId || !selectedPartitionId || !isAdmin}
              danger
            />
            <OperationButton
              icon={<FormatPainterOutlined />}
              label="Format"
              tooltip="Format a partition with a file system"
              onClick={handleFormat}
              disabled={!selectedDiskId || !selectedPartitionId || !isAdmin}
              danger
            />
            <OperationButton
              icon={<SelectOutlined />}
              label="Assign Letter"
              tooltip="Assign a drive letter to a partition"
              onClick={handleAssignLetter}
              disabled={!selectedDiskId || !selectedPartitionId || !isAdmin}
            />
            <OperationButton
              icon={<ArrowsAltOutlined />}
              label="Extend"
              tooltip="Extend a partition to use free space"
              onClick={handleExtend}
              disabled={!selectedDiskId || !selectedPartitionId || !isAdmin}
            />
            <OperationButton
              icon={<ShrinkOutlined />}
              label="Shrink"
              tooltip="Shrink a partition to free up space"
              onClick={handleShrink}
              disabled={!selectedDiskId || !selectedPartitionId || !isAdmin}
            />
          </Space>
        </div>

        {!isAdmin && (
          <div style={{ marginTop: 16, padding: 8, background: '#fff7e6', borderRadius: 4 }}>
            <small style={{ color: '#d46b08' }}>
              ⚠️ Administrator privileges required for most operations
            </small>
          </div>
        )}
      </Card>

      <ConfirmationDialog
        open={confirmationState.open}
        type={confirmationState.type}
        title={confirmationState.title}
        operation={confirmationState.operation}
        description={confirmationState.description}
        impact={confirmationState.impact}
        diskId={selectedDiskId || undefined}
        onConfirm={confirmationState.onConfirm}
        onCancel={closeConfirmation}
        danger={confirmationState.type !== 'simple'}
      />

      <InputDialog
        open={inputDialogState.open}
        type={inputDialogState.type}
        disk={selectedDisk}
        partitionId={selectedPartitionId || undefined}
        onConfirm={inputDialogState.onConfirm}
        onCancel={closeInputDialog}
      />
    </>
  );
};

export default OperationsPanel;