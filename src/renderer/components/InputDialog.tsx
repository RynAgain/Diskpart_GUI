import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, InputNumber, Form, Alert, Space, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  validatePartitionSize,
  validateDriveLetter,
  validateFileSystem,
  formatBytes,
} from '../utils/safetyChecks';
import { DiskInfo } from '../../shared/types';

const { Text } = Typography;
const { Option } = Select;

export type InputDialogType =
  | 'create_partition'
  | 'format'
  | 'extend'
  | 'shrink'
  | 'assign_letter';

interface InputDialogProps {
  open: boolean;
  type: InputDialogType;
  disk: DiskInfo | null;
  partitionId?: number;
  onConfirm: (values: any) => void;
  onCancel: () => void;
}

const InputDialog: React.FC<InputDialogProps> = ({
  open,
  type,
  disk,
  partitionId,
  onConfirm,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      form.resetFields();
      setError('');
      
      // Set default values based on type
      if (type === 'format') {
        form.setFieldsValue({ fileSystem: 'NTFS' });
      }
    }
  }, [open, type, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setError('');

      // Additional validation based on type
      switch (type) {
        case 'create_partition':
        case 'extend':
        case 'shrink':
          if (values.size) {
            const sizeInBytes = values.size * 1024 * 1024; // Convert MB to bytes
            const validation = validatePartitionSize(sizeInBytes, disk);
            if (!validation.valid) {
              setError(validation.error || 'Invalid size');
              return;
            }
            values.size = sizeInBytes;
          }
          break;

        case 'assign_letter':
          const letterValidation = validateDriveLetter(values.letter);
          if (!letterValidation.valid) {
            setError(letterValidation.error || 'Invalid drive letter');
            return;
          }
          values.letter = values.letter.toUpperCase();
          break;

        case 'format':
          const fsValidation = validateFileSystem(values.fileSystem);
          if (!fsValidation.valid) {
            setError(fsValidation.error || 'Invalid file system');
            return;
          }
          break;
      }

      onConfirm(values);
      form.resetFields();
    } catch (err) {
      console.error('Form validation failed:', err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError('');
    onCancel();
  };

  const getTitle = (): string => {
    switch (type) {
      case 'create_partition':
        return 'Create Partition';
      case 'format':
        return 'Format Partition';
      case 'extend':
        return 'Extend Partition';
      case 'shrink':
        return 'Shrink Partition';
      case 'assign_letter':
        return 'Assign Drive Letter';
      default:
        return 'Input Required';
    }
  };

  const renderFormFields = () => {
    switch (type) {
      case 'create_partition':
        return (
          <>
            <Alert
              message="Create New Partition"
              description={`Available free space: ${disk ? formatBytes(disk.free) : '0 Bytes'}`}
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              label="Size (MB)"
              name="size"
              rules={[
                { required: false },
                {
                  type: 'number',
                  min: 1,
                  message: 'Size must be at least 1 MB',
                },
              ]}
              tooltip="Leave empty to use all available space"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Leave empty for maximum size"
                min={1}
                max={disk ? Math.floor(disk.free / (1024 * 1024)) : undefined}
              />
            </Form.Item>
            <Form.Item
              label="Partition Type"
              name="type"
              initialValue="primary"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="primary">Primary</Option>
                <Option value="extended">Extended</Option>
                <Option value="logical">Logical</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'format':
        return (
          <>
            <Alert
              message="Format Partition"
              description="All data on this partition will be permanently erased"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              label="File System"
              name="fileSystem"
              rules={[{ required: true, message: 'Please select a file system' }]}
              initialValue="NTFS"
            >
              <Select>
                <Option value="NTFS">NTFS</Option>
                <Option value="FAT32">FAT32</Option>
                <Option value="exFAT">exFAT</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Volume Label"
              name="label"
              rules={[
                { max: 32, message: 'Label must be 32 characters or less' },
              ]}
            >
              <Input placeholder="Optional volume label" maxLength={32} />
            </Form.Item>
            <Form.Item
              label="Quick Format"
              name="quick"
              valuePropName="checked"
              initialValue={true}
            >
              <Select defaultValue={true}>
                <Option value={true}>Yes (Faster)</Option>
                <Option value={false}>No (Full format, slower but more thorough)</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'extend':
        return (
          <>
            <Alert
              message="Extend Partition"
              description={`Available free space: ${disk ? formatBytes(disk.free) : '0 Bytes'}`}
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              label="Extend by (MB)"
              name="size"
              rules={[
                { required: false },
                {
                  type: 'number',
                  min: 1,
                  message: 'Size must be at least 1 MB',
                },
              ]}
              tooltip="Leave empty to use all available space"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Leave empty for maximum extension"
                min={1}
                max={disk ? Math.floor(disk.free / (1024 * 1024)) : undefined}
              />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>
              The partition will be extended using adjacent free space
            </Text>
          </>
        );

      case 'shrink':
        return (
          <>
            <Alert
              message="Shrink Partition"
              description="Shrinking may fail if there are unmovable files at the end of the partition"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              label="Shrink by (MB)"
              name="size"
              rules={[
                { required: true, message: 'Please specify shrink size' },
                {
                  type: 'number',
                  min: 1,
                  message: 'Size must be at least 1 MB',
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Amount to shrink"
                min={1}
              />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Backup important data before shrinking. The operation may take several minutes.
            </Text>
          </>
        );

      case 'assign_letter':
        return (
          <>
            <Alert
              message="Assign Drive Letter"
              description="Choose an available drive letter for this partition"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              label="Drive Letter"
              name="letter"
              rules={[
                { required: true, message: 'Please enter a drive letter' },
                { len: 1, message: 'Drive letter must be a single character' },
                { pattern: /^[A-Za-z]$/, message: 'Drive letter must be A-Z' },
              ]}
            >
              <Input
                placeholder="E"
                maxLength={1}
                style={{ width: '100%', textTransform: 'uppercase' }}
              />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Recommended: Use letters D-Z. Letters A, B, and C are typically reserved.
            </Text>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Confirm"
      cancelText="Cancel"
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Form form={form} layout="vertical">
          {renderFormFields()}
        </Form>
        {error && (
          <Alert message="Validation Error" description={error} type="error" showIcon />
        )}
      </Space>
    </Modal>
  );
};

export default InputDialog;