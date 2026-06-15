import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Space,
  Modal,
  Form,
  DatePicker,
  Drawer,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { request } from '../api/client';
import { CONVERSION } from '../api/endpoints';
import {
  REPORT_TYPE,
  REPORT_TYPE_OPTIONS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import {
  formatMoney,
  formatDate,
  formatPercent,
} from '../utils/format';
import dayjs from 'dayjs';

const SummaryCards = ({ report }) => {
  if (!report) return null;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={8} lg={4}>
        <Card size="small">
          <Statistic
            title="总预约"
            value={report.total_bookings ?? 0}
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} lg={4}>
        <Card size="small">
          <Statistic
            title="到店率"
            value={report.arrival_rate ?? 0}
            suffix="%"
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} lg={4}>
        <Card size="small">
          <Statistic
            title="总营收"
            value={report.total_revenue ?? 0}
            formatter={(v) => formatMoney(v)}
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} lg={4}>
        <Card size="small">
          <Statistic
            title="新会员"
            value={report.new_memberships ?? 0}
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} lg={4}>
        <Card size="small">
          <Statistic
            title="会员转化率"
            value={report.membership_conversion_rate ?? 0}
            suffix="%"
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} lg={4}>
        <Card size="small">
          <Statistic
            title="客单价"
            value={report.average_order_value ?? 0}
            formatter={(v) => formatMoney(v)}
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

