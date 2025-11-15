import React from 'react';
import { Table, Tag, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DiskInfo } from '../../shared/types';
import { useDiskStore } from '../store/diskStore';

const DiskList: React.FC = () => {
  const { disks, selectedDiskId, selectDisk, loading } = useDiskStore();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const columns: ColumnsType<DiskInfo> = [
    {
      title: 'Disk #',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <strong>Disk {id}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        if (status === 'Online') color = 'success';
        else if (status === 'Offline') color = 'error';
        else if (status === 'No Media') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatBytes(size),
    },
    {
      title: 'Free Space',
      dataIndex: 'free',
      key: 'free',
      width: 120,
      render: (free: number) => formatBytes(free),
    },
    {
      title: 'Type',
      dataIndex: 'diskType',
      key: 'diskType',
      width: 100,
    },
    {
      title: 'Partition Style',
      dataIndex: 'partitionStyle',
      key: 'partitionStyle',
      width: 120,
    },
    {
      title: 'Flags',
      key: 'flags',
      width: 150,
      render: (_, record: DiskInfo) => (
        <>
          {record.isSystemDisk && <Tag color="blue">System</Tag>}
          {record.isBootDisk && <Tag color="purple">Boot</Tag>}
        </>
      ),
    },
  ];

  return (
    <div className="disk-list">
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={disks}
          rowKey="id"
          pagination={false}
          size="small"
          rowClassName={(record) =>
            record.id === selectedDiskId ? 'selected-row' : ''
          }
          onRow={(record) => ({
            onClick: () => selectDisk(record.id),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: 'No disks found. Click "Refresh" to scan for disks.',
          }}
        />
      </Spin>
    </div>
  );
};

export default DiskList;