import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Card,
  message,
  Alert,
  Spin,
  Row,
  Col,
  Radio,
  Tag,
} from 'antd';
import { SafetyOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { counselorApi, appointmentApi, waitlistApi, schedulesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

function AppointmentForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [waitlistInfo, setWaitlistInfo] = useState(null);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);

  const counselorId = searchParams.get('counselorId');
  const serviceId = searchParams.get('serviceId');

  useEffect(() => {
    loadCounselors();
  }, []);

  useEffect(() => {
    if (counselorId) {
      form.setFieldsValue({ counselorId });
      handleCounselorChange(counselorId);
    }
  }, [counselorId, counselors]);

  const loadCounselors = async () => {
    setLoading(true);
    try {
      const data = await counselorApi.getPublicList();
      setCounselors(data);
    } catch (error) {
      console.error('加载咨询师失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCounselorChange = async (value) => {
    const counselor = counselors.find(c => c.id === value);
    setSelectedCounselor(counselor);
    form.setFieldsValue({ startTime: null, endTime: null, slotId: null });
    setAvailableSlots([]);
    setSelectedSlot(null);
    setSelectedDate(null);
    setJoinWaitlist(false);
    setWaitlistInfo(null);
  };

  const loadWaitlistInfo = async (cId, date) => {
    setLoadingWaitlist(true);
    try {
      const info = await waitlistApi.getPosition({ counselorId: cId, preferredDate: date });
      setWaitlistInfo(info);
    } catch (error) {
      console.error('加载候补信息失败', error);
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    form.setFieldsValue({ startTime: null, endTime: null, slotId: null });
    setSelectedSlot(null);
    setJoinWaitlist(false);
    setWaitlistInfo(null);

    if (date && selectedCounselor) {
      try {
        const slots = await schedulesApi.getByCounselorAndDate(
          selectedCounselor.id,
          date.format('YYYY-MM-DD')
        );
        const available = slots.filter(s => s.status === 'available');
        setAvailableSlots(available);
        if (available.length === 0) {
          setJoinWaitlist(true);
          loadWaitlistInfo(selectedCounselor.id, date.format('YYYY-MM-DD'));
        }
      } catch (error) {
        console.error('加载可用时段失败', error);
        setAvailableSlots([]);
      }
    }
  };

  const handleSlotSelect = (slotId) => {
    const slot = availableSlots.find(s => s.id === slotId);
    setSelectedSlot(slot);
    if (slot) {
      form.setFieldsValue({
        startTime: dayjs(slot.startTime, 'HH:mm'),
        endTime: dayjs(slot.endTime, 'HH:mm'),
        slotId: slot.id,
      });
    }
  };

  const onFinish = async (values) => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (!joinWaitlist && !selectedSlot) {
      message.error('请选择一个可用时段');
      return;
    }

    if (joinWaitlist && waitlistInfo && !waitlistInfo.canJoin) {
      message.error(`候补队列已满（最多${waitlistInfo.maxQueueSize}人），请选择其他日期或咨询师`);
      return;
    }

    setSubmitting(true);
    try {
      if (joinWaitlist) {
        await waitlistApi.join({
          counselorId: values.counselorId,
          serviceId: serviceId,
          preferredDate: values.appointmentDate.format('YYYY-MM-DD'),
          preferredStartTime: values.startTime?.format('HH:mm'),
          preferredEndTime: values.endTime?.format('HH:mm'),
          visitReason: values.visitReason,
        });
        message.success('已加入候补队列，有空位我们会及时通知您');
        navigate('/my-waitlist');
      } else {
        const appointmentData = {
          counselorId: values.counselorId,
          serviceId: serviceId,
          appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
          startTime: values.startTime.format('HH:mm'),
          endTime: values.endTime.format('HH:mm'),
          visitReason: values.visitReason,
          clientNotes: values.clientNotes,
          amount: selectedCounselor?.hourlyRate || 0,
        };
        await appointmentApi.create(appointmentData);
        message.success('预约成功');
        navigate('/my-appointments');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  return (
    <div>
      <Alert
        message="隐私保护提醒"
        description="您填写的所有信息将严格保密，仅用于咨询服务。我们遵守心理咨询伦理规范，保护您的隐私安全。"
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Card title="预约咨询">
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ appointmentDate: null }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="选择咨询师"
                  name="counselorId"
                  rules={[{ required: true, message: '请选择咨询师' }]}
                >
                  <Select
                    placeholder="请选择咨询师"
                    onChange={handleCounselorChange}
                    showSearch
                    optionFilterProp="children"
                  >
                    {counselors.map(c => (
                      <Option key={c.id} value={c.id}>
                        {c.name} - {c.specialties?.slice(0, 2).join('、')} (¥{c.hourlyRate}/小时)
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                {selectedCounselor && (
                  <div style={{
                    padding: 12,
                    background: '#f5f7fa',
                    borderRadius: 6,
                    marginBottom: 24,
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedCounselor.name}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      ⭐ {selectedCounselor.rating} 分 · 从业{selectedCounselor.experienceYears}年
                    </div>
                    <div style={{ color: '#ff4d4f', fontWeight: 600, marginTop: 4 }}>
                      ¥{selectedCounselor.hourlyRate}/小时
                    </div>
                  </div>
                )}
              </Col>
            </Row>

            <Form.Item
              label="咨询日期"
              name="appointmentDate"
              rules={[{ required: true, message: '请选择咨询日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                disabledDate={disabledDate}
                onChange={handleDateChange}
                placeholder="选择日期"
                disabled={!selectedCounselor}
              />
            </Form.Item>

            {selectedDate && availableSlots.length > 0 && (
              <Form.Item
                label="选择时段"
                name="slotId"
                rules={[{ required: !joinWaitlist, message: '请选择咨询时段' }]}
              >
                <Radio.Group
                  style={{ width: '100%' }}
                  onChange={(e) => handleSlotSelect(e.target.value)}
                  value={selectedSlot?.id}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableSlots.map(slot => (
                      <Radio.Button
                        key={slot.id}
                        value={slot.id}
                        style={{
                          marginRight: 0,
                          marginBottom: 8,
                          borderRadius: 6,
                        }}
                      >
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {slot.startTime} - {slot.endTime}
                      </Radio.Button>
                    ))}
                  </div>
                </Radio.Group>
              </Form.Item>
            )}

            {selectedDate && availableSlots.length === 0 && !loadingWaitlist && (
              <Alert
                message="该日期暂无可用时段"
                description={
                  waitlistInfo
                    ? `当前候补队列：${waitlistInfo.queueLength}/${waitlistInfo.maxQueueSize}人（规则：${waitlistInfo.ruleName}）。${waitlistInfo.canJoin ? '您可以加入候补队列，一旦有空位我们会优先通知您。' : '候补队列已满，请选择其他日期或咨询师。'}`
                    : '您可以选择加入候补队列，一旦有空位我们会优先通知您。'
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {selectedDate && (availableSlots.length > 0 || joinWaitlist) && (
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="开始时间" name="startTime">
                    <div style={{
                      padding: '8px 12px',
                      background: '#f5f7fa',
                      borderRadius: 4,
                      color: selectedSlot ? '#333' : '#999',
                    }}>
                      {selectedSlot ? selectedSlot.startTime : (joinWaitlist ? '候补时段' : '请选择时段')}
                    </div>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="结束时间" name="endTime">
                    <div style={{
                      padding: '8px 12px',
                      background: '#f5f7fa',
                      borderRadius: 4,
                      color: selectedSlot ? '#333' : '#999',
                    }}>
                      {selectedSlot ? selectedSlot.endTime : (joinWaitlist ? '以实际安排为准' : '请选择时段')}
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Form.Item
              label="来访原因"
              name="visitReason"
              rules={[{ required: true, message: '请简要描述您的来访原因' }]}
            >
              <TextArea
                rows={4}
                placeholder="请简要描述您想咨询的问题或困扰...（您的信息将严格保密）"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="备注说明"
              name="clientNotes"
            >
              <TextArea
                rows={3}
                placeholder="其他需要说明的情况（选填）"
                maxLength={200}
                showCount
              />
            </Form.Item>

            <Form.Item>
              <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  disabled={joinWaitlist && waitlistInfo && !waitlistInfo.canJoin}
                >
                  {joinWaitlist ? '加入候补队列' : '提交预约'}
                </Button>
                <Button size="large" onClick={() => navigate(-1)}>取消</Button>
                {joinWaitlist && waitlistInfo && (
                  <Tag color={waitlistInfo.canJoin ? 'orange' : 'default'}>
                    <UserOutlined style={{ marginRight: 4 }} />
                    队列 {waitlistInfo.queueLength}/{waitlistInfo.maxQueueSize}
                  </Tag>
                )}
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

export default AppointmentForm;
