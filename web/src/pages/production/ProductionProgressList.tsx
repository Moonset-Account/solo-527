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
  DatePicker,
  Row,
  Col,
  Card,
  InputNumber,
  Alert,
  Badge,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { ProductionProgress, ProgressStatus, ProgressQueryParams, ProductionNode, Team } from '@/types';
import { progressStatusMap } from '@/types';
import {
  getProgress,
  startProgress,
  pauseProgress,
  completeProgress,
  assignTeam,
  getActiveNodes,
  getActiveTeams,
} from '@/api/production';

const progressStatusColorMap: Record<ProgressStatus, string> = {
  pending: 'default',
  in_progress: 'processing',
  completed: 'success',
  paused: 'warning',
  delayed: 'error',
  skipped: 'purple',
  cancelled: 'default',
};

const { RangePicker } = DatePicker;

const ProductionProgressList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductionProgress[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<ProgressQueryParams>({});
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ProductionProgress | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<ProductionProgress | null>(null);
  const [nodes, setNodes] = useState<{ label: string; value: string }[]>([]);
  const [teams, setTeams] = useState<{ label: string; value: string }[]>([]);
  const [delayedList, setDelayedList] = useState<ProductionProgress[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [searchForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [completeForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProgress({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取生产进度列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  const fetchDelayed = useCallback(async () => {
    try {
      const res = await getProgress({ status: 'delayed', page: 1, pageSize: 100 });
      const res2 = await getProgress({ status: 'in_progress', page: 1, pageSize: 100 });
      const warningItems = [...(res.list || []), ...(res2.list || []).filter((item: ProductionProgress) => {
        if (!item.endTime) return false;
        return dayjs().isAfter(dayjs(item.endTime).subtract(2, 'hour'));
      })];
      setDelayedList(warningItems.slice(0, 5));
    } catch (error) {
      console.error('获取延误列表失败', error);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [nodesRes, teamsRes] = await Promise.all([
        getActiveNodes(),
        getActiveTeams(),
      ]);
      setNodes(
        (nodesRes || []).map((n: ProductionNode) => ({ label: n.nodeName, value: n.id }))
      );
      setTeams(
        (teamsRes || []).map((t: Team) => ({ label: t.teamName, value: t.id }))
      );
    } catch (error) {
      console.error('获取下拉数据失败', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchDropdowns();
    fetchDelayed();
  }, [fetchDropdowns, fetchDelayed]);

  const handleSearch = async (values: any) => {
    const params: ProgressQueryParams = { ...values };
    if (values.createdAt && values.createdAt.length === 2) {
      params.startDate = values.createdAt[0]?.format('YYYY-MM-DD');
      params.endDate = values.createdAt[1]?.format('YYYY-MM-DD');
      delete (params as any).createdAt;
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

  const handleStart = async (record: ProductionProgress) => {
    try {
      await startProgress(record.id);
      message.success('开始成功');
      fetchData();
      fetchDelayed();
    } catch (error) {
      message.error('开始失败');
    }
  };

  const handlePause = async (record: ProductionProgress) => {
    try {
      await pauseProgress(record.id);
      message.success('暂停成功');
      fetchData();
      fetchDelayed();
    } catch (error) {
      message.error('暂停失败');
    }
  };

  const handleComplete = (record: ProductionProgress) => {
    setCompleteTarget(record);
    completeForm.setFieldsValue({
      completedQuantity: record.plannedQuantity || 0,
    });
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!completeTarget) return;
    try {
      const values = await completeForm.validateFields();
      await completeProgress(completeTarget.id, { completedQuantity: values.completedQuantity });
      message.success('完成成功');
      setCompleteModalOpen(false);
      setCompleteTarget(null);
      completeForm.resetFields();
      fetchData();
      fetchDelayed();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error('完成失败');
    }
  };

  const handleAssignTeam = (record: ProductionProgress) => {
    setAssignTarget(record);
    assignForm.setFieldsValue({ teamId: record.teamId });
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!assignTarget) return;
    try {
      const values = await assignForm.validateFields();
      await assignTeam(assignTarget.id, { teamId: values.teamId });
      message.success('分配成功');
      setAssignModalOpen(false);
      setAssignTarget(null);
      assignForm.resetFields();
      fetchData();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error('分配失败');
    }
  };

  const calculateDuration = (start: Date | string | undefined, end: Date | string | undefined) => {
    if (!start) return '-';
    const startT = dayjs(start);
    const endT = end ? dayjs(end) : dayjs();
    const diff = endT.diff(startT, 'minute');
    if (diff < 60) return `${diff}分钟`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const renderActions = (record: ProductionProgress) => {
    const actions: React.ReactNode[] = [];
    if (record.status === 'pending') {
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
    }
    if (record.status === 'in_progress') {
      actions.push(
        <Button
          key="pause"
          size="small"
          type="link"
          icon={<PauseCircleOutlined />}
          onClick={() => handlePause(record)}
        >
          暂停
        </Button>
      );
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
    if (record.status === 'paused') {
      actions.push(
        <Button
          key="resume"
          size="small"
          type="link"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStart(record)}
        >
          继续
        </Button>
      );
    }
    actions.push(
      <Button
        key="assign"
        size="small"
        type="link"
        icon={<TeamOutlined />}
        onClick={() => handleAssignTeam(record)}
      >
        分配班组
      </Button>
    );
    return <Space size="small" wrap>{actions}</Space>;
  };

  const columns: ColumnsType<ProductionProgress> = [
    {
      title: '订单号',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
      width: 140,
      render: (val: string, record: ProductionProgress) => val || record.orderId || '-',
    },
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
      width: 120,
    },
    {
      title: '班组',
      dataIndex: ['team', 'teamName'],
      key: 'teamName',
      width: 120,
      render: (val: string) => val || '未分配',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: ProgressStatus) => (
        <Tag color={progressStatusColorMap[status]}>
          {progressStatusMap[status]}
        </Tag>
      ),
    },
    {
      title: '计划数量',
      dataIndex: 'plannedQuantity',
      key: 'plannedQuantity',
      width: 100,
      render: (val: number) => val ?? '-',
    },
    {
      title: '完成数量',
      dataIndex: 'completedQuantity',
      key: 'completedQuantity',
      width: 100,
      render: (val: number) => val ?? 0,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (val: string | Date) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (val: string | Date) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '耗时',
      key: 'duration',
      width: 120,
      render: (_: any, record: ProductionProgress) => calculateDuration(record.startTime, record.endTime),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: ProductionProgress) => renderActions(record),
    },
  ];

  return (
    <div>
      {delayedList.length > 0 && (
        <Card
          style={{ marginBottom: 16, border: '1px solid #ffccc7', background: '#fff1f0' }}
          title={
            <Space>
              <Badge status="error" />
              <span style={{ color: '#cf1322', fontWeight: 500 }}>
                延误预警 ({delayedList.length}条)
              </span>
              <Button
                type="link"
                size="small"
                icon={<WarningOutlined />}
                onClick={() => setShowWarning(!showWarning)}
              >
                {showWarning ? '收起' : '展开'}
              </Button>
            </Space>
          }
          extra={null}
        >
          {showWarning && (
            <Space direction="vertical" style={{ width: '100%' }}>
              {delayedList.map((item) => (
                <Alert
                  key={item.id}
                  type="error"
                  showIcon
                  message={
                    <Space>
                      <span>订单: {item.order?.orderNo || item.orderId}</span>
                      <span>节点: {item.nodeName}</span>
                      <Tag color="error">{progressStatusMap[item.status]}</Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      {item.team?.teamName && <span>班组: {item.team.teamName}</span>}
                      {item.endTime && (
                        <span>
                          计划结束: {dayjs(item.endTime).format('YYYY-MM-DD HH:mm')}
                        </span>
                      )}
                    </Space>
                  }
                />
              ))}
            </Space>
          )}
        </Card>
      )}

      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="orderId" label="订单ID">
                <Select
                  placeholder="请输入或选择订单"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={[]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="请选择状态"
                  options={Object.entries(progressStatusMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="nodeId" label="节点ID">
                <Select
                  placeholder="请选择节点"
                  options={nodes}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="teamId" label="班组ID">
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
              <Form.Item name="createdAt" label="创建日期">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Col>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      <Table<ProductionProgress>
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

      <Modal
        title="分配班组"
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setAssignTarget(null);
          assignForm.resetFields();
        }}
        onOk={handleConfirmAssign}
        okText="确定"
        cancelText="取消"
        width={500}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="teamId"
            label="选择班组"
            rules={[{ required: true, message: '请选择班组' }]}
          >
            <Select
              placeholder="请选择班组"
              options={teams}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          {assignTarget && (
            <div style={{ color: '#666', fontSize: 13 }}>
              当前进度：订单号 {assignTarget.order?.orderNo || assignTarget.orderId} - {assignTarget.nodeName}
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="完成生产进度"
        open={completeModalOpen}
        onCancel={() => {
          setCompleteModalOpen(false);
          setCompleteTarget(null);
          completeForm.resetFields();
        }}
        onOk={handleConfirmComplete}
        okText="确定"
        cancelText="取消"
        width={500}
        destroyOnClose
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item
            name="completedQuantity"
            label="完成数量"
            rules={[{ required: true, message: '请输入完成数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入完成数量" />
          </Form.Item>
          {completeTarget && (
            <div style={{ color: '#666', fontSize: 13 }}>
              计划数量：{completeTarget.plannedQuantity || 0}
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionProgressList;
