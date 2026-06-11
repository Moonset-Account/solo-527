import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Input, Select, Typography, Modal, Form, message } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../api/resume';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const ResumeList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [statusModal, setStatusModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [statusForm] = Form.useForm();

  useEffect(() => {
    loadResumes();
  }, [page, pageSize, keyword, statusFilter]);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const res = await resumeApi.getResumes({
        keyword: keyword || undefined,
        status: statusFilter,
        page,
        pageSize,
      });
      if (res.success) {
        setData(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to load resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    submitted: { label: '已提交', color: 'blue' },
    screening: { label: '筛选中', color: 'orange' },
    written_test: { label: '笔试中', color: 'purple' },
    interview: { label: '面试中', color: 'cyan' },
    offer: { label: '已发Offer', color: 'green' },
    rejected: { label: '已拒绝', color: 'red' },
    hired: { label: '已入职', color: 'success' },
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 100,
    },
    {
      title: '学校/专业',
      key: 'education',
      render: (_: any, record: any) => (
        <div>
          <div>{record.school || '-'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.major || '-'}</div>
        </div>
      ),
    },
    {
      title: '应聘岗位',
      dataIndex: 'positionApplied',
      key: 'positionApplied',
      width: 120,
    },
    {
      title: '招聘周期',
      dataIndex: 'recruiterCycle',
      key: 'recruiterCycle',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '综合评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 90,
      render: (score: number) => score || '待评分',
    },
    {
      title: '提交时间',
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
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/resumes/${record.id}`)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openStatusModal(record)}>
            状态
          </Button>
        </Space>
      ),
    },
  ];

  const openStatusModal = (record: any) => {
    setSelectedResume(record);
    statusForm.setFieldsValue({ status: record.status, reason: '' });
    setStatusModal(true);
  };

  const handleStatusChange = async () => {
    try {
      const values = await statusForm.validateFields();
      const res = await resumeApi.updateStatus(selectedResume.id, values.status, values.reason);
      if (res.success) {
        message.success('状态更新成功');
        setStatusModal(false);
        loadResumes();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>简历列表</Title>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索姓名、学校、专业"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="筛选状态"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.label}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={loadResumes}>查询</Button>
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
        title="更新简历状态"
        open={statusModal}
        onCancel={() => setStatusModal(false)}
        onOk={handleStatusChange}
        okText="确认更新"
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="status" label="新状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="变更原因">
            <Input.TextArea rows={3} placeholder="请输入变更原因（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ResumeList;
