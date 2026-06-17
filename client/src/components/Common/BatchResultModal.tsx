import React from 'react';
import { Modal, Card, Row, Col, Statistic, Table, Button, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InboxOutlined } from '@ant-design/icons';
import type { BatchOperationResult, BatchOperationFailedItem } from '../../types';

interface BatchResultModalProps {
  open: boolean;
  onClose: () => void;
  result: BatchOperationResult | null;
  onRetry?: (failedItems: BatchOperationFailedItem[]) => void;
}

const BatchResultModal: React.FC<BatchResultModalProps> = ({
  open,
  onClose,
  result,
  onRetry,
}) => {
  const hasFailedItems = result && result.failedItems.length > 0;

  const columns = [
    {
      title: '实体类型',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 160,
    },
    {
      title: '实体ID',
      dataIndex: 'entityId',
      key: 'entityId',
      width: 280,
      ellipsis: true,
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
    },
  ];

  return (
    <Modal
      title="批量操作结果摘要"
      open={open}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          {hasFailedItems && onRetry && (
            <Button
              type="primary"
              onClick={() => onRetry(result!.failedItems)}
            >
              重试失败项
            </Button>
          )}
        </Space>
      }
    >
      {result && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Statistic
                  title="总条数"
                  value={result.totalCount}
                  prefix={<InboxOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="成功数"
                  value={result.successCount}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="失败数"
                  value={result.failedCount}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16, color: '#666' }}>
              {result.summary}
            </div>
          </Card>

          {hasFailedItems && (
            <Table
              rowKey={(record: BatchOperationFailedItem) => record.entityId}
              columns={columns}
              dataSource={result.failedItems}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          )}
        </>
      )}
    </Modal>
  );
};

export default BatchResultModal;
