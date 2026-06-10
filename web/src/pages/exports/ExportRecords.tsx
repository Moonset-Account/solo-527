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
  Row,
  Col,
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type {
  ExportRecord,
  ExportType,
  ExportFormat,
  ExportRecordQueryParams,
} from '@/types';
import {
  getExportRecords,
} from '@/api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const exportTypeMap: Record<ExportType, string> = {
  order: '订单',
  production: '生产',
  material: '耗材',
  quality: '质检',
  customer: '客户',
  other: '其他',
};

const exportFormatMap: Record<ExportFormat, string> = {
  xlsx: 'Excel',
  csv: 'CSV',
  pdf: 'PDF',
};

const exportTypeColorMap: Record<ExportType, string> = {
  order: 'blue',
  production: 'cyan',
  material: 'green',
  quality: 'purple',
  customer: 'orange',
  other: 'default',
};

const exportFormatColorMap: Record<ExportFormat, string> = {
  xlsx: 'green',
  csv: 'blue',
  pdf: 'red',
};

const ExportRecordsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExportRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<ExportRecordQueryParams>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ExportRecord | null>(null);
  const [searchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExportRecords({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取导出记录失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async (values: any) => {
    const params: ExportRecordQueryParams = { ...values };
    if (values.exportTime && values.exportTime.length === 2) {
      params.startDate = values.exportTime[0]?.format('YYYY-MM-DD');
      params.endDate = values.exportTime[1]?.format('YYYY-MM-DD');
      delete (params as any).exportTime;
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

  const handleViewDetail = (record: ExportRecord) => {
    setDetailRecord(record);
    setDetailModalOpen(true);
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const columns: ColumnsType<ExportRecord> = [
    {
      title: '导出名称',
      dataIndex: 'exportName',
      key: 'exportName',
      width: 180,
      render: (val: string) => (
        <Space>
          <FileOutlined />
          <span>{val}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'exportType',
      key: 'exportType',
      width: 100,
      render: (type: ExportType) => (
        <Tag color={exportTypeColorMap[type]}>{exportTypeMap[type]}</Tag>
      ),
    },
    {
      title: '格式',
      dataIndex: 'exportFormat',
      key: 'exportFormat',
      width: 90,
      render: (format: ExportFormat) => (
        <Tag color={exportFormatColorMap[format]}>{exportFormatMap[format]}</Tag>
      ),
    },
    {
      title: '筛选条件',
      dataIndex: 'filterCriteria',
      key: 'filterCriteria',
      width: 250,
      ellipsis: true,
      render: (val: Record<string, any>) => {
        try {
          const jsonStr = JSON.stringify(val);
          return (
            <span title={jsonStr}>
              {truncateText(jsonStr, 80)}
            </span>
          );
        } catch {
          return '-';
        }
      },
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 90,
      render: (val: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{val}</span>
      ),
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 200,
      ellipsis: true,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '操作者',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '操作者角色',
      dataIndex: 'operatorRole',
      key: 'operatorRole',
      width: 100,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '导出时间',
      dataIndex: 'exportTime',
      key: 'exportTime',
      width: 160,
      render: (val: string | Date) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: any, record: ExportRecord) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

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
              <Form.Item name="exportType" label="导出类型">
                <Select
                  placeholder="请选择导出类型"
                  options={Object.entries(exportTypeMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="exportFormat" label="导出格式">
                <Select
                  placeholder="请选择导出格式"
                  options={Object.entries(exportFormatMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="operator" label="操作人">
                <Input placeholder="请输入操作人" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="exportTime" label="时间范围">
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

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      <Table<ExportRecord>
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
        scroll={{ x: 1200 }}
      />

      <Modal
        title="导出记录详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={720}
        destroyOnClose
      >
        {detailRecord && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={12}>
                <p><strong>导出名称：</strong>{detailRecord.exportName}</p>
                <p>
                  <strong>类型：</strong>
                  <Tag color={exportTypeColorMap[detailRecord.exportType]}>
                    {exportTypeMap[detailRecord.exportType]}
                  </Tag>
                </p>
                <p>
                  <strong>格式：</strong>
                  <Tag color={exportFormatColorMap[detailRecord.exportFormat]}>
                    {exportFormatMap[detailRecord.exportFormat]}
                  </Tag>
                </p>
                <p><strong>记录数：</strong>{detailRecord.recordCount}</p>
              </Col>
              <Col xs={12}>
                <p><strong>文件名：</strong>{detailRecord.fileName || '-'}</p>
                <p><strong>操作者：</strong>{detailRecord.operator}</p>
                <p><strong>操作者角色：</strong>{detailRecord.operatorRole || '-'}</p>
                <p><strong>导出时间：</strong>{dayjs(detailRecord.exportTime).format('YYYY-MM-DD HH:mm:ss')}</p>
              </Col>
            </Row>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>筛选条件 (JSON)：</p>
              <TextArea
                value={JSON.stringify(detailRecord.filterCriteria, null, 2)}
                rows={10}
                readOnly
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExportRecordsPage;
