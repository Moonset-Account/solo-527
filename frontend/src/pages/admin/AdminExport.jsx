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
  Typography,
  Alert,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import { counselorApi, appointmentApi, exportApi } from '../../services/api.js';

const { Title, Paragraph } = Typography;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '待确认', color: 'gold' },
  { value: 'CONFIRMED', label: '已确认', color: 'blue' },
  { value: 'CHECKED_IN', label: '已到店', color: 'cyan' },
  { value: 'COMPLETED', label: '已完成', color: 'green' },
  { value: 'NO_SHOW', label: '爽约', color: 'red' },
  { value: 'CANCELLED', label: '已取消', color: 'default' },
];

export default function AdminExport() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [counselors, setCounselors] = useState([]);
  const [filters, setFilters] = useState({
    status: undefined,
    counselorId: undefined,
    startDate: dayjs().startOf('month'),
    endDate: dayjs().endOf('month'),
    keyword: '',
  });

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

  const handleExport = (format = 'csv') => {
    const params = {
      keyword: filters.keyword || undefined,
      status: filters.status,
      counselorId: filters.counselorId,
      startDate: filters.startDate?.format('YYYY-MM-DD'),
      endDate: filters.endDate?.format('YYYY-MM-DD'),
      format,
    };
    const url = exportApi.appointments(params);
    window.open(url, '_blank');
    message.success(`正在导出${format.toUpperCase()}文件...`);
  };

  const getEfficiency = (apt) => {
    const completed = apt.status === 'COMPLETED' || apt.status === 'CHECKED_IN';
    const noShow = apt.status === 'NO_SHOW';
    if (!completed && !noShow) return { value: null, label: '未完成', color: 'default' };
    return completed
      ? { value: 100, label: '100%', color: 'green' }
      : { value: 0, label: '0%', color: 'red' };
  };

  const columns = [
    {
      title: '预约编号',
      dataIndex: 'id',
      width: 90,
      render: (v) => `#${v}`,
    },
    {
      title: '咨询信息',
      render: (_, r) => (
        <div>
          <div>{dayjs(r.timeSlot.date).format('YYYY-MM-DD')}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
            {r.timeSlot.startTime} - {r.timeSlot.endTime} · {r.timeSlot.duration}分钟
          </div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{r.counselor.name}</div>
        </div>
      ),
      width: 180,
    },
    {
      title: '来访人',
      dataIndex: 'clientName',
      render: (v, r) => (
        <div>
          <div>{v}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{r.clientPhone}</div>
        </div>
      ),
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (v) => {
        const opt = STATUS_OPTIONS.find((o) => o.value === v) || { label: v, color: 'default' };
        return (
          <Space direction="vertical" size={2}>
            <Tag color={opt.color}>{opt.label}</Tag>
            {v === 'NO_SHOW' && <Tag color="red">爽约</Tag>}
          </Space>
        );
      },
    },
    {
      title: '核销效率',
      width: 100,
      render: (_, r) => {
        const eff = getEfficiency(r);
        return <Tag color={eff.color}>{eff.label}</Tag>;
      },
    },
    {
      title: '候补状态',
      width: 120,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          {r.isWaitlisted ? <Tag color="orange">候补</Tag> : <Tag color="default">正常</Tag>}
          {r.waitlistExpired && <Tag color="red">候补超时</Tag>}
        </Space>
      ),
    },
    {
      title: '最近操作',
      width: 160,
      render: (_, r) => (
        <div>
          <div>{r.lastOperation || '-'}</div>
          {r.lastOperatedAt && (
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {dayjs(r.lastOperatedAt).format('MM-DD HH:mm')}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        type="info"
        showIcon
        message="数据导出说明"
        description={
          <div>
            <div>• 导出内容包含：预约信息、来访人信息、核销效率、候补状态、最近操作等完整字段</div>
            <div>• 支持 CSV 和 JSON 两种格式，CSV 默认 UTF-8 编码（兼容 Excel）</div>
            <div>• 下载明细会自动带上核销效率、候补超时和最近一次操作，方便跨部门核对</div>
          </div>
        }
      />

      <Card>
        <Row gutter={16} align="middle">
          <Col><Title level={5} style={{ margin: 0 }}>查询下载</Title></Col>
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
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" icon={null} onClick={() => handleExport('csv')}>
                导出 CSV
              </Button>
              <Button onClick={() => handleExport('json')}>导出 JSON</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title={`预约明细（共 ${total} 条记录）`}>
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
    </Space>
  );
}