const ReportDetailDrawer = ({ open, report, onClose }) => {
  if (!report) return null;

  return (
    <Drawer
      title={`报表详情 - ${getLabelByValue(REPORT_TYPE_OPTIONS, report.report_type)} ${formatDate(report.report_date)}`}
      open={open}
      onClose={onClose}
      width={640}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card size="small">
            <Statistic title="总预约数" value={report.total_bookings ?? 0} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic title="总到店数" value={report.total_arrivals ?? 0} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="到店率"
              value={report.arrival_rate ?? 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic title="总服务数" value={report.total_services ?? 0} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="服务完成率"
              value={report.service_completion_rate ?? 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic title="总支付数" value={report.total_payments ?? 0} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="支付率"
              value={report.payment_rate ?? 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic title="新会员数" value={report.new_memberships ?? 0} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="会员转化率"
              value={report.membership_conversion_rate ?? 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="总营收"
              value={report.total_revenue ?? 0}
              formatter={(v) => formatMoney(v)}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="会员营收"
              value={report.membership_revenue ?? 0}
              formatter={(v) => formatMoney(v)}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="服务营收"
              value={report.service_revenue ?? 0}
              formatter={(v) => formatMoney(v)}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="客单价"
              value={report.average_order_value ?? 0}
              formatter={(v) => formatMoney(v)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="收银差异"
              value={report.cashier_discrepancies ?? 0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="已解决差异"
              value={report.resolved_discrepancies ?? 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="未解决差异"
              value={report.unresolved_discrepancies ?? 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
    </Drawer>
  );
};

const GenerateReportModal = ({ open, reportType, onClose, onSuccess }) => {
  const [form] = Form.useForm();

  const generateMutation = useMutation({
    mutationFn: (values) => {
      const endpointMap = {
        [REPORT_TYPE.DAILY]: CONVERSION.REPORTS + 'generate_daily/',
        [REPORT_TYPE.WEEKLY]: CONVERSION.REPORTS + 'generate_weekly/',
        [REPORT_TYPE.MONTHLY]: CONVERSION.REPORTS + 'generate_monthly/',
      };
      const endpoint = endpointMap[reportType];
      return request.post(endpoint, values);
    },
    onSuccess: () => {
      message.success('报表生成成功');
      onSuccess();
      onClose();
      form.resetFields();
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        report_date: values.report_date?.format('YYYY-MM-DD'),
      };
      generateMutation.mutate(payload);
    } catch {}
  };

  const typeLabel = getLabelByValue(REPORT_TYPE_OPTIONS, reportType);

  return (
    <Modal
      title={`生成${typeLabel}`}
      open={open}
      onOk={handleSubmit}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      confirmLoading={generateMutation.isPending}
      destroyOnClose
      width={400}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="report_date"
          label="报表日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ReportPage = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateType, setGenerateType] = useState(null);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['conversion-reports', typeFilter, dateRange],
    queryFn: () => {
      const params = {};
      if (typeFilter) params.report_type = typeFilter;
      if (dateRange?.[0]) params.report_date_after = dateRange[0];
      if (dateRange?.[1]) params.report_date_before = dateRange[1];
      return request.get(CONVERSION.REPORTS, params);
    },
  });

  const reports = reportsData?.results || reportsData || [];
  const latestReport = reports.length > 0 ? reports[0] : null;

  const handleViewDetail = (record) => {
    setCurrentReport(record);
    setDrawerOpen(true);
  };

  const handleOpenGenerate = (type) => {
    setGenerateType(type);
    setGenerateModalOpen(true);
  };

  const columns = [
    {
      title: '报表类型',
      dataIndex: 'report_type',
      key: 'report_type',
      render: (v) => (
        <Tag color={getColorByValue(REPORT_TYPE_OPTIONS, v)}>
          {getLabelByValue(REPORT_TYPE_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '报表日期',
      dataIndex: 'report_date',
      key: 'report_date',
      render: (v) => formatDate(v),
      sorter: (a, b) => dayjs(a.report_date).unix() - dayjs(b.report_date).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: '总预约',
      dataIndex: 'total_bookings',
      key: 'total_bookings',
      sorter: (a, b) => (a.total_bookings || 0) - (b.total_bookings || 0),
    },
    {
      title: '总到店',
      dataIndex: 'total_arrivals',
      key: 'total_arrivals',
      sorter: (a, b) => (a.total_arrivals || 0) - (b.total_arrivals || 0),
    },
    {
      title: '到店率',
      dataIndex: 'arrival_rate',
      key: 'arrival_rate',
      render: (v) => formatPercent(v),
      sorter: (a, b) => (a.arrival_rate || 0) - (b.arrival_rate || 0),
    },
    {
      title: '总服务',
      dataIndex: 'total_services',
      key: 'total_services',
      sorter: (a, b) => (a.total_services || 0) - (b.total_services || 0),
    },
    {
      title: '服务完成率',
      dataIndex: 'service_completion_rate',
      key: 'service_completion_rate',
      render: (v) => formatPercent(v),
    },
    {
      title: '总支付',
      dataIndex: 'total_payments',
      key: 'total_payments',
      sorter: (a, b) => (a.total_payments || 0) - (b.total_payments || 0),
    },
    {
      title: '支付率',
      dataIndex: 'payment_rate',
      key: 'payment_rate',
      render: (v) => formatPercent(v),
    },
    {
      title: '新会员',
      dataIndex: 'new_memberships',
      key: 'new_memberships',
      sorter: (a, b) => (a.new_memberships || 0) - (b.new_memberships || 0),
    },
    {
      title: '会员转化率',
      dataIndex: 'membership_conversion_rate',
      key: 'membership_conversion_rate',
      render: (v) => formatPercent(v),
    },
    {
      title: '总营收',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (v) => formatMoney(v),
      sorter: (a, b) => (a.total_revenue || 0) - (b.total_revenue || 0),
    },
    {
      title: '会员营收',
      dataIndex: 'membership_revenue',
      key: 'membership_revenue',
      render: (v) => formatMoney(v),
    },
    {
      title: '服务营收',
      dataIndex: 'service_revenue',
      key: 'service_revenue',
      render: (v) => formatMoney(v),
    },
    {
      title: '客单价',
      dataIndex: 'average_order_value',
      key: 'average_order_value',
      render: (v) => formatMoney(v),
    },
    {
      title: '收银差异',
      dataIndex: 'cashier_discrepancies',
      key: 'cashier_discrepancies',
      render: (v) => v ?? 0,
    },
    {
      title: '已解决',
      dataIndex: 'resolved_discrepancies',
      key: 'resolved_discrepancies',
      render: (v) => v ?? 0,
    },
    {
      title: '未解决',
      dataIndex: 'unresolved_discrepancies',
      key: 'unresolved_discrepancies',
      render: (v) => (
        <span style={{ color: v > 0 ? '#ff4d4f' : undefined }}>
          {v ?? 0}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div className="page-title">转化报表</div>
          <div className="page-description">查看转化数据报表</div>
        </div>
        <Space>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => handleOpenGenerate(REPORT_TYPE.DAILY)}
          >
            生成日报
          </Button>
          <Button
            icon={<CalendarOutlined />}
            onClick={() => handleOpenGenerate(REPORT_TYPE.WEEKLY)}
          >
            生成周报
          </Button>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => handleOpenGenerate(REPORT_TYPE.MONTHLY)}
          >
            生成月报
          </Button>
        </Space>
      </div>

      <SummaryCards report={latestReport} />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="报表类型"
            allowClear
            style={{ width: 150 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={REPORT_TYPE_OPTIONS}
          />
          <DatePicker.RangePicker
            value={
              dateRange
                ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                : null
            }
            onChange={(dates) =>
              setDateRange(
                dates
                  ? [
                      dates[0]?.format('YYYY-MM-DD'),
                      dates[1]?.format('YYYY-MM-DD'),
                    ]
                  : null
              )
            }
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={isLoading}
          scroll={{ x: 2000 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <ReportDetailDrawer
        open={drawerOpen}
        report={currentReport}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentReport(null);
        }}
      />

      <GenerateReportModal
        open={generateModalOpen}
        reportType={generateType}
        onClose={() => {
          setGenerateModalOpen(false);
          setGenerateType(null);
        }}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ['conversion-reports'] })
        }
      />
    </div>
  );
};

export default ReportPage;
