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
  Popconfirm,
  Progress,
  Avatar,
  Drawer,
  Descriptions,
  List,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  WarningOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { ColumnsType } from 'antd/es/table';
import { membersApi, MemberListItem, MemberDetail, campsApi, usersApi } from '../services/api';
import {
  memberStatusMap,
  conversionSourceMap,
  campStatusMap,
  formatDate,
  formatNumber,
  todoPriorityMap,
  todoTypeMap,
} from '../lib/constants';
const { RangePicker } = DatePicker;
const MembersPage: React.FC = () => {
 const navigate = useNavigate();
 const search = useSearch({ strict: false }) as any;
 const queryClient = useQueryClient();
 const [page, setPage] = useState(1);
 const [pageSize, setPageSize] = useState(10);
 const [filters, setFilters] = useState<any>({
 isFallingBehind: search?.isFallingBehind,
 });
 const [modalOpen, setModalOpen] = useState(false);
 const [detailOpen, setDetailOpen] = useState(false);
 const [detail, setDetail] = useState<MemberDetail | null>(null);
 const [form] = Form.useForm();
 const { data: camps } = useQuery({
 queryKey: ['camps', 'all'],
 queryFn: () => campsApi.list({ pageSize: 100, page: 1 }),
 });
 const { data, isLoading, refetch } = useQuery({
 queryKey: ['members', page, pageSize, filters],
 queryFn: () => membersApi.list({ page, pageSize, ...filters }),
 });
 const mutation = useMutation({
 mutationFn: (data: any) => membersApi.create(data),
 onSuccess: () => {
 message.success('会员已添加');
 setModalOpen(false);
 form.resetFields();
 refetch();
 queryClient.invalidateQueries({ queryKey: ['members'] });
 },
 onError: (e: any) => message.error(e.message),
 });
 const refreshProgress = (id: string) => {
 membersApi.refreshProgress(id).then(() => {
 message.success('进度已刷新');
 queryClient.invalidateQueries({ queryKey: ['members'] });
 });
 };
 const openDetail = async (item: MemberListItem) => {
 try {
 const d = await membersApi.get(item.id);
 setDetail(d);
 setDetailOpen(true);
 }
 catch (e: any) {
 message.error(e.message);
 }
 };
 const columns: ColumnsType<MemberListItem> = [
 {
 title: '会员信息',
 key: 'member',
 width: 260,
 render: (_, r) => (<div style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => openDetail(r)}>
 <Avatar style={{ backgroundColor: '#9254DE' }} size={42}>
 {r.userName?.slice(0, 1)}
 </Avatar>
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <span style={{ fontWeight: 500 }}>{r.userName}</span>
 {r.isFallingBehind && (<Tag color="red" className="falling-behind-tag">
 <WarningOutlined /> 掉队
 </Tag>)}
 </div>
 <div style={{ color: '#999', fontSize: 12 }}>
 {r.memberNo} · {r.userPhone || '无手机'}
 </div>
 </div>
 </div>),
 },
 {
 title: '营期',
 dataIndex: 'campName',
 width: 200,
 render: (name, r) => (<div onClick={() => navigate({ to: `/camps/${r.campId}` } as any)} style={{
 cursor: 'pointer',
 color: '#722ED1',
 }}>
 {name}
 </div>),
 },
 {
 title: '学习进度',
 dataIndex: 'progress',
 width: 220,
 render: (progress, r) => (<div>
 <Progress percent={parseFloat(progress)} size="small" status={r.isFallingBehind ? 'exception' : undefined} format={() => `${r.completedChapters}/${r.totalChapters} 章 (${formatNumber(progress)}%)`}/>
 </div>),
 },
 {
 title: '会员状态',
 dataIndex: 'status',
 width: 100,
 render: (s) => {
 const map = memberStatusMap[s] || {};
 return <Tag color={map.color as any}>{map.label}</Tag>;
 },
 },
 {
 title: '转化来源',
 dataIndex: 'conversionSource',
 width: 100,
 render: (s) => {
 const map = conversionSourceMap[s] || {};
 return <Tag color={map.color as any}>{map.label}</Tag>;
 },
 },
 {
 title: '销售/入营时间',
 width: 160,
 render: (_, r) => (<div>
 <div style={{ fontSize: 13 }}>
 <span style={{ color: '#666' }}>销售：</span>
 {r.salesPerson || '—'}
 </div>
 <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
 {formatDate(r.joinDate, 'MM-DD HH:mm')}
 </div>
 </div>),
 },
 {
 title: '操作',
 key: 'actions',
 width: 200,
 fixed: 'right',
 render: (_, r) => (<Space>
 <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>
 详情
 </Button>
 <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => refreshProgress(r.id)}>
 刷新进度
 </Button>
 <Popconfirm title="确定删除？" onConfirm={() => {
 membersApi.remove(r.id).then(() => {
 message.success('已删除');
 refetch();
 });
 }}>
 <Button type="link" size="small" danger icon={<DeleteOutlined />}>
 删除
 </Button>
 </Popconfirm>
 </Space>),
 },
 ];
 const handleSearch = (values: any) => {
 const newFilters: any = {};
 if (values.keyword)
 newFilters.keyword = values.keyword;
 if (values.status)
 newFilters.status = values.status;
 if (values.campId)
 newFilters.campId = values.campId;
 if (values.conversionSource)
 newFilters.conversionSource = values.conversionSource;
 if (values.isFallingBehind)
 newFilters.isFallingBehind = values.isFallingBehind;
 if (values.salesPerson)
 newFilters.salesPerson = values.salesPerson;
 if (values.joinDateRange) {
 newFilters.joinDateStart = values.joinDateRange[0]?.toISOString();
 newFilters.joinDateEnd = values.joinDateRange[1]?.toISOString();
 }
 setFilters(newFilters);
 setPage(1);
 };
 return (<div>
 <div className="filter-bar">
 <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
 <div className="filter-row">
 <Form.Item name="keyword">
 <Input allowClear placeholder="搜索姓名/邮箱/会员号" prefix={<SearchOutlined />} style={{ width: 220 }}/>
 </Form.Item>
 <Form.Item name="campId">
 <Select allowClear placeholder="营期" style={{ width: 180 }} options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))}/>
 </Form.Item>
 <Form.Item name="status">
 <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(memberStatusMap).map(([v, l]) => ({ value: v, label: l.label }))}/>
 </Form.Item>
 <Form.Item name="conversionSource">
 <Select allowClear placeholder="转化来源" style={{ width: 140 }} options={Object.entries(conversionSourceMap).map(([v, l]) => ({ value: v, label: l.label }))}/>
 </Form.Item>
 <Form.Item name="isFallingBehind">
 <Select allowClear placeholder="是否掉队" style={{ width: 120 }} options={[
 { value: 'true', label: '仅掉队' },
 { value: 'false', label: '不掉队' },
 ]}/>
 </Form.Item>
 <Form.Item name="joinDateRange">
 <RangePicker placeholder={['入营起', '止']} style={{ width: 240 }}/>
 </Form.Item>
 <Form.Item name="salesPerson">
 <Input allowClear placeholder="销售姓名" style={{ width: 120 }}/>
 </Form.Item>
 <Form.Item>
 <Space>
 <Button type="primary" htmlType="submit">
 查询
 </Button>
 <Button onClick={() => {
 setFilters({});
 form.resetFields();
 refetch();
 }}>
 重置
 </Button>
 </Space>
 </Form.Item>
 </div>
 </Form>
 </div>

 <Card title={`会员列表（${data?.total || 0}）`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
 添加会员
 </Button>}>
 <Table<MemberListItem> rowKey="id" loading={isLoading} columns={columns} dataSource={data?.items} pagination={{
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
 }} scroll={{ x: 1300 }}/>
 </Card>

 <Modal title="添加会员" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={560} destroyOnClose>
 <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)} initialValues={{ status: 'active', conversionSource: 'other' }}>
 <Form.Item label="选择营期" name="campId" rules={[{ required: true }]}>
 <Select options={camps?.items?.filter((c: any) => c.status !== 'completed').map((c: any) => ({ value: c.id, label: c.name }))} placeholder="请选择营期"/>
 </Form.Item>
 <Button style={{ marginBottom: 16 }} size="small" onClick={() => navigate({ to: '/users' as any })}>
 找不到学员？去创建
 </Button>
 <Form.Item label="用户ID" name="userId" rules={[{ required: true }]}>
 <Input placeholder="先去用户管理创建，复制ID粘贴到这里"/>
 </Form.Item>
 <div style={{ display: 'flex', gap: 16 }}>
 <Form.Item label="会员状态" name="status" style={{ flex: 1 }}>
 <Select options={Object.entries(memberStatusMap).map(([v, l]) => ({ value: v, label: l.label }))}/>
 </Form.Item>
 <Form.Item label="转化来源" name="conversionSource" style={{ flex: 1 }}>
 <Select options={Object.entries(conversionSourceMap).map(([v, l]) => ({ value: v, label: l.label }))}/>
 </Form.Item>
 </div>
 <Form.Item label="来源详情" name="conversionSourceDetail">
 <Input placeholder="如：微信第X群，XX活动等"/>
 </Form.Item>
 <Form.Item label="销售" name="salesPerson">
 <Input placeholder="填写销售人员姓名"/>
 </Form.Item>
 <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
 <Space>
 <Button onClick={() => setModalOpen(false)}>取消</Button>
 <Button type="primary" htmlType="submit" loading={mutation.isPending}>
 添加
 </Button>
 </Space>
 </Form.Item>
 </Form>
 </Modal>

 <Drawer title="会员详情" width={640} open={detailOpen} onClose={() => setDetailOpen(false)} extra={<Space>
 <Button icon={<EditOutlined />}>编辑</Button>
 <Button type="primary" icon={<SyncOutlined />} onClick={() => detail && refreshProgress(detail.id)}>
 刷新进度
 </Button>
 </Space>}>
 {detail ? (<div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, borderRadius: 12, background: '#FAFAFA' }}>
 <Avatar style={{ backgroundColor: '#9254DE', width: 56, height: 56, fontSize: 24 }}>
 {detail.user?.name?.slice(0, 1)}
 </Avatar>
 <div style={{ flex: 1 }}>
 <Space style={{ marginBottom: 4 }}>
 <span style={{ fontSize: 18, fontWeight: 600 }}>{detail.user?.name}</span>
 {detail.isFallingBehind && (<Tag color="red" className="falling-behind-tag">
 <WarningOutlined /> 学习掉队
 </Tag>)}
 <Tag color={(memberStatusMap[detail.status] || {}).color as any}>
 {(memberStatusMap[detail.status] || {}).label}
 </Tag>
 </Space>
 <div style={{ color: '#666' }}>
 {detail.user?.email} · {detail.user?.phone || '无手机'}
 </div>
 <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
 会员号：{detail.memberNo}
 </div>
 </div>
 </div>

 <Descriptions column={2} size="small" style={{ marginBottom: 24 }}>
 <Descriptions.Item label="所属营期">{detail.camp?.name}</Descriptions.Item>
 <Descriptions.Item label="营期状态">
 <Tag color={(campStatusMap[detail.camp?.status || ''] || {}).color as any}>
 {(campStatusMap[detail.camp?.status || ''] || {}).label}
 </Tag>
 </Descriptions.Item>
 <Descriptions.Item label="入营时间">{formatDate(detail.joinDate)}</Descriptions.Item>
 <Descriptions.Item label="过期时间">{detail.expiryDate ? formatDate(detail.expiryDate) : '—'}</Descriptions.Item>
 <Descriptions.Item label="转化来源">
 <Tag color={(conversionSourceMap[detail.conversionSource] || {}).color as any}>
 {(conversionSourceMap[detail.conversionSource] || {}).label}
 </Tag>
 </Descriptions.Item>
 <Descriptions.Item label="销售">{detail.salesPerson || '—'}</Descriptions.Item>
 <Descriptions.Item label="来源详情" span={2}>
 {detail.conversionSourceDetail || '—'}
 </Descriptions.Item>
 <Descriptions.Item label="最后活跃">
 {detail.lastActiveAt ? formatDate(detail.lastActiveAt) : '—'}
 </Descriptions.Item>
 </Descriptions>

 <Card size="small" title="学习进度" style={{ marginBottom: 16 }}>
 <Progress percent={parseFloat(detail.progress)} size="large" status={detail.isFallingBehind ? 'exception' : undefined} format={() => `已完成 ${detail.completedChapters}/${detail.totalChapters} 章 (${formatNumber(detail.progress)}%)`}/>
 {detail.progress && detail.progress.length > 0 ? (<List size="small" dataSource={detail.progress} style={{ marginTop: 16 }} renderItem={(p: any) => (<List.Item>
 <List.Item.Meta title={p.chapterTitle || `章节ID: ${p.chapterId}`} description={p.isCompleted ? (<Tag color="green">已完成 {formatDate(p.completedAt, 'MM-DD')}</Tag>) : (<Tag color="default">未完成</Tag>)}/>
 <span style={{ color: '#999' }}>
 观看 {Math.round(p.watchDuration / 60)}分钟
 </span>
 </List.Item>)}/>) : (<Empty description="暂无学习记录" style={{ padding: 20 }}/>)}
 </Card>
 </div>) : (<Empty style={{ padding: 60 }}/>)}
 </Drawer>
 </div>);
};
export default MembersPage;


