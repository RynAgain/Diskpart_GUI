import React from 'react';
import { Card, Descriptions, Button, Empty, Tag, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useDiskStore } from '../store/diskStore';

const DiskDetails: React.FC = () => {
  const { selectedDisk, fetchDisks, fetchPartitions, loading } = useDiskStore();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleRefresh = async () => {
    await fetchDisks();
    if (selectedDisk) {
      await fetchPartitions(selectedDisk.id);
    }
  };

  if (!selectedDisk) {
    return (
      <Card
        title="Disk Details"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        }
      >
        <Empty
          description="No disk selected"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const usedSpace = selectedDisk.size - selectedDisk.free;
  const usagePercent = selectedDisk.size > 0
    ? ((usedSpace / selectedDisk.size) * 100).toFixed(1)
    : '0';

  return (
    <Card
      title={`Disk ${selectedDisk.id} Details`}
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
          size="small"
        >
          Refresh
        </Button>
      }
    >
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Disk ID">
          <strong>Disk {selectedDisk.id}</strong>
        </Descriptions.Item>
        
        <Descriptions.Item label="Status">
          <Tag color={selectedDisk.status === 'Online' ? 'success' : 'error'}>
            {selectedDisk.status}
          </Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label="Type">
          {selectedDisk.diskType}
        </Descriptions.Item>
        
        <Descriptions.Item label="Partition Style">
          <Tag color="blue">{selectedDisk.partitionStyle}</Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label="Total Size">
          {formatBytes(selectedDisk.size)}
        </Descriptions.Item>
        
        <Descriptions.Item label="Free Space">
          {formatBytes(selectedDisk.free)}
        </Descriptions.Item>
        
        <Descriptions.Item label="Used Space">
          {formatBytes(usedSpace)} ({usagePercent}%)
        </Descriptions.Item>
        
        <Descriptions.Item label="Partitions">
          {selectedDisk.partitions.length}
        </Descriptions.Item>
        
        <Descriptions.Item label="Attributes">
          <Space size="small" wrap>
            {selectedDisk.isSystemDisk && <Tag color="blue">System Disk</Tag>}
            {selectedDisk.isBootDisk && <Tag color="purple">Boot Disk</Tag>}
            {!selectedDisk.isSystemDisk && !selectedDisk.isBootDisk && (
              <span style={{ color: '#999' }}>None</span>
            )}
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default DiskDetails;