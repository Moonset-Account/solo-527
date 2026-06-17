import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  Select,
  Card,
  message,
  Alert,
  Spin,
  Row,
  Col,
} from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { counselorApi, appointmentApi, waitlistApi, schedulesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

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
  const [joinWaitlist, setJoinWaitlist] = useState(false);

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
    form.setFieldsValue({ startTime: null, endTime: null });
    setAvailableSlots([]);
    setSelectedDate(null);
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    form.setFieldsValue({ startTime: null, endTime: null });
    if (date && selectedCounselor) {
      try {
        const slots = await schedulesApi.getByCounselorAndDate(
          selectedCounselor.id,
          date.format('YYYY-MM-DD')
        );
        setAvailableSlots(slots.filter(s => s.status === 'available'));
        if (slots.filter(s => s.status === 'available').length === 0) {
          setJoinWaitlist(true);
        } else {
          setJoinWaitlist(false);
        }
      } catch (error) {
        console.error('加载可用时段失败', error);
        setAvailableSlots([]);
      }
    }
  };

  const handleTimeChange = (time, timeString) => {
    if (time && selectedCounselor) {
      const endTime = time.add(50, 'minute');
      form.setFieldsValue({ endTime: endTime });
    }
  };

  const onFinish = async (values) => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const appointmentData = {
        counselorId: values.counselorId,
        serviceId: serviceId,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime?.format('HH:mm') || values.startTime.add(50, 'minute').format('HH:mm'),
        visitReason: values.visitReason,
        clientNotes: values.clientNotes,
        amount: selectedCounselor?.hourlyRate || 0,
      };

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

            <Row gutter={24}>
              <Col span={8}>
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
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="开始时间"
                  name="startTime"
                  rules={[{ required: true, message: '请选择开始时间' }]}
                >
                  <TimePicker
                    style={{ width: '100%' }}
                    format="HH:mm"
                    minuteStep={30}
                    onChange={handleTimeChange}
                    placeholder="选择时间"
                    disabled={!selectedDate}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label="结束时间"
                  name="endTime"
                >
                  <TimePicker
                    style={{ width: '100%' }}
                    format="HH:mm"
                    minuteStep={30}
                    placeholder="自动计算"
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>

            {selectedDate && availableSlots.length === 0 && (
              <Alert
                message="该日期暂无可用时段"
                description="您可以选择加入候补队列，一旦有空位我们会优先通知您。"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {selectedDate && availableSlots.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#666', marginBottom: 8 }}>可用时段：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {availableSlots.map(slot => (
                    <span
                      key={slot.id}
                      style={{
                        padding: '4px 12px',
                        background: '#e6f7ff',
                        border: '1px solid #91d5ff',
                        borderRadius: 4,
                        fontSize: 13,
                        color: '#1890ff',
                      }}
                    >
                      {slot.startTime} - {slot.endTime}
                    </span>
                  ))}
                </div>
              </div>
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
                <Button type="primary" htmlType="submit" loading={submitting} size="large">
                  {joinWaitlist ? '加入候补队列' : '提交预约'}
                </Button>
                <Button size="large" onClick={() => navigate(-1)}>取消</Button>
                {joinWaitlist && (
                  <span style={{ color: '#faad14', fontSize: 13 }}>
                    当前时段已满，将加入候补队列
                  </span>
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
