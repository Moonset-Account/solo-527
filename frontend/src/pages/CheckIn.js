import React, { useState } from 'react';
import { Card, Input, Button, Form, message, Descriptions, Tag, Space, Divider, List, Statistic, Row, Col } from 'antd';
import { ScanOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons';
import { bookingsAPI, guestsAPI } from '../services/api';
import dayjs from 'dayjs';

function CheckIn() {
  const [bookingNo, setBookingNo] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [todayStats, setTodayStats] = useState({ checked: 0, total: 0 });
  const [form] = Form.useForm();

  const handleSearch = async () => {
    if (!bookingNo.trim()) {
      message.warning('请输入报名编号');
      return;
    }

    try {
      const response = await bookingsAPI.getByBookingNo(bookingNo.trim());
      setMemberInfo(response.data);
      setCheckInResult(null);
    } catch (error) {
      message.error('未找到该报名记录');
      setMemberInfo(null);
    }
  };

  const handleCheckIn = async () => {
    if (!memberInfo) return;

    try {
      await bookingsAPI.checkIn(memberInfo.id);
      message.success('签到成功');
      setCheckInResult({ success: true, time: new Date() });
    } catch (error) {
      message.error(error.response?.data?.message || '签到失败');
      setCheckInResult({ success: false, message: error.response?.data?.message });
    }
  };

  const handleGuestCheckIn = async (guestId) => {
    try {
      await guestsAPI.checkIn(guestId);
      message.success('嘉宾签到成功');
    } catch (error) {
      message.error(error.response?.data?.message || '签到失败');
    }
  };

  const statusConfig = {
    confirmed: { color: 'green', label: '已确认' },
    checked_in: { color: 'blue', label: '已签到' },
    waitlisted: { color: 'orange', label: '候补中' },
    cancelled: { color: 'red', label: '已取消' },
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>票务核销</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="今日已签到" value={todayStats.checked} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="今日总报名" value={todayStats.total} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="签到率"
              value={todayStats.total > 0 ? `${Math.round(todayStats.checked / todayStats.total * 100}%` : '0%'}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="会员签到" style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item style={{ flex: 1 }}>
            <Input
              size="large"
              placeholder="请输入或扫描报名编号"
              prefix={<ScanOutlined />}
              value={bookingNo}
              onChange={(e) => setBookingNo(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" size="large" htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {memberInfo && (
        <Card
          title="报名信息"
          extra={
            memberInfo.status === 'confirmed' && !checkInResult?.success ? (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleCheckIn}
              >
                确认签到
              </Button>
            ) : null
          }
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="报名编号">
              {memberInfo.booking_no}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusConfig[memberInfo.status]?.color}>
                {statusConfig[memberInfo.status]?.label || memberInfo.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="会员姓名">
              {memberInfo.member?.name}
            </Descriptions.Item>
            <Descriptions.Item label="会员编号">
              {memberInfo.member?.member_no}
            </Descriptions.Item>
            <Descriptions.Item label="会员等级">
              {memberInfo.member?.level_name}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {memberInfo.member?.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="影片" span={2}>
              {memberInfo.screening?.film?.title}
            </Descriptions.Item>
            <Descriptions.Item label="放映时间">
              {dayjs(memberInfo.screening?.start_time).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="放映厅">
              {memberInfo.screening?.hall?.name}
            </Descriptions.Item>
            <Descriptions.Item label="携带嘉宾">
              {memberInfo.guest_count || 0} 人
            </Descriptions.Item>
            <Descriptions.Item label="报名时间">
              {dayjs(memberInfo.registered_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          {checkInResult && (
            <>
              <Divider />
              {checkInResult.success ? (
                <div style={{ textAlign: 'center', padding: 20, background: '#f6ffed', borderRadius: 8 }}>
                  <CheckOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <h3 style={{ marginTop: 16, color: '#52c41a' }}>签到成功</h3>
                  <p>签到时间：{dayjs(checkInResult.time).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, background: '#fff2f0', borderRadius: 8 }}>
                  <p style={{ color: '#ff4d4f' }}>签到失败：{checkInResult.message}</p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {!memberInfo && !checkInResult && (
        <Card>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <ScanOutlined style={{ fontSize: 64, marginBottom: 16 }} />
            <p>请输入报名编号进行查询和签到</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default CheckIn;
