import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Input, Select, Modal, Form, message, Typography, Switch } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { questionApi } from '../api/question';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const QuestionManage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadQuestions();
    loadCategories();
  }, [page, pageSize, keyword, categoryFilter, difficultyFilter, typeFilter]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await questionApi.getQuestions({
        keyword: keyword || undefined,
        category: categoryFilter,
        difficulty: difficultyFilter as any,
        type: typeFilter as any,
        page,
        pageSize,
      });
      if (res.success) {
        setData(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await questionApi.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const typeMap: Record<string, string> = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    true_false: '判断题',
    short_answer: '简答题',
    coding: '编程题',
    essay: '论述题',
  };

  const difficultyMap: Record<string, { label: string; color: string }> = {
    easy: { label: '简单', color: 'green' },
    medium: { label: '中等', color: 'orange' },
    hard: { label: '困难', color: 'red' },
  };

  const columns = [
    {
      title: '题目类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color="blue">{typeMap[type] || type}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const info = difficultyMap[difficulty] || { label: difficulty, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
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
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const openAddModal = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingQuestion(record);
    form.setFieldsValue({
      ...record,
      options: record.options?.join('\n') || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (values.type === 'single_choice' || values.type === 'multiple_choice') {
        values.options = values.options?.split('\n').filter((o: string) => o.trim());
      } else {
        values.options = null;
      }

      if (editingQuestion) {
        const res = await questionApi.updateQuestion(editingQuestion.id, values);
        if (res.success) {
          message.success('更新成功');
        } else {
          message.error(res.message);
        }
      } else {
        const res = await questionApi.createQuestion(values);
        if (res.success) {
          message.success('创建成功');
        } else {
          message.error(res.message);
        }
      }

      setModalVisible(false);
      loadQuestions();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await questionApi.deleteQuestion(id);
      if (res.success) {
        message.success('删除成功');
        loadQuestions();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>题库管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          新增题目
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索题目内容"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="分类"
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            style={{ width: 130 }}
            allowClear
          >
            {categories.map((cat) => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
          <Select
            placeholder="难度"
            value={difficultyFilter}
            onChange={(value) => setDifficultyFilter(value)}
            style={{ width: 100 }}
            allowClear
          >
            <Option value="easy">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="hard">困难</Option>
          </Select>
          <Select
            placeholder="题型"
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            style={{ width: 120 }}
            allowClear
          >
            {Object.entries(typeMap).map(([key, val]) => (
              <Option key={key} value={key}>{val}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={loadQuestions}>查询</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
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
        title={editingQuestion ? '编辑题目' : '新增题目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认"
        width={700}
      >
        <Form form={form} {...formItemLayout}>
          <Form.Item name="type" label="题型" rules={[{ required: true }]}>
            <Select>
              {Object.entries(typeMap).map(([key, val]) => (
                <Option key={key} value={key}>{val}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Input placeholder="例如：前端开发、后端开发" />
          </Form.Item>
          <Form.Item name="difficulty" label="难度" rules={[{ required: true }]}>
            <Select>
              <Option value="easy">简单</Option>
              <Option value="medium">中等</Option>
              <Option value="hard">困难</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="题目内容" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请输入题目内容" />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === 'single_choice' || type === 'multiple_choice') {
                return (
                  <Form.Item name="options" label="选项" rules={[{ required: true }]}>
                    <TextArea rows={4} placeholder="每行一个选项，例如：&#10;A. 选项一&#10;B. 选项二" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item name="correctAnswer" label="正确答案">
            <Input placeholder="请输入正确答案" />
          </Form.Item>
          <Form.Item name="defaultScore" label="默认分值">
            <Input type="number" defaultValue={10} />
          </Form.Item>
          <Form.Item name="scoringCriteria" label="评分标准">
            <TextArea rows={2} placeholder="请输入评分标准" />
          </Form.Item>
          <Form.Item name="knowledgePoints" label="知识点">
            <Input placeholder="请输入相关知识点" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionManage;
