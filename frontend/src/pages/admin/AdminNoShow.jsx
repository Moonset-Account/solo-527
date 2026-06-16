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
  Modal,
  Form,
  Typography,
  Divider,
  Popconfirm,
} from 'antd';
import dayjs from 'dayjs';
import { counselorApi, appointmentApi } from '../../services/api.js';

const { Title } = Typography;

export default function AdminNoShow() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [counselors, setCounselors] = useState([]);
  const [filters, setFilters] = useState({
    counselorId: undefined,
    startDate: dayjs().subtract(3, 'month').startOf('day'),
    endDate: dayjs().endOf('day'),
    keyword: '',
    waitlistExpired: undefined,
  });
  const [remarkVisible, setRemarkVisible] = useState(false);
  const [remarkForm] = Form.useForm();
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
        status: 'NO_SHOW',
        keyword: filters.keyword || undefined,
        counselorId: filters.counselorId,
        startDate: filters.startDate?.format('YYYY-MM-DD'),
        endDate: filters.endDate?.format('YYYY-MM-DD'),
        waitlistExpired: filters.waitlistExpired,
      };
      if (filters.waitlistExpired === undefined) {
        delete params.waitlistExpired;
      }
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

  const openRemark = (apt) => {
    setCurrentApt(apt);
    remarkForm.setFieldsValue({ reason: apt.noShowReason });
    setRemarkVisible(true);
  };

  const handleUpdateRemark = async (values) => {
    try {
      const res = await appointmentApi.noShow(currentApt.id, { reason: values.reason });
      if (res.success) {
        message.success('已更新');
        setRemarkVisible(false);
        remarkForm.resetFields();
        loadData();
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const handleWaitlistExpire = async (apt) => {
    try {
      const res = await appointmentApi.waitlistExpire(apt.id);
      if (res.success) {
        message.success('已标记候补超时');
        loadData();
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const handleCancel = async (apt) => {
    try {
      const res = await appointmentApi.cancel(apt.id, { reason: '手动取消' });
      if (res.success) {
        message.success('已取消');
        loadData();
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '咨询日期',
      dataIndex: ['timeSlot', 'date'],
      render: (v, r) => (
        <div>
          <div>{dayjs(v).format('YYYY-MM-DD')}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
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
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{r.clientPhone}</div>
        </div>
      ),
      width: 140,
    },
    { title: '来访原因', dataIndex: 'reason', ellipsis: true },
    {
      title: '爽约原因',
      dataIndex: 'noShowReason',
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>未填写</span>,
    },
    {
      title: '候补状态',
      render: (_, r) => (
        <Space direction="vertical" size={4}>
          {r.isWaitlisted ? <Tag color="orange">候补</Tag> : <Tag color="default">正常预约</Tag>}
          {r.waitlistExpired && <Tag color="red">已超时</Tag>}
        </Space>
      ),
      width: 120,
    },
    {
      title: '最近操作',
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
      width: 140,
    },
    {
      title: '操作',
      width: 220,
      render: (_, apt) => (
        <Space>
          <Button size="small" onClick={() => openRemark(apt)}>更新原因</Button>
          {apt.isWaitlisted && !apt.waitlistExpired && (
            <Popconfirm title="确认标记候补超时？" onConfirm={() => handleWaitlistExpire(apt)}>
              <Button size="small">候补超时</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确认取消该预约？" onConfirm={() => handleCancel(apt)}>
            <Button size="small">取消</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Row gutter={16} align="middle">
          <Col><Title level={5} style={{ margin: 0 }}>爽约名单</Title></Col>
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
              placeholder="全部咨询师"
              allowClear
              style={{ width: 160 }}
              value={filters.counselorId}
              onChange={(v) => setFilters({ ...filters, counselorId: v })}
              options={counselors.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="候补状态"
              allowClear
              style={{ width: 140 }}
              value={filters.waitlistExpired}
              onChange={(v) => setFilters({ ...filters, waitlistExpired: v })}
              options={[
                { value: true, label: '候补超时' },
                { value: false, label: '正常爽约' },
              ]}
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
        title="更新爽约原因"
        open={remarkVisible}
        onCancel={() => setRemarkVisible(false)}
        footer={null}
      >
        <Form form={remarkForm} layout="vertical" onFinish={handleUpdateRemark}>
          <Form.Item label="爽约原因" name="reason">
            <Input.TextArea rows={4} placeholder="请输入爽约原因" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setRemarkVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
