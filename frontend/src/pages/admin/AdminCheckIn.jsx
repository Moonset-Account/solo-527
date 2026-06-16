import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  message,
  Popconfirm,
  Modal,
  Form,
  Typography,
  Divider,
  Descriptions,
} from 'antd';
import dayjs from 'dayjs';
import { counselorApi, appointmentApi } from '../../services/api.js';

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '待确认', color: 'gold' },
  { value: 'CONFIRMED', label: '已确认', color: 'blue' },
  { value: 'CHECKED_IN', label: '已到店', color: 'cyan' },
  { value: 'COMPLETED', label: '已完成', color: 'green' },
];

export default function AdminCheckIn() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [counselors, setCounselors] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({
    status: undefined,
    counselorId: undefined,
    startDate: dayjs().startOf('day'),
    endDate: dayjs().add(7, 'day').endOf('day'),
    keyword: '',
  });
  const [noShowForm] = Form.useForm();
  const [noShowVisible, setNoShowVisible] = useState(false);
  const [currentApt, setCurrentApt] = useState(null);

  useEffect(() => {
    loadCounselors();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters, page, pageSize]);

  const loadCounselors = async () => {
    try {
      const res = await counselorApi.list({ active: true });
      if (res.success) setCounselors(res.data);
    } catch (e) {
      message.error('加载咨询师失败');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status,
        counselorId: filters.counselorId,
        startDate: filters.startDate?.format('YYYY-MM-DD'),
        endDate: filters.endDate?.format('YYYY-MM-DD'),
      };
      const res = await appointmentApi.list(params);
      if (res.success) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, payload = {}) => {
    try {
      let res;
      switch (action) {
        case 'confirm':
          res = await appointmentApi.confirm(id, payload);
          break;
        case 'checkin':
          res = await appointmentApi.checkIn(id, payload);
          break;
        case 'complete':
          res = await appointmentApi.complete(id, payload);
          break;
        case 'cancel':
          res = await appointmentApi.cancel(id, payload);
          break;
        default:
          return;
      }
      if (res.success) {
        message.success(res.message || '操作成功');
        loadData();
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const handleNoShow = async (values) => {
    try {
      const res = await appointmentApi.noShow(currentApt.id, { reason: values.reason });
      if (res.success) {
        message.success('已标记爽约');
        setNoShowVisible(false);
        noShowForm.resetFields();
        loadData();
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const openDetail = async (apt) => {
    try {
      const res = await appointmentApi.get(apt.id);
      if (res.success) {
        setDetail(res.data);
        setDetailVisible(true);
      }
    } catch (e) {
      message.error('加载详情失败');
    }
  };

  const renderActions = (_, apt) => {
    const actions = [];
    if (apt.status === 'PENDING') {
      actions.push(<Button size="small" type="primary" onClick={() => handleAction(apt.id, 'confirm')}>确认</Button>);
    }
    if (apt.status === 'CONFIRMED' || apt.status === 'PENDING') {
      actions.push(<Button size="small" onClick={() => handleAction(apt.id, 'checkin')}>到店核销</Button>);
    }
    if (apt.status === 'CHECKED_IN') {
      actions.push(<Button size="small" type="primary" onClick={() => handleAction(apt.id, 'complete')}>完成</Button>);
    }
    if (!['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(apt.status)) {
      actions.push(
        <Button size="small" danger onClick={() => { setCurrentApt(apt); setNoShowVisible(true); }}>
          标记爽约
        </Button>
      );
      actions.push(
        <Popconfirm title="确认取消该预约？" onConfirm={() => handleAction(apt.id, 'cancel')}>
          <Button size="small">取消</Button>
        </Popconfirm>
      );
    }
    actions.push(<Button size="small" onClick={() => openDetail(apt)}>详情</Button>);
    return <Space>{actions}</Space>;
  };

  const columns = [
    {
      title: '咨询日期',
      dataIndex: ['timeSlot', 'date'],
      render: (v, r) => (
        <div>
          <div>{dayjs(v).format('YYYY-MM-DD')}</div>
          <div type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
            {r.timeSlot.startTime} - {r.timeSlot.endTime}
          </div>
        </div>
      ),
      width: 160,
      sorter: (a, b) => dayjs(a.timeSlot.date).valueOf() - dayjs(b.timeSlot.date).valueOf(),
    },
    { title: '咨询师', dataIndex: ['counselor', 'name'], width: 100 },
    {
      title: '来访人',
      dataIndex: 'clientName',
      render: (v, r) => (
        <div>
          <div>{v}</div>
          <div type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>{r.clientPhone}</div>
        </div>
      ),
      width: 140,
    },
    {
      title: '来访原因',
      dataIndex: 'reason',
      ellipsis: true,
      render: (v) => <Text>{v}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (v) => {
        const opt = STATUS_OPTIONS.find((o) => o.value === v) || { label: v, color: 'default' };
        return (
          <Space direction="vertical" size={4}>
            <Tag color={opt.color}>{opt.label}</Tag>
            {v === 'NO_SHOW' && <Tag color="red">爽约</Tag>}
            {v === 'CANCELLED' && <Tag color="default">已取消</Tag>}
            {detail?.isWaitlisted && <Tag color="orange">候补</Tag>}
          </Space>
        );
      },
    },
    {
      title: '最近操作',
      render: (_, r) => (
        <div>
          <div>{r.lastOperation || '-'}</div>
          {r.lastOperatedAt && (
            <div type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
              {dayjs(r.lastOperatedAt).format('MM-DD HH:mm')}
            </div>
          )}
        </div>
      ),
      width: 140,
    },
    { title: '操作', width: 320, render: renderActions },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Row gutter={16} align="middle">
          <Col><Title level={5} style={{ margin: 0 }}>预约核销</Title></Col>
          <Col>
            <Input.Search
              placeholder="搜索姓名/电话"
              allowClear
              style={{ width: 200 }}
              onSearch={(v) => setFilters({ ...filters, keyword: v })}
            />
          </Col>
          <Col>
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Select
              placeholder="全部咨询师"
              allowClear
              style={{ width: 160 }}
              value={filters.counselorId}
              onChange={(v) => setFilters({ ...filters, counselorId: v })}
              options={counselors.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Col>
          <Col>
            <DatePicker.RangePicker
              value={[filters.startDate, filters.endDate]}
              onChange={(val) => val && setFilters({ ...filters, startDate: val[0], endDate: val[1] })}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          loading={loading}
          dataSource={data}
          rowKey="id"
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title="预约详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {detail && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="预约编号">#{detail.id}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="咨询师">{detail.counselor.name}</Descriptions.Item>
              <Descriptions.Item label="咨询时段">
                {dayjs(detail.timeSlot.date).format('YYYY-MM-DD')} {detail.timeSlot.startTime}-{detail.timeSlot.endTime}
              </Descriptions.Item>
              <Descriptions.Item label="来访人">{detail.clientName}</Descriptions.Item>
              <Descriptions.Item label="电话">{detail.clientPhone}</Descriptions.Item>
              <Descriptions.Item label="邮箱" span={2}>{detail.clientEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="来访原因" span={2}>{detail.reason}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const opt = STATUS_OPTIONS.find((o) => o.value === detail.status) || { label: detail.status, color: 'default' };
                  return <Tag color={opt.color}>{opt.label}</Tag>;
                })()}
                {detail.isWaitlisted && <Tag color="orange">候补</Tag>}
                {detail.waitlistExpired && <Tag color="default">候补超时</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="爽约原因">{detail.noShowReason || '-'}</Descriptions.Item>
              <Descriptions.Item label="到店时间">{detail.checkInTime ? dayjs(detail.checkInTime).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{detail.checkOutTime ? dayjs(detail.checkOutTime).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="最近操作">{detail.lastOperation || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作时间">{detail.lastOperatedAt ? dayjs(detail.lastOperatedAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">操作记录</Divider>
            <Table
              size="small"
              pagination={false}
              dataSource={detail.operationLogs}
              rowKey="id"
              columns={[
                { title: '操作', dataIndex: 'action', width: 120 },
                { title: '操作人', dataIndex: 'operator', width: 100 },
                { title: '备注', dataIndex: 'remark' },
                { title: '时间', dataIndex: 'createdAt', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'), width: 160 },
              ]}
            />
          </Space>
        )}
      </Modal>

      <Modal
        title="标记爽约"
        open={noShowVisible}
        onCancel={() => setNoShowVisible(false)}
        footer={null}
      >
        <Form form={noShowForm} layout="vertical" onFinish={handleNoShow}>
          <Form.Item label="爽约原因" name="reason">
            <Input.TextArea rows={3} placeholder="请输入爽约原因（选填）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">确认标记</Button>
              <Button onClick={() => setNoShowVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
