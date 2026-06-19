import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Modal, Form, message, Tag, Row, Col, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, PlayCircleOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { patrolAPI } from '../../services/api';
import { formatDate, formatDateTime, getStatusBadge, handleApiError } from '../../utils/helpers';
import DataExportButton from '../../components/DataExportButton';
import ProcessRecordList from '../../components/ProcessRecordList';

const { Search } = Input;
const { Option } = Select;

const PatrolTaskList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [processRecords, setProcessRecords] = useState([]);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchRoutes();
  }, [pagination.current, pagination.pageSize, searchText, status]);

  const fetchRoutes = async () => {
    try {
      const response = await patrolAPI.routes.list({ page_size: 100 });
      setRoutes(response.data.results || []);
    } catch (error) {
      console.error('加载巡逻路线失败:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText,
        status: status,
      };
      const response = await patrolAPI.tasks.list(params);
      setData(response.data.results || []);
      setPagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载巡逻任务失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      scheduled_date: record.scheduled_date ? record.scheduled_date.split('T')[0] : null,
    });
    setModalVisible(true);
  };

  const handleViewDetail = async (record) => {
    setSelectedRecord(record);
    try {
      const response = await patrolAPI.tasks.getProcessRecords(record.id);
      setProcessRecords(response.data.results || response.data || []);
    } catch (error) {
      setProcessRecords([]);
    }
    setDetailModalVisible(true);
  };

  const handleStart = async (id) => {
    try {
      await patrolAPI.tasks.start(id);
      message.success('任务已开始');
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '开始任务失败'));
    }
  };

  const handleComplete = (record) => {
    setSelectedRecord(record);
    completeForm.resetFields();
    Modal.confirm({
      title: '完成巡逻任务',
      content: (
        <Form form={completeForm} layout="vertical">
          <Form.Item 
            name="result" 
            label="巡逻结果" 
            rules={[{ required: true, message: '请输入巡逻结果' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入巡逻结果" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await completeForm.validateFields();
          await patrolAPI.tasks.complete(selectedRecord.id, values);
          message.success('任务已完成');
          fetchData();
        } catch (error) {
          message.error(handleApiError(error, '完成任务失败'));
          return Promise.reject();
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        scheduled_date: values.scheduled_date ? values.scheduled_date.format('YYYY-MM-DD') : null,
      };
      if (editingRecord) {
        await patrolAPI.tasks.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await patrolAPI.tasks.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, editingRecord ? '更新失败' : '创建失败'));
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路线',
      dataIndex: 'route_name',
      key: 'route_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const badge = getStatusBadge(text);
        return <Tag className={badge.class}>{badge.text}</Tag>;
      },
    },
    {
      title: '巡逻人员',
      dataIndex: 'volunteer_name',
      key: 'volunteer_name',
    },
    {
      title: '计划日期',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      render: formatDate,
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: formatDateTime,
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'todo' && (
            <Button 
              type="link" 
              icon={<PlayCircleOutlined />} 
              onClick={() => handleStart(record.id)}
            >
              开始
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button 
              type="link" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleComplete(record)}
            >
              完成
            </Button>
          )}
          {record.status === 'todo' && (
            <Button 
              type="link" 
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>巡逻任务</h2>
        </Col>
        <Col>
          <Space>
            <DataExportButton exportAPI={patrolAPI.export} filename="巡逻任务.xlsx" />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增任务
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Search
            placeholder="搜索任务名称"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={(value) => { setSearchText(value); setPagination(prev => ({ ...prev, current: 1 })); }}
            onChange={(e) => !e.target.value && setSearchText('')}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: '100%' }}
            value={status || undefined}
            onChange={(value) => { setStatus(value); setPagination(prev => ({ ...prev, current: 1 })); }}
          >
            <Option value="todo">待处理</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="done">已完成</Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={(page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))}
      />

      <Modal
        title={editingRecord ? '编辑巡逻任务' : '新增巡逻任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item name="route" label="巡逻路线" rules={[{ required: true, message: '请选择巡逻路线' }]}>
            <Select placeholder="请选择巡逻路线">
              {routes.map(route => (
                <Option key={route.id} value={route.id}>{route.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="volunteer" label="巡逻人员">
            <Input placeholder="请输入巡逻人员ID" type="number" />
          </Form.Item>
          <Form.Item name="scheduled_date" label="计划日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>任务名称</div>
                <div style={{ fontWeight: 'bold' }}>{selectedRecord.name}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>状态</div>
                <Tag className={`status-${selectedRecord.status}`}>
                  {getStatusBadge(selectedRecord.status).text}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>路线</div>
                <div>{selectedRecord.route_name || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>巡逻人员</div>
                <div>{selectedRecord.volunteer_name || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>计划日期</div>
                <div>{formatDate(selectedRecord.scheduled_date)}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>异常次数</div>
                <div>{selectedRecord.exception_count || 0}</div>
              </Col>
            </Row>
            {selectedRecord.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', marginBottom: 4 }}>任务描述</div>
                <div>{selectedRecord.description}</div>
              </div>
            )}
            {selectedRecord.result && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', marginBottom: 4 }}>巡逻结果</div>
                <div>{selectedRecord.result}</div>
              </div>
            )}
            <div>
              <div style={{ color: '#999', marginBottom: 8, fontWeight: 'bold' }}>处理记录</div>
              <ProcessRecordList records={processRecords} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatrolTaskList;
