import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { QualityInspection, InspectionResult, QualityQueryParams } from '@/types';
import { inspectionResultMap } from '@/types';
import {
  getInspections,
  createInspection,
  updateInspection,
  deleteInspection,
  getQualityStatistics,
} from '@/api/quality';

const { RangePicker } = DatePicker;

const PASS_RATE_THRESHOLD = 95;

const resultColorMap: Record<InspectionResult, string> = {
  passed: 'success',
  failed: 'error',
  partial: 'warning',
  pending: 'default',
};

const resultIconMap: Record<InspectionResult, React.ReactNode> = {
  passed: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
  partial: <ExclamationCircleOutlined />,
  pending: <WarningOutlined />,
};

const QualityInspections: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QualityInspection[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<QualityQueryParams>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<QualityInspection | null>(null);
  const [statistics, setStatistics] = useState({
    totalInspections: 0,
    overallPassRate: 0,
    passedCount: 0,
    failedCount: 0,
  });
  const [searchForm] = Form.useForm();
  const [inspectionForm] = Form.useForm();
  const [inspectedQuantity, setInspectedQuantity] = useState<number>(0);
  const [passedQuantity, setPassedQuantity] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInspections({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取质检记录失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await getQualityStatistics(queryParams);
      setStatistics({
        totalInspections: res.totalInspections || 0,
        overallPassRate: res.overallPassRate || 0,
        passedCount: res.passedCount || 0,
        failedCount: res.failedCount || 0,
      });
    } catch (error) {
      console.error('获取质检统计失败', error);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleSearch = async (values: any) => {
    const params: QualityQueryParams = { ...values };
    if (values.inspectionTime && values.inspectionTime.length === 2) {
      params.startDate = values.inspectionTime[0]?.format('YYYY-MM-DD');
      params.endDate = values.inspectionTime[1]?.format('YYYY-MM-DD');
      delete (params as any).inspectionTime;
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
    setEditingInspection(null);
    inspectionForm.resetFields();
    setInspectedQuantity(0);
    setPassedQuantity(0);
    inspectionForm.setFieldsValue({
      inspectedQuantity: 0,
      passedQuantity: 0,
      failedQuantity: 0,
      passRate: 0,
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: QualityInspection) => {
    setEditingInspection(record);
    setInspectedQuantity(record.inspectedQuantity || 0);
    setPassedQuantity(record.passedQuantity || 0);
    inspectionForm.setFieldsValue({
      ...record,
      inspectionTime: record.inspectionTime ? dayjs(record.inspectionTime) : undefined,
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInspection(id);
      message.success('删除成功');
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const formData = { ...values };
      if (formData.inspectionTime) {
        formData.inspectionTime = formData.inspectionTime.format('YYYY-MM-DD HH:mm:ss');
      }
      if (editingInspection) {
        await updateInspection(editingInspection.id, formData);
        message.success('更新成功');
      } else {
        await createInspection(formData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingInspection(null);
      inspectionForm.resetFields();
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error(editingInspection ? '更新失败' : '创建失败');
    }
  };

  const calculateFailedQuantity = (inspected: number, passed: number) => {
    return Math.max(0, inspected - passed);
  };

  const calculatePassRate = (inspected: number, passed: number) => {
    if (inspected === 0) return 0;
    return Number(((passed / inspected) * 100).toFixed(2));
  };

  const handleQuantityChange = (field: 'inspected' | 'passed', value: number) => {
    const newInspected = field === 'inspected' ? Number(value) || 0 : inspectedQuantity;
    const newPassed = field === 'passed' ? Math.min(Number(value) || 0, newInspected) : passedQuantity;

    if (field === 'inspected') {
      setInspectedQuantity(newInspected);
      if (newPassed > newInspected) {
        setPassedQuantity(newInspected);
        inspectionForm.setFieldsValue({ passedQuantity: newInspected });
      }
    } else {
      setPassedQuantity(newPassed);
    }

    const failed = calculateFailedQuantity(newInspected, field === 'passed' ? newPassed : passedQuantity);
    const passRate = calculatePassRate(newInspected, field === 'passed' ? newPassed : passedQuantity);

    inspectionForm.setFieldsValue({
      failedQuantity: failed,
      passRate,
    });
  };

  const hasLowPassRate = data.some((item) => {
    const rate = item.passRate ?? calculatePassRate(item.inspectedQuantity, item.passedQuantity);
    return rate < PASS_RATE_THRESHOLD;
  });

  const columns: ColumnsType<QualityInspection> = [
    {
      title: '订单号',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
      width: 140,
      fixed: 'left',
      render: (val: string, record: QualityInspection) => val || record.orderId || '-',
    },
    {
      title: '质检类型',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      width: 100,
    },
    {
      title: '检验项',
      dataIndex: 'inspectionItem',
      key: 'inspectionItem',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '抽检数',
      dataIndex: 'inspectedQuantity',
      key: 'inspectedQuantity',
      width: 80,
    },
    {
      title: '合格数',
      dataIndex: 'passedQuantity',
      key: 'passedQuantity',
      width: 80,
      render: (val: number) => <span style={{ color: '#52c41a' }}>{val}</span>,
    },
    {
      title: '不合格数',
      dataIndex: 'failedQuantity',
      key: 'failedQuantity',
      width: 90,
      render: (val: number) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '合格率',
      key: 'passRate',
      width: 180,
      render: (_: any, record: QualityInspection) => {
        const rate = record.passRate ?? calculatePassRate(record.inspectedQuantity, record.passedQuantity);
        const isLow = rate < PASS_RATE_THRESHOLD;
        return (
          <Space direction="vertical" style={{ width: '100%' }} size={2}>
            <Progress
              percent={rate}
              size="small"
              status={isLow ? 'exception' : rate === 100 ? 'success' : 'active'}
              strokeColor={isLow ? '#ff4d4f' : '#52c41a'}
            />
            <span
              style={{
                color: isLow ? '#ff4d4f' : '#52c41a',
                fontWeight: isLow ? 'bold' : 500,
                fontSize: 12,
              }}
            >
              {rate.toFixed(2)}%
              {isLow && <WarningOutlined style={{ marginLeft: 4 }} />}
            </span>
          </Space>
        );
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result: InspectionResult) => (
        <Tag color={resultColorMap[result]} icon={resultIconMap[result]}>
          {inspectionResultMap[result]}
        </Tag>
      ),
    },
    {
      title: '检验员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 90,
      render: (val: string) => val || '-',
    },
    {
      title: '检验时间',
      dataIndex: 'inspectionTime',
      key: 'inspectionTime',
      width: 160,
      render: (val: string | Date) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: QualityInspection) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该质检记录？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总质检次数"
              value={statistics.totalInspections}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总合格率"
              value={statistics.overallPassRate}
              precision={2}
              valueStyle={{
                color: statistics.overallPassRate < PASS_RATE_THRESHOLD ? '#ff4d4f' : '#52c41a',
                fontSize: 24,
                fontWeight: 'bold',
              }}
              suffix="%"
              prefix={statistics.overallPassRate < PASS_RATE_THRESHOLD && <WarningOutlined />}
            />
            <Progress
              percent={statistics.overallPassRate}
              size="small"
              status={statistics.overallPassRate < PASS_RATE_THRESHOLD ? 'exception' : 'success'}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="通过数"
              value={statistics.passedCount}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="未通过数"
              value={statistics.failedCount}
              valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {hasLowPassRate && (
        <Alert
          message="合格率预警"
          description={`当前列表中存在合格率低于 ${PASS_RATE_THRESHOLD}% 的质检记录，请关注！`}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
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
                <Input placeholder="请输入订单ID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="result" label="结果">
                <Select
                  placeholder="请选择结果"
                  options={Object.entries(inspectionResultMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="inspectionType" label="质检类型">
                <Input placeholder="请输入质检类型" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="inspector" label="检验员">
                <Input placeholder="请输入检验员" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="inspectionTime" label="日期范围">
                <RangePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="订单号/检验项" allowClear />
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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增质检记录</Button>
        </Space>
      </div>

      <Table<QualityInspection>
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
        scroll={{ x: 1500 }}
        rowClassName={(record) => {
          const rate = record.passRate ?? calculatePassRate(record.inspectedQuantity, record.passedQuantity);
          if (rate < PASS_RATE_THRESHOLD && record.inspectedQuantity > 0) {
            return 'ant-table-row-pass-rate-warning';
          }
          return '';
        }}
      />

      <style>{`
        .ant-table-row-pass-rate-warning > td {
          background-color: #fff2f0 !important;
        }
      `}</style>

      <Modal
        title={editingInspection ? '编辑质检记录' : '新增质检记录'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        width={800}
        destroyOnClose
        footer={null}
      >
        <Form
          form={inspectionForm}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderId"
                label="订单ID"
                rules={[{ required: true, message: '请输入订单ID' }]}
              >
                <Input placeholder="请输入订单ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inspectionType"
                label="质检类型"
                rules={[{ required: true, message: '请输入质检类型' }]}
              >
                <Input placeholder="例如：外观检测/尺寸检测/色差检测" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="inspectionItem" label="检验项">
                <Input placeholder="请输入具体检验项" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="inspectedQuantity"
                label="抽检数量"
                rules={[{ required: true, message: '请输入抽检数量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="抽检数量"
                  onChange={(val) => handleQuantityChange('inspected', Number(val) || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="passedQuantity"
                label="合格数量"
                rules={[{ required: true, message: '请输入合格数量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="合格数量"
                  onChange={(val) => handleQuantityChange('passed', Number(val) || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="failedQuantity"
                label="不合格数量"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="自动计算=抽检-合格"
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="passRate"
                label="合格率(%)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="自动计算"
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="result"
                label="检验结果"
                rules={[{ required: true, message: '请选择检验结果' }]}
              >
                <Select
                  placeholder="请选择检验结果"
                  options={Object.entries(inspectionResultMap).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="inspector" label="检验员">
                <Input placeholder="请输入检验员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inspectionTime" label="检验时间">
                <DatePicker style={{ width: '100%' }} showTime placeholder="请选择检验时间" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="defectDescription" label="缺陷描述">
            <Input.TextArea rows={3} placeholder="请描述发现的缺陷（如有）" />
          </Form.Item>
          <Form.Item name="handlingSuggestion" label="处理建议">
            <Input.TextArea rows={3} placeholder="请输入处理建议（如有）" />
          </Form.Item>
          <Row justify="end">
            <Col>
              <Space>
                <Button onClick={() => setFormModalOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit">
                  {editingInspection ? '更新' : '创建'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default QualityInspections;
