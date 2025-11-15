import React from 'react';
import { Table, Tag, Dropdown, Button, Spin } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { VolumeInfo } from '../../shared/types';
import { useDiskStore } from '../store/diskStore';

const VolumeList: React.FC = () => {
  const { volumes, loading } = useDiskStore();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getVolumeActions = (volume: VolumeInfo): MenuProps['items'] => [
    {
      key: 'format',
      label: 'Format',
      danger: true,
    },
    {
      key: 'assign',
      label: 'Assign Letter',
    },
    {
      key: 'remove',
      label: 'Remove Letter',
      disabled: !volume.letter,
    },
    {
      type: 'divider',
    },
    {
      key: 'extend',
      label: 'Extend',
    },
    {
      key: 'shrink',
      label: 'Shrink',
    },
  ];

  const columns: ColumnsType<VolumeInfo> = [
    {
      title: 'Letter',
      dataIndex: 'letter',
      key: 'letter',
      width: 80,
      render: (letter?: string) => (
        <strong>{letter ? `${letter}:` : '-'}</strong>
      ),
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      render: (label?: string) => label || <span style={{ color: '#999' }}>No label</span>,
    },
    {
      title: 'File System',
      dataIndex: 'fileSystem',
      key: 'fileSystem',
      width: 100,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatBytes(size),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'Healthy' ? 'success' : 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Info',
      dataIndex: 'info',
      key: 'info',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record: VolumeInfo) => (
        <Dropdown
          menu={{
            items: getVolumeActions(record),
            onClick: ({ key }) => {
              console.log(`Action ${key} for volume ${record.letter || 'unlabeled'}`);
              // TODO: Implement action handlers
            },
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="volume-list">
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={volumes}
          rowKey={(record) => record.letter || `${record.label}-${record.size}`}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'No volumes found. Create a partition and format it to see volumes.',
          }}
        />
      </Spin>
    </div>
  );
};

export default VolumeList;