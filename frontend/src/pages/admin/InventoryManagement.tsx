import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Drawer,
  List,
  Badge,
  Switch,
} from 'antd';
import {
  CalendarOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import { useInventoryStore } from '@/store/inventoryStore';
import {
  formatCurrency,
  formatDate,
  getDateRange,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
} from '@/utils';
import type { Inventory, SpecialPricing } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function InventoryManagement() {
  const { properties, rooms, fetchProperties, fetchRooms } = useAppStore();
  const {
    calendarData,
    specialPricing,
    conflicts,
    fetchCalendar,
    fetchConflicts,
    fetchSpecialPricing,
    batchUpdate,
    createSpecialPricing,
    updateSpecialPricing,
    deleteSpecialPricing,
    isLoading,
  } = useInventoryStore();

  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs().add(30, 'day'),
  ]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPricingDrawer, setShowPricingDrawer] = useState(false);
  const [showConflictsDrawer, setShowConflictsDrawer] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [batchForm] = Form.useForm();
  const [pricingForm] = Form.useForm();
  const [editingPricing, setEditingPricing] = useState<SpecialPricing | null>(null);

  useEffect(() => {
    fetchProperties();
    fetchRooms();
  }, [fetchProperties, fetchRooms]);

  useEffect(() => {
    if (selectedProperty) {
      loadData();
    }
  }, [selectedProperty, dateRange]);

  const loadData = () => {
    if (!selectedProperty) return;
    const [startDate, endDate] = dateRange;
    if (filteredRooms.length > 0) {
      fetchCalendar({
        room_id: filteredRooms[0].id,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
      });
    }
    fetchSpecialPricing({ property_id: selectedProperty });
    fetchConflicts({ property_id: selectedProperty, resolved: false });
  };

  const filteredRooms = useMemo(() => {
    if (!selectedProperty) return rooms;
    return rooms.filter((room) => room.property === selectedProperty);
  }, [selectedProperty, rooms]);

  const calendarColumns = useMemo(() => {
    if (!dateRange) return [];
    const dates = getDateRange(
      dateRange[0].format('YYYY-MM-DD'),
      dateRange[1].format('YYYY-MM-DD')
    );
    return [
      {
        title: '房型',
        dataIndex: 'room_name',
        key: 'room_name',
        width: 180,
        fixed: 'left' as const,
        render: (text: string, record: Record<string, unknown>) => (
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-400">
              基准价: {formatCurrency(record.base_price as number)}
            </div>
          </div>
        ),
      },
      ...dates.map((date) => ({
        title: (
          <div className="text-center">
            <div>{formatDate(date, 'MM/DD')}</div>
            <div className="text-xs text-gray-400">{formatDate(date, 'ddd')}</div>
          </div>
        ),
        dataIndex: date,
        key: date,
        width: 100,
        align: 'center' as const,
        render: (inventory: Inventory) => {
          if (!inventory) return <Tag color="gray">未知</Tag>;
          return (
            <Tooltip
              title={
                <div className="text-left">
                  <p>状态: {INVENTORY_STATUS_LABELS[inventory.status]}</p>
                  <p>价格: {formatCurrency(inventory.price)}</p>
                  {inventory.is_locked && (
                    <p>已锁定至: {formatDate(inventory.locked_until || '')}</p>
                  )}
                  {inventory.order_id && <p>订单ID: {inventory.order_id}</p>}
                </div>
              }
            >
              <div className={`p-1 rounded ${getInventoryStatusBg(inventory.status)}`}>
                <Tag className={INVENTORY_STATUS_COLORS[inventory.status]} bordered={false}>
                  {INVENTORY_STATUS_LABELS[inventory.status]}
                </Tag>
                <div className="text-xs font-medium mt-1">
                  {formatCurrency(inventory.price)}
                </div>
                {inventory.is_locked && <LockOutlined className="text-yellow-600 text-xs" />}
              </div>
            </Tooltip>
          );
        },
      })),
    ];
  }, [dateRange]);

  const calendarDataSource = useMemo(() => {
    if (!dateRange || !selectedProperty) return [];
    const dates = getDateRange(
      dateRange[0].format('YYYY-MM-DD'),
      dateRange[1].format('YYYY-MM-DD')
    );

    const calendarMap: Record<string, Record<string, Inventory>> = {};
    calendarData.forEach((inv: Inventory & { room_id?: string }) => {
      if (!calendarMap[inv.date]) {
        calendarMap[inv.date] = {};
      }
      const roomId = inv.room_id || inv.room;
      calendarMap[inv.date][roomId] = inv;
    });

    return filteredRooms.map((room) => {
      const row: Record<string, unknown> = {
        key: room.id,
        room_id: room.id,
        room_name: room.name,
        base_price: room.base_price,
      };
      dates.forEach((date) => {
        const inventory = calendarMap[date]?.[room.id];
        row[date] = inventory;
      });
      return row;
    });
  }, [filteredRooms, calendarData, dateRange, selectedProperty]);

  const getInventoryStatusBg = (status: string): string => {
    const map: Record<string, string> = {
      available: 'bg-green-50',
      booked: 'bg-red-50',
      locked: 'bg-yellow-50',
      maintenance: 'bg-gray-100',
    };
    return map[status] || '';
  };

  const handleBatchUpdate = async (values: {
    status?: string;
    price?: number;
    is_locked?: boolean;
  }) => {
    if (!dateRange || selectedRooms.length === 0) {
      message.warning('请选择日期范围和房型');
      return;
    }

    try {
      for (const roomId of selectedRooms) {
        await batchUpdate({
          room_id: roomId,
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
          status: values.status,
          price: values.price,
          is_locked: values.is_locked,
        });
      }
      message.success('批量更新成功');
      setShowBatchModal(false);
      batchForm.resetFields();
      setSelectedRooms([]);
      loadData();
    } catch {
      message.error('批量更新失败');
    }
  };

  const handleSavePricing = async (values: Partial<SpecialPricing>) => {
    try {
      if (editingPricing) {
        await updateSpecialPricing(editingPricing.id, values);
        message.success('更新成功');
      } else {
        await createSpecialPricing({
          ...values,
          room: selectedRooms[0],
        } as SpecialPricing);
        message.success('创建成功');
      }
      setShowPricingDrawer(false);
      pricingForm.resetFields();
      setEditingPricing(null);
      fetchSpecialPricing({ property_id: selectedProperty });
    } catch {
      message.error('保存失败');
    }
  };

  const handleDeletePricing = async (id: string) => {
    try {
      await deleteSpecialPricing(id);
      message.success('删除成功');
      fetchSpecialPricing({ property_id: selectedProperty });
    } catch {
      message.error('删除失败');
    }
  };

  const rowSelection = {
    selectedRowKeys: selectedRooms,
    onChange: (keys: React.Key[]) => {
      setSelectedRooms(keys as string[]);
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">房态管理</h1>
        <Space>
          <Badge count={conflicts.length > 0 ? conflicts.length : 0}>
            <Button
              type="primary"
              onClick={() => setShowConflictsDrawer(true)}
            >
              <ExclamationCircleOutlined />
              房态冲突
            </Button>
          </Badge>
          <Button onClick={() => setShowPricingDrawer(true)}>
            <SettingOutlined />
            特殊价格
          </Button>
          <Button
            type="primary"
            onClick={() => setShowBatchModal(true)}
            disabled={selectedRooms.length === 0}
          >
            <EditOutlined />
            批量修改
          </Button>
        </Space>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <CalendarOutlined />
              <span className="font-medium">选择民宿</span>
            </div>
            <Select
              placeholder="请选择民宿"
              className="w-full"
              size="large"
              value={selectedProperty || undefined}
              onChange={(value) => {
                setSelectedProperty(value);
                setSelectedRooms([]);
              }}
            >
              {properties.map((property) => (
                <Option key={property.id} value={property.id}>
                  {property.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={12}>
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <CalendarOutlined />
              <span className="font-medium">日期范围</span>
            </div>
            <RangePicker
              className="w-full"
              size="large"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <CalendarOutlined />
              <span className="font-medium">快捷操作</span>
            </div>
            <Space>
              <Button
                size="large"
                onClick={() => setDateRange([dayjs(), dayjs().add(30, 'day')])}
              >
                未来30天
              </Button>
              <Button
                size="large"
                onClick={() => setDateRange([dayjs(), dayjs().add(90, 'day')])}
              >
                未来90天
              </Button>
            </Space>
          </Col>
        </Row>

        <div className="mt-4 mb-2">
          <Space wrap>
            <Tag className="bg-green-100 text-green-800 border-0">可预订</Tag>
            <Tag className="bg-red-100 text-red-800 border-0">已预订</Tag>
            <Tag className="bg-yellow-100 text-yellow-800 border-0">已锁定</Tag>
            <Tag className="bg-gray-100 text-gray-800 border-0">维护中</Tag>
          </Space>
          {selectedRooms.length > 0 && (
            <span className="text-gray-500 text-sm ml-4">
              已选择 {selectedRooms.length} 个房型
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table
            rowSelection={rowSelection}
            columns={calendarColumns}
            dataSource={calendarDataSource}
            pagination={false}
            loading={isLoading}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        </div>
      </Card>

      <Modal
        title="批量修改房态"
        open={showBatchModal}
        onCancel={() => {
          setShowBatchModal(false);
          batchForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchUpdate}
        >
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">
              已选择 {selectedRooms.length} 个房型
            </p>
            <p className="text-sm text-blue-700">
              日期范围: {dateRange && `${formatDate(dateRange[0].toDate())} - ${formatDate(dateRange[1].toDate())}`}
            </p>
          </div>

          <Form.Item name="status" label="房态">
            <Select placeholder="请选择房态（不选则不修改）">
              <Option value="available">可预订</Option>
              <Option value="locked">已锁定</Option>
              <Option value="maintenance">维护中</Option>
            </Select>
          </Form.Item>

          <Form.Item name="price" label="价格">
            <InputNumber
              className="w-full"
              min={0}
              placeholder="请输入价格（不填则不修改）"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item name="is_locked" label="锁定房态" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setShowBatchModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="特殊价格管理"
        open={showPricingDrawer}
        onClose={() => {
          setShowPricingDrawer(false);
          pricingForm.resetFields();
          setEditingPricing(null);
        }}
        width={600}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPricing(null);
              pricingForm.resetFields();
            }}
          >
            添加特殊价格
          </Button>
        }
      >
        <List
          dataSource={specialPricing}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingPricing(item);
                    pricingForm.setFieldsValue({
                      ...item,
                      start_date: dayjs(item.start_date),
                      end_date: dayjs(item.end_date),
                    });
                  }}
                >
                  编辑
                </Button>,
                <Popconfirm
                  title="确定要删除这个特殊价格吗？"
                  onConfirm={() => handleDeletePricing(item.id)}
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(item.price)}</span>
                    {item.reason && <Tag color="blue">{item.reason}</Tag>}
                  </div>
                }
                description={
                  <div>
                    <p className="text-gray-600">
                      {formatDate(item.start_date)} - {formatDate(item.end_date)}
                    </p>
                  </div>
                }
              />
            </List.Item>
          )}
        />

        {(editingPricing || showPricingDrawer) && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-4">
              {editingPricing ? '编辑特殊价格' : '添加特殊价格'}
            </h4>
            <Form
              form={pricingForm}
              layout="vertical"
              onFinish={handleSavePricing}
            >
              <Form.Item
                name="room"
                label="适用房型"
                rules={[{ required: true, message: '请选择房型' }]}
              >
                <Select placeholder="请选择房型">
                  {filteredRooms.map((room) => (
                    <Option key={room.id} value={room.id}>
                      {room.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name={['start_date', 'end_date']}
                label="适用日期"
                rules={[{ required: true, message: '请选择日期范围' }]}
              >
                <RangePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="price"
                label="特殊价格"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber className="w-full" min={0} prefix="¥" />
              </Form.Item>

              <Form.Item name="reason" label="价格原因">
                <Select placeholder="请选择或输入">
                  <Option value="节假日">节假日</Option>
                  <Option value="周末">周末</Option>
                  <Option value="旺季">旺季</Option>
                  <Option value="促销">促销活动</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space className="w-full justify-end">
                  <Button
                    onClick={() => {
                      setEditingPricing(null);
                      pricingForm.resetFields();
                    }}
                  >
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit" loading={isLoading}>
                    保存
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>

      <Drawer
        title="房态冲突"
        open={showConflictsDrawer}
        onClose={() => setShowConflictsDrawer(false)}
        width={600}
      >
        <List
          dataSource={conflicts}
          locale={{ emptyText: '暂无房态冲突' }}
          renderItem={(conflict) => (
            <List.Item
              key={conflict.id}
              className={`${conflict.resolved ? 'opacity-50' : 'bg-red-50'}`}
            >
              <List.Item.Meta
                avatar={<ExclamationCircleOutlined className="text-red-500 text-xl" />}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{conflict.conflict_type}</span>
                    {conflict.resolved ? (
                      <Tag color="green">已解决</Tag>
                    ) : (
                      <Tag color="red">待处理</Tag>
                    )}
                  </div>
                }
                description={
                  <div className="space-y-1">
                    <p className="text-gray-600">{conflict.description}</p>
                    <p className="text-sm text-gray-500">
                      日期: {formatDate(conflict.date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      关联订单: {conflict.order_ids.join(', ')}
                    </p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
}
