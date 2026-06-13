import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Descriptions, Tag, Button, Space, Modal,
  Form, Input, Select, Upload, message, Tabs, List, Avatar,
  Divider, Empty, Timeline
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, UploadOutlined,
  PaperClipOutlined, MessageOutlined, HistoryOutlined,
  EnvironmentOutlined, UserOutlined, ClockCircleOutlined,
  CheckCircleOutlined, FileOutlined, DeleteOutlined
} from '@ant-design/icons';
import { Event, Attachment, Note, History, EventStatus, EventType, User } from '../types';
import { eventApi } from '../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;

const typeConfig: Record<EventType, { label: string; color: string }> = {
  rectification: { label: '整改复查', color: 'orange' },
  vote: { label: '议题投票', color: 'blue' },
  patrol: { label: '巡逻任务', color: 'green' },
};

const statusConfig: Record<EventStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  reviewing: { label: '复查中', color: 'warning' },
  voting: { label: '投票中', color: 'blue' },
  completed: { label: '已完成', color: 'success' },
  closed: { label: '已关闭', color: 'default' },
};

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [noteForm] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (id) {
      loadEventDetail();
    }
  }, [id]);

  const loadEventDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [eventData, attachmentsData, notesData, historiesData] = await Promise.all([
        eventApi.getEvent(id) as any,
        eventApi.getAttachments(id) as any,
        eventApi.getNotes(id) as any,
        eventApi.getHistories(id) as any,
      ]);
      setEvent(eventData);
      setAttachments(attachmentsData);
      setNotes(notesData);
      setHistories(historiesData);
    } catch (error) {
      message.error('加载事件详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (values: any) => {
    if (!id) return;
    try {
      const updateData = {
        ...values,
        operatorId: currentUser.id,
        deadline: values.deadline ? dayjs(values.deadline).format('YYYY-MM-DD HH:mm:ss') : undefined,
      };
      await eventApi.updateEvent(id, updateData);
      message.success('更新成功');
      setEditModalVisible(false);
      loadEventDetail();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleAddNote = async (values: any) => {
    if (!id) return;
    try {
      await eventApi.addNote({
        eventId: id,
        content: values.content,
        creatorId: currentUser.id,
      });
      message.success('添加备注成功');
      setNoteModalVisible(false);
      noteForm.resetFields();
      loadEventDetail();
    } catch (error) {
      message.error('添加备注失败');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!id) return;
    try {
      await eventApi.uploadAttachment(id, currentUser.id, file);
      message.success('上传成功');
      loadEventDetail();
    } catch (error) {
      message.error('上传失败');
    }
  };

  const handleUpdateStatus = async (status: EventStatus) => {
    if (!id) return;
    try {
      await eventApi.updateEvent(id, { status, operatorId: currentUser.id });
      message.success('状态更新成功');
      loadEventDetail();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleRectification = async () => {
    if (!id) return;
    Modal.confirm({
      title: '整改确认',
      content: '确认已完成整改？',
      onOk: async () => {
        try {
          await eventApi.updateEvent(id, {
            isRectified: true,
            status: 'reviewing',
            operatorId: currentUser.id,
          });
          message.success('整改已提交复查');
          loadEventDetail();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  if (!event && !loading) {
    return <Empty description="事件不存在" />;
  }

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h1 className="page-title">事件详情</h1>
        </Space>
        <Space>
          {event?.status === 'pending' && (
            <Button type="primary" onClick={() => handleUpdateStatus('processing')}>
              开始处理
            </Button>
          )}
          {event?.status === 'processing' && event?.type === 'rectification' && (
            <Button type="primary" onClick={handleRectification}>
              提交整改
            </Button>
          )}
          {event?.status === 'reviewing' && (
            <Button type="primary" onClick={() => handleUpdateStatus('completed')}>
              复查通过
            </Button>
          )}
          {event?.status === 'completed' && (
            <Button onClick={() => handleUpdateStatus('closed')}>
              关闭事件
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => {
            form.setFieldsValue({
              title: event?.title,
              description: event?.description,
              assigneeId: event?.assigneeId,
              deadline: event?.deadline ? dayjs(event.deadline) : null,
              status: event?.status,
              gridArea: event?.gridArea,
              location: event?.location,
              latitude: event?.latitude,
              longitude: event?.longitude,
              reviewResult: event?.reviewResult,
              rectificationResult: event?.rectificationResult,
            });
            setEditModalVisible(true);
          }}>
            编辑
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card loading={loading} className="operation-panel">
            <div className="panel-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{event?.title}</h2>
                <Space>
                  <Tag color={typeConfig[event?.type as EventType]?.color}>
                    {typeConfig[event?.type as EventType]?.label}
                  </Tag>
                  <Tag color={statusConfig[event?.status as EventStatus]?.color} className="status-tag">
                    {statusConfig[event?.status as EventStatus]?.label}
                  </Tag>
                </Space>
              </div>
              
              <p style={{ color: '#595959', lineHeight: 1.8, marginBottom: 16 }}>
                {event?.description}
              </p>

              <Descriptions column={2} size="small">
                <Descriptions.Item label="上报人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {event?.reporter?.name}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="负责人">
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {event?.assignee?.name || '未分配'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="位置">
                  <Space>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    {event?.location || event?.gridArea || '未设置'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="网格区域">
                  {event?.gridArea || '未设置'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  <Space>
                    <ClockCircleOutlined />
                    {event?.createdAt ? dayjs(event.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="截止时间">
                  <Space>
                    <ClockCircleOutlined />
                    {event?.deadline ? dayjs(event.deadline).format('YYYY-MM-DD HH:mm') : '未设置'}
                  </Space>
                </Descriptions.Item>
                {event?.reviewTime && (
                  <Descriptions.Item label="复查时间">
                    {dayjs(event.reviewTime).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                )}
                {event?.isRectified && (
                  <Descriptions.Item label="整改状态">
                    <Tag color="success"><CheckCircleOutlined /> 已整改</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {event?.reviewResult && (
                <>
                  <Divider />
                  <div>
                    <h4 style={{ marginBottom: 8 }}>复查结果</h4>
                    <p style={{ background: '#f6ffed', padding: 12, borderRadius: 4, margin: 0 }}>
                      {event.reviewResult}
                    </p>
                  </div>
                </>
              )}

              {event?.rectificationResult && (
                <>
                  <Divider />
                  <div>
                    <h4 style={{ marginBottom: 8 }}>整改结果</h4>
                    <p style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, margin: 0 }}>
                      {event.rectificationResult}
                    </p>
                  </div>
                </>
              )}
            </div>

            <Tabs defaultActiveKey="attachments" size="large">
              <TabPane
                tab={
                  <span>
                    <PaperClipOutlined />
                    附件 ({attachments.length})
                  </span>
                }
                key="attachments"
              >
                <div style={{ marginBottom: 16 }}>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    上传附件
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  />
                </div>
                {attachments.length === 0 ? (
                  <Empty description="暂无附件" />
                ) : (
                  <List
                    dataSource={attachments}
                    renderItem={(item) => (
                      <div className="attachment-item" key={item.id}>
                        <FileOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                        <span className="attachment-name">{item.originalName}</span>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => window.open(`/${item.path}`, '_blank')}
                        >
                          下载
                        </Button>
                        <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 12 }}>
                          {(item.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                  />
                )}
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <MessageOutlined />
                    备注 ({notes.length})
                  </span>
                }
                key="notes"
              >
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<MessageOutlined />}
                    onClick={() => setNoteModalVisible(true)}
                  >
                    添加备注
                  </Button>
                </div>
                {notes.length === 0 ? (
                  <Empty description="暂无备注" />
                ) : (
                  <List
                    dataSource={notes}
                    renderItem={(item) => (
                      <div className="note-item" key={item.id}>
                        <div className="note-meta">
                          <Space>
                            <Avatar size="small" icon={<UserOutlined />} />
                            <strong>{item.creator?.name}</strong>
                            <span style={{ color: '#8c8c8c' }}>
                              {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                            </span>
                          </Space>
                        </div>
                        <p style={{ margin: 0, color: '#595959' }}>{item.content}</p>
                      </div>
                    )}
                  />
                )}
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <HistoryOutlined />
                    修改历史 ({histories.length})
                  </span>
                }
                key="histories"
              >
                {histories.length === 0 ? (
                  <Empty description="暂无修改记录" />
                ) : (
                  <Timeline
                    items={histories.map((item) => ({
                      color: item.action.includes('创建') ? 'green' :
                             item.action.includes('删除') ? 'red' : 'blue',
                      children: (
                        <div className="history-item">
                          <div className="history-action">{item.action}</div>
                          <div className="history-meta">
                            <Space>
                              <Avatar size="small" icon={<UserOutlined />} />
                              {item.operator?.name}
                              <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                            </Space>
                          </div>
                          {item.changes && (
                            <div className="history-changes">变更内容: {item.changes}</div>
                          )}
                        </div>
                      ),
                    }))}
                  />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="事件闭环流程" className="operation-panel">
            <Timeline
              items={[
                {
                  color: event?.createdAt ? 'green' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>上报事件</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {event?.createdAt ? dayjs(event.createdAt).format('YYYY-MM-DD HH:mm') : '未完成'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: event?.status !== 'pending' ? 'green' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>开始处理</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {event?.status !== 'pending' ? '已完成' : '待处理'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: event?.isRectified ? 'green' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>整改完成</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {event?.isRectified ? '已完成' : '待整改'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: event?.reviewTime ? 'green' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>复查通过</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {event?.reviewTime ? dayjs(event.reviewTime).format('YYYY-MM-DD HH:mm') : '待复查'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: event?.status === 'closed' ? 'green' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>事件关闭</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {event?.status === 'closed' ? '已关闭' : '进行中'}
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          {event?.location && (
            <Card title="位置信息" style={{ marginTop: 16 }}>
              <div style={{ background: '#f0f2f5', padding: 16, borderRadius: 4, textAlign: 'center' }}>
                <EnvironmentOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                <p style={{ margin: 0 }}>{event.location}</p>
                {event.latitude && event.longitude && (
                  <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
                    坐标: {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="编辑事件"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateEvent}>
          <Form.Item name="title" label="事件标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="事件描述" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <Select.Option key={value} value={value}>{config.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assigneeId" label="负责人">
                <Select placeholder="选择负责人">
                  {event?.assignee && (
                    <Select.Option value={event.assignee.id}>{event.assignee.name}</Select.Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="deadline" label="截止时间">
            <Input />
          </Form.Item>
          <Form.Item name="reviewResult" label="复查结果">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="rectificationResult" label="整改结果">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加备注"
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        footer={null}
      >
        <Form form={noteForm} layout="vertical" onFinish={handleAddNote}>
          <Form.Item name="content" label="备注内容" rules={[{ required: true, message: '请输入备注内容' }]}>
            <TextArea rows={4} placeholder="请输入备注内容..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setNoteModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventDetail;
