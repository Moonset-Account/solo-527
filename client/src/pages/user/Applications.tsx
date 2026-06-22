import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Select, Space, Button, Modal, Descriptions, Spin, Timeline } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { Application } from '@/types';
import { getApplicationList, getApplicationDetail } from '@/api/application';
import { statusMap, formatDateTime, formatMoney, billingCycleMap } from '@/utils';

const { Option } = Select;

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState<string | undefined>();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const result = await getApplicationList({ page, pageSize, status });
      setApplications(result.list);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, status]);

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await getApplicationDetail(id);
      setCurrentApp(detail);
      setDetailVisible(true);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => <span className="text-blue-600">#{id}</span>,
    },
    {
      title: '插件名称',
      dataIndex: ['plugin', 'name'],
      key: 'pluginName',
      render: (text: string, record: Application) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm">
            <FileTextOutlined />
          </div>
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '套餐',
      dataIndex: ['plan', 'name'],
      key: 'plan',
      render: (text: string, record: Application) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-400">
            {record.plan ? formatMoney(Number(record.plan.price)) : '--'}/{record.plan ? billingCycleMap[record.plan.billingCycle] : ''}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const info = statusMap[status as keyof typeof statusMap];
        return <Tag color={info?.color}>{info?.text}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: Application) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockCircleOutlined className="text-orange-500" />;
      case 'PROCESSING': return <ClockCircleOutlined className="text-blue-500" />;
      case 'COMPLETED': return <CheckCircleOutlined className="text-green-500" />;
      case 'CLOSED_ABNORMAL': return <CloseCircleOutlined className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">申请记录</h2>
        <p className="text-gray-500 text-sm">查看您所有的授权申请记录和处理进度</p>
      </div>

      <Card variant="borderless">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-600 text-sm">筛选：</span>
          <Select
            placeholder="申请状态"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={(val) => { setStatus(val); setPage(1); }}
          >
            <Option value="PENDING">待处理</Option>
            <Option value="PROCESSING">处理中</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="CLOSED_ABNORMAL">异常关闭</Option>
          </Select>
          <div className="text-gray-500 text-sm ml-auto">
            共 <span className="text-blue-500 font-medium">{total}</span> 条记录
          </div>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={applications}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              showSizeChanger: false,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="申请详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        <Spin spinning={detailLoading}>
          {currentApp && (
            <>
              <div className="flex items-center gap-4 pb-4 mb-4 border-b">
                {getStatusIcon(currentApp.status)}
                <div>
                  <h3 className="text-lg font-bold">{currentApp.plugin?.name}</h3>
                  <Tag color={statusMap[currentApp.status]?.color}>
                    {statusMap[currentApp.status]?.text}
                  </Tag>
                </div>
              </div>

              <Descriptions column={2} size="small" className="mb-4">
                <Descriptions.Item label="申请编号">#{currentApp.id}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{formatDateTime(currentApp.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="套餐">{currentApp.plan?.name}</Descriptions.Item>
                <Descriptions.Item label="价格">
                  {currentApp.plan ? formatMoney(Number(currentApp.plan.price)) : '--'}
                  /{currentApp.plan ? billingCycleMap[currentApp.plan.billingCycle] : ''}
                </Descriptions.Item>
                <Descriptions.Item label="申请席位">{currentApp.seatCount}</Descriptions.Item>
                <Descriptions.Item label="试用天数">
                  {currentApp.trialDays > 0 ? `${currentApp.trialDays} 天` : '不申请试用'}
                </Descriptions.Item>
              </Descriptions>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">申请理由</div>
                <div className="text-gray-700">{currentApp.reason}</div>
              </div>

              <Timeline
                items={[
                  {
                    color: 'blue',
                    children: (
                      <div>
                        <div className="font-medium">提交申请</div>
                        <div className="text-xs text-gray-400">{formatDateTime(currentApp.createdAt)}</div>
                      </div>
                    ),
                  },
                  ...(currentApp.processingNote ? [{
                    color: 'blue',
                    children: (
                      <div>
                        <div className="font-medium">处理中</div>
                        <div className="text-sm text-gray-600">{currentApp.processingNote}</div>
                      </div>
                    ),
                  }] : []),
                  ...(currentApp.status === 'COMPLETED' ? [{
                    color: 'green',
                    children: (
                      <div>
                        <div className="font-medium">审批通过</div>
                        <div className="text-xs text-gray-400">
                          审批人：{currentApp.approver?.name}
                          {currentApp.approvedAt ? ` · ${formatDateTime(currentApp.approvedAt)}` : ''}
                        </div>
                      </div>
                    ),
                  }] : []),
                  ...(currentApp.status === 'CLOSED_ABNORMAL' ? [{
                    color: 'red',
                    children: (
                      <div>
                        <div className="font-medium">异常关闭</div>
                        <div className="text-sm text-gray-600">{currentApp.closeReason}</div>
                        <div className="text-xs text-gray-400">
                          处理人：{currentApp.approver?.name}
                        </div>
                      </div>
                    ),
                  }] : []),
                ]}
              />
            </>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default ApplicationsPage;
