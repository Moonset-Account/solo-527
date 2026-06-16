import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Form,
  message,
  Avatar,
  Drawer,
  Descriptions,
  Image,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { checkinsApi, CheckinListItem, campsApi, usersApi } from '../services/api';
import { checkinStatusMap, formatDate } from '../lib/constants';

const { RangePicker } = DatePicker;

const CheckinsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<CheckinListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<CheckinListItem | null>(null);
  const [reviewForm] = Form.useForm();

  const { data: camps } = useQuery({
    queryKey: ['camps', 'all'],
    queryFn: () => campsApi.list({ pageSize: 100, page: 1 }),
  });

  const { data: operators } = useQuery({
    queryKey: ['users', 'operators'],
    queryFn: usersApi.listOperators,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['checkins', page, pageSize, filters],
    queryFn: () => checkinsApi.list({ page, pageSize, ...filters }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => checkinsApi.review(id, data),
    onSuccess: () => {
      message.success('审核完成');
      setReviewModalOpen(false);
      reviewingItem && setReviewingItem(null);
      reviewForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
    onError: (e: any) => message.error(e.message),
  });

  const openDetail = async (id: string) => {
    try {
      const d = await checkinsApi.get(id);
      setDetail(d);
      setDetailOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns: ColumnsType<CheckinListItem> = [
    {
      title: '学员',
      dataIndex: 'userName',
      width: 140,
      render: (name, r) => (
        <Space>
          <Avatar style={{ backgroundColor: '#13C2C2' }}>{name?.slice(0, 1)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{r.memberNo}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '营期',
      dataIndex: 'campName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '章节',
      dataIndex: 'chapterTitle',
      width: 200,
      ellipsis: true,
    },
    {
      title: '打卡内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (c) => c || '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        const map = checkinStatusMap[s] || {};
        return <Tag color={map.color as any}>{map.label}</Tag>;
      },
    },
    {
      title: '打卡时间',
      dataIndex: 'checkedInAt',
      width: 160,
      sorter: true,
      render: (d) => formatDate(d),
    },
    {
      title: '审核人',
      dataIndex: 'reviewerName',
      width: 100,
      render: (n) => n || '—',
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(r.id)}
          >
            详情
          </Button>
          {r.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => {
                setReviewingItem(r);
                reviewForm.setFieldsValue({ status: 'approved' });
                setReviewModalOpen(true);
              }}
            >
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleSearch = (values: any) => {
    const newFilters: any = {};
    if (values.keyword) newFilters.keyword = values.keyword;
    if (values.campId) newFilters.campId = values.campId;
    if (values.status) newFilters.status = values.status;
    if (values.reviewedBy) newFilters.reviewedBy = values.reviewedBy;
    if (values.dateRange) {
      newFilters.startDate = values.dateRange[0]?.toISOString();
      newFilters.endDate = values.dateRange[1]?.toISOString();
    }
    setFilters(newFilters);
    setPage(1);
  };

  const stats = {
    total: data?.total || 0,
    pending: data?.items?.filter((i) => i.status === 'pending').length || 0,
    approved: data?.items?.filter((i) => i.status === 'approved').length || 0,
    rejected: data?.items?.filter((i) => i.status === 'rejected').length || 0,
  };

  return (
    <div>
      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
          <div className="filter-row">
            <Form.Item name="keyword">
              <Input allowClear placeholder="搜索学员/章节" prefix={<SearchOutlined />} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="campId">
              <Select allowClear placeholder="营期" style={{ width: 180 }} options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))} />
            </Form.Item>
            <Form.Item name="status">
              <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(checkinStatusMap).map(([v, l]) => ({ value: v, label: l.label }))} />
            </Form.Item>
            <Form.Item name="reviewedBy">
              <Select allowClear placeholder="处理人" style={{ width: 120 }} options={operators?.map((o) => ({ value: o.id, label: o.name }))} />
            </Form.Item>
            <Form.Item name="dateRange">
              <RangePicker placeholder={['打卡起', '止']} style={{ width: 240 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">查询</Button>
                <Button
                  onClick={() => {
                    setFilters({});
                    refetch();
                  }}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </div>

      <Card
        title={`打卡记录（${stats.total}）`}
        extra={
          <Space>
            <Tag color="warning">待审核 {stats.pending}</Tag>
            <Tag color="success">已通过 {stats.approved}</Tag>
            <Tag color="error">已拒绝 {stats.rejected}</Tag>
          </Space>
        }
      >
        <Table<CheckinListItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="打卡审核"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        {reviewingItem && (
          <div>
            <div style={{ padding: 12, background: '#FAFAFA', borderRadius: 8, marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="学员">{reviewingItem.userName}</Descriptions.Item>
                <Descriptions.Item label="章节">{reviewingItem.chapterTitle}</Descriptions.Item>
                <Descriptions.Item label="打卡内容">{reviewingItem.content || '—'}</Descriptions.Item>
                <Descriptions.Item label="打卡时间">
                  {formatDate(reviewingItem.checkedInAt)}
                </Descriptions.Item>
              </Descriptions>
            </div>
            <Form form={reviewForm} layout="vertical" onFinish={(v) => reviewMutation.mutate({ id: reviewingItem.id, data: v })}>
              <Form.Item label="审核结果" name="status" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'approved', label: <span style={{ color: '#52c41a' }}><CheckOutlined /> 通过</span> },
                    { value: 'rejected', label: <span style={{ color: '#ff4d4f' }}><CloseOutlined /> 拒绝</span> },
                  ]}
                />
              </Form.Item>
              <Form.Item label="审核备注" name="reviewComment">
                <Input.TextArea rows={3} placeholder="输入审核意见（可选）" />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setReviewModalOpen(false)}>取消</Button>
                  <Button type="primary" htmlType="submit" loading={reviewMutation.isPending}>
                    提交
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Drawer
        title="打卡详情"
        width={520}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detail ? (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="学员">{detail.userName}</Descriptions.Item>
              <Descriptions.Item label="营期">{detail.campName}</Descriptions.Item>
              <Descriptions.Item label="章节">{detail.chapterTitle}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={(checkinStatusMap[detail.status] || {}).color as any}>
                  {(checkinStatusMap[detail.status] || {}).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="打卡时间">{formatDate(detail.checkedInAt)}</Descriptions.Item>
              {detail.reviewedAt && (
                <>
                  <Descriptions.Item label="审核时间">{formatDate(detail.reviewedAt)}</Descriptions.Item>
                  <Descriptions.Item label="审核人">{detail.reviewerName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="审核备注">{detail.reviewComment || '—'}</Descriptions.Item>
                </>
              )}
            </Descriptions>
            <Card size="small" title="打卡内容" style={{ marginBottom: 16 }}>
              {detail.content || '无文字内容'}
            </Card>
            {detail.imageUrls && detail.imageUrls.length > 0 && (
              <Card size="small" title="打卡图片">
                <Image.PreviewGroup>
                  <Space wrap>
                    {detail.imageUrls.map((url, i) => (
                      <Image key={i} width={100} src={url} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </Card>
            )}
          </div>
        ) : (
          <Empty />
        )}
      </Drawer>
    </div>
  );
};

export default CheckinsPage;
