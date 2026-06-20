import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Tag,
  Modal,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { alertsApi } from '@/api';
import type { DeviceAlert, AlertStatus, AlertLevel } from '../../shared/types';
import { ALERT_STATUS_LABELS, ALERT_LEVEL_LABELS } from '../../shared/types';
import { StatusTag } from '@/components/StatusTag';
import { DurationText } from '@/components/DurationText';
import { useUserStore } from '@/store/user';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const AlertList: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);

  const [data, setData] = useState<DeviceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    alert: DeviceAlert | null;
    targetStatus: AlertStatus | null;
  }>({ visible: false, alert: null, targetStatus: null });

  useEffect(() => {
    const status = searchParams.get('status') as AlertStatus | null;
    if (status) {
      form.setFieldsValue({ status });
    }
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = {
        page,
        pageSize,
        status: values.status,
        level: values.level,
        keyword: values.keyword,
      };
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }

      const result = await alertsApi.getList(params);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
    setPage(1);
    loadData();
  };

  const handleStatusChange = (alert: DeviceAlert, targetStatus: AlertStatus) => {
    setStatusModal({
      visible: true,
      alert,
      targetStatus,
    });
  };

  const confirmStatusChange = async () => {
    if (!statusModal.alert || !statusModal.targetStatus || !currentUser) return;

    try {
      const remark = (document.getElementById('status-remark') as HTMLTextAreaElement)?.value || '';
      await alertsApi.updateStatus(
        statusModal.alert.id,
        statusModal.targetStatus,
        remark,
        currentUser.id
      );
      message.success('状态更新成功');
      setStatusModal({ visible: false, alert: null, targetStatus: null });
      loadData();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const getNextStatusOptions = (currentStatus: AlertStatus) => {
    const options: { status: AlertStatus; label: string; icon: React.ReactNode; type: string }[] = [];
    
    if (currentStatus === 'PENDING') {
      options.push({
        status: 'PROCESSING',
        label: '接单处理',
        icon: <PlayCircleOutlined />,
        type: 'primary',
      });
    }
    if (currentStatus === 'PROCESSING') {
      options.push({
        status: 'COMPLETED',
        label: '处理完成',
        icon: <CheckCircleOutlined />,
        type: 'primary',
      });
      options.push({
        status: 'ABNORMAL_CLOSED',
        label: '异常关闭',
        icon: <CloseCircleOutlined />,
        type: 'default',
      });
    }
    if (currentStatus === 'COMPLETED' || currentStatus === 'ABNORMAL_CLOSED') {
      options.push({
        status: 'PENDING',
        label: '重新打开',
        icon: <ReloadOutlined />,
        type: 'default',
      });
    }
    return options;
  };

  const columns: ColumnsType<DeviceAlert> = [
    {
      title: '告警级别',
      dataIndex: 'alertLevel',
      key: 'alertLevel',
      width: 100,
      render: (level: AlertLevel) => <StatusTag type="alertLevel" value={level} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AlertStatus) => <StatusTag type="alertStatus" value={status} />,
    },
    {
      title: '告警标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <a onClick={() => navigate(`/alerts/${record.id}`)} style={{ color: '#262626' }}>
            {text}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '告警类型',
      dataIndex: 'alertType',
      key: 'alertType',
      width: 120,
    },
    {
      title: '处理人',
      dataIndex: 'handlerName',
      key: 'handlerName',
      width: 100,
      render: (text) => text || <Tag color="default">未分配</Tag>,
    },
    {
      title: '响应时长',
      dataIndex: 'responseDurationSeconds',
      key: 'responseDurationSeconds',
      width: 110,
      render: (seconds) => <DurationText seconds={seconds} />,
    },
    {
      title: '告警时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/alerts/${record.id}`)}
          >
            详情
          </Button>
          {getNextStatusOptions(record.status).map((option) => (
            <Button
              key={option.status}
              type={option.type as 'primary' | 'default'}
              size="small"
              icon={option.icon}
              onClick={() => handleStatusChange(record, option.status)}
            >
              {option.label}
            </Button>
          ))}
        </Space>
      ),
    },
  ];

  const statusModalAction = statusModal.targetStatus
    ? ALERT_STATUS_LABELS[statusModal.targetStatus]
    : '';

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="status" label="告警状态">
                <Select placeholder="全部状态" allowClear>
                  {(Object.keys(ALERT_STATUS_LABELS) as AlertStatus[]).map((status) => (
                    <Option key={status} value={status}>
                      {ALERT_STATUS_LABELS[status]}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="level" label="告警级别">
                <Select placeholder="全部级别" allowClear>
                  {(Object.keys(ALERT_LEVEL_LABELS) as AlertLevel[]).map((level) => (
                    <Option key={level} value={level}>
                      {ALERT_LEVEL_LABELS[level]}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="keyword" label="关键词搜索">
                <Input placeholder="标题/设备/描述" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="dateRange" label="时间范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  查询
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={`${statusModalAction} - ${statusModal.alert?.title || ''}`}
        open={statusModal.visible}
        onOk={confirmStatusChange}
        onCancel={() => setStatusModal({ visible: false, alert: null, targetStatus: null })}
        okText="确认"
        cancelText="取消"
      >
        <p style={{ marginBottom: 16 }}>
          当前告警: <strong>{statusModal.alert?.title}</strong>
        </p>
        <p style={{ marginBottom: 16 }}>
          当前状态: <StatusTag type="alertStatus" value={statusModal.alert?.status || 'PENDING'} />
        </p>
        <p style={{ marginBottom: 8 }}>目标状态: {statusModalAction}</p>
        <p style={{ marginBottom: 8 }}>处理备注:</p>
        <TextArea
          id="status-remark"
          rows={4}
          placeholder="请输入处理备注..."
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

export default AlertList;
