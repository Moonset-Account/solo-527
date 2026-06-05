import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Card, Tabs, Table, Button, Space, Tag, Modal, message,
  Avatar, Descriptions, Badge, Alert
} from 'antd';
import {
  CheckOutlined, CloseOutlined, UserOutlined,
  TeamOutlined, EyeOutlined
} from '@ant-design/icons';
import { mentorsApi, studentsApi } from '../api';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

const reviewStatusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
};

const AdminReview = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mentors');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');

  const { data: mentors, isLoading: mentorsLoading } = useQuery(
    ['admin-mentors', activeTab],
    () => mentorsApi.list({ review_status: activeTab === 'mentors' ? 'pending' : undefined }),
    { enabled: user?.role === 'admin' }
  );

  const { data: students, isLoading: studentsLoading } = useQuery(
    ['admin-students', activeTab],
    () => studentsApi.list({ review_status: activeTab === 'students' ? 'pending' : undefined }),
    { enabled: user?.role === 'admin' }
  );

  const reviewMentorMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => mentorsApi.review(id, status),
    {
      onSuccess: () => {
        message.success('审核成功');
        queryClient.invalidateQueries(['admin-mentors']);
        setReviewModalVisible(false);
        setDetailVisible(false);
      },
      onError: (err: any) => {
        message.error(err.response?.data?.error || '审核失败');
      }
    }
  );

  const reviewStudentMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => studentsApi.review(id, status),
    {
      onSuccess: () => {
        message.success('审核成功');
        queryClient.invalidateQueries(['admin-students']);
        setReviewModalVisible(false);
        setDetailVisible(false);
      },
      onError: (err: any) => {
        message.error(err.response?.data?.error || '审核失败');
      }
    }
  );

  if (user?.role !== 'admin') {
    return <Alert type="error" message="无权限访问此页面" />;
  }

  const handleViewDetail = (item: any, type: 'mentor' | 'student') => {
    setSelectedItem({ ...item, type });
    setDetailVisible(true);
  };

  const handleReview = (type: 'approve' | 'reject') => {
    setReviewType(type);
    setReviewModalVisible(true);
  };

  const confirmReview = () => {
    if (!selectedItem) return;
    const status = reviewType === 'approve' ? 'approved' : 'rejected';
    if (selectedItem.type === 'mentor') {
      reviewMentorMutation.mutate({ id: selectedItem.id, status });
    } else {
      reviewStudentMutation.mutate({ id: selectedItem.id, status });
    }
  };

  const getPendingMentorCount = () => {
    const items = mentors?.data?.items || [];
    return items.filter((m: any) => m.review_status === 'pending').length;
  };

  const getPendingStudentCount = () => {
    const items = students?.data?.items || [];
    return items.filter((s: any) => s.review_status === 'pending').length;
  };

  const mentorColumns = [
    {
      title: '导师信息',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} src={user?.avatar_url}>
            {user?.name?.[0]}
          </Avatar>
          <div>
            <div className="font-medium">{user?.name}</div>
            <div className="text-gray-500 text-sm">{user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '公司职位',
      key: 'position',
      render: (_: any, record: any) => (
        <div>
          <div>{record.current_position}</div>
          <div className="text-gray-500 text-sm">{record.current_company}</div>
        </div>
      ),
    },
    {
      title: '学校专业',
      key: 'school',
      render: (_: any, record: any) => (
        <div>
          <div>{record.school}</div>
          <div className="text-gray-500 text-sm">{record.major} ({record.graduation_year}届)</div>
        </div>
      ),
    },
    {
      title: '行业标签',
      dataIndex: 'industry_tags',
      key: 'industry_tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map((tag, i) => <Tag key={i}>{tag}</Tag>)}
        </Space>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'review_status',
      key: 'review_status',
      render: (status: string) => {
        const config = reviewStatusConfig[status];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record, 'mentor')}>
            查看
          </Button>
          {record.review_status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { handleViewDetail(record, 'mentor'); handleReview('approve'); }}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => { handleViewDetail(record, 'mentor'); handleReview('reject'); }}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const studentColumns = [
    {
      title: '学生信息',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} src={user?.avatar_url}>
            {user?.name?.[0]}
          </Avatar>
          <div>
            <div className="font-medium">{user?.name}</div>
            <div className="text-gray-500 text-sm">{user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '学校专业',
      key: 'school',
      render: (_: any, record: any) => (
        <div>
          <div>{record.school} - {record.department}</div>
          <div className="text-gray-500 text-sm">{record.major} {record.grade}级</div>
        </div>
      ),
    },
    {
      title: '目标行业',
      dataIndex: 'target_industries',
      key: 'target_industries',
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map((tag, i) => <Tag key={i}>{tag}</Tag>)}
        </Space>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'review_status',
      key: 'review_status',
      render: (status: string) => {
        const config = reviewStatusConfig[status];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record, 'student')}>
            查看
          </Button>
          {record.review_status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { handleViewDetail(record, 'student'); handleReview('approve'); }}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => { handleViewDetail(record, 'student'); handleReview('reject'); }}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const tabItems: any = [
    {
      key: 'mentors',
      label: (
        <span>
          <TeamOutlined /> 导师审核
          {getPendingMentorCount() > 0 && (
            <Badge count={getPendingMentorCount()} size="small" className="ml-2" />
          )}
        </span>
      ),
      children: (
        <Table
          columns={mentorColumns}
          dataSource={mentors?.data?.items || []}
          loading={mentorsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'students',
      label: (
        <span>
          <UserOutlined /> 学生审核
          {getPendingStudentCount() > 0 && (
            <Badge count={getPendingStudentCount()} size="small" className="ml-2" />
          )}
        </span>
      ),
      children: (
        <Table
          columns={studentColumns}
          dataSource={students?.data?.items || []}
          loading={studentsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">资料审核</h1>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title={selectedItem?.type === 'mentor' ? '导师详情' : '学生详情'}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={700}
        footer={
          selectedItem?.review_status === 'pending' ? (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={() => handleReview('approve')}>
                审核通过
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => handleReview('reject')}>
                审核拒绝
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setDetailVisible(false)}>关闭</Button>
          )
        }
      >
        {selectedItem && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="姓名">{selectedItem.user?.name}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedItem.user?.email}</Descriptions.Item>
            <Descriptions.Item label="手机号">{selectedItem.user?.phone || '-'}</Descriptions.Item>
            {selectedItem.type === 'mentor' ? (
              <>
                <Descriptions.Item label="公司">{selectedItem.current_company}</Descriptions.Item>
                <Descriptions.Item label="职位">{selectedItem.current_position}</Descriptions.Item>
                <Descriptions.Item label="工作年限">{selectedItem.years_of_experience} 年</Descriptions.Item>
                <Descriptions.Item label="毕业院校">{selectedItem.school}</Descriptions.Item>
                <Descriptions.Item label="专业">{selectedItem.major}</Descriptions.Item>
                <Descriptions.Item label="毕业年份">{selectedItem.graduation_year}</Descriptions.Item>
                <Descriptions.Item label="行业标签">
                  <Space wrap>
                    {selectedItem.industry_tags?.map((t: string, i: number) => <Tag key={i}>{t}</Tag>)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="擅长领域">
                  <Space wrap>
                    {selectedItem.expertise_areas?.map((t: string, i: number) => <Tag key={i}>{t}</Tag>)}
                  </Space>
                </Descriptions.Item>
              </>
            ) : (
              <>
                <Descriptions.Item label="学校">{selectedItem.school}</Descriptions.Item>
                <Descriptions.Item label="院系">{selectedItem.department}</Descriptions.Item>
                <Descriptions.Item label="专业">{selectedItem.major}</Descriptions.Item>
                <Descriptions.Item label="年级">{selectedItem.grade}</Descriptions.Item>
                <Descriptions.Item label="目标行业">
                  <Space wrap>
                    {selectedItem.target_industries?.map((t: string, i: number) => <Tag key={i}>{t}</Tag>)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="目标岗位">
                  <Space wrap>
                    {selectedItem.target_positions?.map((t: string, i: number) => <Tag key={i}>{t}</Tag>)}
                  </Space>
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="个人简介">{selectedItem.bio || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核状态">
              <Tag color={reviewStatusConfig[selectedItem.review_status]?.color}>
                {reviewStatusConfig[selectedItem.review_status]?.text}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={reviewType === 'approve' ? '确认通过审核' : '确认拒绝审核'}
        open={reviewModalVisible}
        onOk={confirmReview}
        onCancel={() => setReviewModalVisible(false)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: reviewType === 'reject' }}
      >
        <p>
          {reviewType === 'approve'
            ? `确定要通过 ${selectedItem?.user?.name} 的资料审核吗？`
            : `确定要拒绝 ${selectedItem?.user?.name} 的资料审核吗？`}
        </p>
      </Modal>
    </div>
  );
};

export default AdminReview;
