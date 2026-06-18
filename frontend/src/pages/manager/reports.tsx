import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  DatePicker,
  Input,
  Select,
  Tag,
  message,
  Spin,
  Row,
  Col,
  Descriptions,
  Drawer,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import {
  Report,
  ReportType,
  ReportFormat,
  ApiResponse,
  User,
  PaginatedResponse,
} from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface ReportFormData {
  title: string;
  type: ReportType;
  format?: ReportFormat;
  dataScope: string;
  startTime: Dayjs;
  endTime: Dayjs;
  notes?: string;
}

const reportTypeMap: Record<ReportType, { text: string; color: string; icon: string }> = {
  [ReportType.SERVICE_REPURCHASE]: { text: '服务复购', color: 'blue', icon: '📊' },
  [ReportType.FOSTER_SAFETY]: { text: '寄养安全', color: 'green', icon: '🏠' },
  [ReportType.ADOPTION_STATISTICS]: { text: '领养统计', color: 'magenta', icon: '❤️' },
  [ReportType.HEALTH_STATISTICS]: { text: '健康统计', color: 'cyan', icon: '💊' },
  [ReportType.TRAINING_STATISTICS]: { text: '训练统计', color: 'purple', icon: '🎓' },
  [ReportType.APPOINTMENT_SUMMARY]: { text: '预约汇总', color: 'orange', icon: '📅' },
  [ReportType.CUSTOM]: { text: '自定义', color: 'default', icon: '📝' },
};

