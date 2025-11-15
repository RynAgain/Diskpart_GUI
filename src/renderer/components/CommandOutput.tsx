import React, { useEffect, useRef } from 'react';
import { Card, Button, Space, Typography, Empty } from 'antd';
import { ClearOutlined, DownloadOutlined } from '@ant-design/icons';
import { useDiskStore } from '../store/diskStore';

const { Text } = Typography;

const CommandOutput: React.FC = () => {
  const { commandHistory, clearCommandHistory } = useDiskStore();
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new commands are added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const formatTimestamp = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const handleExport = () => {
    const content = commandHistory
      .map((item) => {
        const timestamp = formatTimestamp(item.timestamp);
        const status = item.success ? 'SUCCESS' : 'FAILED';
        return `[${timestamp}] [${status}] ${item.command}\n${item.output}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diskpart-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title="Command Output"
      extra={
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={commandHistory.length === 0}
            size="small"
          >
            Export
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={clearCommandHistory}
            disabled={commandHistory.length === 0}
            size="small"
          >
            Clear
          </Button>
        </Space>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div
        ref={outputRef}
        className="command-output-container"
        style={{
          height: '200px',
          overflowY: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '13px',
          padding: '12px',
        }}
      >
        {commandHistory.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666'
          }}>
            <Empty
              description="No commands executed yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ color: '#666' }}
            />
          </div>
        ) : (
          <div>
            {commandHistory.map((item) => (
              <div key={item.id} style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <Text
                    style={{
                      color: '#858585',
                      fontSize: '11px',
                      marginRight: '8px',
                    }}
                  >
                    [{formatTimestamp(item.timestamp)}]
                  </Text>
                  <Text
                    style={{
                      color: item.success ? '#4ec9b0' : '#f48771',
                      fontWeight: 'bold',
                      marginRight: '8px',
                    }}
                  >
                    {item.success ? '✓' : '✗'}
                  </Text>
                  <Text style={{ color: '#569cd6' }}>
                    DISKPART&gt; {item.command}
                  </Text>
                </div>
                <div
                  style={{
                    paddingLeft: '16px',
                    color: item.success ? '#d4d4d4' : '#f48771',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.output}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CommandOutput;