import React, { useEffect, useState } from 'react';
import { Layout, Typography, Space, Button, Alert, Row, Col, Card, Tabs, Tooltip } from 'antd';
import {
  DatabaseOutlined,
  ReloadOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useDiskStore } from './store/diskStore';
import DiskList from './components/DiskList';
import VolumeList from './components/VolumeList';
import PartitionList from './components/PartitionList';
import DiskDetails from './components/DiskDetails';
import OperationsPanel from './components/OperationsPanel';
import CommandOutput from './components/CommandOutput';
import ErrorAlert from './components/ErrorAlert';
import { useKeyboardShortcuts, createDefaultShortcuts } from './hooks/useKeyboardShortcuts';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const {
    isAdmin,
    loading,
    error,
    setError,
    checkAdminStatus,
    refreshAll,
    selectedPartitionId,
    selectedDiskId,
  } = useDiskStore();

  const [dialogsOpen, setDialogsOpen] = useState(false);

  useEffect(() => {
    // Initialize app on mount
    const initialize = async () => {
      await checkAdminStatus();
      await refreshAll();
    };

    initialize();
  }, [checkAdminStatus, refreshAll]);

  const handleRefreshAll = async () => {
    try {
      await refreshAll();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  const handleRescan = async () => {
    try {
      await refreshAll();
    } catch (error) {
      console.error('Failed to rescan:', error);
    }
  };

  const handleDeletePartition = () => {
    // This will be handled by OperationsPanel
    // Just a placeholder for keyboard shortcut
    if (selectedDiskId && selectedPartitionId) {
      console.log('Delete partition shortcut triggered');
    }
  };

  const handleEscape = () => {
    // Close any open dialogs
    setDialogsOpen(false);
  };

  // Setup keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    onRefresh: handleRefreshAll,
    onRescan: handleRescan,
    onDelete: handleDeletePartition,
    onEscape: handleEscape,
  });

  useKeyboardShortcuts(shortcuts, !dialogsOpen);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DatabaseOutlined style={{ fontSize: '24px', color: '#fff' }} />
          <Title level={3} style={{ margin: 0, color: '#fff' }}>
            Diskpart GUI
          </Title>
        </div>
        <Space>
          <Tooltip title="Refresh all data (F5)">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefreshAll}
              loading={loading}
            >
              Refresh All
            </Button>
          </Tooltip>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin ? (
              <SafetyOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
            ) : (
              <SafetyOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
            )}
            <Text style={{ color: '#fff' }}>
              {isAdmin ? 'Administrator' : 'Limited Access'}
            </Text>
          </div>
        </Space>
      </Header>

      {/* Main Content */}
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Admin Warning */}
          {!isAdmin && (
            <Alert
              message="Administrator Privileges Required"
              description="This application requires administrator privileges to perform disk operations. Please restart the application as administrator."
              type="warning"
              showIcon
              icon={<SafetyOutlined />}
              closable
            />
          )}

          {/* Error Alert */}
          {error && (
            <ErrorAlert
              message="Operation Failed"
              description={error}
              onRetry={handleRefreshAll}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Main Layout */}
          <Row gutter={[16, 16]}>
            {/* Left Column - Disk List and Volumes */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Disk List */}
                <Card title="Disks" size="small">
                  <DiskList />
                </Card>

                {/* Tabs for Partitions and Volumes */}
                <Card size="small" styles={{ body: { padding: '12px' } }}>
                  <Tabs
                    defaultActiveKey="partitions"
                    items={[
                      {
                        key: 'partitions',
                        label: 'Partitions',
                        children: <PartitionList />,
                      },
                      {
                        key: 'volumes',
                        label: 'Volumes',
                        children: <VolumeList />,
                      },
                    ]}
                  />
                </Card>
              </Space>
            </Col>

            {/* Right Column - Details and Operations */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Disk Details */}
                <DiskDetails />

                {/* Operations Panel */}
                <OperationsPanel />
              </Space>
            </Col>
          </Row>

          {/* Command Output */}
          <CommandOutput />
        </Space>
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: 'center', background: '#001529', color: '#fff', padding: '16px 24px' }}>
        <Text style={{ color: '#fff' }}>
          Diskpart GUI ©{new Date().getFullYear()} | Built with Electron + React + TypeScript
        </Text>
      </Footer>
    </Layout>
  );
};

export default App;