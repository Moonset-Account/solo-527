import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Form, Card, Modal, Drawer, List, message, Progress } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, PhoneOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';
import request from '../../utils/request.js';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const CollectionList = () => {
  const [collections, setCollections] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm] = Form.useForm();

  useEffect(() => {
    fetchCollections();
  }, [page, pageSize, filters]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await request.get('/collections', {
        params: { page, pageSize, ...filters },
      });
      setCollections(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取催收列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPage(1);
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await request.get(`/collections/${id}`);
      setDetailData(res.collection);
      setDetailDrawer(true);
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleAddRecord = (record) => {
    setDetailData(record);
    setShowRecordModal(true);
    recordForm.setFieldsValue({
      stage: record.currentStage,
      action: 'PHONE',
    });
  };

  const handleSubmitRecord = async (values) => {
    try {
      await request.post(`/collections/${detailData.id}/record`, {
        ...values,
        contactTime: new Date().toISOString(),
      });
      message.success('记录添加成功');
      setShowRecordModal(false);
      recordForm.resetFields();
      handleViewDetail(detailData.id);
      fetchCollections();
    } catch (error) {
      console.error('添加记录失败:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      PENDING: { color: 'default', text: '待处理' },
      IN_PROGRESS: { color: 'blue', text: '处理中' },
      COMPLETED: { color: 'green', text: '已完成' },
      ESCALATED: { color: 'red', text: '已升级' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      LOW: { color: 'default', text: '低' },
      NORMAL: { color: 'blue', text: '普通' },
      HIGH: { color: 'orange', text: '高' },
      URGENT: { color: 'red', text: '紧急' },
    };
    const config = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '催收单号',
      dataIndex: 'collectionNo',
      key: 'collectionNo',
      width: 160,
    },
    {
      title: '客户名称',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
    },
    {
      title: '关联账单',
      dataIndex: ['bill', 'billNo'],
      key: 'billNo',
    },
    {
      title: '催收金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{Number(val).toLocaleString()}</span>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: getPriorityTag,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '催收阶段',
      dataIndex: 'currentStage',
      key: 'currentStage',
      width: 150,
      render: (stage, record) => (
        <Progress
          percent={Math.round((stage / record.totalStages) * 100)}
          size="small"
          format={() => `第${stage}/${record.totalStages}阶段`}
        />
      ),
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '负责人',
      dataIndex: ['assignedTo', 'name'],
      key: 'assignedTo',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => handleAddRecord(record)}>
            添加记录
          </Button>
        </Space>
      ),
    },
  ];

  const actionTypes = [
    { value: 'PHONE', label: '电话催收', icon: <PhoneOutlined /> },
    { value: 'EMAIL', label: '邮件催款', icon: <MailOutlined /> },
    { value: 'SMS', label: '短信通知', icon: <MessageOutlined /> },
    { value: 'LETTER', label: '律师函', icon: '📄' },
    { value: 'VISIT', label: '上门拜访', icon: '🚶' },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>催款提醒</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            新建催收单
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchCollections}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 150 }} allowClear>
              <Option value="PENDING">待处理</Option>
              <Option value="IN_PROGRESS">处理中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="ESCALATED">已升级</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="全部优先级" style={{ width: 120 }} allowClear>
              <Option value="LOW">低</Option>
              <Option value="NORMAL">普通</Option>
              <Option value="HIGH">高</Option>
              <Option value="URGENT">紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="催收单号/客户名称" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-section">
        <Table
          dataSource={collections}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </div>

      <Drawer
        title="催收详情"
        placement="right"
        width={500}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
        extra={
          <Button type="primary" size="small" onClick={() => detailData && handleAddRecord(detailData)}>
            添加记录
          </Button>
        }
      >
        {detailData && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <Space>
                  {getStatusTag(detailData.status)}
                  {getPriorityTag(detailData.priority)}
                </Space>
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f', marginBottom: 8 }}>
                ¥{Number(detailData.amount).toLocaleString()}
              </div>
              <Progress
                percent={Math.round((detailData.currentStage / detailData.totalStages) * 100)}
                format={() => `第${detailData.currentStage}/${detailData.totalStages}阶段`}
              />
            </Card>

            <h4 style={{ marginBottom: 12 }}>催收记录</h4>
            <List
              dataSource={detailData.records || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>阶段 {item.stage}</span>
                        <span style={{ color: '#666' }}>{item.action}</span>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ color: '#333' }}>{item.result || '无结果'}</div>
                        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                          {item.operator?.name} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                        {item.remark && (
                          <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                            备注：{item.remark}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            {(detailData.records || []).length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无催收记录
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="添加催收记录"
        open={showRecordModal}
        onCancel={() => setShowRecordModal(false)}
        footer={null}
        width={450}
      >
        <Form form={recordForm} layout="vertical" onFinish={handleSubmitRecord}>
          <Form.Item name="stage" label="催收阶段" rules={[{ required: true, message: '请选择阶段' }]}>
            <Select>
              <Option value={1}>第一阶段</Option>
              <Option value={2}>第二阶段</Option>
              <Option value={3}>第三阶段</Option>
            </Select>
          </Form.Item>
          <Form.Item name="action" label="催收方式" rules={[{ required: true, message: '请选择方式' }]}>
            <Select>
              {actionTypes.map(item => (
                <Option key={item.value} value={item.value}>
                  <Space>{item.icon}{item.label}</Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="result" label="催收结果">
            <TextArea rows={3} placeholder="请输入催收结果..." />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="补充说明..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowRecordModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CollectionList;
