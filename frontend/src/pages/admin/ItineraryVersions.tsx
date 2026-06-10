import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  message,
  Drawer,
  Descriptions,
  Popconfirm,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  CopyOutlined,
  DiffOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import {
  formatDateTime,
  ITINERARY_STATUS_LABELS,
  ITINERARY_STATUS_COLORS,
} from '@/utils';
import type { ItineraryVersion, ItineraryStatus } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function ItineraryVersions() {
  const {
    properties,
    itineraryVersions,
    fetchProperties,
    fetchItineraryVersions,
    createItineraryVersion,
    updateItineraryVersion,
    deleteItineraryVersion,
    compareItineraryVersions,
    isLoading,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState<ItineraryVersion | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ItineraryVersion | null>(null);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string, string] | null>(null);
  const [diffResult, setDiffResult] = useState<Array<{
    field: string;
    old_value: unknown;
    new_value: unknown;
  }>>([]);
  const [filters, setFilters] = useState({
    status: undefined as ItineraryStatus | undefined,
    property_id: undefined as string | undefined,
  });
  const [form] = Form.useForm();
  const [contentEditor, setContentEditor] = useState<string>('{}');

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    loadVersions();
  }, [filters]);

  const loadVersions = () => {
    const params: Record<string, unknown> = {};
    if (filters.status) params.status = filters.status;
    if (filters.property_id) params.property_id = filters.property_id;
    fetchItineraryVersions(params);
  };

  const handleSubmit = async (values: Partial<ItineraryVersion>) => {
    try {
      let content: Record<string, unknown> = {};
      try {
        content = JSON.parse(contentEditor);
      } catch {
        message.error('内容格式错误，请输入有效的JSON');
        return;
      }

      const versionData: Partial<ItineraryVersion> = {
        ...values,
        content,
      };

      if (editingVersion) {
        await updateItineraryVersion(editingVersion.id, versionData);
        message.success('版本更新成功');
      } else {
        await createItineraryVersion(versionData);
        message.success('版本创建成功');
      }

      setShowModal(false);
      form.resetFields();
      setEditingVersion(null);
      setContentEditor('{}');
      loadVersions();
    } catch {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItineraryVersion(id);
      message.success('删除成功');
      loadVersions();
    } catch {
      message.error('删除失败');
    }
  };

  const handlePublish = async (version: ItineraryVersion) => {
    try {
      await updateItineraryVersion(version.id, { status: 'published' });
      message.success('已发布');
      loadVersions();
    } catch {
      message.error('操作失败');
    }
  };

  const handleArchive = async (version: ItineraryVersion) => {
    try {
      await updateItineraryVersion(version.id, { status: 'archived' });
      message.success('已归档');
      loadVersions();
    } catch {
      message.error('操作失败');
    }
  };

  const handleCreateNewVersion = async (parent: ItineraryVersion) => {
    try {
      const newVersion: Partial<ItineraryVersion> = {
        property: parent.property,
        name: `${parent.name} (副本)`,
        description: parent.description,
        version_number: `${parseFloat(parent.version_number) + 0.1}`,
        status: 'draft',
        content: parent.content,
        parent_version: parent.id,
      };
      await createItineraryVersion(newVersion);
      message.success('新版本已创建');
      loadVersions();
    } catch {
      message.error('创建失败');
    }
  };

  const handleCompare = async (id1: string, id2: string) => {
    try {
      const result = await compareItineraryVersions(id1, id2);
      setDiffResult(result);
      setCompareVersions([id1, id2]);
      setShowCompareDrawer(true);
    } catch {
      message.error('比较失败');
    }
  };

  const columns = [
    {
      title: '版本名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ItineraryVersion) => (
        <div>
          <div className="flex items-center gap-2">
            <span
              className="font-medium cursor-pointer hover:text-primary-600"
              onClick={() => {
                setSelectedVersion(record);
                setShowDetailDrawer(true);
              }}
            >
              {text}
            </span>
            <Tag color="blue">v{record.version_number}</Tag>
            {record.parent_version && (
              <Tag icon={<HistoryOutlined />} color="default">
                基于其他版本
              </Tag>
            )}
          </div>
          {record.description && (
            <div className="text-sm text-gray-500 mt-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ItineraryStatus) => (
        <Tag className={ITINERARY_STATUS_COLORS[status]}>
          {ITINERARY_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: ItineraryVersion) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DiffOutlined />}
            onClick={() => {
              const otherVersions = itineraryVersions.filter((v) => v.id !== record.id);
              if (otherVersions.length > 0) {
                handleCompare(record.id, otherVersions[0].id);
              } else {
                message.warning('没有其他版本可比较');
              }
            }}
          >
            对比
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCreateNewVersion(record)}
          >
            新建版本
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => handlePublish(record)}
            >
              发布
            </Button>
          )}
          {record.status === 'published' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleArchive(record)}
            >
              归档
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingVersion(record);
              setContentEditor(JSON.stringify(record.content, null, 2));
              form.setFieldsValue(record);
              setShowModal(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个版本吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">
          <BarChartOutlined className="mr-2" />
          行程版本管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingVersion(null);
            form.resetFields();
            setContentEditor('{}');
            form.setFieldsValue({
              status: 'draft',
              version_number: '1.0',
            });
            setShowModal(true);
          }}
        >
          新建版本
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="状态筛选"
              className="w-full"
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {Object.entries(ITINERARY_STATUS_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="选择民宿"
              className="w-full"
              allowClear
              value={filters.property_id}
              onChange={(value) => setFilters({ ...filters, property_id: value })}
            >
              {properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={itineraryVersions}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个版本`,
          }}
        />
      </Card>

      <Modal
        title={editingVersion ? '编辑行程版本' : '新建行程版本'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setEditingVersion(null);
          setContentEditor('{}');
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="property"
            label="所属民宿"
            rules={[{ required: true, message: '请选择民宿' }]}
          >
            <Select>
              {properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="版本名称"
                rules={[{ required: true, message: '请输入版本名称' }]}
              >
                <Input placeholder="例如：2024年夏季行程" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="version_number"
                label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="例如：1.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="版本描述">
            <TextArea rows={2} placeholder="请输入版本描述" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              {Object.entries(ITINERARY_STATUS_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="行程内容（JSON格式）"
            help="使用JSON格式定义行程内容，包括每日安排、活动、注意事项等"
          >
            <TextArea
              rows={8}
              value={contentEditor}
              onChange={(e) => setContentEditor(e.target.value)}
              placeholder='{"days": [{"day": 1, "activities": []}]}'
              className="font-mono text-sm"
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setShowModal(false);
                  form.resetFields();
                  setEditingVersion(null);
                  setContentEditor('{}');
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingVersion ? '更新版本' : '创建版本'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="版本详情"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={700}
      >
        {selectedVersion && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="版本名称" span={2}>
                <div className="flex items-center gap-2">
                  {selectedVersion.name}
                  <Tag color="blue">v{selectedVersion.version_number}</Tag>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedVersion.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag className={ITINERARY_STATUS_COLORS[selectedVersion.status]}>
                  {ITINERARY_STATUS_LABELS[selectedVersion.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="父版本">
                {selectedVersion.parent_version || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(selectedVersion.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(selectedVersion.updated_at)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="行程内容" size="small">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(selectedVersion.content, null, 2)}
              </pre>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setEditingVersion(selectedVersion);
                  setContentEditor(JSON.stringify(selectedVersion.content, null, 2));
                  form.setFieldsValue(selectedVersion);
                  setShowDetailDrawer(false);
                  setShowModal(true);
                }}
              >
                编辑版本
              </Button>
              {selectedVersion.status === 'draft' && (
                <Button
                  type="primary"
                  onClick={() => {
                    handlePublish(selectedVersion);
                    setShowDetailDrawer(false);
                  }}
                >
                  发布版本
                </Button>
              )}
              <Button onClick={() => setShowDetailDrawer(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title="版本差异对比"
        open={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
        width={800}
      >
        {compareVersions && (
          <div className="space-y-6">
            <Alert
              message={`正在比较版本 ${compareVersions[0]} 和 ${compareVersions[1]}`}
              type="info"
              showIcon
            />

            {diffResult.length === 0 ? (
              <Card className="text-center py-12">
                <DiffOutlined className="text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">两个版本内容完全一致，没有差异</p>
              </Card>
            ) : (
              <Card title={`差异项 (${diffResult.length})`} size="small">
                <Space direction="vertical" className="w-full">
                  {diffResult.map((diff, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-primary-600 mb-2">{diff.field}</div>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div className="text-xs text-gray-500 mb-1">原值</div>
                          <div className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                            {JSON.stringify(diff.old_value, null, 2)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="text-xs text-gray-500 mb-1">新值</div>
                          <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                            {JSON.stringify(diff.new_value, null, 2)}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => setShowCompareDrawer(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
