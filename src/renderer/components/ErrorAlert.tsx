import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ReloadOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface ErrorAlertProps {
  message: string;
  description?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showIcon?: boolean;
  closable?: boolean;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  description,
  onRetry,
  onDismiss,
  showIcon = true,
  closable = true,
}) => {
  return (
    <Alert
      message={message}
      description={description}
      type="error"
      showIcon={showIcon}
      closable={closable}
      onClose={onDismiss}
      icon={<CloseCircleOutlined />}
      action={
        onRetry && (
          <Space direction="vertical">
            <Button
              size="small"
              type="primary"
              danger
              icon={<ReloadOutlined />}
              onClick={onRetry}
            >
              Retry
            </Button>
          </Space>
        )
      }
      style={{ marginBottom: 16 }}
    />
  );
};

export default ErrorAlert;