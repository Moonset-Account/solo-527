import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Space,
  Select,
  Progress,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Drawer,
  Descriptions,
  Divider,
  List,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
  TeamOutlined,
  EyeOutlined,
  EditOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { campApi, userApi, memberApi } from '../../services/api';
import dayjs from 'dayjs';
import { campStatusColor, campStatusLabel } from '../../types';
import type { CampStatus } from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function CampList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ keyword: '', status: undefined as CampStatus | undefined });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [currentCamp, setCurrentCamp] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    loadTeachers();
    loadMembers();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await campApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await userApi.teachers();
      setTeachers(res);
    } catch {}
  };

  const loadMembers = async () => {
    try {
      const res = await memberApi.list({ pageSize: 200 });
      setMembers(res.list);
    } catch {}
  };

  const columns: ColumnsType<any> = [
    {
      title: '营期名称',
      dataIndex: 'name',
      render: (t, r) => (
        <a onClick={() => navigate(`/camps/${r.id}`)} style={{ fontWeight: 500 }}>
          {t}
        </a>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <Tag color={campStatusColor[s as CampStatus]}>{campStatusLabel[s as CampStatus]}</Tag>,
      filters: [
        { text: '即将开营', value: 'UPCOMING' },
        { text: '进行中', value: 'ONGOING' },
        { text: '已结束', value: 'COMPLETED' },
      ],
    },
    {
      title: '时间',
      width: 220,
      render: (_: any, r) => (
        <div style={{ fontSize: 13 }}>
          <div><CalendarOutlined style={{ color: '#1677ff', marginRight: 6 }} />{dayjs(r.startDate).format('YYYY-MM-DD')} ~</div>
          <div style={{ paddingLeft: 20, color: '#999' }}>{dayjs(r.endDate).format('YYYY-MM-DD')}</div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf(),
    },
    {
      title: '总天数',
      dataIndex: 'totalDays',
      width: 80,
      render: (d) => <Tag color="blue">{d} 天</Tag>,
    },
    {
      title: '学员数',
      width: 140,
      render: (_: any, r) => (
        <div>
          <Tooltip title={`已报名 ${r.memberCount || 0} 人${r.maxMembers ? ` / ${r.maxMembers} 人` : ''}`}>
            <Progress
              percent={r.maxMembers ? Math.round((r.memberCount / r.maxMembers) * 100) : undefined}
              size="small"
              format={() => (
                <span>
                  <TeamOutlined style={{ color: '#1677ff' }} /> {r.memberCount || 0}
                </span>
              )}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '负责老师',
      dataIndex: ['teacher', 'name'],
      width: 100,
      render: (t) => t || <Tag color="default">未指派</Tag>,
    },
    {
      title: '进度',
      width: 120,
      render: (_: any, r) => {
        const progress = r.status === 'ONGOING'
          ? Math.min(100, Math.round((dayjs().diff(dayjs(r.startDate), 'day') + 1) / r.totalDays * 100))
          : r.status === 'COMPLETED' ? 100 : 0;
        return (
          <Progress
            percent={progress}
            size="small"
            status={r.status === 'COMPLETED' ? 'success' : progress > 0 ? 'active' : undefined}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<UserAddOutlined />} onClick={() => openAddMember(r)}>
            加人
          </Button>
        </Space>
      ),
    },
  ];

  const openDetail = async (record: any) => {
    try {
      const res = await campApi.detail(record.id);
      setDetailData(res);
      setDetailOpen(true);
    } catch {}
  };

  const openEdit = (record: any) => {
    setEditData(record);
    editForm.setFieldsValue({
      ...record,
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
    });
    setEditOpen(true);
  };

  const openAddMember = (camp: any) => {
    setCurrentCamp(camp);
    setSelectedMembers([]);
    setAddMemberOpen(true);
  };

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await campApi.create({
        ...values,
        startDate: values.dateRange[0].toDate(),
        endDate: values.dateRange[1].toDate(),
      });
      message.success('营期创建成功');
      setCreateOpen(false);
      form.resetFields();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    try {
      setSubmitting(true);
      const updateData: any = { ...values };
      if (values.dateRange) {
        updateData.startDate = values.dateRange[0].toDate();
        updateData.endDate = values.dateRange[1].toDate();
        delete updateData.dateRange;
      }
      await campApi.update(editData.id, updateData);
      message.success('更新成功');
      setEditOpen(false);
      editForm.resetFields();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (selectedMembers.length === 0) {
      message.warning('请选择要添加的学员');
      return;
    }
    try {
      setSubmitting(true);
      await campApi.addMembers(currentCamp.id, { memberIds: selectedMembers });
      message.success('添加成功');
      setAddMemberOpen(false);
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>营期安排</h2>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索营期名称"
            style={{ width: 220 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select
            allowClear
            placeholder="选择状态"
            style={{ width: 140 }}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            options={[
              { label: '即将开营', value: 'UPCOMING' },
              { label: '进行中', value: 'ONGOING' },
              { label: '已结束', value: 'COMPLETED' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建营期
          </Button>
        </Space>
      </div>

      <Card bordered={false}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 个营期`,
          } as TablePaginationConfig}
          onChange={(p) => setPagination({ current: p.current!, pageSize: p.pageSize! })}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title="新建营期"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ status: 'UPCOMING' }}
        >
          <Form.Item name="name" label="营期名称" rules={[{ required: true, message: '请输入营期名称' }]}>
            <Input placeholder="如：21天亲子阅读训练营" />
          </Form.Item>
          <Form.Item name="description" label="营期简介">
            <TextArea rows={3} placeholder="简要描述营期内容和目标" maxLength={500} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateRange" label="营期时间" rules={[{ required: true, message: '请选择时间' }]}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalDays" label="总天数" rules={[{ required: true, message: '请输入总天数' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacherId" label="负责老师">
                <Select
                  allowClear
                  placeholder="请选择"
                  options={teachers.map((t) => ({ label: t.name, value: t.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxMembers" label="最大人数">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="不限则留空" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '即将开营', value: 'UPCOMING' },
                { label: '进行中', value: 'ONGOING' },
                { label: '已结束', value: 'COMPLETED' },
              ]}
            />
          </Form.Item>
          <Form.Item name="checkInRule" label="打卡规则">
            <TextArea rows={2} placeholder="如：每天阅读15分钟以上" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑营期"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="营期名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="营期简介">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateRange" label="营期时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalDays" label="总天数" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacherId" label="负责老师">
                <Select options={teachers.map((t) => ({ label: t.name, value: t.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxMembers" label="最大人数">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '即将开营', value: 'UPCOMING' },
                { label: '进行中', value: 'ONGOING' },
                { label: '已结束', value: 'COMPLETED' },
                { label: '已取消', value: 'CANCELLED' },
              ]}
            />
          </Form.Item>
          <Form.Item name="checkInRule" label="打卡规则">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`${currentCamp?.name || '营期'} - 添加学员`}
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        width={520}
        extra={
          <Space>
            <Button onClick={() => setAddMemberOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleAddMember} loading={submitting}>
              添加 {selectedMembers.length} 人
            </Button>
          </Space>
        }
      >
        <Input
          allowClear
          placeholder="搜索学员姓名或手机号"
          style={{ marginBottom: 12 }}
          prefix={<SearchOutlined />}
        />
        <Table
          rowKey="id"
          size="small"
          dataSource={members}
          rowSelection={{
            selectedRowKeys: selectedMembers as any,
            onChange: (keys) => setSelectedMembers(keys as number[]),
          }}
          pagination={false}
          scroll={{ y: 480 }}
          columns={[
            { title: '姓名', dataIndex: 'name' },
            { title: '手机号', dataIndex: 'phone' },
            { title: '孩子', dataIndex: 'childName' },
            {
              title: '等级',
              dataIndex: 'level',
              render: (l) => (
                <Tag color={memberLevelColor[l as keyof typeof memberLevelColor]}>
                  {memberLevelLabel[l as keyof typeof memberLevelLabel]}
                </Tag>
              ),
            },
          ]}
        />
      </Drawer>

      <Drawer
        title="营期详情"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={720}
      >
        {detailData && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="营期名称" span={2}>{detailData.name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={campStatusColor[detailData.status as CampStatus]}>
                  {campStatusLabel[detailData.status as CampStatus]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="负责老师">{detailData.teacher?.name || '未指派'}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{dayjs(detailData.startDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{dayjs(detailData.endDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="总天数">{detailData.totalDays} 天</Descriptions.Item>
              <Descriptions.Item label="学员数">{detailData.memberCount} 人</Descriptions.Item>
              <Descriptions.Item label="课程数">{detailData.courseCount} 节</Descriptions.Item>
              <Descriptions.Item label="营期进度" span={2}>
                <Progress percent={detailData.progress} status={detailData.status === 'COMPLETED' ? 'success' : 'active'} />
              </Descriptions.Item>
              <Descriptions.Item label="打卡规则" span={2}>
                {detailData.checkInRule || '暂无'}
              </Descriptions.Item>
              <Descriptions.Item label="简介" span={2}>{detailData.description || '暂无'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">课程安排</Divider>
            <List
              size="small"
              dataSource={detailData.courses}
              locale={{ emptyText: '暂无课程安排' }}
              renderItem={(course: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Tag color="blue">D{course.dayIndex}</Tag>}
                    title={course.title}
                    description={
                      <span>
                        {course.type}
                        {course.duration && <span> · {course.duration}分钟</span>}
                        {course.hasTrial && <Tag color="gold" style={{ marginLeft: 8 }}>试看</Tag>}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider />
            <Button type="primary" block onClick={() => navigate(`/camps/${detailData.id}`)}>
              查看完整详情 <EyeOutlined />
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
}

import { Row, Col } from 'antd';
import { memberLevelColor, memberLevelLabel } from '../../types';
