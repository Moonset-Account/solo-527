import { useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Select, DatePicker, Space, Modal, Form, message, Dropdown, MenuProps } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DownloadOutlined,
  UserOutlined,
  EyeOutlined,
  MoreOutlined,
  ExceptionOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentApi } from '../../services/api';
import { appointmentStatusLabels, appointmentStatusColors } from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import { UserRole, AppointmentStatus } from '../../types';
import type { Appointment } from '../../types';

const { RangePicker } = DatePicker;

function AppointmentList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [current, setCurrent] = useState<Appointment | null>(null);
  const [form] = Form.useForm();

  const canManage = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.ConsultantManager);
  const canExport = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance || user.role === UserRole.ConsultantManager);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.list({
        page,
        pageSize,
        keyword,
        status,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      if (res.success && res.data) {
        setList(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleExport = async () => {
    try {
      const blob: any = await appointmentApi.export({
        keyword, status,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { }
  };

  const handleAssign = async (values: any) => {
    if (!current) return;
    try {
      const res = await appointmentApi.assignConsultant(current.id, { consultantId: values.consultantId });
      if (res.success) {
        message.success('顾问分配成功');
        setAssignModal(false);
        form.resetFields();
        fetchData();
      }
    } catch { }
  };

  const handleMarkNoShow = async (record: Appointment) => {
    Modal.confirm({
      title: '确认标记为爽约？',
      content: '标记后该预约将进入爽约处理流程',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await appointmentApi.markNoShow(record.id, '系统标记');
          if (res.success) {
            message.success('已标记为爽约');
            fetchData();
          }
        } catch { }
      },
    });
  };

  const getActionMenu = (record: Appointment): MenuProps => ({
    items: [
      canManage && { key: 'assign', label: '分配顾问', icon: <UserOutlined />, onClick: () => { setCurrent(record); setAssignModal(true); } },
      { key: 'noshow', label: '标记爽约', icon: <ExceptionOutlined />, onClick: () => handleMarkNoShow(record), disabled: record.status === AppointmentStatus.NoShow },
    ].filter(Boolean) as MenuProps['items'],
  });

  const columns = [
    { title: '预约编号', dataIndex: 'appointmentNo', width: 160, fixed: 'left' as const },
    { title: '客户', render: (_: any, r: Appointment) => `${r.customerName} · ${r.customerPhone}` },
    { title: '房源', dataIndex: 'spaceName' },
    { title: '看房日期', dataIndex: 'viewingDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD'), width: 120 },
    { title: '时间段', render: (_: any, r: Appointment) => `${r.startTime.substring(0, 5)}-${r.endTime.substring(0, 5)}`, width: 100 },
    { title: '人数', dataIndex: 'personCount', width: 60 },
    { title: '顾问', dataIndex: 'consultantName', width: 100, render: (v: string) => v || <Tag color="orange">未分配</Tag> },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: AppointmentStatus) => <Tag color={appointmentStatusColors[v]}>{appointmentStatusLabels[v]}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', render: (v: string) => dayjs(v).format('MM-DD HH:mm'), width: 120 },
    {
      title: '操作', width: 180, fixed: 'right' as const,
      render: (_: any, r: Appointment) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/admin/appointments/${r.id}`)}>详情</Button>
          <Dropdown menu={getActionMenu(r)}>
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索编号/客户/电话"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={setStatus}
            options={Object.entries(appointmentStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))}
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange as any}
            placeholder={['开始日期', '结束日期']}
          />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Space>
          {canExport && (
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/spaces')}>前往预约</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title="分配顾问"
        open={assignModal}
        onCancel={() => { setAssignModal(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="consultantId" label="选择顾问" rules={[{ required: true, message: '请选择顾问' }]}>
            <Select placeholder="请选择顾问" options={[
              { value: 'test-consultant-id', label: '张顾问 (示例)' },
            ]} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAssignModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认分配</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AppointmentList;
