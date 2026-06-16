import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  DatePicker,
  Input,
  Form,
  Space,
  Divider,
  Typography,
  message,
  Alert,
} from 'antd';
import {
  DownloadOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  GiftOutlined,
  SolutionOutlined,
  LineChartOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { campsApi, usersApi, exportApi } from '../services/api';
import { useQuery } from '@tanstack/react-query';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

interface ExportConfig {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  filters: {
    date?: boolean;
    status?: { key: string; options: { label: string; value: string }[] };
    handler?: boolean;
    camp?: boolean;
    source?: boolean;
    custom?: { name: string; label: string }[];
  };
  exportFn: (params: any) => void;
}

const ExportPage: React.FC = () => {
  const { data: camps } = useQuery({
    queryKey: ['camps', 'all'],
    queryFn: () => campsApi.list({ pageSize: 100, page: 1 }),
  });

  const { data: operators } = useQuery({
    queryKey: ['users', 'operators'],
    queryFn: usersApi.listOperators,
  });

  const exportConfigs: ExportConfig[] = [
    {
      key: 'members',
      icon: <TeamOutlined style={{ fontSize: 32, color: '#722ED1' }} />,
      title: '会员明细导出',
      description: '按营期、状态、转化来源、销售等条件导出会员详细信息，包含学习进度、掉队状态等。',
      tags: ['时间', '状态', '转化来源', '销售', '营期'],
      filters: {
        date: true,
        camp: true,
        status: {
          key: 'status',
          options: [
            { label: '正常', value: 'active' },
            { label: '已过期', value: 'expired' },
            { label: '已退款', value: 'refunded' },
            { label: '已暂停', value: 'paused' },
          ],
        },
        source: true,
        custom: [{ name: 'salesPerson', label: '销售姓名' }],
      },
      exportFn: exportApi.members,
    },
    {
      key: 'conversion-by-source',
      icon: <LineChartOutlined style={{ fontSize: 32, color: '#13C2C2' }} />,
      title: '转化来源明细',
      description: '根据转化来源（微信群、抖音、小红书等）导出明细，可分析不同渠道的转化效果。',
      tags: ['转化来源', '时间', '营期', '销售'],
      filters: {
        date: true,
        camp: true,
        source: true,
      },
      exportFn: exportApi.conversionBySource,
    },
    {
      key: 'checkins',
      icon: <CheckSquareOutlined style={{ fontSize: 32, color: '#52C41A' }} />,
      title: '打卡记录明细',
      description: '导出打卡记录详情，包含学员、章节、打卡内容、审核状态、审核人等信息。',
      tags: ['时间', '状态', '处理人', '营期'],
      filters: {
        date: true,
        camp: true,
        handler: true,
        status: {
          key: 'status',
          options: [
            { label: '待审核', value: 'pending' },
            { label: '已通过', value: 'approved' },
            { label: '已拒绝', value: 'rejected' },
          ],
        },
      },
      exportFn: exportApi.checkins,
    },
    {
      key: 'refunds',
      icon: <DollarOutlined style={{ fontSize: 32, color: '#FA8C16' }} />,
      title: '退款明细导出',
      description: '导出退款申请记录，包含申请人、金额、状态、适用规则、处理人等详细信息。',
      tags: ['时间', '状态', '处理人', '营期'],
      filters: {
        date: true,
        camp: true,
        handler: true,
        status: {
          key: 'status',
          options: [
            { label: '待处理', value: 'pending' },
            { label: '已同意', value: 'approved' },
            { label: '已拒绝', value: 'rejected' },
            { label: '已完成', value: 'processed' },
          ],
        },
      },
      exportFn: exportApi.refunds,
    },
    {
      key: 'benefits',
      icon: <GiftOutlined style={{ fontSize: 32, color: '#EB2F96' }} />,
      title: '会员权益明细',
      description: '导出会员发放的所有权益记录，包含权益类型、价值、使用状态、过期时间等。',
      tags: ['时间', '类型', '使用状态'],
      filters: {
        date: true,
        status: {
          key: 'isUsed',
          options: [
            { label: '未使用', value: 'false' },
            { label: '已使用', value: 'true' },
          ],
        },
        custom: [
          {
            name: 'type',
            label: '权益类型',
          },
        ],
      },
      exportFn: exportApi.benefits,
    },
    {
      key: 'todos',
      icon: <SolutionOutlined style={{ fontSize: 32, color: '#1890FF' }} />,
      title: '待办事项明细',
      description: '导出所有待办事项记录，包含掉队预警、打卡审核、退款审核等任务的完整信息。',
      tags: ['时间', '状态', '优先级', '处理人', '营期', '类型'],
      filters: {
        date: true,
        camp: true,
        handler: true,
        status: {
          key: 'status',
          options: [
            { label: '待处理', value: 'pending' },
            { label: '处理中', value: 'in_progress' },
            { label: '已完成', value: 'completed' },
            { label: '已取消', value: 'cancelled' },
          ],
        },
        custom: [
          { name: 'type', label: '待办类型' },
          { name: 'priority', label: '优先级' },
        ],
      },
      exportFn: exportApi.todos,
    },
  ];

  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleExport = (config: ExportConfig) => {
    const values = formValues[config.key] || {};
    const params: any = {};

    if (config.filters.date && values.dateRange && values.dateRange.length === 2) {
      const keys = {
        members: ['joinDateStart', 'joinDateEnd'],
        checkins: ['startDate', 'endDate'],
        refunds: ['startDate', 'endDate'],
        benefits: ['createdStart', 'createdEnd'],
        todos: ['createdStart', 'createdEnd'],
        'conversion-by-source': ['startDate', 'endDate'],
      };
      const [startKey, endKey] = (keys as any)[config.key] || ['startDate', 'endDate'];
      params[startKey] = values.dateRange[0].toISOString();
      params[endKey] = values.dateRange[1].toISOString();
    }
    if (config.filters.camp && values.campId) params.campId = values.campId;
    if (config.filters.handler && values.handlerId) params.processedBy = values.handlerId;
    if (config.filters.source && values.conversionSource) params.conversionSource = values.conversionSource;
    if (config.filters.status?.key && values[config.filters.status.key]) {
      params[config.filters.status.key] = values[config.filters.status.key];
    }
    if (config.filters.custom) {
      config.filters.custom.forEach((c) => {
        if (values[c.name]) params[c.name] = values[c.name];
      });
    }
    if (config.key === 'refunds' && values.handlerId) {
      delete params.processedBy;
      params.processedBy = values.handlerId;
    }
    if (config.key === 'checkins' && values.handlerId) {
      params.reviewedBy = values.handlerId;
    }
    if (config.key === 'todos' && values.handlerId) {
      params.assigneeId = values.handlerId;
    }
    if (config.key === 'members') {
      if (values.status) params.status = values.status;
      if (values.isFallingBehind) params.isFallingBehind = values.isFallingBehind;
    }

    message.loading('正在生成导出文件...', 1);
    setTimeout(() => {
      config.exportFn(params);
      message.success('导出文件已生成！');
    }, 500);
  };

  const sourceOptions = [
    { label: '微信群', value: 'wechat_group' },
    { label: '朋友圈', value: 'wechat_moments' },
    { label: '抖音', value: 'douyin' },
    { label: '小红书', value: 'xiaohongshu' },
    { label: '知乎', value: 'zhihu' },
    { label: '转介绍', value: 'referral' },
    { label: '线下', value: 'offline' },
    { label: '其他', value: 'other' },
  ];

  const typeOptions = {
    benefits: [
      { label: '折扣券', value: 'discount' },
      { label: '赠品', value: 'gift' },
      { label: '服务', value: 'service' },
      { label: '其他', value: 'other' },
    ],
    todos: [
      { label: '掉队预警', value: 'fall_behind_warning' },
      { label: '打卡审核', value: 'checkin_review' },
      { label: '退款审核', value: 'refund_review' },
      { label: '自定义', value: 'custom' },
    ],
  };

  const priorityOptions = [
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '紧急', value: 'urgent' },
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="数据导出说明"
        description="所有导出均为 CSV 格式，支持 Excel 打开。可根据实际需要设置筛选条件，未设置条件的将导出全部数据。"
      />

      <Row gutter={[16, 16]}>
        {exportConfigs.map((config) => (
          <Col xs={24} lg={12} key={config.key}>
            <Card
              className="stat-card"
              styles={{ body: { padding: 24 } }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {config.icon}
                  <span>{config.title}</span>
                </div>
              }
              extra={
                <Space>
                  {config.tags.map((t) => (
                    <Tag key={t} color="blue">
                      {t}
                    </Tag>
                  ))}
                </Space>
              }
            >
              <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                {config.description}
              </Paragraph>

              <Form
                layout="vertical"
                initialValues={formValues[config.key] || {}}
                onValuesChange={(changed, all) => {
                  setFormValues({ ...formValues, [config.key]: all });
                }}
                style={{ marginBottom: 16 }}
              >
                <Row gutter={12}>
                  {config.filters.date && (
                    <Col xs={24} md={12}>
                      <Form.Item label="时间范围" name="dateRange">
                        <RangePicker style={{ width: '100%' }} placeholder={['开始', '结束']} />
                      </Form.Item>
                    </Col>
                  )}
                  {config.filters.camp && (
                    <Col xs={24} md={12}>
                      <Form.Item label="营期" name="campId">
                        <Select
                          allowClear
                          placeholder="全部营期"
                          options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))}
                        />
                      </Form.Item>
                    </Col>
                  )}
                  {config.filters.status && (
                    <Col xs={24} md={12}>
                      <Form.Item label="状态" name={config.filters.status.key}>
                        <Select allowClear placeholder="全部状态" options={config.filters.status.options} />
                      </Form.Item>
                    </Col>
                  )}
                  {config.filters.handler && (
                    <Col xs={24} md={12}>
                      <Form.Item label="处理人" name="handlerId">
                        <Select
                          allowClear
                          placeholder="全部处理人"
                          options={operators?.map((o) => ({ value: o.id, label: o.name }))}
                        />
                      </Form.Item>
                    </Col>
                  )}
                  {config.filters.source && (
                    <Col xs={24} md={12}>
                      <Form.Item label="转化来源" name="conversionSource">
                        <Select allowClear placeholder="全部来源" options={sourceOptions} />
                      </Form.Item>
                    </Col>
                  )}
                  {config.filters.custom?.map((c) => (
                    <Col xs={24} md={12} key={c.name}>
                      <Form.Item label={c.label} name={c.name}>
                        {c.name === 'type' && config.key === 'benefits' ? (
                          <Select allowClear placeholder={`全部${c.label}`} options={typeOptions.benefits} />
                        ) : c.name === 'type' && config.key === 'todos' ? (
                          <Select allowClear placeholder={`全部${c.label}`} options={typeOptions.todos} />
                        ) : c.name === 'priority' ? (
                          <Select allowClear placeholder={`全部${c.label}`} options={priorityOptions} />
                        ) : (
                          <Input allowClear placeholder={`输入${c.label}`} />
                        )}
                      </Form.Item>
                    </Col>
                  ))}
                  {config.key === 'members' && (
                    <>
                      <Col xs={24} md={12}>
                        <Form.Item label="是否掉队" name="isFallingBehind">
                          <Select
                            allowClear
                            placeholder="全部"
                            options={[
                              { label: '仅掉队', value: 'true' },
                              { label: '不掉队', value: 'false' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </>
                  )}
                </Row>
              </Form>

              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    onClick={() => setFormValues({ ...formValues, [config.key]: {} })}
                  >
                    清空条件
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    size="large"
                    onClick={() => handleExport(config)}
                  >
                    导出 CSV
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <Card size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={5} style={{ margin: 0 }}>
            <FileExcelOutlined style={{ color: '#52C41A' }} /> 导出字段说明
          </Title>
          <Row gutter={[24, 8]} style={{ marginTop: 8 }}>
            <Col xs={24} md={8}>
              <Text strong>会员明细：</Text> 会员编号、姓名、手机、营期、状态、转化来源、销售、学习进度、是否掉队、入营时间等16+字段
            </Col>
            <Col xs={24} md={8}>
              <Text strong>打卡明细：</Text> 学员、营期、章节、打卡内容、状态、打卡时间、审核人、审核时间、审核备注等
            </Col>
            <Col xs={24} md={8}>
              <Text strong>退款明细：</Text> 学员、营期、适用规则、退款金额、原因、状态、申请时间、处理人、处理备注等
            </Col>
            <Col xs={24} md={8}>
              <Text strong>权益明细：</Text> 会员、权益类型、名称、价值、是否使用、使用时间、过期时间、发放时间等
            </Col>
            <Col xs={24} md={8}>
              <Text strong>待办明细：</Text> 标题、描述、类型、优先级、状态、处理人、关联营期/会员、截止时间等
            </Col>
            <Col xs={24} md={8}>
              <Text strong>转化来源：</Text> 来源名称、营期、会员、销售、来源详情、入营时间、订单金额、会员状态等
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default ExportPage;
