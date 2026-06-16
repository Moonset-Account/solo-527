import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Tabs,
  List,
  Tag,
  Button,
  Space,
  Divider,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Table,
  Popconfirm,
  Descriptions,
  Empty,
  Progress,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  FileOutlined,
  UploadOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from '@tanstack/react-router';
import type { ColumnsType } from 'antd/es/table';
import {
  campsApi,
  CampDetail,
  chaptersApi,
  Chapter,
  membersApi,
  checkinsApi,
  exportApi,
  MemberListItem,
  CheckinListItem,
} from '../services/api';
import {
  campStatusMap,
  chapterStatusMap,
  memberStatusMap,
  checkinStatusMap,
  formatDate,
  formatDuration,
  formatFileSize,
  formatNumber,
} from '../lib/constants';
import dayjs from 'dayjs';

const CampDetailPage: React.FC = () => {
  const params = useParams({ from: '/camps/$campId' });
  const campId = params.campId!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialTarget, setMaterialTarget] = useState<'camp' | string>('camp');
  const [memberPage, setMemberPage] = useState(1);
  const [checkinPage, setCheckinPage] = useState(1);
  const [chapterForm] = Form.useForm();
  const [materialForm] = Form.useForm();

  const { data: camp, isLoading: campLoading } = useQuery({
    queryKey: ['camps', campId],
    queryFn: () => campsApi.get(campId),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['camps', campId, 'members', memberPage],
    queryFn: () => membersApi.list({ campId, page: memberPage, pageSize: 10 }),
  });

  const { data: checkins, isLoading: checkinsLoading } = useQuery({
    queryKey: ['camps', campId, 'checkins', checkinPage],
    queryFn: () => checkinsApi.list({ campId, page: checkinPage, pageSize: 10 }),
  });

  const chapterMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, campId };
      if (editingChapter) {
        return chaptersApi.update(editingChapter.id, payload);
      }
      return chaptersApi.create(payload);
    },
    onSuccess: () => {
      message.success(editingChapter ? '章节已更新' : '章节已添加');
      setChapterModalOpen(false);
      setEditingChapter(null);
      chapterForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['camps', campId] });
    },
    onError: (e: any) => message.error(e.message),
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id: string) => chaptersApi.remove(id),
    onSuccess: () => {
      message.success('章节已删除');
      queryClient.invalidateQueries({ queryKey: ['camps', campId] });
    },
  });

  const materialMutation = useMutation({
    mutationFn: (data: any) => {
      if (materialTarget === 'camp') {
        return campsApi.addMaterial(campId, data);
      }
      return chaptersApi.addMaterial(materialTarget, data);
    },
    onSuccess: () => {
      message.success('资料已添加');
      setMaterialModalOpen(false);
      materialForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['camps', campId] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });

  const memberColumns: ColumnsType<MemberListItem> = [
    {
      title: '学员',
      key: 'member',
      render: (_, r) => (
        <div
          style={{ cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
          onClick={() => navigate({ to: `/members/${r.id}` } as any)}
        >
          <Avatar style={{ backgroundColor: '#9254DE' }}>
            {r.userName?.slice(0, 1)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{r.userName}</div>
            <div style={{ color: '#999', fontSize: 12 }}>
              {r.memberNo} · {r.userPhone || '无手机'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '学习进度',
      dataIndex: 'progress',
      width: 200,
      render: (progress, r) => (
        <Progress
          percent={parseFloat(progress)}
          size="small"
          status={r.isFallingBehind ? 'exception' : undefined}
          format={() => `${r.completedChapters}/${r.totalChapters} 章`}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        const map = memberStatusMap[s] || {};
        return <Tag color={map.color as any}>{map.label}</Tag>;
      },
    },
    {
      title: '入营时间',
      dataIndex: 'joinDate',
      width: 180,
      render: (d) => formatDate(d),
    },
    {
      title: '掉队风险',
      dataIndex: 'isFallingBehind',
      width: 100,
      render: (is) =>
        is ? (
          <Tag color="red" className="falling-behind-tag">
            已掉队
          </Tag>
        ) : (
          <Tag color="green">正常</Tag>
        ),
    },
  ];

  const checkinColumns: ColumnsType<CheckinListItem> = [
    {
      title: '学员',
      dataIndex: 'userName',
      width: 140,
      render: (name, r) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#13C2C2' }}>
            {name?.slice(0, 1)}
          </Avatar>
          <span>{name}</span>
        </Space>
      ),
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
      render: (c) => c || '-',
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
      width: 180,
      render: (d) => formatDate(d),
    },
    {
      title: '审核人',
      dataIndex: 'reviewerName',
      width: 100,
      render: (n) => n || '-',
    },
  ];

  const campStatus = campStatusMap[camp?.status || ''] || {};
  const progressPercent =
    (camp?.currentMembers || 0) > 0 && camp
      ? ((camp.currentMembers || 0) / (camp.maxMembers || 1)) * 100
      : 0;

  return (
    <Spin spinning={campLoading}>
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate({ to: '/camps' as any })}
      >
        返回营期列表
      </Button>

      {camp && (
        <Card
          style={{ marginBottom: 16 }}
          cover={
            camp.coverImageUrl ? (
              <div
                style={{
                  height: 200,
                  background: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3)), url(${camp.coverImageUrl}) center/cover`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 24,
                    right: 24,
                    color: 'white',
                  }}
                >
                  <h2 style={{ color: 'white', fontSize: 24, margin: 0 }}>{camp.name}</h2>
                </div>
              </div>
            ) : null
          }
        >
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <Space style={{ marginBottom: 12 }}>
                <Tag color={campStatus.color as any}>{campStatus.label}</Tag>
                <Tag color="blue">¥{formatNumber(camp.price, 0)}</Tag>
              </Space>
              <p style={{ color: '#666', whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                {camp.description || '暂无描述'}
              </p>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="开营时间">{formatDate(camp.startDate)}</Descriptions.Item>
                <Descriptions.Item label="闭营时间">{formatDate(camp.endDate)}</Descriptions.Item>
                <Descriptions.Item label="学员人数">
                  {camp.currentMembers}/{camp.maxMembers} 人
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{formatDate(camp.createdAt)}</Descriptions.Item>
              </Descriptions>
            </div>
            <div style={{ width: 280 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#666' }}>报名进度</span>
                  <span>{camp.currentMembers}/{camp.maxMembers}</span>
                </div>
                <Progress percent={Math.round(progressPercent)} status="active" />
              </div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  icon={<ExportOutlined />}
                  block
                  onClick={() => exportApi.members({ campId })}
                >
                  导出本营学员
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  block
                  onClick={() => exportApi.checkins({ campId })}
                >
                  导出打卡记录
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: <span><PlayCircleOutlined /> 章节安排</span>,
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 500 }}>
                      共 {camp?.chapters?.length || 0} 个章节
                    </span>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingChapter(null);
                        chapterForm.resetFields();
                        chapterForm.setFieldsValue({
                          sortOrder: (camp?.chapters?.length || 0) + 1,
                          status: 'draft',
                          isPreview: false,
                        });
                        setChapterModalOpen(true);
                      }}
                    >
                      添加章节
                    </Button>
                  </div>
                  {camp?.chapters?.length ? (
                    <List
                      dataSource={camp.chapters}
                      renderItem={(chapter) => {
                        const status = chapterStatusMap[chapter.status] || {};
                        return (
                          <List.Item
                            key={chapter.id}
                            className="chapter-list-item"
                            actions={[
                              <Button
                                key="preview"
                                type="link"
                                size="small"
                                onClick={() => {
                                  chaptersApi.togglePreview(chapter.id);
                                  queryClient.invalidateQueries({
                                    queryKey: ['camps', campId],
                                  });
                                  message.success(chapter.isPreview ? '已取消试看' : '已设为试看');
                                }}
                              >
                                {chapter.isPreview ? '取消试看' : '设为试看'}
                              </Button>,
                              <Button
                                key="material"
                                type="link"
                                size="small"
                                icon={<FileOutlined />}
                                onClick={() => {
                                  setMaterialTarget(chapter.id);
                                  setMaterialModalOpen(true);
                                }}
                              >
                                资料
                              </Button>,
                              <Button
                                key="edit"
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingChapter(chapter);
                                  chapterForm.setFieldsValue(chapter);
                                  setChapterModalOpen(true);
                                }}
                              >
                                编辑
                              </Button>,
                              <Popconfirm
                                key="del"
                                title="确定删除？"
                                onConfirm={() => deleteChapterMutation.mutate(chapter.id)}
                              >
                                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                                  删除
                                </Button>
                              </Popconfirm>,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <div
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 10,
                                    background: chapter.isPreview
                                      ? '#FFF7E6'
                                      : '#F9F0FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20,
                                  }}
                                >
                                  {chapter.sortOrder}
                                </div>
                              }
                              title={
                                <Space>
                                  <span style={{ fontWeight: 500 }}>{chapter.title}</span>
                                  {chapter.isPreview && (
                                    <Tag color="orange">
                                      <PlayCircleOutlined /> 试看
                                    </Tag>
                                  )}
                                  <Tag color={status.color as any}>{status.label}</Tag>
                                  <span style={{ color: '#999', fontSize: 12 }}>
                                    {formatDuration(chapter.duration)}
                                  </span>
                                  {chapter.materials && chapter.materials.length > 0 && (
                                    <span style={{ color: '#999', fontSize: 12 }}>
                                      <FileOutlined /> {chapter.materials.length}
                                    </span>
                                  )}
                                </Space>
                              }
                              description={chapter.description || '暂无描述'}
                            />
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty description="暂无章节" />
                  )}
                </div>
              ),
            },
            {
              key: 'materials',
              label: <span><FileOutlined /> 营期资料</span>,
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 500 }}>
                      共 {camp?.materials?.length || 0} 份公共资料
                    </span>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => {
                        setMaterialTarget('camp');
                        materialForm.resetFields();
                        setMaterialModalOpen(true);
                      }}
                    >
                      上传资料
                    </Button>
                  </div>
                  {camp?.materials?.length ? (
                    <List
                      dataSource={camp.materials}
                      renderItem={(m) => (
                        <List.Item
                          actions={[
                            <a key="dl" href={m.url} target="_blank">
                              下载
                            </a>,
                            <Popconfirm
                              key="del"
                              title="确定删除？"
                              onConfirm={() => {
                                campsApi.removeMaterial(campId, m.id);
                                queryClient.invalidateQueries({ queryKey: ['camps', campId] });
                              }}
                            >
                              <Button type="link" size="small" danger>
                                删除
                              </Button>
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 10,
                                  background: '#E6FFFB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#13C2C2',
                                  fontSize: 20,
                                }}
                              >
                                <FileOutlined />
                              </div>
                            }
                            title={m.name}
                            description={
                              <Space>
                                <Tag>{m.type}</Tag>
                                <span style={{ color: '#999' }}>{formatFileSize(m.fileSize)}</span>
                                <span style={{ color: '#bbb' }}>·</span>
                                <span style={{ color: '#999' }}>
                                  {formatDate(m.createdAt, 'MM-DD')}
                                </span>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无资料" />
                  )}
                </div>
              ),
            },
            {
              key: 'members',
              label: (
                <span>
                  <TeamOutlined /> 学员名单 ({camp?.membersCount || 0})
                </span>
              ),
              children: (
                <Table<MemberListItem>
                  rowKey="id"
                  loading={membersLoading}
                  columns={memberColumns}
                  dataSource={members?.items}
                  pagination={{
                    current: memberPage,
                    pageSize: 10,
                    total: members?.total,
                    onChange: (p) => setMemberPage(p),
                    showSizeChanger: false,
                  }}
                />
              ),
            },
            {
              key: 'checkins',
              label: (
                <span>
                  <CheckSquareOutlined /> 打卡记录
                </span>
              ),
              children: (
                <Table<CheckinListItem>
                  rowKey="id"
                  loading={checkinsLoading}
                  columns={checkinColumns}
                  dataSource={checkins?.items}
                  pagination={{
                    current: checkinPage,
                    pageSize: 10,
                    total: checkins?.total,
                    onChange: (p) => setCheckinPage(p),
                    showSizeChanger: false,
                  }}
                />
              ),
            },
          ]}
        />
      )}

      <Modal
        title={editingChapter ? '编辑章节' : '添加章节'}
        open={chapterModalOpen}
        onCancel={() => setChapterModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form
          form={chapterForm}
          layout="vertical"
          onFinish={(v) => chapterMutation.mutate(v)}
        >
          <Form.Item label="章节标题" name="title" rules={[{ required: true }]}>
            <Input maxLength={300} />
          </Form.Item>
          <Form.Item label="章节描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="视频URL" name="videoUrl">
            <Input placeholder="输入视频播放地址" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="时长（秒）" name="duration" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="排序" name="sortOrder" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="状态" name="status" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                options={Object.entries(chapterStatusMap).map(([v, l]) => ({ value: v, label: l.label }))}
              />
            </Form.Item>
            <Form.Item label="是否试看" name="isPreview" valuePropName="checked" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: true, label: '是' },
                  { value: false, label: '否' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setChapterModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={chapterMutation.isPending}>
                {editingChapter ? '保存' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加资料"
        open={materialModalOpen}
        onCancel={() => setMaterialModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={materialForm}
          layout="vertical"
          onFinish={(v) => materialMutation.mutate(v)}
          initialValues={{ type: 'pdf' }}
        >
          <Form.Item label="资料名称" name="name" rules={[{ required: true }]}>
            <Input maxLength={300} placeholder="如：学员手册.pdf" />
          </Form.Item>
          <Form.Item label="资料类型" name="type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'pdf', label: 'PDF文档' },
                { value: 'video', label: '视频' },
                { value: 'audio', label: '音频' },
                { value: 'image', label: '图片' },
                { value: 'zip', label: '压缩包' },
                { value: 'other', label: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item label="资料链接URL" name="url" rules={[{ required: true }]}>
            <Input placeholder="输入文件URL" />
          </Form.Item>
          <Form.Item label="文件大小（字节）" name="fileSize">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setMaterialModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={materialMutation.isPending}>
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default CampDetailPage;
