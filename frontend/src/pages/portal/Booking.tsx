import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  DatePicker,
  Select,
  Button,
  InputNumber,
  Form,
  Input,
  Space,
  Row,
  Col,
  Tag,
  Divider,
  message,
  Table,
  Alert,
} from 'antd';
import {
  CalendarOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { useOrderStore } from '@/store/orderStore';
import {
  formatCurrency,
  formatDate,
  calculateNights,
  getDateRange,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
} from '@/utils';
import type { Room, BookingFormData, Inventory } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

export default function Booking() {
  const navigate = useNavigate();
  const { properties, rooms, fetchProperties, fetchRooms } = useAppStore();
  const { calendarData, fetchCalendar, checkAvailability, isLoading } = useInventoryStore();
  const { createOrder } = useOrderStore();

  const [form] = Form.useForm<BookingFormData>();
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    total_price: number;
  } | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchRooms();
  }, [fetchProperties, fetchRooms]);

  useEffect(() => {
    if (selectedRoom && dateRange) {
      const [startDate, endDate] = dateRange;
      fetchCalendar({
        room_id: selectedRoom,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
      });
    }
  }, [selectedRoom, dateRange, fetchCalendar]);

  const filteredRooms = useMemo(() => {
    if (!selectedProperty) return rooms;
    return rooms.filter((room) => room.property === selectedProperty);
  }, [selectedProperty, rooms]);

  const handleSearch = async () => {
    if (!selectedRoom || !dateRange) {
      message.warning('请选择房型和入住日期');
      return;
    }

    const [startDate, endDate] = dateRange;
    try {
      const result = await checkAvailability({
        room_id: selectedRoom,
        check_in: startDate.format('YYYY-MM-DD'),
        check_out: endDate.format('YYYY-MM-DD'),
      });
      setAvailabilityResult(result);
      setSearchPerformed(true);
      setShowBookingForm(result.available);
    } catch (error) {
      message.error('查询房态失败，请重试');
    }
  };

  const handleSubmitBooking = async (values: BookingFormData) => {
    if (!dateRange) return;

    try {
      const [startDate, endDate] = dateRange;
      const orderData: BookingFormData = {
        ...values,
        room_id: selectedRoom,
        check_in_date: startDate.format('YYYY-MM-DD'),
        check_out_date: endDate.format('YYYY-MM-DD'),
        adults,
        children,
      };

      const order = await createOrder(orderData);
      message.success('预订成功！');
      navigate('/booking/confirm', {
        state: {
          order,
          total_price: availabilityResult?.total_price || 0,
        },
      });
    } catch (error) {
      message.error('预订失败，请重试');
    }
  };

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);
  const selectedPropertyData = properties.find((p) => p.id === selectedProperty);

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
      },
      ...dates.map((date) => ({
        title: formatDate(date, 'MM/DD'),
        dataIndex: date,
        key: date,
        width: 100,
        align: 'center' as const,
        render: (status: string) => {
          if (!status) return <Tag color="gray">未知</Tag>;
          return (
            <Tag className={INVENTORY_STATUS_COLORS[status]}>
              {INVENTORY_STATUS_LABELS[status]}
            </Tag>
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
    (calendarData as unknown as Inventory[]).forEach((inv: Inventory & { room_id?: string }) => {
      if (!calendarMap[inv.date]) {
        calendarMap[inv.date] = {};
      }
      const roomId = inv.room_id || inv.room;
      calendarMap[inv.date][roomId] = inv;
    });

    return filteredRooms.map((room) => {
      const row: Record<string, string> = {
        key: room.id,
        room_name: room.name,
      };
      dates.forEach((date) => {
        const inventory = calendarMap[date]?.[room.id];
        row[date] = inventory?.status || 'available';
      });
      return row;
    });
  }, [filteredRooms, calendarData, dateRange, selectedProperty]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">房态查询</h1>
          <p className="text-gray-500">选择日期和房型，查看实时房态并完成预订</p>
        </div>

        <Card className="mb-8 shadow-lg">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <HomeOutlined />
                <span className="font-medium">选择民宿</span>
              </div>
              <Select
                placeholder="请选择民宿"
                className="w-full"
                size="large"
                value={selectedProperty || undefined}
                onChange={(value) => {
                  setSelectedProperty(value);
                  setSelectedRoom('');
                  setSearchPerformed(false);
                  setShowBookingForm(false);
                }}
              >
                {properties.map((property) => (
                  <Option key={property.id} value={property.id}>
                    <Space>
                      <EnvironmentOutlined />
                      {property.name} - {property.city}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <CalendarOutlined />
                <span className="font-medium">入住日期</span>
              </div>
              <RangePicker
                className="w-full"
                size="large"
                minDate={dayjs()}
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
                  setSearchPerformed(false);
                  setShowBookingForm(false);
                }}
              />
            </Col>

            <Col xs={24} sm={12} md={3}>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <UserOutlined />
                <span className="font-medium">成人</span>
              </div>
              <InputNumber
                min={1}
                max={10}
                value={adults}
                onChange={(value) => setAdults(value as number)}
                className="w-full"
                size="large"
                addonBefore="人"
              />
            </Col>

            <Col xs={24} sm={12} md={3}>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <UserOutlined />
                <span className="font-medium">儿童</span>
              </div>
              <InputNumber
                min={0}
                max={10}
                value={children}
                onChange={(value) => setChildren(value as number)}
                className="w-full"
                size="large"
                addonBefore="人"
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <SearchOutlined />
                <span className="font-medium">查询房态</span>
              </div>
              <Button
                type="primary"
                size="large"
                className="w-full h-[40px]"
                onClick={handleSearch}
                loading={isLoading}
              >
                查询房态
              </Button>
            </Col>
          </Row>
        </Card>

        {selectedProperty && dateRange && (
          <Card className="mb-8" title="房态日历">
            <div className="mb-4">
              <Space wrap>
                <Tag className="bg-green-100 text-green-800 border-0">可预订</Tag>
                <Tag className="bg-red-100 text-red-800 border-0">已预订</Tag>
                <Tag className="bg-yellow-100 text-yellow-800 border-0">已锁定</Tag>
                <Tag className="bg-gray-100 text-gray-800 border-0">维护中</Tag>
              </Space>
            </div>
            <div className="overflow-x-auto">
              <Table
                columns={calendarColumns}
                dataSource={calendarDataSource}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedRoom(record.key as string);
                  },
                  className: selectedRoom === record.key ? 'bg-primary-50 cursor-pointer' : 'cursor-pointer hover:bg-gray-50',
                })}
              />
            </div>
          </Card>
        )}

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card title="选择房型" className="h-full">
              <Row gutter={[16, 16]}>
                {filteredRooms.map((room: Room) => (
                  <Col key={room.id} xs={24} md={12}>
                    <Card
                      hoverable
                      className={`cursor-pointer transition-all ${selectedRoom === room.id ? 'ring-2 ring-primary-500' : ''}`}
                      onClick={() => setSelectedRoom(room.id)}
                      cover={
                        <img
                          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20hotel%20room%20interior%20cozy%20modern&image_size=landscape_4_3"
                          alt={room.name}
                          className="h-40 object-cover"
                        />
                      }
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">{room.name}</h3>
                        <span className="text-primary-600 font-bold text-xl">
                          {formatCurrency(room.base_price)}
                          <span className="text-sm font-normal text-gray-500">/晚</span>
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{room.description}</p>
                      <Space wrap>
                        <Tag color="green">{room.max_guests}人</Tag>
                        <Tag color="blue">{room.room_type}</Tag>
                        <Tag color="orange">{room.bed_count}张床</Tag>
                        <Tag color="purple">{room.size_sqm}㎡</Tag>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            {searchPerformed && availabilityResult && (
              <Card
                title="预订信息"
                className="sticky top-4"
                extra={
                  <Tag color={availabilityResult.available ? 'green' : 'red'}>
                    {availabilityResult.available ? '可预订' : '已订满'}
                  </Tag>
                }
              >
                {selectedRoomData && selectedPropertyData && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <img
                        src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hotel%20room%20thumbnail&image_size=square"
                        alt={selectedRoomData.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">{selectedRoomData.name}</h4>
                        <p className="text-gray-500 text-sm">{selectedPropertyData.name}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">入住日期</span>
                          <span className="font-medium">
                            {dateRange && `${formatDate(dateRange[0].toDate())} - ${formatDate(dateRange[1].toDate())}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">入住天数</span>
                          <span className="font-medium">
                            {dateRange ? calculateNights(
                              dateRange[0].format('YYYY-MM-DD'),
                              dateRange[1].format('YYYY-MM-DD')
                            ) : 0} 晚
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">入住人数</span>
                          <span className="font-medium">成人 {adults} 人，儿童 {children} 人</span>
                        </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">每晚价格</span>
                        <span className="font-medium">{formatCurrency(selectedRoomData.base_price)}</span>
                      </div>
                    </div>

                    <Divider className="my-4" />

                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-700">总计</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(availabilityResult.total_price)}
                      </span>
                    </div>

                    {availabilityResult.available ? (
                      <Alert
                        message="该房型在所选日期内可预订"
                        type="success"
                        showIcon
                        className="mb-4"
                      />
                    ) : (
                      <Alert
                        message="该房型在所选日期内已订满，请选择其他日期或房型"
                        type="error"
                        showIcon
                        className="mb-4"
                      />
                    )}

                    {showBookingForm && (
                      <>
                        <Divider className="my-4">填写预订信息</Divider>
                        <Form
                          form={form}
                          layout="vertical"
                          onFinish={handleSubmitBooking}
                        >
                          <Form.Item
                            name="guest_name"
                            label="入住人姓名"
                            rules={[{ required: true, message: '请输入入住人姓名' }]}
                          >
                            <Input
                              size="large"
                              prefix={<UserOutlined />}
                              placeholder="请输入入住人姓名"
                            />
                          </Form.Item>

                          <Form.Item
                            name="guest_phone"
                            label="联系电话"
                            rules={[
                              { required: true, message: '请输入联系电话' },
                              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                            ]}
                          >
                            <Input
                              size="large"
                              prefix={<PhoneOutlined />}
                              placeholder="请输入手机号码"
                            />
                          </Form.Item>

                          <Form.Item
                            name="guest_email"
                            label="邮箱（选填）"
                            rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                          >
                            <Input
                              size="large"
                              prefix={<MailOutlined />}
                              placeholder="请输入邮箱地址"
                            />
                          </Form.Item>

                          <Form.Item
                            name="guest_remarks"
                            label="特殊要求（选填）"
                          >
                            <TextArea
                              rows={3}
                              placeholder="如有特殊要求请在此说明"
                            />
                          </Form.Item>

                          <Form.Item>
                            <Button
                              type="primary"
                              htmlType="submit"
                              size="large"
                              className="w-full h-12 text-lg"
                              loading={isLoading}
                            >
                              确认预订
                            </Button>
                          </Form.Item>
                        </Form>
                      </>
                    )}
                  </div>
                )}
              </Card>
            )}

            {!searchPerformed && selectedRoom && (
              <Card className="sticky top-4">
                <div className="text-center py-8">
                  <CalendarOutlined className="text-6xl text-gray-300 mb-4" />
                  <p className="text-gray-500">请选择日期后点击"查询房态"按钮</p>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
