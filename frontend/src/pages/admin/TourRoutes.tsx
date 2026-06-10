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
  InputNumber,
  message,
  Drawer,
  Descriptions,
  Popconfirm,
  List,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { formatDateTime } from '@/utils';
import type { TourRoute, TourWaypoint } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function TourRoutes() {
  const { properties, tourRoutes, fetchProperties, fetchTourRoutes, createTourRoute, updateTourRoute, deleteTourRoute, isLoading } =
    useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TourRoute | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TourRoute | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string | undefined>();
  const [waypoints, setWaypoints] = useState<Partial<TourWaypoint>[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    const params: Record<string, unknown> = {};
    if (propertyFilter) params.property_id = propertyFilter;
    fetchTourRoutes(params);
  }, [propertyFilter, fetchTourRoutes]);

  const handleSubmit = async (values: Partial<TourRoute>) => {
    try {
      const routeData: Partial<TourRoute> = {
        ...values,
        waypoints: waypoints.filter((wp) => wp.name && wp.duration_minutes) as TourWaypoint[],
      };

      if (editingRoute) {
        await updateTourRoute(editingRoute.id, routeData);
        message.success('路线更新成功');
      } else {
        await createTourRoute(routeData);
        message.success('路线创建成功');
      }

      setShowModal(false);
      form.resetFields();
      setEditingRoute(null);
      setWaypoints([]);
      fetchTourRoutes({ property_id: propertyFilter });
    } catch {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTourRoute(id);
      message.success('删除成功');
      fetchTourRoutes({ property_id: propertyFilter });
    } catch {
      message.error('删除失败');
    }
  };

  const addWaypoint = () => {
    setWaypoints([
      ...waypoints,
      { name: '', duration_minutes: 10, order_index: waypoints.length },
    ]);
  };

  const updateWaypoint = (index: number, field: keyof TourWaypoint, value: unknown) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = { ...newWaypoints[index], [field]: value };
    setWaypoints(newWaypoints);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints.map((wp, i) => ({ ...wp, order_index: i })));
  };

  const columns = [
    {
      title: '路线名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TourRoute) => (
        <div>
          <span
            className="font-medium cursor-pointer hover:text-primary-600"
            onClick={() => {
              setSelectedRoute(record);
              setShowDetailDrawer(true);
            }}
          >
            {text}
          </span>
          {record.description && (
            <div className="text-sm text-gray-500 mt-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      width: 120,
      render: (minutes: number) => (
        <div className="flex items-center gap-1">
          <ClockCircleOutlined />
          <span>{minutes} 分钟</span>
        </div>
      ),
    },
    {
      title: '途经点',
      dataIndex: 'waypoints',
      key: 'waypoints',
      render: (waypoints: TourWaypoint[]) => (
        <Tag color="blue">{waypoints?.length || 0} 个</Tag>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version: number) => `v${version}`,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean) =>
        active ? <Tag color="green">已启用</Tag> : <Tag color="gray">已禁用</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: TourRoute) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRoute(record);
              setWaypoints(record.waypoints || []);
              form.setFieldsValue(record);
              setShowModal(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条路线吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
          <CarOutlined className="mr-2" />
          导览路线管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRoute(null);
            form.resetFields();
            setWaypoints([]);
            setShowModal(true);
          }}
        >
          新建路线
        </Button>
      </div>

      <Card>
        <Select
          placeholder="选择民宿筛选"
          className="w-64"
          allowClear
          value={propertyFilter}
          onChange={(value) => setPropertyFilter(value)}
        >
          {properties.map((p) => (
            <Option key={p.id} value={p.id}>
              {p.name}
            </Option>
          ))}
        </Select>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={tourRoutes}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条路线`,
          }}
        />
      </Card>

      <Modal
        title={editingRoute ? '编辑导览路线' : '新建导览路线'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setEditingRoute(null);
          setWaypoints([]);
        }}
        footer={null}
        width={800}
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

          <Form.Item
            name="name"
            label="路线名称"
            rules={[{ required: true, message: '请输入路线名称' }]}
          >
            <Input placeholder="例如：山居深度游" />
          </Form.Item>

          <Form.Item name="description" label="路线描述">
            <TextArea rows={2} placeholder="请输入路线描述" />
          </Form.Item>

          <Form.Item
            name="duration_minutes"
            label="总时长（分钟）"
            rules={[{ required: true, message: '请输入总时长' }]}
          >
            <InputNumber className="w-full" min={1} />
          </Form.Item>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">途经点</label>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addWaypoint}>
                添加途经点
              </Button>
            </div>
            <List
              dataSource={waypoints}
              locale={{ emptyText: '暂无途经点' }}
              renderItem={(wp, index) => (
                <List.Item
                  key={index}
                  className="border rounded-lg p-4 mb-2 bg-gray-50"
                >
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-primary-600">#{index + 1}</span>
                      <Input
                        placeholder="途经点名称"
                        value={wp.name}
                        onChange={(e) => updateWaypoint(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <InputNumber
                        placeholder="时长"
                        min={1}
                        value={wp.duration_minutes}
                        onChange={(value) => updateWaypoint(index, 'duration_minutes', value)}
                        addonAfter="分钟"
                        style={{ width: 150 }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeWaypoint(index)}
                      />
                    </div>
                    <Input
                      placeholder="途经点描述（选填）"
                      value={wp.description}
                      onChange={(e) => updateWaypoint(index, 'description', e.target.value)}
                    />
                    <Input
                      placeholder="位置信息（选填）"
                      prefix={<EnvironmentOutlined />}
                      value={wp.location}
                      onChange={(e) => updateWaypoint(index, 'location', e.target.value)}
                    />
                  </div>
                </List.Item>
              )}
            />
          </div>

          <Form.Item name="is_active" label="启用路线" valuePropName="checked">
            <Input type="checkbox" defaultChecked />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setShowModal(false);
                  form.resetFields();
                  setEditingRoute(null);
                  setWaypoints([]);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingRoute ? '更新路线' : '创建路线'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="路线详情"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={600}
      >
        {selectedRoute && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="路线名称" span={2}>
                {selectedRoute.name}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedRoute.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="总时长">{selectedRoute.duration_minutes} 分钟</Descriptions.Item>
              <Descriptions.Item label="版本">v{selectedRoute.version}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedRoute.is_active ? (
                  <Tag color="green">已启用</Tag>
                ) : (
                  <Tag color="gray">已禁用</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="途经点">{selectedRoute.waypoints?.length || 0} 个</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {formatDateTime(selectedRoute.created_at)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="路线详情" size="small">
              <Timeline
                items={selectedRoute.waypoints?.map((wp) => ({
                  color: 'green',
                  children: (
                    <div>
                      <div className="font-medium">{wp.name}</div>
                      {wp.description && (
                        <div className="text-sm text-gray-600">{wp.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        <ClockCircleOutlined className="mr-1" />
                        {wp.duration_minutes} 分钟
                        {wp.location && (
                          <span className="ml-3">
                            <EnvironmentOutlined className="mr-1" />
                            {wp.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="primary"
                onClick={() => {
                  setEditingRoute(selectedRoute);
                  setWaypoints(selectedRoute.waypoints || []);
                  form.setFieldsValue(selectedRoute);
                  setShowDetailDrawer(false);
                  setShowModal(true);
                }}
              >
                编辑路线
              </Button>
              <Button onClick={() => setShowDetailDrawer(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
