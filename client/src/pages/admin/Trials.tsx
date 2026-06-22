import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, message, Spin, Badge } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, WarningOutlined } from '@ant-design/icons';
import type { License } from '@/types';
import { getTrialList, handleTrial } from '@/api/trial';
import { getPlanList } from '@/api/pricing';
import { formatDate, formatDateTime, formatMoney, billingCycleMap } from '@/utils';

const { TextArea } = Input;
const { Option } = Select;

const TrialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [trials, setTrials] = useState<License[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTrial, setCurrentTrial] = useState<License | null>(null);
  const [actionType, setActionType] = useState<'CONVERT' | 'CLOSE' | 'EXTEND'>('CONVERT');
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState<string | undefined>();

  const fetchTrials = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const result = await getTrialList({
        page,
        pageSize,
        status,
        keyword,
        department,
      });
      setTrials(result.list);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async (pluginId: number) => {
    try {
      const result = await getPlanList({ pluginId, status: 'ACTIVE', pageSize: 50 });
      setPlans(result.list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, [activeTab, page, keyword, department]);

  const openHandleModal = (trial: License, type: 'CONVERT' | 'CLOSE' | 'EXTEND') => {
    setCurrentTrial(trial);
    setActionType(type);
    form.resetFields();
    
    if (type === 'CONVERT' && trial.pluginId) {
      fetchPlans(trial.pluginId);
    }
    
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!currentTrial) return;

      setSubmitLoading(true);
      await handleTrial(currentTrial.id, {
        result: actionType,
        remark: values.remark,
        extendDays: values.extendDays,
        planId: values.planId,
      });
      
      message.success('处理成功');
      setModalVisible(false);
      fetchTrials();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getTrialStatusTag = (trial: License) => {
    const status = trial.trialStatus;
    if (status === 'EXPIRED') return <Tag color="red">已过期</Tag>;
    if (status === 'URGENT') return <Tag color="orange">即将到期</Tag>;
    if (status === 'EXPIRING_SOON') return <Tag color="gold">7天内到期</Tag>;
    return <Tag color="green">试用中</Tag>;
  };

  const columns = [
    {
      title: '插件名称',
      dataIndex: ['plugin', 'name'],
      key: 'plugin',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '用户/部门',
      key: 'user',
      render: (_: any, record: License) => (
        <div>
          <div>{record.user?.name}</div>
          <div className="text-xs text-gray-400">{record.user?.department}</div>
        </div>
      ),
    },
    {
      title: '套餐',
      dataIndex: ['plan', 'name'],
      key: 'plan',
    },
    {
      title: '席位',
      dataIndex: 'seatCount',
      key: 'seatCount',
      width: 80,
    },
    {
      title: '试用开始',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
      render: (date: string) => formatDate(date),
    },
    {
      title: '试用到期',
      dataIndex: 'trialEndDate',
      key: 'trialEndDate',
      width: 110,
      render: (date: string, record: License) => (
        <div>
          <div>{formatDate(date as string)}</div>
          <div className="text-xs">
            {record.daysLeft !== undefined && record.daysLeft <= 0
              ? <span className="text-red-500">已过期 {Math.abs(record.daysLeft)} 天</span>
              : <span className="text-orange-500">剩余 {record.daysLeft} 天</span>
            }
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: License) => getTrialStatusTag(record),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: License) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            onClick={() => openHandleModal(record, 'CONVERT')}
            disabled={record.status !== 'ACTIVE'}
          >
            转正
          </Button>
          <Button 
            type="link" 
            size="small" 
            onClick={() => openHandleModal(record, 'EXTEND')}
            disabled={record.status !== 'ACTIVE'}
          >
            延期
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger
            onClick={() => openHandleModal(record, 'CLOSE')}
            disabled={record.status !== 'ACTIVE'}
          >
            关闭
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'ACTIVE', label: <span><CheckCircleOutlined className="text-green-500" /> 试用中</span> },
    { key: 'EXPIRING_SOON', label: <span><WarningOutlined className="text-orange-500" /> 即将到期</span> },
    { key: 'EXPIRED', label: <span><CloseCircleOutlined className="text-red-500" /> 已过期</span> },
  ];

  const stats = [
    { label: '试用总数', value: total, color: 'text-blue-600' },
    { label: '试用中', value: trials.filter(t => t.status === 'ACTIVE').length, color: 'text-green-600' },
    { label: '即将到期', value: trials.filter(t => t.trialStatus === 'EXPIRING_SOON' || t.trialStatus === 'URGENT').length, color: 'text-orange-600' },
    { label: '已过期', value: trials.filter(t => t.status === 'EXPIRED').length, color: 'text-red-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">试用管理</h2>
        <p className="text-gray-500 text-sm">管理试用授权，处理到期转正、延期和关闭</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx} variant="borderless" size="small">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card variant="borderless">
        <div className="flex items-center gap-4 mb-4">
          <Input.Search
            placeholder="搜索用户/插件"
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
          </Select>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={trials}
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
        title={
          actionType === 'CONVERT' ? '试用转正' :
          actionType === 'EXTEND' ? '试用延期' : '关闭试用'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger={actionType === 'CLOSE'}
            loading={submitLoading} 
            onClick={handleSubmit}
          >
            确认
          </Button>,
        ]}
        width={520}
      >
        {currentTrial && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="font-medium mb-1">{currentTrial.plugin?.name}</div>
            <div className="text-sm text-gray-500">
              用户：{currentTrial.user?.name}（{currentTrial.user?.department}）
              <span className="mx-2">·</span>
              到期：{formatDate(currentTrial.trialEndDate as string)}
            </div>
          </div>
        )}

        <Form form={form} layout="vertical">
          {actionType === 'CONVERT' && (
            <>
              <Form.Item
                label="转正套餐"
                name="planId"
                rules={[{ required: true, message: '请选择套餐' }]}
              >
                <Select placeholder="请选择转正后的套餐">
                  {plans.map(plan => (
                    <Option key={plan.id} value={plan.id}>
                      {plan.name} - {formatMoney(Number(plan.price))}/{billingCycleMap[plan.billingCycle]}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="备注"
                name="remark"
              >
                <TextArea rows={3} placeholder="请填写转正说明..." />
              </Form.Item>
            </>
          )}

          {actionType === 'EXTEND' && (
            <>
              <Form.Item
                label="延期天数"
                name="extendDays"
                initialValue={7}
                rules={[{ required: true, message: '请输入延期天数' }]}
              >
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="备注"
                name="remark"
                rules={[{ required: true, message: '请填写延期原因' }]}
              >
                <TextArea rows={3} placeholder="请填写延期原因..." />
              </Form.Item>
            </>
          )}

          {actionType === 'CLOSE' && (
            <Form.Item
              label="关闭原因"
              name="remark"
              rules={[{ required: true, message: '请填写关闭原因' }]}
            >
              <TextArea rows={4} placeholder="请详细说明关闭原因..." />
            </Form.Item>
          )}
        </Form>

        {currentTrial?.lastHandle && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500 mb-2">上次处理记录：</div>
            <div className="p-2 bg-gray-50 rounded text-sm">
              <div className="flex items-center justify-between">
                <span>
                  {currentTrial.lastHandle.result === 'CONVERT' ? '转正' : 
                   currentTrial.lastHandle.result === 'EXTEND' ? '延期' : '关闭'}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(currentTrial.lastHandle.createdAt)}
                </span>
              </div>
              {currentTrial.lastHandle.remark && (
                <div className="text-gray-600 mt-1">{currentTrial.lastHandle.remark}</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TrialsPage;
