import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Switch,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import type { ColumnsType } from 'antd/es/table';
import { chaptersApi, Chapter, campsApi } from '../services/api';
import { chapterStatusMap, campStatusMap, formatDuration } from '../lib/constants';

const ChaptersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [form] = Form.useForm();

  const { data: camps } = useQuery({
    queryKey: ['camps', 'all'],
    queryFn: () => campsApi.list({ pageSize: 100, page: 1 }),
  });

  const { data: chapters, isLoading, refetch } = useQuery({
    queryKey: ['chapters', filters],
    queryFn: () => chaptersApi.list(filters),
  });

  const { data: previewChapters } = useQuery({
    queryKey: ['chapters', 'preview'],
    queryFn: () => chaptersApi.listPreview(),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editingChapter) {
        return chaptersApi.update(editingChapter.id, data);
      }
      return chaptersApi.create(data);
    },
    onSuccess: () => {
      message.success(editingChapter ? '章节已更新' : '章节已添加');
      setModalOpen(false);
      setEditingChapter(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
    onError: (e: any) => message.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chaptersApi.remove(id),
    onSuccess: () => {
      message.success('章节已删除');
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });

  const togglePreview = (chapter: Chapter) => {
    chaptersApi.togglePreview(chapter.id).then(() => {
      message.success(chapter.isPreview ? '已取消试看' : '已设为试看');
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    });
  };

  const columns: ColumnsType<Chapter> = [
    {
      title: '序号',
      dataIndex: 'sortOrder',
      width: 60,
      align: 'center',
      render: (n) => <Tag color="purple">{n}</Tag>,
    },
    {
      title: '所属营期',
      dataIndex: 'campId',
      width: 200,
      render: (id) => {
        const camp = camps?.items?.find((c: any) => c.id === id);
        if (!camp) return id;
        const s = campStatusMap[camp.status] || {};
        return (
          <div>
            <div
              style={{
                cursor: 'pointer',
                color: '#722ED1',
              }}
              onClick={() => navigate({ to: `/camps/${id}` } as any)}
            >
              {camp.name}
            </div>
            <Tag color={s.color as any} style={{ marginTop: 4, fontSize: 11 }}>
              {s.label}
            </Tag>
          </div>
        );
      },
    },
    {
      title: '章节',
      dataIndex: 'title',
      render: (t, r) => (
        <div>
          <Space style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{t}</span>
            {r.isPreview && (
              <Tag color="orange" icon={<PlayCircleOutlined />}>
                试看
              </Tag>
            )}
          </Space>
          {r.description && (
            <div style={{ color: '#999', fontSize: 12 }}>{r.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      width: 100,
      render: (d) => formatDuration(d),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        const map = chapterStatusMap[s] || {};
        return <Tag color={map.color as any}>{map.label}</Tag>;
      },
    },
    {
      title: '试看',
      dataIndex: 'isPreview',
      width: 80,
      align: 'center',
      render: (is, record) => (
        <Tooltip title={is ? '点击取消试看' : '点击设为试看'}>
          <Switch
            checked={is}
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
            onChange={() => togglePreview(record)}
            onClick={(e: any) => {
              e.stopPropagation();
            }}
          />
        </Tooltip>
      ),
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
            icon={<EditOutlined />}
            onClick={() => {
              setEditingChapter(r);
              form.setFieldsValue(r);
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const campOptions =
    camps?.items?.map((c: any) => ({ value: c.id, label: c.name })) || [];

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-row">
          <Select
            allowClear
            placeholder="按营期筛选"
            style={{ width: 260 }}
            options={campOptions}
            value={filters.campId}
            onChange={(v) => {
              setFilters({ campId: v });
            }}
          />
          <Select
            allowClear
            placeholder="仅试看章节"
            style={{ width: 160 }}
            value={filters.previewFilter}
            onChange={(v) => {
              setFilters({ ...filters, previewFilter: v });
            }}
            options={[
              { value: 'yes', label: '仅显示试看章节' },
              { value: 'no', label: '隐藏试看章节' },
            ]}
          />
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingChapter(null);
                form.resetFields();
                form.setFieldsValue({
                  sortOrder: (chapters?.length || 0) + 1,
                  status: 'draft',
                  isPreview: false,
                  duration: 0,
                });
                setModalOpen(true);
              }}
            >
              新建章节
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card size="small" className="stat-card">
            <div style={{ color: '#666', fontSize: 13 }}>章节总数</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{chapters?.length || 0}</div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small" className="stat-card">
            <div style={{ color: '#666', fontSize: 13 }}>已发布</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>
              {chapters?.filter((c) => c.status === 'published').length || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small" className="stat-card">
            <div style={{ color: '#666', fontSize: 13 }}>草稿</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#888' }}>
              {chapters?.filter((c) => c.status === 'draft').length || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small" className="stat-card">
            <div style={{ color: '#666', fontSize: 13 }}>
              <PlayCircleOutlined /> 试看片段
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#FA8C16' }}>
              {previewChapters?.length || 0}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="章节列表">
        <Table<Chapter>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={(() => {
            let list = chapters || [];
            if (filters.previewFilter === 'yes') {
              list = list.filter((c) => c.isPreview);
            } else if (filters.previewFilter === 'no') {
              list = list.filter((c) => !c.isPreview);
            }
            return list;
          })()}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editingChapter ? '编辑章节' : '新建章节'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => mutation.mutate(v)}
        >
          <Form.Item label="所属营期" name="campId" rules={[{ required: true }]}>
            <Select options={campOptions} placeholder="请选择营期" />
          </Form.Item>
          <Form.Item label="章节标题" name="title" rules={[{ required: true }]}>
            <Input maxLength={300} />
          </Form.Item>
          <Form.Item label="章节描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="视频URL" name="videoUrl">
            <Input placeholder="输入视频播放地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="时长（秒）" name="duration">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="排序" name="sortOrder">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="状态" name="status" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(chapterStatusMap).map(([v, l]) => ({
                    value: v,
                    label: l.label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="是否试看" name="isPreview" valuePropName="checked">
                <Select
                  options={[
                    { value: true, label: '是 - 免费试看' },
                    { value: false, label: '否 - 会员可见' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                {editingChapter ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChaptersPage;
