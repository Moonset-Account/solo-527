import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Descriptions,
} from 'antd';
import { PlusOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import request from '../../utils/request';
import {
  Report,
  ReportType,
  ReportTypeLabels,
  ReportFormat,
  ReportFormatLabels,
  PageResult,
} from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const ReportDetailModal = ({
  visible,
  report,
  onClose,
}: {
  visible: boolean;
  report: Report | null;
  onClose: () => void;
}) => {
  if (!report) return null;

  const summaryData = report.summaryData || {};
  const summaryItems = Object.entries(summaryData).map(([key, value]) => ({
    key,
    label: key,
    children: typeof value === 'object' ? JSON.stringify(value) : String(value),
  }));

  return (
    <Modal
      title="报表详情"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={700}
    >
      <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="报表标题">{report.title}</Descriptions.Item>
        <Descriptions.Item label="报表类型">
          {ReportTypeLabels[report.type]}
        </Descriptions.Item>
        <Descriptions.Item label="格式">{ReportFormatLabels[report.format]}</Descriptions.Item>
        <Descriptions.Item label="发起人">
          {report.initiator?.name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="生成时间">
          {dayjs(report.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="下载次数">
          {report.downloadCount}
        </Descriptions.Item>
        <Descriptions.Item label="时间范围" span={2}>
          {dayjs(report.startTime).format('YYYY-MM-DD')} ~ {dayjs(report.endTime).format('YYYY-MM-DD')}
        </Descriptions.Item>
        <Descriptions.Item label="数据范围" span={2}>
          {report.dataScope}
        </Descriptions.Item>
        <Descriptions.Item label="统计口径" span={2}>
          {report.statisticalCaliber}
        </Descriptions.Item>
        {report.notes && (
          <Descriptions.Item label="备注" span={2}>
            {report.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      {summaryItems.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>统计数据</div>
          <Descriptions bordered column={2} size="small">
            {summaryItems.slice(0, 10).map((item) => (
              <Descriptions.Item key={item.key} label={item.label}>
                {item.children}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </div>
      )}
    </Modal>
  );
};

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<string>(ReportType.SERVICE_REPURCHASE);
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [form] = Form.useForm();

  const fetchData = async (type?: ReportType) => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        type: type || activeTab,
      };
      const res = await request.get<any, PageResult<Report>>('/reports', { params });
      const result = res as unknown as PageResult<Report>;
      setData(result.data || []);
      setPagination({
        current: result.page || 1,
        pageSize: result.pageSize || 10,
        total: result.total || 0,
      });
    } catch (error) {
      console.error('获取报表列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPagination({ current: 1, pageSize: 10, total: 0 });
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      type: activeTab,
      format: ReportFormat.EXCEL,
    });
    setCreateModalVisible(true);
  };

  const handleCreateOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startTime: values.dateRange?.[0]?.toISOString(),
        endTime: values.dateRange?.[1]?.toISOString(),
        dataScope: values.dataScope || '全部数据',
        statisticalCaliber: values.statisticalCaliber || '按系统默认口径统计',
      };
      delete payload.dateRange;
      await request.post('/reports', payload);
      message.success('报表生成成功');
      setCreateModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('生成报表失败:', error);
    }
  };

  const handleDownload = async (record: Report) => {
    try {
      await request.post(`/reports/${record.id}/download`);
      message.success('下载次数已更新');
      fetchData();
    } catch (error) {
      console.error('下载报表失败:', error);
    }
  };

  const handleViewDetail = (record: Report) => {
    setSelectedReport(record);
    setDetailModalVisible(true);
  };

  const columns: ColumnsType<Report> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: ReportType) => ReportTypeLabels[type] || type,
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '发起人',
      dataIndex: ['initiator', 'name'],
      key: 'initiatorName',
      render: (_, record) => record.initiator?.name || '-',
    },
    {
      title: '统计口径',
      dataIndex: 'statisticalCaliber',
      key: 'statisticalCaliber',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '下载次数',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      render: (value) => value || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: ReportType.SERVICE_REPURCHASE, label: ReportTypeLabels[ReportType.SERVICE_REPURCHASE] },
    { key: ReportType.APPOINTMENT_SUMMARY, label: ReportTypeLabels[ReportType.APPOINTMENT_SUMMARY] },
    { key: ReportType.CUSTOM, label: ReportTypeLabels[ReportType.CUSTOM] },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        tabBarExtraContent={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            生成报表
          </Button>
        }
      />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
            fetchData();
          },
        }}
      />

      <Modal
        title="生成报表"
        open={createModalVisible}
        onOk={handleCreateOk}
        onCancel={() => setCreateModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="报表类型"
            rules={[{ required: true, message: '请选择报表类型' }]}
          >
            <Select placeholder="请选择报表类型">
              {Object.values(ReportType).map((type) => (
                <Option key={type} value={type}>
                  {ReportTypeLabels[type]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="报表标题"
            rules={[{ required: true, message: '请输入报表标题' }]}
          >
            <Input placeholder="请输入报表标题" />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select placeholder="请选择导出格式">
              {Object.values(ReportFormat).map((format) => (
                <Option key={format} value={format}>
                  {ReportFormatLabels[format]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dataScope" label="数据范围">
            <Input placeholder="例如：全部门店、指定门店等" />
          </Form.Item>
          <Form.Item name="statisticalCaliber" label="统计口径">
            <TextArea rows={2} placeholder="请输入统计口径说明" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      <ReportDetailModal
        visible={detailModalVisible}
        report={selectedReport}
        onClose={() => setDetailModalVisible(false)}
      />
    </div>
  );
};

export default ReportsPage;
