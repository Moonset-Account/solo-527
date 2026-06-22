import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, message, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { Application, ApplicationStatus } from '@/types';
import { getApplicationList, updateApplicationStatus } from '@/api/application';
import { statusMap, formatDateTime, formatMoney, billingCycleMap } from '@/utils';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('PENDING');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState<Application | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'processing' | 'close'>('approve');
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState<string | undefined>();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const result = await getApplicationList({ 
        page, 
        pageSize, 
        status,
        keyword,
        department,
      });
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
  }, [activeTab, page, keyword, department]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as ApplicationStatus | 'all');
    setPage(1);
  };

  const openActionModal = (app: Application, type: 'approve' | 'reject' | 'processing' | 'close') => {
    setCurrentApp(app);
    setActionType(type);
    form.resetFields();
    setActionModalVisible(true);
  };

  const handleActionSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!currentApp) return;

      setSubmitLoading(true);
      let status: ApplicationStatus;
      let data: any = {};

      switch (actionType) {
        case 'approve':
          status = 'COMPLETED';
          data.trialDays = values.trialDays || 0;
          break;
        case 'reject':
          status = 'CLOSED_ABNORMAL';
          data.closeReason = values.reason;
          break;
        case 'processing':
          status = 'PROCESSING';
          data.processingNote = values.note;
          break;
        case 'close':
          status = 'CLOSED_ABNORMAL';
          data.closeReason = values.reason;
          break;
        default:
          return;
      }

      await updateApplicationStatus(currentApp.id, { status, ...data });
      message.success('操作成功');
      setActionModalVisible(false);
      fetchApplications();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const viewDetail = (app: Application) => {
    setCurrentApp(app);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id: number) => <span className="text-blue-600 font-medium">#{id}</span>,
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100,
      render: (text: string, record: Application) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-400">{record.department}</div>
        </div>
      ),
    },
    {
      title: '插件',
      dataIndex: ['plugin', 'name'],
      key: 'plugin',
      render: (text: string) => text,
    },
    {
      title: '套餐',
      dataIndex: ['plan', 'name'],
      key: 'plan',
      render: (text: string, record: Application) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-400">
            {record.plan ? formatMoney(Number(record.plan.price)) : '--'}
            /{record.plan ? billingCycleMap[record.plan.billingCycle] : ''}
          </div>
        </div>
      ),
    },
    {
      title: '席位',
      dataIndex: 'seatCount',
      key: 'seatCount',
      width: 80,
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ApplicationStatus) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Application) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => viewDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button type="link" size="small" onClick={() => openActionModal(record, 'approve')}>
                通过
              </Button>
              <Button type="link" size="small" danger onClick={() => openActionModal(record, 'reject')}>
                驳回
              </Button>
            </>
          )}
          {record.status === 'PENDING' && (
            <Button type="link" size="small" onClick={() => openActionModal(record, 'processing')}>
              处理中
            </Button>
          )}
          {(record.status === 'PENDING' || record.status === 'PROCESSING') && (
            <Button type="link" size="small" danger onClick={() => openActionModal(record, 'close')}>
              关闭
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'PENDING', label: <span><ClockCircleOutlined /> 待处理</span> },
    { key: 'PROCESSING', label: <span><ClockCircleOutlined className="text-blue-500" /> 处理中</span> },
    { key: 'COMPLETED', label: <span><CheckCircleOutlined className="text-green-500" /> 已完成</span> },
    { key: 'CLOSED_ABNORMAL', label: <span><ExclamationCircleOutlined className="text-red-500" /> 异常关闭</span> },
    { key: 'all', label: '全部' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">授权审批</h2>
        <p className="text-gray-500 text-sm">管理插件授权申请，进行审批和状态流转</p>
      </div>

      <Card variant="borderless">
        <div className="flex items-center gap-4 mb-4">
          <Input.Search
            placeholder="搜索申请人/理由"
            allowClear
            style={{ width: 240 }}
            onSearch={setKeyword}
            onChange={(e) => !e.target.value && setKeyword('')}
          />
          <Select
            placeholder="部门筛选"
            allowClear
            style={{ width: 140 }}
            value={department}
            onChange={(val) => { setDepartment(val); setPage(1); }}
          >
            <Option value="产品部">产品部</Option>
            <Option value="研发部">研发部</Option>
            <Option value="市场部">市场部</Option>
            <Option value="运营部">运营部</Option>
            <Option value="财务部">财务部</Option>
            <Option value="技术部">技术部</Option>
          </Select>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={applications}
            rowKey="id"
            scroll={{ x: 900 }}
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
        {currentApp && (
          <>
            <div className="flex items-center gap-4 pb-4 mb-4 border-b">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
                {currentApp.plugin?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold">{currentApp.plugin?.name}</h3>
                <Tag color={statusMap[currentApp.status]?.color}>
                  {statusMap[currentApp.status]?.text}
                </Tag>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-400">申请编号：</span>
                <span className="font-medium">#{currentApp.id}</span>
              </div>
              <div>
                <span className="text-gray-400">申请时间：</span>
                <span>{formatDateTime(currentApp.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-400">申请人：</span>
                <span>{currentApp.applicantName}（{currentApp.department}）</span>
              </div>
              <div>
                <span className="text-gray-400">套餐：</span>
                <span>{currentApp.plan?.name}</span>
              </div>
              <div>
                <span className="text-gray-400">价格：</span>
                <span>{currentApp.plan ? formatMoney(Number(currentApp.plan.price)) : '--'}
                  /{currentApp.plan ? billingCycleMap[currentApp.plan.billingCycle] : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400">申请席位：</span>
                <span>{currentApp.seatCount} 个</span>
              </div>
              <div>
                <span className="text-gray-400">试用天数：</span>
                <span>{currentApp.trialDays > 0 ? `${currentApp.trialDays} 天` : '不申请'}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="text-gray-500 text-sm mb-1">申请理由</div>
              <div className="text-gray-700">{currentApp.reason}</div>
            </div>

            {currentApp.processingNote && (
              <div className="p-3 bg-blue-50 rounded-lg mb-4">
                <div className="text-blue-600 text-sm font-medium mb-1">处理说明</div>
                <div className="text-blue-800">{currentApp.processingNote}</div>
              </div>
            )}

            {currentApp.closeReason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-red-600 text-sm font-medium mb-1">关闭原因</div>
                <div className="text-red-800">{currentApp.closeReason}</div>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        title={
          actionType === 'approve' ? '通过申请' :
          actionType === 'reject' ? '驳回申请' :
          actionType === 'processing' ? '标记为处理中' : '异常关闭'
        }
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setActionModalVisible(false)}>取消</Button>,
          <Button 
            key="submit" 
            type={actionType === 'reject' || actionType === 'close' ? 'primary' : 'primary'}
            danger={actionType === 'reject' || actionType === 'close'}
            loading={submitLoading} 
            onClick={handleActionSubmit}
          >
            确认
          </Button>,
        ]}
        width={480}
      >
        <Form form={form} layout="vertical">
          {actionType === 'approve' && (
            <Form.Item
              label="试用天数（0为直接开通付费，0-30天）"
              name="trialDays"
              initialValue={currentApp?.trialDays || 0}
            >
              <InputNumber min={0} max={30} style={{ width: '100%' }} />
            </Form.Item>
          )}

          {(actionType === 'reject' || actionType === 'close') && (
            <Form.Item
              label={actionType === 'reject' ? '驳回原因' : '关闭原因'}
              name="reason"
              rules={[{ required: true, message: '请填写原因' }]}
            >
              <TextArea rows={4} placeholder="请详细说明原因..." />
            </Form.Item>
          )}

          {actionType === 'processing' && (
            <Form.Item
              label="处理说明"
              name="note"
              rules={[{ required: true, message: '请填写处理说明' }]}
            >
              <TextArea rows={4} placeholder="请说明当前处理进度..." />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalsPage;
