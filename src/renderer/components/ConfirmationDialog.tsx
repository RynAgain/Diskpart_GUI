import React, { useState } from 'react';
import { Modal, Input, Alert, Space, Typography, Divider, Spin } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface ConfirmationDialogProps {
  open: boolean;
  type: 'simple' | 'detailed' | 'type-to-confirm';
  title: string;
  operation: string;
  description?: string;
  impact?: string[];
  confirmText?: string;
  diskId?: number;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  danger?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  type,
  title,
  operation,
  description,
  impact = [],
  confirmText,
  diskId,
  onConfirm,
  onCancel,
  danger = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [executing, setExecuting] = useState(false);

  const handleConfirm = async () => {
    if (type === 'type-to-confirm') {
      const expectedText = diskId !== undefined ? diskId.toString() : '';
      if (inputValue !== expectedText) {
        setError(`Please type "${expectedText}" to confirm`);
        return;
      }
    }
    
    setInputValue('');
    setError('');
    setExecuting(true);
    
    try {
      await onConfirm();
    } finally {
      setExecuting(false);
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setError('');
    onCancel();
  };

  const renderContent = () => {
    if (executing) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <Paragraph style={{ marginTop: 16 }}>
            Executing operation... Please wait.
          </Paragraph>
          <Text type="secondary">
            Do not close this window or interrupt the operation.
          </Text>
        </div>
      );
    }

    switch (type) {
      case 'simple':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>{description || `Are you sure you want to ${operation}?`}</Paragraph>
          </Space>
        );

      case 'detailed':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Paragraph>{description || `You are about to ${operation}.`}</Paragraph>
            
            {impact.length > 0 && (
              <>
                <Alert
                  message="Impact"
                  description={
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {impact.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  }
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                />
              </>
            )}
            
            <Paragraph type="secondary">
              This operation will be executed immediately and cannot be undone.
            </Paragraph>
          </Space>
        );

      case 'type-to-confirm':
        const expectedText = diskId !== undefined ? diskId.toString() : '';
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="Destructive Operation"
              description={description || `You are about to ${operation}. This action is IRREVERSIBLE.`}
              type="error"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
            
            {impact.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text strong>This will:</Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {impact.map((item, index) => (
                      <li key={index}>
                        <Text type="danger">{item}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            
            <Divider style={{ margin: '8px 0' }} />
            
            <div>
              <Text strong>
                Type <Text code>{expectedText}</Text> to confirm:
              </Text>
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                placeholder={`Type ${expectedText} here`}
                status={error ? 'error' : ''}
                style={{ marginTop: 8 }}
                autoFocus
                disabled={executing}
              />
              {error && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {error}
                </Text>
              )}
            </div>
            
            <Alert
              message="Warning"
              description="All data on the selected disk will be permanently lost. This operation cannot be undone."
              type="warning"
              showIcon
            />
          </Space>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          {danger && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          {title}
        </Space>
      }
      open={open}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText={confirmText || 'Confirm'}
      cancelText="Cancel"
      okButtonProps={{
        danger: danger,
        disabled: type === 'type-to-confirm' && inputValue !== (diskId?.toString() || ''),
        loading: executing,
      }}
      cancelButtonProps={{
        disabled: executing,
      }}
      closable={!executing}
      maskClosable={!executing}
      width={type === 'type-to-confirm' ? 600 : 500}
    >
      {renderContent()}
    </Modal>
  );
};

export default ConfirmationDialog;