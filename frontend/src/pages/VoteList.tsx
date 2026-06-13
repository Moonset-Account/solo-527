import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  DatePicker, message, Row, Col, Statistic, Progress, Popconfirm
} from 'antd';
import {
  PlusOutlined, EyeOutlined, PlayCircleOutlined,
  StopOutlined, CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Vote, VoteStatus, VoteType, VoteRule, User } from '../types';
import { voteApi, userApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const statusConfig: Record<VoteStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  ongoing: { label: '进行中', color: 'processing' },
  ended: { label: '已结束', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
};

const VoteList: React.FC = () => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [rules, setRules] = useState<VoteRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [voteOptions, setVoteOptions] = useState<{ text: string }[]>([{ text: '' }]);
  const [form] = Form.useForm();
  const [voteForm] = Form.useForm();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadVotes();
    loadRules();
    loadUsers();
  }, []);

  const loadVotes = async () => {
    setLoading(true);
    try {
      const data = await voteApi.getVotes() as any;
      setVotes(data);
    } catch (error) {
      message.error('加载投票列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const data = await voteApi.getRules() as any;
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userApi.getUsers() as any;
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateVote = async (values: any) => {
    try {
      await voteApi.createVote({
        ...values,
        options: voteOptions.filter(o => o.text),
        creatorId: currentUser.id,
        startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.endTime?.format('YYYY-MM-DD HH:mm:ss'),
      }) as any;
      message.success('创建投票成功');
      setModalVisible(false);
      form.resetFields();
      setVoteOptions([{ text: '' }]);
      loadVotes();
    } catch (error) {
      message.error('创建投票失败');
    }
  };

  const handleStartVote = async (id: string) => {
    try {
      await voteApi.startVote(id);
      message.success('投票已启动');
      loadVotes();
    } catch (error) {
      message.error('启动失败');
    }
  };

  const handleEndVote = async (id: string) => {
    Modal.confirm({
      title: '确认结束投票',
      content: '结束后无法继续投票，是否继续？',
      onOk: async () => {
        try {
          await voteApi.endVote(id);
          message.success('投票已结束');
          loadVotes();
        } catch (error) {
          message.error('结束失败');
        }
      },
    });
  };

  const handleCastVote = async (values: any) => {
    if (!selectedVote) return;
    try {
      await voteApi.castVote(selectedVote.id, {
        selectedOptions: values.selectedOptions,
        isAbstained: values.isAbstained || false,
        reason: values.reason,
        voterId: currentUser.id,
      });
      message.success('投票成功');
      setVoteModalVisible(false);
      voteForm.resetFields();
      loadVotes();
    } catch (error: any) {
      message.error(error.response?.data?.message || '投票失败');
    }
  };

  const addOption = () => {
    setVoteOptions([...voteOptions, { text: '' }]);
  };

  const removeOption = (index: number) => {
    const newOptions = [...voteOptions];
    newOptions.splice(index, 1);
    setVoteOptions(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...voteOptions];
    newOptions[index] = { text: value };
    setVoteOptions(newOptions);
  };

  const calculatePercentage = (count: number, total: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  };

  const columns = [
    {
      title: '投票标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: VoteType) => (
        <Tag>{type === 'single' ? '单选' : '多选'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: VoteStatus) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].label}</Tag>
      ),
    },
    {
      title: '投票进度',
      key: 'progress',
      render: (_: any, record: Vote) => (
        <div style={{ minWidth: 150 }}>
          <Progress
            percent={parseFloat(calculatePercentage(record.totalVotes, record.eligibleVoters))}
            size="small"
          />
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.totalVotes}/{record.eligibleVoters} 人已投票
          </span>
        </div>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator: User) => (
        <Space>
          <UserOutlined />
          {creator?.name}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Vote) => (
        <Space size="middle">
          {record.status === 'draft' && (
            <Button type="link" icon={<PlayCircleOutlined />} onClick={() => handleStartVote(record.id)}>
              启动
            </Button>
          )}
          {record.status === 'ongoing' && (
            <>
              <Button type="link" icon={<CheckCircleOutlined />} onClick={() => {
                setSelectedVote(record);
                setVoteModalVisible(true);
              }}>
                投票
              </Button>
              <Button type="link" danger icon={<StopOutlined />} onClick={() => handleEndVote(record.id)}>
                结束
              </Button>
            </>
          )}
          {record.status === 'ended' && (
            <Button type="link" onClick={() => {
              Modal.info({
                title: record.title,
                width: 600,
                content: (
                  <div>
                    <p style={{ marginBottom: 16 }}>{record.description}</p>
                    {record.options.map((opt, idx) => (
                      <div key={idx} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{opt.text}</span>
                          <span>{opt.count} 票 ({calculatePercentage(opt.count, record.totalVotes)}%)</span>
                        </div>
                        <Progress percent={parseFloat(calculatePercentage(opt.count, record.totalVotes))} showInfo={false} />
                      </div>
                    ))}
                    {record.allowAbstain && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>弃权</span>
                          <span>{record.abstainCount} 票 ({calculatePercentage(record.abstainCount, record.totalVotes)}%)</span>
                        </div>
                        <Progress percent={parseFloat(calculatePercentage(record.abstainCount, record.totalVotes))} showInfo={false} />
                      </div>
                    )}
                    <p style={{ marginTop: 16, color: '#8c8c8c' }}>
                      总投票数: {record.totalVotes} / 应有投票数: {record.eligibleVoters}
                    </p>
                  </div>
                ),
              });
            }}>
              查看结果
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const ongoingCount = votes.filter(v => v.status === 'ongoing').length;
  const endedCount = votes.filter(v => v.status === 'ended').length;
  const draftCount = votes.filter(v => v.status === 'draft').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">投票管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          创建投票
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <Statistic title="进行中" value={ongoingCount} valueStyle={{ color: '#1890ff' }} />
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <Statistic title="已结束" value={endedCount} valueStyle={{ color: '#52c41a' }} />
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <Statistic title="草稿" value={draftCount} valueStyle={{ color: '#8c8c8c' }} />
          </div>
        </Col>
      </Row>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={votes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="创建投票"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateVote}>
          <Form.Item name="title" label="投票标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入投票标题" />
          </Form.Item>
          <Form.Item name="description" label="投票说明" rules={[{ required: true, message: '请输入说明' }]}>
            <TextArea rows={3} placeholder="请输入投票说明" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="投票类型" initialValue="single">
                <Select>
                  <Option value="single">单选</Option>
                  <Option value="multiple">多选</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ruleId" label="投票规则">
                <Select placeholder="选择投票规则">
                  {rules.map(rule => (
                    <Option key={rule.id} value={rule.id}>{rule.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="投票选项">
            <div>
              {voteOptions.map((opt, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: 8 }}>
                  <Input
                    style={{ flex: 1, marginRight: 8 }}
                    value={opt.text}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`选项 ${index + 1}`}
                  />
                  {voteOptions.length > 1 && (
                    <Button danger onClick={() => removeOption(index)}>删除</Button>
                  )}
                </div>
              ))}
              <Button type="dashed" block onClick={addOption}>+ 添加选项</Button>
            </div>
          </Form.Item>
          <Form.Item name="allowAbstain" label="允许弃权" valuePropName="checked" initialValue={true}>
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`参与投票: ${selectedVote?.title}`}
        open={voteModalVisible}
        onCancel={() => setVoteModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedVote && (
          <Form form={voteForm} layout="vertical" onFinish={handleCastVote}>
            <p style={{ marginBottom: 16, color: '#595959' }}>{selectedVote.description}</p>
            
            <Form.Item name="selectedOptions" label="请选择" rules={[{ required: true, message: '请选择选项' }]}>
              {selectedVote.type === 'single' ? (
                <Select placeholder="请选择">
                  {selectedVote.options.map(opt => (
                    <Option key={opt.id} value={opt.id}>{opt.text}</Option>
                  ))}
                </Select>
              ) : (
                <Select mode="multiple" placeholder="请选择（可多选）">
                  {selectedVote.options.map(opt => (
                    <Option key={opt.id} value={opt.id}>{opt.text}</Option>
                  ))}
                </Select>
              )}
            </Form.Item>

            {selectedVote.allowAbstain && (
              <Form.Item name="isAbstained" label="弃权" valuePropName="checked">
                <Select>
                  <Option value={false}>否</Option>
                  <Option value={true}>是</Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item name="reason" label="备注（可选）">
              <TextArea rows={2} placeholder="填写投票理由或备注" />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={() => setVoteModalVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit">提交投票</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default VoteList;
