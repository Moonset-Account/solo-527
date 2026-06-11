import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Modal, Form, Input, InputNumber, Select, Rate, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { assignmentApi, classApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import OperationPanel from '@/components/OperationPanel';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const AssignmentReview: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const loadClasses = async () => {
    const result = await classApi.list({ pageNum: 1, pageSize: 100 });
    setClasses(result.records || []);
  };

  const loadAssignments = async (classId: number) => {
    setLoading(true);
    try {
      const result = await assignmentApi.classList(classId);
      setAssignments(result || []);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId: number) => {
    setLoading(true);
    try {
      let result = await assignmentApi.submissions(assignmentId);
      if (statusFilter) {
        result = result.filter((s: any) => s.status === statusFilter);
      }
      setSubmissions(result || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment);
    }
  }, [selectedAssignment, statusFilter]);

  const handleSearch = (values: SearchFilterValues) => {
    loadClasses();
  };

  const handleReview = (record: any) => {
    setReviewModal(record);
    form.setFieldsValue({ score: record.score, comment: record.comment });
  };

  const handleSubmitReview = async () => {
    const values = await form.validateFields();
    await assignmentApi.review(reviewModal.id, values);
    message.success('点评成功');
    setReviewModal(null);
    if (selectedAssignment) loadSubmissions(selectedAssignment);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户ID', dataIndex: 'userId', width: 100 },
    {
      title: '作业内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (v: string) => v || '（仅附件提交）',
    },
    {
      title: '附件',
      dataIndex: 'attachmentUrl',
      width: 100,
      render: (v: string) => (v ? <a href={v} target="_blank">查看</a> : '-'),
    },
    {
      title: '分数',
      dataIndex: 'score',
      width: 100,
      render: (v: number) => (v != null ? v : '-'),
    },
    {
      title: '点评',
      dataIndex: 'comment',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.text || v}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 160,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleReview(record)}
            disabled={record.status === 'REVIEWED'}
          >
            点评
          </Button>
          <Button size="small" onClick={() => {
            setSelectedItem(record);
            setPanelOpen(true);
          }}>
            操作面板
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>作业点评</Title>

      <SearchFilter keywordPlaceholder="搜索班级" showStatus={false} onSearch={handleSearch} />

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择班级"
          style={{ width: 220 }}
          value={selectedClass}
          onChange={(v) => {
            setSelectedClass(v);
            setSelectedAssignment(null);
            setSubmissions([]);
            loadAssignments(v);
          }}
          options={classes.map((c) => ({ label: c.className, value: c.id }))}
          allowClear
        />
        <Select
          placeholder="选择作业"
          style={{ width: 260 }}
          value={selectedAssignment}
          onChange={setSelectedAssignment}
          options={assignments.map((a) => ({ label: a.title, value: a.id }))}
          disabled={!selectedClass}
          allowClear
        />
        <Select
          placeholder="状态筛选"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          options={[
            { label: '待点评', value: 'SUBMITTED' },
            { label: '已点评', value: 'REVIEWED' },
          ]}
        />
      </Space>

      <Table
        loading={loading}
        columns={columns}
        dataSource={submissions}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="作业点评"
        open={!!reviewModal}
        onCancel={() => setReviewModal(null)}
        onOk={handleSubmitReview}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>用户ID:</strong> {reviewModal?.userId}</p>
          <p><strong>作业内容:</strong></p>
          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, maxHeight: 120, overflow: 'auto' }}>
            {reviewModal?.content || '（仅附件提交）'}
          </div>
          {reviewModal?.attachmentUrl && (
            <p style={{ marginTop: 8 }}>
              <a href={reviewModal.attachmentUrl} target="_blank">查看附件</a>
            </p>
          )}
        </div>
        <Form form={form} layout="vertical">
          <Form.Item name="score" label="评分" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="comment" label="点评意见" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <OperationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        bizType="ASSIGNMENT"
        bizId={selectedItem?.id}
        title={`作业提交 #${selectedItem?.id}`}
      />
    </div>
  );
};

export default AssignmentReview;
