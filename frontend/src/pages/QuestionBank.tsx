import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, InputNumber, Select, message, Typography } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { questionApi } from '../api/question';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const QuestionBank: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [viewingBank, setViewingBank] = useState<any>(null);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [allQuestions, setAllQuestions] = useState<any[]>([]);

  useEffect(() => {
    loadBanks();
    loadAllQuestions();
  }, [page, pageSize]);

  const loadBanks = async () => {
    setLoading(true);
    try {
      const res = await questionApi.getBanks({ page, pageSize });
      if (res.success) {
        setData(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to load question banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllQuestions = async () => {
    try {
      const res = await questionApi.getQuestions({ pageSize: 100 });
      if (res.success) {
        setAllQuestions(res.data.items);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const columns = [
    {
      title: '题库名称',
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
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 80,
    },
    {
      title: '及格分',
      dataIndex: 'passScore',
      key: 'passScore',
      width: 80,
    },
    {
      title: '考试时长',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      width: 100,
      render: (minutes: number) => `${minutes}分钟`,
    },
    {
      title: '题目数量',
      key: 'questionCount',
      width: 100,
      render: (_: any, record: any) => record.questionIds?.length || 0,
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
      width: 180,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => viewDetail(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const openAddModal = () => {
    setEditingBank(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingBank(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const viewDetail = async (record: any) => {
    setViewingBank(record);
    try {
      const res = await questionApi.getBankQuestions(record.id);
      if (res.success) {
        setBankQuestions(res.data);
      }
    } catch (error) {
      console.error('Failed to load bank questions:', error);
    }
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingBank) {
        const res = await questionApi.updateBank(editingBank.id, values);
        if (res.success) {
          message.success('更新成功');
        } else {
          message.error(res.message);
        }
      } else {
        const res = await questionApi.createBank(values);
        if (res.success) {
          message.success('创建成功');
        } else {
          message.error(res.message);
        }
      }

      setModalVisible(false);
      loadBanks();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const questionColumns = [
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          single_choice: '单选题',
          multiple_choice: '多选题',
          true_false: '判断题',
          short_answer: '简答题',
          coding: '编程题',
          essay: '论述题',
        };
        return <Tag color="blue">{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const colorMap: Record<string, string> = {
          easy: 'green',
          medium: 'orange',
          hard: 'red',
        };
        return <Tag color={colorMap[difficulty]}>{difficulty}</Tag>;
      },
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '分值',
      dataIndex: 'defaultScore',
      key: 'defaultScore',
      width: 80,
    },
  ];

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>题库列表</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          新建题库
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={editingBank ? '编辑题库' : '新建题库'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认"
        width={600}
      >
        <Form form={form} {...formItemLayout}>
          <Form.Item name="name" label="题库名称" rules={[{ required: true, message: '请输入题库名称' }]}>
            <Input placeholder="请输入题库名称" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入题库描述" />
          </Form.Item>
          <Form.Item name="totalScore" label="总分">
            <InputNumber min={0} defaultValue={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="passScore" label="及格分">
            <InputNumber min={0} defaultValue={60} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationMinutes" label="考试时长(分钟)">
            <InputNumber min={1} defaultValue={60} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="题库详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={800}
      >
        {viewingBank && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p><strong>分类：</strong>{viewingBank.category}</p>
              <p><strong>描述：</strong>{viewingBank.description || '-'}</p>
              <p>
                <strong>总分：</strong>{viewingBank.totalScore}分
                <span style={{ marginLeft: 20 }}><strong>及格分：</strong>{viewingBank.passScore}分</span>
                <span style={{ marginLeft: 20 }}><strong>时长：</strong>{viewingBank.durationMinutes}分钟</span>
              </p>
            </div>
            <h4>题目列表（{bankQuestions.length}题）</h4>
            <Table
              columns={questionColumns}
              dataSource={bankQuestions}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuestionBank;
