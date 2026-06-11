import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, InputNumber, message, Typography, List } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { assessmentApi } from '../api/assessment';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const ScoringCriteria: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<any>(null);
  const [form] = Form.useForm();
  const [dimensions, setDimensions] = useState<any[]>([]);

  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = async () => {
    setLoading(true);
    try {
      const res = await assessmentApi.getScoringCriteria();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Failed to load scoring criteria:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '标准名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '满分',
      dataIndex: 'maxScore',
      key: 'maxScore',
      width: 80,
    },
    {
      title: '及格分',
      dataIndex: 'passScore',
      key: 'passScore',
      width: 80,
    },
    {
      title: '维度数量',
      key: 'dimensionCount',
      width: 100,
      render: (_: any, record: any) => record.dimensions?.length || 0,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const openAddModal = () => {
    setEditingCriterion(null);
    form.resetFields();
    setDimensions([{ name: '', weight: 25, description: '', scoringGuide: '' }]);
    setModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingCriterion(record);
    form.setFieldsValue(record);
    setDimensions(record.dimensions || []);
    setModalVisible(true);
  };

  const addDimension = () => {
    setDimensions([...dimensions, { name: '', weight: 0, description: '', scoringGuide: '' }]);
  };

  const removeDimension = (index: number) => {
    const newDimensions = dimensions.filter((_, i) => i !== index);
    setDimensions(newDimensions);
  };

  const updateDimension = (index: number, field: string, value: any) => {
    const newDimensions = [...dimensions];
    newDimensions[index] = { ...newDimensions[index], [field]: value };
    setDimensions(newDimensions);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const totalWeight = dimensions.reduce((sum, d) => sum + (d.weight || 0), 0);
      
      if (totalWeight !== 100) {
        message.error('所有维度的权重之和必须等于100');
        return;
      }

      const data = {
        ...values,
        dimensions,
      };

      if (editingCriterion) {
        const res = await assessmentApi.updateScoringCriterion(editingCriterion.id, data);
        if (res.success) {
          message.success('更新成功');
        } else {
          message.error(res.message);
        }
      } else {
        const res = await assessmentApi.createScoringCriterion(data);
        if (res.success) {
          message.success('创建成功');
        } else {
          message.error(res.message);
        }
      }

      setModalVisible(false);
      loadCriteria();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>评分标准管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          新增评分标准
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingCriterion ? '编辑评分标准' : '新增评分标准'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认"
        width={700}
      >
        <Form form={form} {...formItemLayout}>
          <Form.Item name="name" label="标准名称" rules={[{ required: true }]}>
            <Input placeholder="请输入标准名称" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item name="maxScore" label="满分">
            <InputNumber min={0} defaultValue={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="passScore" label="及格分">
            <InputNumber min={0} defaultValue={60} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入描述" />
          </Form.Item>

          <Form.Item label="评分维度">
            <div>
              <List
                size="small"
                dataSource={dimensions}
                renderItem={(item, index) => (
                  <List.Item key={index}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Input
                          placeholder="维度名称"
                          value={item.name}
                          onChange={(e) => updateDimension(index, 'name', e.target.value)}
                          style={{ width: 120 }}
                        />
                        <InputNumber
                          placeholder="权重"
                          value={item.weight}
                          min={0}
                          max={100}
                          onChange={(value) => updateDimension(index, 'weight', value)}
                          style={{ width: 100 }}
                        />
                        <span style={{ color: '#999' }}>%</span>
                        <Button type="link" danger size="small" onClick={() => removeDimension(index)}>
                          删除
                        </Button>
                      </Space>
                      <Input
                        placeholder="维度描述"
                        value={item.description}
                        onChange={(e) => updateDimension(index, 'description', e.target.value)}
                      />
                      <TextArea
                        placeholder="评分说明"
                        value={item.scoringGuide}
                        onChange={(e) => updateDimension(index, 'scoringGuide', e.target.value)}
                        rows={2}
                      />
                    </Space>
                  </List.Item>
                )}
              />
              <Button type="dashed" block onClick={addDimension} style={{ marginTop: 8 }}>
                + 添加维度
              </Button>
              <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                当前总权重：{dimensions.reduce((sum, d) => sum + (d.weight || 0), 0)}%（需等于100%）
              </p>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScoringCriteria;
