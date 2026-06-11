import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Tag, Input, Select, DatePicker, Typography, Space, message, Modal } from 'antd';
import { ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons';
import { courseApi, classApi, couponApi, orderApi } from '@/api';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const PurchaseCourse: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | undefined>();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await courseApi.list({ keyword, status: 'ACTIVE', pageNum: 1, pageSize: 50 });
      setCourses(result.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [keyword]);

  const handleBuy = async (course: any) => {
    setSelectedModal(course);
    const cls = await classApi.list({ status: 'RUNNING', pageNum: 1, pageSize: 50 });
    setClasses(cls.records.filter((c: any) => c.courseId === course.id) || []);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const coupon = await couponApi.getByCode(couponCode.trim());
      if (coupon.courseIds && coupon.courseIds.length > 0 && !coupon.courseIds.includes(selectedModal.id)) {
        message.error('该优惠券不适用于此课程');
        return;
      }
      setAppliedCoupon(coupon);
      message.success('优惠券已应用');
    } catch (e) {
      // error handled
    }
  };

  const handleConfirmOrder = async () => {
    try {
      let discountAmount = 0;
      if (appliedCoupon) {
        if (appliedCoupon.type === 'FIXED') {
          discountAmount = appliedCoupon.discountValue;
        } else if (appliedCoupon.type === 'PERCENT') {
          discountAmount = (selectedModal.price * appliedCoupon.discountValue) / 100;
        }
      }
      const finalAmount = Math.max(0, selectedModal.price - discountAmount);

      const order = await orderApi.create({
        courseId: selectedModal.id,
        classId: selectedClass,
        couponId: appliedCoupon?.id,
      });

      Modal.confirm({
        title: '确认支付',
        content: (
          <div>
            <p>订单号: {order.orderNo}</p>
            <p>课程: {selectedModal.title}</p>
            <p>原价: ¥{selectedModal.price}</p>
            {discountAmount > 0 && <p>优惠: -¥{discountAmount.toFixed(2)}</p>}
            <p>实付: <strong>¥{finalAmount.toFixed(2)}</strong></p>
          </div>
        ),
        onOk: async () => {
          await orderApi.pay(order.id);
          message.success('购买成功！');
          setSelectedModal(null);
          setAppliedCoupon(null);
          setCouponCode('');
          setSelectedClass(undefined);
        },
      });
    } catch (e) {
      // handled
    }
  };

  return (
    <div>
      <Title level={3}>购买课程</Title>

      <Space style={{ marginBottom: 24 }}>
        <Input
          placeholder="搜索课程名称或描述"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Space>

      <Row gutter={[24, 24]}>
        {courses.map((course) => (
          <Col span={8} key={course.id}>
            <Card
              hoverable
              cover={
                <div
                  style={{
                    height: 180,
                    background: course.coverUrl
                      ? `url(${course.coverUrl}) center/cover`
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 32,
                  }}
                >
                  {!course.coverUrl && course.title?.charAt(0)}
                </div>
              }
              actions={[
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleBuy(course)}
                >
                  立即购买
                </Button>,
              ]}
            >
              <Card.Meta
                title={
                  <Space>
                    <span>{course.title}</span>
                    <Tag color={STATUS_MAP[course.status]?.color} style={{ fontSize: 11, padding: '0 6px' }}>
                      {STATUS_MAP[course.status]?.text}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ minHeight: 44 }}>
                      {course.subtitle || course.description}
                    </Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 'bold' }}>
                        ¥{course.price}
                      </span>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <span style={{ color: '#999', textDecoration: 'line-through' }}>
                          ¥{course.originalPrice}
                        </span>
                      )}
                      <span style={{ color: '#666' }}>{course.totalHours}课时</span>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="确认购买信息"
        open={!!selectedModal}
        onCancel={() => {
          setSelectedModal(null);
          setAppliedCoupon(null);
          setCouponCode('');
          setSelectedClass(undefined);
        }}
        footer={[
          <Button key="cancel" onClick={() => setSelectedModal(null)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmOrder}>
            提交订单
          </Button>,
        ]}
        width={500}
      >
        {selectedModal && (
          <div>
            <p><strong>课程:</strong> {selectedModal.title}</p>
            <p><strong>价格:</strong> ¥{selectedModal.price}</p>

            {classes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p><strong>选择班级:</strong></p>
                <Select
                  placeholder="请选择班级（可选）"
                  style={{ width: '100%' }}
                  value={selectedClass}
                  onChange={setSelectedClass}
                  options={classes.map((c: any) => ({
                    label: `${c.className} (${c.teacherName || '待安排'})`,
                    value: c.id,
                  }))}
                  allowClear
                />
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <p><strong>优惠券:</strong></p>
              <Space>
                <Input
                  placeholder="输入优惠码"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ width: 200 }}
                />
                <Button onClick={handleApplyCoupon}>应用</Button>
                {appliedCoupon && (
                  <Tag color="green">
                    {appliedCoupon.name} - {appliedCoupon.type === 'FIXED' ? `减¥${appliedCoupon.discountValue}` : `${appliedCoupon.discountValue}%`}
                  </Tag>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseCourse;
