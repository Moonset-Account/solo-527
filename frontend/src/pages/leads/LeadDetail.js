import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  List,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tabs,
  Divider,
  Row,
  Col,
  Avatar,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PhoneOutlined,
  WechatOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLeadDetail,
  fetchLeadStatuses,
  addFollowup,
  changeLeadStatus,
  clearLeadDetail,
} from '../../store/slices/leadsSlice';
import { fetchLogsByObject, fetchUsers } from '../../store/slices/commonSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { leadDetail, statuses, detailLoading } = useSelector(state => state.leads);
  const { users } = useSelector(state => state.common);
  const [followupModalVisible, setFollowupModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [followupForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [operationLogs, setOperationLogs] = useState([]);

  useEffect(() => {
    dispatch(fetchLeadDetail(id));
    dispatch(fetchLeadStatuses());
    dispatch(fetchUsers());
    loadOperationLogs();
    return () => dispatch(clearLeadDetail());
  }, [dispatch, id]);

  const loadOperationLogs = async () => {
    const result = await dispatch(fetchLogsByObject({ contentType: 'lead', objectId: id }));
    if (fetchLogsByObject.fulfilled.match(result)) {
      setOperationLogs(result.payload);
    }
  };

  const getQualityColor = (quality) => {
    const colors = { high: 'green', medium: 'gold', low: 'red' };
    return colors[quality] || 'default';
  };

  const getQualityText = (quality) => {
    const texts = { high: '高质量', medium: '中质量', low: '低质量' };
    return texts[quality] || quality;
  };

  const getFollowupTypeText = (type) => {
    const types = { phone: '电话', wechat: '微信', visit: '到店', email: '邮件', sms: '短信', other: '其他' };
    return types[type] || type;
  };

  const getResultText = (result) => {
    const results = {
      interested: '有意向', considering: '考虑中', not_interested: '无意向',
      no_answer: '未接通', appointment: '已预约', other: '其他'
    };
    return results[result] || result;
  };

  const handleFollowupSubmit = async (values) => {
    const data = {
      ...values,
      lead: id,
      next_followup_at: values.next_followup_at ? values.next_followup_at.toISOString() : null,
    };
    await dispatch(addFollowup(data));
    message.success('跟进记录添加成功');
    setFollowupModalVisible(false);
    followupForm.resetFields();
    dispatch(fetchLeadDetail(id));
  };

  const handleStatusSubmit = async (values) => {
    await dispatch(changeLeadStatus({ id, statusId: values.status_id }));
    message.success('状态更新成功');
    setStatusModalVisible(false);
    dispatch(fetchLeadDetail(id));
    loadOperationLogs();
  };

  if (detailLoading || !leadDetail) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  const customer = leadDetail.customer || {};

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Button icon={<EditOutlined />} type="primary">
          编辑
        </Button>
        <Button onClick={() => setStatusModalVisible(true)}>
          变更状态
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFollowupModalVisible(true)}>
          添加跟进
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="客户姓名">
                {customer.name}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {customer.phone}
              </Descriptions.Item>
              <Descriptions.Item label="性别">
                {customer.gender === 'male' ? '男' : customer.gender === 'female' ? '女' : '其他'}
              </Descriptions.Item>
              <Descriptions.Item label="年龄">
                {customer.age || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="微信">
                {customer.wechat || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {customer.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                {customer.address || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions column={2}>
              <Descriptions.Item label="线索来源">
                {leadDetail.source_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color="blue">{leadDetail.status_name || '新线索'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="质量等级">
                <Tag color={getQualityColor(leadDetail.quality)}>
                  {getQualityText(leadDetail.quality)} ({leadDetail.quality_score}分)
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="响应节点">
                {leadDetail.response_node || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="负责人">
                {leadDetail.assigned_to_name || '未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="咨询师">
                {leadDetail.consultant_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预计金额">
                ¥{Number(leadDetail.expected_amount).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="实际成交">
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  ¥{Number(leadDetail.actual_amount).toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="需求信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="牙齿问题">
                {leadDetail.dental_issues || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="治疗方案">
                {leadDetail.treatment_plan || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预算范围">
                {leadDetail.budget || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="紧迫程度">
                {leadDetail.urgency || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="跟进记录" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setFollowupModalVisible(true)}>添加</Button>}>
            <Timeline
              items={leadDetail.followups?.map(followup => ({
                color: followup.result === 'interested' ? 'green' : followup.result === 'no_answer' ? 'red' : 'blue',
                children: (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {getFollowupTypeText(followup.followup_type)} - {getResultText(followup.result)}
                      <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                        {dayjs(followup.created_at).format('YYYY-MM-DD HH:mm')} · {followup.created_by_name}
                      </span>
                    </div>
                    <div style={{ color: '#666' }}>{followup.content}</div>
                    {followup.next_followup_at && (
                      <div style={{ marginTop: 4, color: '#faad14' }}>
                        <CalendarOutlined /> 下次跟进：{dayjs(followup.next_followup_at).format('YYYY-MM-DD HH:mm')}
                      </div>
                    )}
                  </div>
                ),
              })) || []}
            />
            {(!leadDetail.followups || leadDetail.followups.length === 0) && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无跟进记录
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="处理进度" style={{ marginBottom: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="创建时间">
                {dayjs(leadDetail.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {leadDetail.created_by_name}
              </Descriptions.Item>
              <Descriptions.Item label="跟进次数">
                {leadDetail.followup_count || 0} 次
              </Descriptions.Item>
              <Descriptions.Item label="最后跟进">
                {leadDetail.last_followup_at ? dayjs(leadDetail.last_followup_at).format('YYYY-MM-DD HH:mm') : '未跟进'}
              </Descriptions.Item>
              <Descriptions.Item label="下次跟进">
                {leadDetail.next_followup_at ? (
                  <span style={{ color: leadDetail.is_timeout ? '#ff4d4f' : '#1890ff' }}>
                    {dayjs(leadDetail.next_followup_at).format('YYYY-MM-DD HH:mm')}
                    {leadDetail.is_timeout && <Tag color="red" style={{ marginLeft: 8 }}>已超时</Tag>}
                  </span>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>

            {leadDetail.is_timeout && leadDetail.timeout_reason && (
              <>
                <Divider />
                <div>
                  <div style={{ color: '#ff4d4f', marginBottom: 4 }}><ClockCircleOutlined /> 超时原因</div>
                  <div style={{ color: '#666' }}>{leadDetail.timeout_reason}</div>
                </div>
              </>
            )}
          </Card>

          <Card title="操作历史" extra={<a>查看全部</a>}>
            <List
              size="small"
              dataSource={operationLogs.slice(0, 5)}
              renderItem={(log) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size="small" icon={<HistoryOutlined />} />}
                    title={
                      <span style={{ fontSize: 12 }}>
                        {log.user_name} {log.description}
                      </span>
                    }
                    description={
                      <span style={{ fontSize: 11 }}>
                        {dayjs(log.created_at).format('MM-DD HH:mm')}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
            {operationLogs.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 10 }}>
                暂无操作记录
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加跟进记录"
        open={followupModalVisible}
        onCancel={() => setFollowupModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={followupForm} layout="vertical" onFinish={handleFollowupSubmit}>
          <Form.Item
            name="followup_type"
            label="跟进方式"
            rules={[{ required: true, message: '请选择跟进方式' }]}
          >
            <Select placeholder="请选择">
              <Option value="phone">电话</Option>
              <Option value="wechat">微信</Option>
              <Option value="visit">到店</Option>
              <Option value="sms">短信</Option>
              <Option value="email">邮件</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="result"
            label="跟进结果"
            rules={[{ required: true, message: '请选择跟进结果' }]}
          >
            <Select placeholder="请选择">
              <Option value="interested">有意向</Option>
              <Option value="considering">考虑中</Option>
              <Option value="not_interested">无意向</Option>
              <Option value="no_answer">未接通</Option>
              <Option value="appointment">已预约</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请填写跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请详细描述跟进内容..." />
          </Form.Item>
          <Form.Item name="next_followup_at" label="下次跟进时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusSubmit}>
          <Form.Item
            name="status_id"
            label="新状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              {statuses.map(status => (
                <Option key={status.id} value={status.id}>{status.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认变更
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadDetail;
