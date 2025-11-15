import React from 'react';
import { Table, Tag, Spin, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PartitionInfo } from '../../shared/types';
import { useDiskStore } from '../store/diskStore';

const PartitionList: React.FC = () => {
  const { partitions, selectedDiskId, selectedPartitionId, selectPartition, loading } = useDiskStore();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const columns: ColumnsType<PartitionInfo> = [
    {
      title: 'Partition #',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => <strong>Partition {id}</strong>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatBytes(size),
    },
    {
      title: 'Offset',
      dataIndex: 'offset',
      key: 'offset',
      width: 120,
      render: (offset: number) => formatBytes(offset),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        if (status === 'Healthy') color = 'success';
        else if (status === 'Active') color = 'processing';
        else if (status === 'System' || status === 'Boot') color = 'blue';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'File System',
      dataIndex: 'fileSystem',
      key: 'fileSystem',
      width: 100,
      render: (fs?: string) => fs || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      render: (label?: string) => label || <span style={{ color: '#999' }}>No label</span>,
    },
    {
      title: 'Drive Letter',
      dataIndex: 'driveLetter',
      key: 'driveLetter',
      width: 100,
      render: (letter?: string) => (
        letter ? <strong>{letter}:</strong> : <span style={{ color: '#999' }}>-</span>
      ),
    },
  ];

  if (!selectedDiskId) {
    return (
      <div className="partition-list">
        <Empty
          description="No disk selected"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="partition-list">
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={partitions}
          rowKey="id"
          pagination={false}
          size="small"
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedPartitionId !== null ? [selectedPartitionId] : [],
            onChange: (selectedRowKeys) => {
              selectPartition(selectedRowKeys[0] as number || null);
            },
          }}
          onRow={(record) => ({
            onClick: () => {
              selectPartition(record.id);
            },
            style: { cursor: 'pointer' },
          })}
          rowClassName={(record) => {
            let className = '';
            if (record.status === 'Active' || record.status === 'Boot') {
              className += 'active-partition-row ';
            }
            if (record.id === selectedPartitionId) {
              className += 'selected-row';
            }
            return className.trim();
          }}
          locale={{
            emptyText: 'No partitions on this disk. Use "Create Partition" to add one.',
          }}
        />
      </Spin>
    </div>
  );
};

export default PartitionList;