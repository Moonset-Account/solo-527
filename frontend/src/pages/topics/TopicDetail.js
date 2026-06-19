import React, { useState, useEffect } from 'react';
import { Descriptions, Card, Tag, Button, Modal, Form, Input, Select, message, List, Space, Row, Col, Statistic, Progress } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { topicsAPI, votingAPI } from '../../services/api';
import { formatDate, formatDateTime, getStatusBadge, handleApiError } from '../../utils/helpers';
import ProcessRecordList from '../../components/ProcessRecordList';

const { Option } = Select;

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState(null);
  const [processRecords, setProcessRecords] = useState([]);
  const [votingStats, setVotingStats] = useState(null);
  const [votes, setVotes] = useState([]);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [voteForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detailRes, recordsRes, statsRes, votesRes] = await Promise.all([
        topicsAPI.detail(id),
        topicsAPI.getProcessRecords(id),
        votingAPI.getStatistics(id).catch(() => ({ data: null })),
        votingAPI.list({ topic: id, page_size: 100 }).catch(() => ({ data: { results: [] } })),
      ]);
      setTopic(detailRes.data);
      setProcessRecords(recordsRes.data.results || recordsRes.data || []);
      setVotingStats(statsRes.data);
      setVotes(votesRes.data.results || []);
    } catch (error) {
      message.error(handleApiError(error, '加载议题详情失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (values) => {
    try {
      await topicsAPI.addProcessRecord(id, values);
      message.success('添加记录成功');
      setRecordModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '添加记录失败'));
    }
  };

  const handleCastVote = async (values) => {
    try {
      await votingAPI.castVote({
        topic_id: id,
        vote: values.vote,
        is_anonymous: false,
      });
      message.success('投票成功');
      setVoteModalVisible(false);
      voteForm.resetFields();
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '投票失败'));
    }
  };

  const handleStatusChange = async (action) => {
    try {
      await topicsAPI.changeStatus(id, action, {});
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      message.error(handleApiError(error, '状态更新失败'));
    }
  };

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }

  if (!topic) {
    return <div>未找到议题信息</div>;
  }

  const statusBadge = getStatusBadge(topic.status);

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/topics')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card 
        title="议题详情" 
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            {topic.status === 'draft' && (
              <Button type="primary" onClick={() => handleStatusChange('submit')}>
                提交审核
              </Button>
            )}
            {topic.status === 'pending' && (
              <>
                <Button type="primary" icon={<CheckOutlined />} onClick={() => handleStatusChange('approve')}>
                  通过
                </Button>
                <Button danger icon={<CloseOutlined />} onClick={() => handleStatusChange('reject')}>
                  拒绝
                </Button>
              </>
            )}
            {topic.status === 'approved' && (
              <Button type="primary" onClick={() => handleStatusChange('start_voting')}>
                开始投票
              </Button>
            )}
            {topic.status === 'voting' && (
              <Button type="primary" onClick={() => setVoteModalVisible(true)}>
                参与投票
              </Button>
            )}
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="标题">{topic.title}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag className={statusBadge.class}>{statusBadge.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="发起人">{topic.author_name || topic.author?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(topic.created_at)}</Descriptions.Item>
          <Descriptions.Item label="投票开始">{formatDate(topic.voting_start_date)}</Descriptions.Item>
          <Descriptions.Item label="投票结束">{formatDate(topic.voting_end_date)}</Descriptions.Item>
          <Descriptions.Item label="议题内容" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{topic.description}</div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {votingStats && (
        <Card title="投票统计" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic title="总票数" value={votingStats.total_votes || 0} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="赞成票" value={votingStats.agree_votes || 0} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="反对票" value={votingStats.disagree_votes || 0} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="弃权票" value={votingStats.abstain_votes || 0} />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>
                投票率：{((votingStats.voting_rate || 0) * 100).toFixed(1)}%
              </div>
              <Progress percent={Math.round((votingStats.voting_rate || 0) * 100)} />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>
                赞成率：{((votingStats.agree_rate || 0) * 100).toFixed(1)}%
              </div>
              <Progress percent={Math.round((votingStats.agree_rate || 0) * 100)} status="success" />
            </Col>
          </Row>
        </Card>
      )}

      {votes.length > 0 && (
        <Card title="投票记录" style={{ marginBottom: 16 }}>
          <List
            dataSource={votes}
            renderItem={(vote) => (
              <List.Item>
                <List.Item.Meta
                  title={vote.voter_name || vote.voter?.name || '未知选民'}
                  description={
                    <Space>
                      <span>{formatDateTime(vote.voted_at)}</span>
                      {vote.is_qualified_exception && (
                        <Tag color="red">资格异常</Tag>
                      )}
                    </Space>
                  }
                />
                <Tag color={vote.vote === 'yes' ? 'green' : vote.vote === 'no' ? 'red' : 'orange'}>
                  {vote.vote === 'yes' ? '赞成' : vote.vote === 'no' ? '反对' : '弃权'}
                </Tag>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card 
        title="处理记录" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setRecordModalVisible(true)}
          >
            添加记录
          </Button>
        }
      >
        <ProcessRecordList records={processRecords} />
      </Card>

      <Modal
        title="添加处理记录"
        open={recordModalVisible}
        onCancel={() => setRecordModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddRecord}>
          <Form.Item 
            name="content" 
            label="处理内容" 
            rules={[{ required: true, message: '请输入处理内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入处理内容" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setRecordModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="参与投票"
        open={voteModalVisible}
        onCancel={() => setVoteModalVisible(false)}
        footer={null}
      >
        <Form form={voteForm} layout="vertical" onFinish={handleCastVote}>
          <Form.Item 
            name="vote" 
            label="投票选项" 
            rules={[{ required: true, message: '请选择投票选项' }]}
          >
            <Select placeholder="请选择">
              <Option value="yes">赞成</Option>
              <Option value="no">反对</Option>
              <Option value="abstain">弃权</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setVoteModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交投票</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TopicDetail;
