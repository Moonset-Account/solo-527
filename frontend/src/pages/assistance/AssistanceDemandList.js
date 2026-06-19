import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Modal, Form, message, Tag, Row, Col, DatePicker, List } from 'antd';
import { PlusOutlined, SearchOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { assistanceAPI } from '../../services/api';
import { formatDate, formatDateTime, getStatusBadge, getAssistanceTypeText, handleApiError } from '../../utils/helpers';
import DataExportButton from '../../components/DataExportButton';
import ProcessRecordList from '../../components/ProcessRecordList';

const { Search } = Input;
const { Option } = Select;

const AssistanceDemandList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [demandType, setDemandType] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [processRecords, setProcessRecords] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [form] = Form.useForm();
  const [progressForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, status, demandType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText,
        status: status,
        demand_type: demandType,
      };
      const response = await assistanceAPI.demands.list(params);
      setData(response.data.results || []);
      setPagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载帮扶需求失败'));
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
      required_date: record.required_date ? record.required_date.split('T')[0] : null,
    });
    setModalVisible(true);
  };

  const handleViewDetail = async (record) => {
    setSelectedRecord(record);
    try {
      const [recordsRes, progressRes] = await Promise.all([
        assistanceAPI.demands.getProcessRecords(record.id),
        assistanceAPI.progress.list({ demand: record.id, page_size: 100 }),
      ]);
      setProcessRecords(recordsRes.data.results || recordsRes.data || []);
      setProgressList(progressRes.data.results || progressRes.data || []);
    } catch (error) {
      setProcessRecords([]);
      setProgressList([]);
    }
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (record, action) => {
    try {
      await assistanceAPI.demands.changeStatus(record.id, action, {});
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '状态更新失败'));
    }
  };

  const handleAddProgress = () => {
    progressForm.resetFields();
    setProgressModalVisible(true);
  };

  const handleProgressSubmit = async (values) => {
    try {
      await assistanceAPI.progress.create({
        demand: selectedRecord.id,
        ...values,
      });
      message.success('添加进度成功');
      setProgressModalVisible(false);
      const response = await assistanceAPI.progress.list({ demand: selectedRecord.id, page_size: 100 });
      setProgressList(response.data.results || response.data || []);
    } catch (error) {
      message.error(handleApiError(error, '添加进度失败'));
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        required_date: values.required_date ? values.required_date.format('YYYY-MM-DD') : null,
      };
      if (editingRecord) {
        await assistanceAPI.demands.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await assistanceAPI.demands.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, editingRecord ? '更新失败' : '创建失败'));
    }
  };

  const assistanceTypes = [
    { value: 'elderly_care', label: '老人照料' },
    { value: 'child_care', label: '儿童看护' },
    { value: 'disability_support', label: '残疾人帮扶' },
    { value: 'medical_assistance', label: '医疗协助' },
    { value: 'living_support', label: '生活照料' },
    { value: 'psychological_support', label: '心理疏导' },
    { value: 'legal_aid', label: '法律援助' },
    { value: 'education_support', label: '教育帮扶' },
    { value: 'employment_support', label: '就业帮扶' },
    { value: 'emergency_rescue', label: '紧急救助' },
    { value: 'environmental_maintenance', label: '环境维护' },
    { value: 'community_service', label: '社区服务' },
  ];

  const columns = [
    {
      title: '需求标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '需求类型',
      dataIndex: 'demand_type',
      key: 'demand_type',
      render: (text) => <Tag>{getAssistanceTypeText(text)}</Tag>,
    },
    {
      title: '申请人',
      dataIndex: 'resident_name',
      key: 'resident_name',
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
      title: '紧急程度',
      dataIndex: 'priority',
      key: 'priority',
      render: (text) => {
        const colors = { high: 'red', medium: 'orange', low: 'green' };
        const labels = { high: '高', medium: '中', low: '低' };
        return <Tag color={colors[text]}>{labels[text]}</Tag>;
      },
    },
    {
      title: '要求完成日期',
      dataIndex: 'required_date',
      key: 'required_date',
      render: formatDate,
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
          {record.status === 'pending' && (
            <Button 
              type="link" 
              onClick={() => handleStatusChange(record, 'approve')}
            >
              受理
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button 
              type="link" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record, 'complete')}
            >
              完成
            </Button>
          )}
          {record.status === 'pending' && (
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
          <h2>帮扶需求</h2>
        </Col>
        <Col>
          <Space>
            <DataExportButton exportAPI={assistanceAPI.export} filename="帮扶需求.xlsx" />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增需求
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Search
            placeholder="搜索标题、申请人"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={(value) => { setSearchText(value); setPagination(prev => ({ ...prev, current: 1 })); }}
            onChange={(e) => !e.target.value && setSearchText('')}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Select
            placeholder="需求类型"
            allowClear
            style={{ width: '100%' }}
            value={demandType || undefined}
            onChange={(value) => { setDemandType(value); setPagination(prev => ({ ...prev, current: 1 })); }}
          >
            {assistanceTypes.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={6}>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: '100%' }}
            value={status || undefined}
            onChange={(value) => { setStatus(value); setPagination(prev => ({ ...prev, current: 1 })); }}
          >
            <Option value="pending">待受理</Option>
            <Option value="in_progress">处理中</Option>
            <Option value="completed">已完成</Option>
            <Option value="rejected">已拒绝</Option>
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
        title={editingRecord ? '编辑帮扶需求' : '新增帮扶需求'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="需求标题" rules={[{ required: true, message: '请输入需求标题' }]}>
            <Input placeholder="请输入需求标题" />
          </Form.Item>
          <Form.Item name="demand_type" label="需求类型" rules={[{ required: true, message: '请选择需求类型' }]}>
            <Select placeholder="请选择需求类型">
              {assistanceTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="resident" label="申请人ID" rules={[{ required: true, message: '请输入申请人ID' }]}>
            <Input placeholder="请输入申请人ID" type="number" />
          </Form.Item>
          <Form.Item name="priority" label="紧急程度" rules={[{ required: true, message: '请选择紧急程度' }]}>
            <Select placeholder="请选择紧急程度">
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
          <Form.Item name="required_date" label="要求完成日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="需求描述" rules={[{ required: true, message: '请输入需求描述' }]}>
            <Input.TextArea rows={4} placeholder="请输入需求详细描述" />
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
        title="需求详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          <Button type="primary" onClick={handleAddProgress}>
            添加进度
          </Button>
        }
        width={700}
      >
        {selectedRecord && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>需求标题</div>
                <div style={{ fontWeight: 'bold' }}>{selectedRecord.title}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>状态</div>
                <Tag className={`status-${selectedRecord.status}`}>
                  {getStatusBadge(selectedRecord.status).text}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>需求类型</div>
                <Tag>{getAssistanceTypeText(selectedRecord.demand_type)}</Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>申请人</div>
                <div>{selectedRecord.resident_name || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>紧急程度</div>
                <Tag color={selectedRecord.priority === 'high' ? 'red' : selectedRecord.priority === 'medium' ? 'orange' : 'green'}>
                  {selectedRecord.priority === 'high' ? '高' : selectedRecord.priority === 'medium' ? '中' : '低'}
                </Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: '#999', marginBottom: 4 }}>要求完成日期</div>
                <div>{formatDate(selectedRecord.required_date)}</div>
              </Col>
            </Row>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#999', marginBottom: 4 }}>需求描述</div>
              <div>{selectedRecord.description}</div>
            </div>
            
            {progressList.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#999', marginBottom: 8, fontWeight: 'bold' }}>帮扶进度</div>
                <List
                  dataSource={progressList}
                  renderItem={(progress) => (
                    <List.Item key={progress.id}>
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{progress.title}</span>
                            <span style={{ color: '#999', fontSize: 12 }}>{formatDateTime(progress.created_at)}</span>
                          </div>
                        }
                        description={
                          <div>
                            <div>{progress.content}</div>
                            {progress.remark && <div style={{ color: '#999', marginTop: 4 }}>备注：{progress.remark}</div>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            <div>
              <div style={{ color: '#999', marginBottom: 8, fontWeight: 'bold' }}>处理记录</div>
              <ProcessRecordList records={processRecords} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="添加帮扶进度"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        footer={null}
      >
        <Form form={progressForm} layout="vertical" onFinish={handleProgressSubmit}>
          <Form.Item 
            name="title" 
            label="进度标题" 
            rules={[{ required: true, message: '请输入进度标题' }]}
          >
            <Input placeholder="请输入进度标题" />
          </Form.Item>
          <Form.Item 
            name="content" 
            label="进度内容" 
            rules={[{ required: true, message: '请输入进度内容' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入进度内容" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setProgressModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssistanceDemandList;
