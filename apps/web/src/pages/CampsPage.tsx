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
  InputNumber,
  Upload,
  message,
  Popconfirm,
  Progress,
  Avatar,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import type { ColumnsType } from 'antd/es/table';
import { campsApi, CampListItem, usersApi } from '../services/api';
import { campStatusMap, formatDate, formatNumber } from '../lib/constants';
import dayjs, { Dayjs } from 'dayjs';
const { RangePicker } = DatePicker;
const CampsPage: React.FC = () => {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const [page, setPage] = useState(1);
 const [pageSize, setPageSize] = useState(10);
 const [filters, setFilters] = useState<any>({});
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingCamp, setEditingCamp] = useState<CampListItem | null>(null);
 const [form] = Form.useForm();
 const { data: operators } = useQuery({
 queryKey: ['users', 'operators'],
 queryFn: usersApi.listOperators,
 });
 const { data, isLoading, refetch } = useQuery({
 queryKey: ['camps', page, pageSize, filters],
 queryFn: () =>
 campsApi.list({
 page,
 pageSize,
 ...filters,
 }),
 });
 const createMutation = useMutation({
 mutationFn: (data: any) => {
 const payload = {
 ...data,
 startDate: data.dateRange[0]?.toISOString(),
 endDate: data.dateRange[1]?.toISOString(),
 price: data.price || 0,
 operatorId: data.operatorId || undefined,
 };
 delete payload.dateRange;
 if (editingCamp) {
 return campsApi.update(editingCamp.id, payload);
 }
 return campsApi.create(payload);
 },
 onSuccess: () => {
 message.success(editingCamp ? '营期已更新' : '营期已创建');
 setIsModalOpen(false);
 setEditingCamp(null);
 form.resetFields();
 refetch();
 queryClient.invalidateQueries({ queryKey: ['camps'] });
 },
 onError: (e: any) => message.error(e.message || '操作失败'),
 });
 const deleteMutation = useMutation({
 mutationFn: (id: string) => campsApi.remove(id),
 onSuccess: () => {
 message.success('已删除');
 refetch();
 },
 onError: (e: any) => message.error(e.message || '删除失败'),
 });
 const columns: ColumnsType<CampListItem> = [
 {
 title: '营期',
 dataIndex: 'name',
 key: 'name',
 width: 280,
 render: (name, record) => (<div onClick={() => navigate({ to: `/camps/${record.id}` } as any)} style={{
 cursor: 'pointer',
 display: 'flex',
 gap: 12,
 alignItems: 'center',
 }}>
 <div style={{
 width: 48,
 height: 48,
 borderRadius: 8,
 background: record.coverImageUrl
 ? `url(${record.coverImageUrl}) center/cover`
 : 'linear-gradient(135deg, #9254DE 0%, #722ED1 100%)',
 flexShrink: 0,
 }}/>
 <div>
 <div style={{ fontWeight: 500 }}>{name}</div>
 <div style={{ color: '#999', fontSize: 12 }}>
 {record.chaptersCount || 0} 章节 · {record.materialsCount || 0} 资料
 </div>
 </div>
 </div>),
 },
 {
 title: '时间',
 key: 'date',
 width: 200,
 render: (_, r) => (<div>
 <div>{formatDate(r.startDate, 'YYYY-MM-DD')}</div>
 <div style={{ color: '#999', fontSize: 12 }}>至 {formatDate(r.endDate, 'YYYY-MM-DD')}</div>
 </div>),
 },
 {
 title: '状态',
 dataIndex: 'status',
 key: 'status',
 width: 100,
 render: (status) => {
 const s = campStatusMap[status] || {};
 return <Tag color={s.color as any}>{s.label}</Tag>;
 },
 },
 {
 title: '学员人数',
 key: 'members',
 width: 160,
 render: (_, r) => {
 const percent = r.maxMembers > 0 ? (r.currentMembers / r.maxMembers) * 100 : 0;
 return (<Progress percent={Math.round(percent)} size="small" format={() => `${r.currentMembers}/${r.maxMembers} 人`} style={{ minWidth: 120 }}/>);
 },
 },
 {
 title: '售价',
 dataIndex: 'price',
 key: 'price',
 width: 100,
 render: (price) => <span style={{ fontWeight: 600 }}>¥{formatNumber(price, 0)}</span>,
 },
 {
 title: '负责人',
 key: 'operator',
 width: 100,
 render: (_, r) => operators?.find((o) => o.id === r.operatorId)?.name || '-',
 },
 {
 title: '操作',
 key: 'actions',
 width: 180,
 fixed: 'right',
 render: (_, r) => (<Space>
 <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate({ to: `/camps/${r.id}` } as any)}>
 查看
 </Button>
 <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
 setEditingCamp(r);
 form.setFieldsValue({
 ...r,
 dateRange: [dayjs(r.startDate), dayjs(r.endDate)],
 });
 setIsModalOpen(true);
 }}>
 编辑
 </Button>
 <Popconfirm title="确定删除此营期？" onConfirm={() => deleteMutation.mutate(r.id)}>
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
 if (values.dateRange) {
 newFilters.startDate = values.dateRange[0]?.toISOString();
 newFilters.endDate = values.dateRange[1]?.toISOString();
 }
 if (values.operatorId)
 newFilters.operatorId = values.operatorId;
 setFilters(newFilters);
 setPage(1);
 };
 return (<div>
 <div className="filter-bar">
 <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
 <div className="filter-row">
 <Form.Item name="keyword">
 <Input allowClear placeholder="搜索营期名称" prefix={<SearchOutlined />} style={{ width: 200 }}/>
 </Form.Item>
 <Form.Item name="status">
 <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(campStatusMap).map(([v, l]) => ({ value: v, label: l.label }))}/>
 </Form.Item>
 <Form.Item name="dateRange">
 <RangePicker placeholder={['开始时间', '结束时间']} style={{ width: 260 }}/>
 </Form.Item>
 <Form.Item name="operatorId">
 <Select allowClear placeholder="负责人" style={{ width: 120 }} options={operators?.map((o) => ({ value: o.id, label: o.name }))}/>
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

 <Card
 title={`营期列表（${data?.total || 0}）`}
 extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => {
 setEditingCamp(null);
 form.resetFields();
 setIsModalOpen(true);
 }}>
 新建营期
 </Button>}
 >
 <Table<CampListItem>
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
 scroll={{ x: 1100 }}/>
 </Card>

 <Modal
 title={editingCamp ? '编辑营期' : '新建营期'}
 open={isModalOpen}
 onCancel={() => setIsModalOpen(false)}
 footer={null}
 width={600}
 destroyOnClose
 >
 <Form
 form={form}
 layout="vertical"
 onFinish={(v) => createMutation.mutate(v)}
 initialValues={{ status: 'draft', maxMembers: 50, price: 0 }}
 >
 <Form.Item label="营期名称" name="name" rules={[{ required: true, message: '请输入营期名称' }]}>
 <Input placeholder="如：2026夏季·亲子阅读启蒙营" maxLength={200}/>
 </Form.Item>
 <Form.Item label="营期描述" name="description">
 <Input.TextArea rows={3} placeholder="描述营期内容、亮点等" maxLength={1000}/>
 </Form.Item>
 <Form.Item label="封面图片URL" name="coverImageUrl">
 <Input placeholder="输入图片URL地址" />
 </Form.Item>
 <Form.Item label="营期时间" name="dateRange" rules={[{ required: true, message: '请选择营期时间' }]}>
 <RangePicker style={{ width: '100%' }} showTime/>
 </Form.Item>
 <Row gutter={16}>
 <Col span={12}>
 <Form.Item label="营期状态" name="status" rules={[{ required: true }]}>
 <Select options={Object.entries(campStatusMap).map(([v, l]) => ({ value: v, label: l.label }))}/>
 </Form.Item>
 </Col>
 <Col span={12}>
 <Form.Item label="最大人数" name="maxMembers">
 <InputNumber min={1} style={{ width: '100%' }} />
 </Form.Item>
 </Col>
 </Row>
 <Row gutter={16}>
 <Col span={12}>
 <Form.Item label="售价（元）" name="price">
 <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `¥ ${v}`} parser={(v) => (v ? parseFloat(v.replace('¥ ', '')) : 0 as any)}/>
 </Form.Item>
 </Col>
 <Col span={12}>
 <Form.Item label="运营负责人" name="operatorId">
 <Select allowClear options={operators?.map((o) => ({ value: o.id, label: o.name }))}/>
 </Form.Item>
 </Col>
 </Row>
 <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
 <Space>
 <Button onClick={() => setIsModalOpen(false)}>取消</Button>
 <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
 {editingCamp ? '保存' : '创建'}
 </Button>
 </Space>
 </Form.Item>
 </Form>
 </Modal>
 </div>);
};
export default CampsPage;