const reportFormatMap: Record<ReportFormat, { text: string; color: string }> = {
  [ReportFormat.PDF]: { text: 'PDF', color: 'red' },
  [ReportFormat.EXCEL]: { text: 'Excel', color: 'green' },
  [ReportFormat.CSV]: { text: 'CSV', color: 'blue' },
  [ReportFormat.JSON]: { text: 'JSON', color: 'purple' },
};

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [form] = Form.useForm<ReportFormData>();

  const [filters, setFilters] = useState({
    type: undefined as ReportType | undefined,
    dateRange: null as [Dayjs, Dayjs] | null,
  });

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (filters.type) params.type = filters.type;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startTime = filters.dateRange[0].toISOString();
        params.endTime = filters.dateRange[1].toISOString();
      }

      const res = await request.get<any, ApiResponse<PaginatedResponse<Report>>>('/reports', { params });
      setData(res.data?.list || []);
      setPagination((prev) => ({ ...prev, total: res.data?.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await request.get<any, ApiResponse<User[]>>('/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setFilters({ type: undefined, dateRange: null });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setTimeout(() => fetchData(), 0);
  };

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      format: ReportFormat.EXCEL,
      startTime: dayjs().startOf('month'),
      endTime: dayjs(),
    });
    setIsModalOpen(true);
  };

  const handleViewDetail = async (record: Report) => {
    try {
      const res = await request.get<any, ApiResponse<Report>>(`/reports/${record.id}`);
      setSelectedReport(res.data || record);
      setIsDrawerOpen(true);
    } catch (error) {
      console.error('Failed to fetch report detail:', error);
      setSelectedReport(record);
      setIsDrawerOpen(true);
    }
  };

  const handleDownload = async (record: Report) => {
    try {
      await request.post(`/reports/${record.id}/download`);
      message.success('下载次数已更新');
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      };

      await request.post('/reports', payload);
      message.success('报表生成任务已提交');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.username || '-';

  const columns: ColumnsType<Report> = [
    {
      title: '报表标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '报表类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: ReportType) => {
        const info = reportTypeMap[type] || { text: type, color: 'default', icon: '📄' };
        return (
          <Tag color={info.color}>
            {info.icon} {info.text}
          </Tag>
        );
      },
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 80,
      align: 'center',
      render: (format: ReportFormat) => {
        const info = reportFormatMap[format] || { text: format, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '生成人',
      key: 'initiatorName',
      width: 100,
      render: (_: any, record: Report) => record.initiator?.username || getUserName(record.initiatorId),
    },
    {
      title: '数据范围',
      dataIndex: 'dataScope',
      key: 'dataScope',
      width: 150,
      ellipsis: true,
    },
    {
      title: '统计时间',
      key: 'timeRange',
      width: 200,
      render: (_: any, record: Report) => (
        <span>
          {dayjs(record.startTime).format('YYYY-MM-DD')} ~ {dayjs(record.endTime).format('YYYY-MM-DD')}
        </span>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: '下载次数',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 90,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: Report) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
            下载
          </Button>
        </Space>
      ),
    },
  ];

  const renderSummaryData = (summaryData?: Record<string, any>) => {
    if (!summaryData || Object.keys(summaryData).length === 0) {
      return <Text type="secondary">暂无汇总数据</Text>;
    }
    return (
      <Descriptions column={2} bordered size="small">
        {Object.entries(summaryData).map(([key, value]) => (
          <Descriptions.Item key={key} label={key}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Select
              placeholder="选择报表类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
              options={Object.entries(reportTypeMap).map(([key, val]) => ({
                label: `${val.icon} ${val.text}`,
                value: key,
              }))}
            />
          </Col>
          <Col span={6}>
            <RangePicker
              showTime
              style={{ width: '100%' }}
              value={filters.dateRange as any}
              onChange={(dates) => setFilters((prev) => ({ ...prev, dateRange: dates as [Dayjs, Dayjs] | null }))}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              生成报表
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          scroll={{ x: 1200 }}
        />
      </Space>

      <Modal
        title="生成报表"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        destroyOnClose
        okText="提交生成"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="报表标题"
            rules={[{ required: true, message: '请输入报表标题' }]}
          >
            <Input placeholder="请输入报表标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="报表类型"
                rules={[{ required: true, message: '请选择报表类型' }]}
              >
                <Select
                  placeholder="请选择报表类型"
                  options={Object.entries(reportTypeMap).map(([key, val]) => ({
                    label: `${val.icon} ${val.text}`,
                    value: key,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="format"
                label="导出格式"
                rules={[{ required: true, message: '请选择导出格式' }]}
              >
                <Select
                  placeholder="请选择导出格式"
                  options={Object.entries(reportFormatMap).map(([key, val]) => ({
                    label: val.text,
                    value: key,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name={['startTime', 'endTime']}
            label="统计时间范围"
            rules={[{ required: true, message: '请选择统计时间范围' }]}
          >
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="dataScope"
            label="数据范围说明"
            rules={[{ required: true, message: '请输入数据范围说明' }]}
          >
            <Input placeholder="例如：全部门店、仅朝阳区门店等" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="报表详情"
        width={720}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => selectedReport && handleDownload(selectedReport)}>
              下载
            </Button>
          </Space>
        }
      >
        {selectedReport && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="报表标题" span={2}>
                {selectedReport.title}
              </Descriptions.Item>
              <Descriptions.Item label="报表类型">
                {(() => {
                  const info = reportTypeMap[selectedReport.type];
                  return (
                    <Tag color={info?.color}>
                      {info?.icon} {info?.text}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="导出格式">
                <Tag color={reportFormatMap[selectedReport.format]?.color}>
                  {reportFormatMap[selectedReport.format]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="生成人">
                {selectedReport.initiator?.username || getUserName(selectedReport.initiatorId)}
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {dayjs(selectedReport.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="下载次数" span={2}>
                {selectedReport.downloadCount} 次
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="统计参数" bordered column={1}>
              <Descriptions.Item label="数据范围">{selectedReport.dataScope}</Descriptions.Item>
              <Descriptions.Item label="统计时间">
                {dayjs(selectedReport.startTime).format('YYYY-MM-DD HH:mm:ss')} ~{' '}
                {dayjs(selectedReport.endTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Title level={5} style={{ marginTop: 0 }}>
                📋 统计口径说明
              </Title>
              <Paragraph>
                <Text type="secondary">{selectedReport.statisticalCaliber || '暂无统计口径说明'}</Text>
              </Paragraph>
            </div>

            <div>
              <Title level={5} style={{ marginTop: 0 }}>
                📈 汇总数据
              </Title>
              {renderSummaryData(selectedReport.summaryData)}
            </div>

            {selectedReport.notes && (
              <div>
                <Title level={5} style={{ marginTop: 0 }}>
                  📝 备注
                </Title>
                <Paragraph>
                  <Text type="secondary">{selectedReport.notes}</Text>
                </Paragraph>
              </div>
            )}
          </Space>
        )}
      </Drawer>
    </Spin>
  );
};

export default ReportsPage;
