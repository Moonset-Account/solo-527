import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Form,
  Select,
  Input,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Segmented,
  Calendar,
  Card,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import type { TeamSchedule, ScheduleStatus, ShiftType, ScheduleQueryParams, Team } from '@/types';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  startSchedule,
  completeSchedule,
  cancelSchedule,
  getActiveTeams,
} from '@/api/production';

const scheduleStatusMap: Record<ScheduleStatus, string> = {
  scheduled: '待执行',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const scheduleStatusColorMap: Record<ScheduleStatus, string> = {
  scheduled: 'default',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'error',
};

const shiftMap: Record<ShiftType, string> = {
  morning: '早班',
  afternoon: '中班',
  night: '晚班',
  overtime: '加班',
};

const shiftColorMap: Record<ShiftType, string> = {
  morning: 'gold',
  afternoon: 'blue',
  night: 'purple',
  overtime: 'red',
};

const { RangePicker } = DatePicker;

type ViewMode = 'list' | 'calendar';

const TeamScheduleList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TeamSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<ScheduleQueryParams>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeamSchedule | null>(null);
  const [teams, setTeams] = useState<{ label: string; value: string }[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSchedules({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取班组排期列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await getActiveTeams();
      setTeams(
        (res || []).map((t: Team) => ({ label: t.teamName, value: t.id }))
      );
    } catch (error) {
      console.error('获取班组列表失败', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleSearch = async (values: any) => {
    const params: ScheduleQueryParams = { ...values };
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
      params.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
      delete (params as any).dateRange;
    }
    setQueryParams(params);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({});
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    form.setFieldsValue({
      shift: 'morning',
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: TeamSchedule) => {
    setEditingSchedule(record);
    form.setFieldsValue({
      ...record,
      scheduleDate: record.scheduleDate ? dayjs(record.scheduleDate) : undefined,
      startTime: record.startTime ? dayjs(record.startTime) : undefined,
      endTime: record.endTime ? dayjs(record.endTime) : undefined,
    });
    setFormModalOpen(true);
  };

  const handleStart = async (record: TeamSchedule) => {
    try {
      await startSchedule(record.id);
      message.success('开始成功');
      fetchData();
    } catch (error) {
      message.error('开始失败');
    }
  };

  const handleComplete = async (record: TeamSchedule) => {
    try {
      await completeSchedule(record.id);
      message.success('完成成功');
      fetchData();
    } catch (error) {
      message.error('完成失败');
    }
  };

  const handleCancel = async (record: TeamSchedule) => {
    try {
      await cancelSchedule(record.id);
      message.success('取消成功');
      fetchData();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = { ...values };
      if (submitData.scheduleDate) {
        submitData.scheduleDate = submitData.scheduleDate.format('YYYY-MM-DD');
      }
      if (submitData.startTime) {
        submitData.startTime = submitData.startTime.format('YYYY-MM-DD HH:mm:ss');
      }
      if (submitData.endTime) {
        submitData.endTime = submitData.endTime.format('YYYY-MM-DD HH:mm:ss');
      }
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, submitData);
        message.success('更新成功');
      } else {
        await createSchedule(submitData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingSchedule(null);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(editingSchedule ? '更新失败' : '创建失败');
    }
  };

  const renderActions = (record: TeamSchedule) => {
    const actions: React.ReactNode[] = [];
    if (record.status === 'scheduled') {
      actions.push(
        <Button
          key="start"
          size="small"
          type="link"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStart(record)}
        >
          开始
        </Button>
      );
      actions.push(
        <Button
          key="edit"
          size="small"
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      );
    }
    if (record.status === 'in_progress') {
      actions.push(
        <Button
          key="complete"
          size="small"
          type="link"
          icon={<CheckCircleOutlined />}
          onClick={() => handleComplete(record)}
        >
          完成
        </Button>
      );
    }
    if (record.status === 'scheduled' || record.status === 'in_progress') {
      actions.push(
        <Button
          key="cancel"
          size="small"
          type="link"
          danger
          icon={<CloseCircleOutlined />}
          onClick={() => handleCancel(record)}
        >
          取消
        </Button>
      );
    }
    if (record.status === 'completed' || record.status === 'cancelled') {
      actions.push(
        <Button
          key="view"
          size="small"
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          查看
        </Button>
      );
    }
    return <Space size="small" wrap>{actions}</Space>;
  };

  const columns: ColumnsType<TeamSchedule> = [
    {
      title: '班组',
      dataIndex: ['team', 'teamName'],
      key: 'teamName',
      width: 120,
      render: (val: string, record: TeamSchedule) => val || record.teamId || '-',
    },
    {
      title: '任务名',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 150,
      render: (val: string) => val || '-',
    },
    {
      title: '排期日期',
      dataIndex: 'scheduleDate',
      key: 'scheduleDate',
      width: 110,
      render: (val: string | Date) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 90,
      render: (shift: ShiftType) => (
        <Tag color={shiftColorMap[shift]}>{shiftMap[shift]}</Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 140,
      render: (val: string | Date) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 140,
      render: (val: string | Date) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '计划数量',
      dataIndex: 'plannedQuantity',
      key: 'plannedQuantity',
      width: 100,
      render: (val: number) => val ?? '-',
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 100,
      render: (val: number) => val ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: ScheduleStatus) => (
        <Tag color={scheduleStatusColorMap[status]}>
          {scheduleStatusMap[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: TeamSchedule) => renderActions(record),
    },
  ];

  const getListData = (value: Dayjs) => {
    const listData = data.filter((item) => {
      if (!item.scheduleDate) return false;
      return dayjs(item.scheduleDate).isSame(value, 'day');
    });
    return listData.map((item) => ({
      type: scheduleStatusColorMap[item.status],
      content: `${item.team?.teamName || item.teamId} - ${item.taskName || '未命名'}`,
    }));
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.slice(0, 3).map((item, idx) => (
          <li key={idx} style={{ fontSize: 12, lineHeight: '18px', marginBottom: 2 }}>
            <Badge
              status={item.type as any}
              text={<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 'calc(100% - 14px)' }}>{item.content}</span>}
            />
          </li>
        ))}
        {listData.length > 3 && (
          <li style={{ fontSize: 12, color: '#999' }}>+{listData.length - 3} 更多</li>
        )}
      </ul>
    );
  };

  const cellRender = (current: Dayjs, info: any) => {
    if (info.type === 'date') {
      return dateCellRender(current);
    }
    return info.originNode;
  };

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="teamId" label="班组">
                <Select
                  placeholder="请选择班组"
                  options={teams}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="orderId" label="订单ID">
                <Input placeholder="请输入订单ID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="请选择状态"
                  options={Object.entries(scheduleStatusMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="shift" label="班次">
                <Select
                  placeholder="请选择班次"
                  options={Object.entries(shiftMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="dateRange" label="日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="space-between" align="middle">
            <Col>
              <Segmented
                value={viewMode}
                onChange={(v) => setViewMode(v as ViewMode)}
                options={[
                  { value: 'list', label: <span><UnorderedListOutlined /> 列表视图</span> },
                  { value: 'calendar', label: <span><CalendarOutlined /> 日历视图</span> },
                ]}
              />
            </Col>
            <Col>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增排期</Button>
        </Space>
      </div>

      {viewMode === 'list' ? (
        <Table<TeamSchedule>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t: number) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      ) : (
        <Card>
          <Calendar
            cellRender={cellRender}
            style={{ background: '#fff' }}
          />
        </Card>
      )}

      <Modal
        title={editingSchedule ? '编辑班组排期' : '新增班组排期'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamId"
                label="班组"
                rules={[{ required: true, message: '请选择班组' }]}
              >
                <Select
                  placeholder="请选择班组"
                  options={teams}
                  showSearch
                  optionFilterProp="label"
                  disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="orderId"
                label="订单ID"
              >
                <Input placeholder="请输入订单ID" disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="taskName"
                label="任务名"
              >
                <Input placeholder="请输入任务名" disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="scheduleDate"
                label="排期日期"
                rules={[{ required: true, message: '请选择排期日期' }]}
              >
                <DatePicker style={{ width: '100%' }} disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="shift"
                label="班次"
                rules={[{ required: true, message: '请选择班次' }]}
              >
                <Select
                  placeholder="请选择班次"
                  options={Object.entries(shiftMap).map(([value, label]) => ({ value, label }))}
                  disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
              >
                <DatePicker showTime style={{ width: '100%' }} disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="endTime"
                label="结束时间"
              >
                <DatePicker showTime style={{ width: '100%' }} disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="plannedQuantity"
                label="计划数量"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入计划数量" disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="remark"
                label="备注"
              >
                <Input.TextArea rows={3} placeholder="请输入备注" disabled={editingSchedule?.status === 'completed' || editingSchedule?.status === 'cancelled'} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamScheduleList;
