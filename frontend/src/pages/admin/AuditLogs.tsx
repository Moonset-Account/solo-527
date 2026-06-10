import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Drawer,
  Descriptions,
  Row,
  Col,
  Alert,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  HistoryOutlined,
  UserOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  DiffOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import { formatDateTime } from '@/utils';
import type { AuditLog } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const modelNameLabels: Record<string, string> = {
  user: '用户',
  property: '民宿',
  room: '房型',
  inventory: '房态',
  order: '订单',
  payment: '支付记录',
  tourroute: '导览路线',
  cleaningtask: '清洁任务',
  itineraryversion: '行程版本',
  reminderrule: '提醒规则',
  reminder: '提醒',
};

export default function AuditLogs() {
  const { auditLogs, fetchAuditLogs, isLoading } = useAppStore();

  const [filters, setFilters] = useState({
    action: undefined as 'create' | 'update' | 'delete' | undefined,
    model_name: undefined as string | undefined,
    user_id: undefined as string | undefined,
    search: '',
    date_range: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  });
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = () => {
    const params: Record<string, unknown> = {};
    if (filters.action) params.action = filters.action;
    if (filters.model_name) params.model_name = filters.model_name;
    if (filters.user_id) params.user_id = filters.user_id;
    if (filters.search) params.search = filters.search;
    if (filters.date_range) {
      params.start_date = filters.date_range[0].format('YYYY-MM-DD');
      params.end_date = filters.date_range[1].format('YYYY-MM-DD');
    }
    fetchAuditLogs(params);
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (username?: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <UserOutlined />
          </div>
          <div>
            <div className="font-medium">{username || '未知用户'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const actionConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          create: { color: 'green', icon: <PlusOutlined />, text: '创建' },
          update: { color: 'blue', icon: <EditOutlined />, text: '更新' },
          delete: { color: 'red', icon: <DeleteOutlined />, text: '删除' },
        };
        const config = actionConfig[action] || { color: 'default', icon: null, text: action };
        return (
          <Tag color={config.color}>
            {config.icon}
            <span className="ml-1">{config.text}</span>
          </Tag>
        );
      },
    },
    {
      title: '操作对象',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 140,
      render: (name: string) => (
        <Tag color="blue">{modelNameLabels[name] || name}</Tag>
      ),
    },
    {
      title: '对象ID',
      dataIndex: 'object_id',
      key: 'object_id',
      width: 200,
      render: (id: string) => <code className="text-xs">{id}</code>,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
      render: (ip?: string) => ip || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: AuditLog) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedLog(record);
            setShowDetailDrawer(true);
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  const renderDiffValue = (value: unknown): string => {
    if (value === null || value === undefined) return '空';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">
          <HistoryOutlined className="mr-2" />
          操作日志
        </h1>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="操作类型"
              className="w-full"
              allowClear
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value })}
            >
              <Option value="create">创建</Option>
              <Option value="update">更新</Option>
              <Option value="delete">删除</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="操作对象"
              className="w-full"
              allowClear
              value={filters.model_name}
              onChange={(value) => setFilters({ ...filters, model_name: value })}
            >
              {Object.entries(modelNameLabels).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              className="w-full"
              value={filters.date_range}
              onChange={(dates) =>
                setFilters({ ...filters, date_range: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined })
              }
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索对象ID/内容"
              allowClear
              onSearch={(value) => setFilters({ ...filters, search: value })}
              enterButton={<SearchOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={auditLogs}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条日志`,
          }}
        />
      </Card>

      <Drawer
        title="操作日志详情"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={800}
      >
        {selectedLog && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="操作时间" span={2}>
                {formatDateTime(selectedLog.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">
                {selectedLog.username || '未知用户'}
              </Descriptions.Item>
              <Descriptions.Item label="操作类型">
                {selectedLog.action === 'create' && (
                  <Tag color="green"><PlusOutlined /> 创建</Tag>
                )}
                {selectedLog.action === 'update' && (
                  <Tag color="blue"><EditOutlined /> 更新</Tag>
                )}
                {selectedLog.action === 'delete' && (
                  <Tag color="red"><DeleteOutlined /> 删除</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="操作对象">
                <Tag color="blue">
                  {modelNameLabels[selectedLog.model_name] || selectedLog.model_name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="对象ID" span={2}>
                <code>{selectedLog.object_id}</code>
              </Descriptions.Item>
              {selectedLog.ip_address && (
                <Descriptions.Item label="IP地址">{selectedLog.ip_address}</Descriptions.Item>
              )}
              {selectedLog.user_agent && (
                <Descriptions.Item label="User Agent" span={2}>
                  <div className="text-xs text-gray-500 break-all">
                    {selectedLog.user_agent}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedLog.action === 'create' && selectedLog.new_values && (
              <Card
                title={
                  <Space>
                    <PlusOutlined className="text-green-500" />
                    <span>创建内容</span>
                  </Space>
                }
                size="small"
                className="border-green-200"
              >
                <pre className="bg-green-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </Card>
            )}

            {selectedLog.action === 'delete' && selectedLog.old_values && (
              <Card
                title={
                  <Space>
                    <DeleteOutlined className="text-red-500" />
                    <span>删除内容</span>
                  </Space>
                }
                size="small"
                className="border-red-200"
              >
                <pre className="bg-red-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </Card>
            )}

            {selectedLog.action === 'update' && (
              <Card
                title={
                  <Space>
                    <DiffOutlined className="text-blue-500" />
                    <span>变更详情</span>
                    {selectedLog.field_diffs && (
                      <Badge count={selectedLog.field_diffs.length} />
                    )}
                  </Space>
                }
                size="small"
                className="border-blue-200"
              >
                {selectedLog.field_diffs && selectedLog.field_diffs.length > 0 ? (
                  <Space direction="vertical" className="w-full">
                    {selectedLog.field_diffs.map((diff, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-primary-600 mb-2 flex items-center gap-2">
                          <EditOutlined />
                          {diff.field}
                        </div>
                        <Row gutter={16}>
                          <Col span={12}>
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                              修改前
                            </div>
                            <div className="p-2 bg-red-50 rounded border border-red-200 text-sm font-mono break-all">
                              {diff.diff_html ? (
                                <div dangerouslySetInnerHTML={{ __html: diff.diff_html }} />
                              ) : (
                                renderDiffValue(diff.old_value)
                              )}
                            </div>
                          </Col>
                          <Col span={12}>
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                              修改后
                            </div>
                            <div className="p-2 bg-green-50 rounded border border-green-200 text-sm font-mono break-all">
                              {renderDiffValue(diff.new_value)}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </Space>
                ) : (
                  <Alert
                    message="没有检测到具体的字段变更"
                    type="info"
                    showIcon
                  />
                )}

                {selectedLog.old_values && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">完整原值：</div>
                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">完整新值：</div>
                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowDetailDrawer(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
