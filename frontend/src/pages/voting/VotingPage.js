import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Modal, Form, message, Tag, Row, Col, Card, Statistic, Progress } from 'antd';
import { VoteOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { votingAPI, topicsAPI } from '../../services/api';
import { formatDate, formatDateTime, getStatusBadge, handleApiError } from '../../utils/helpers';
import DataExportButton from '../../components/DataExportButton';

const { Search } = Input;
const { Option } = Select;

const VotingPage = () => {
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [votingStats, setVotingStats] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchTopics();
  }, [pagination.current, pagination.pageSize, searchText, topicFilter]);

  const fetchTopics = async () => {
    try {
      const response = await topicsAPI.list({ status: 'voting', page_size: 100 });
      setTopics(response.data.results || []);
    } catch (error) {
      console.error('加载议题失败:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText,
        topic: topicFilter,
      };
      const response = await votingAPI.list(params);
      setVotes(response.data.results || []);
      setPagination(prev => ({ ...prev, total: response.data.count || 0 }));
    } catch (error) {
      message.error(handleApiError(error, '加载投票记录失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = async (topicId) => {
    setSelectedTopic(topicId);
    try {
      const response = await votingAPI.getStatistics(topicId);
      setVotingStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleCastVote = async (values) => {
    try {
      await votingAPI.castVote(values);
      message.success('投票成功');
      setVoteModalVisible(false);
      form.resetFields();
      fetchData();
      if (selectedTopic) {
        handleTopicSelect(selectedTopic);
      }
    } catch (error) {
      message.error(handleApiError(error, '投票失败'));
    }
  };

  const columns = [
    {
      title: '议题',
      dataIndex: 'topic_title',
      key: 'topic_title',
    },
    {
      title: '投票人',
      dataIndex: 'voter_name',
      key: 'voter_name',
    },
    {
      title: '投票选项',
      dataIndex: 'vote',
      key: 'vote',
      render: (text) => (
        <Tag color={text === 'agree' ? 'green' : text === 'disagree' ? 'red' : 'orange'}>
          {text === 'agree' ? '赞成' : text === 'disagree' ? '反对' : '弃权'}
        </Tag>
      ),
    },
    {
      title: '资格异常',
      dataIndex: 'is_qualified_exception',
      key: 'is_qualified_exception',
      render: (text) => (
        text ? (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>是</Tag>
        ) : (
          <Tag color="green">否</Tag>
        )
      ),
    },
    {
      title: '异常原因',
      dataIndex: 'exception_reason',
      key: 'exception_reason',
      render: (text) => text || '-',
    },
    {
      title: '投票时间',
      dataIndex: 'voted_at',
      key: 'voted_at',
      render: formatDateTime,
    },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>投票管理</h2>
        </Col>
        <Col>
          <Space>
            <DataExportButton exportAPI={votingAPI.export} filename="投票记录.xlsx" />
            <Button 
              type="primary" 
              icon={<VoteOutlined />} 
              onClick={() => setVoteModalVisible(true)}
              disabled={!topics || topics.length === 0}
            >
              发起投票
            </Button>
          </Space>
        </Col>
      </Row>

      {topics.length > 0 && (
        <Card 
          title="当前投票议题" 
          style={{ marginBottom: 16 }}
          extra={
            <Select
              placeholder="选择议题查看统计"
              style={{ width: 300 }}
              value={selectedTopic || undefined}
              onChange={handleTopicSelect}
              allowClear
            >
              {topics.map(topic => (
                <Option key={topic.id} value={topic.id}>
                  {topic.title}
                </Option>
              ))}
            </Select>
          }
        >
          {votingStats && selectedTopic && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
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
              <Row gutter={16}>
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
              {votingStats.qualification_exceptions > 0 && (
                <div style={{ marginTop: 16, padding: 12, background: '#fff1f0', borderRadius: 4 }}>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  存在 {votingStats.qualification_exceptions} 条投票资格异常记录，已自动生成待办任务
                </div>
              )}
            </div>
          )}
          {!votingStats && (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              请选择一个议题查看投票统计
            </div>
          )}
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Search
            placeholder="搜索投票人姓名"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={(value) => { setSearchText(value); setPagination(prev => ({ ...prev, current: 1 })); }}
            onChange={(e) => !e.target.value && setSearchText('')}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Select
            placeholder="筛选议题"
            allowClear
            style={{ width: '100%' }}
            value={topicFilter || undefined}
            onChange={(value) => { setTopicFilter(value); setPagination(prev => ({ ...prev, current: 1 })); }}
          >
            {topics.map(topic => (
              <Option key={topic.id} value={topic.id}>{topic.title}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={votes}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={(page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))}
      />

      <Modal
        title="发起投票"
        open={voteModalVisible}
        onCancel={() => setVoteModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCastVote}>
          <Form.Item 
            name="topic" 
            label="选择议题" 
            rules={[{ required: true, message: '请选择议题' }]}
          >
            <Select placeholder="请选择投票议题">
              {topics.map(topic => (
                <Option key={topic.id} value={topic.id}>{topic.title}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item 
            name="resident" 
            label="居民ID" 
            rules={[{ required: true, message: '请输入居民ID' }]}
          >
            <Input placeholder="请输入居民ID" type="number" />
          </Form.Item>
          <Form.Item 
            name="vote" 
            label="投票选项" 
            rules={[{ required: true, message: '请选择投票选项' }]}
          >
            <Select placeholder="请选择">
              <Option value="agree">赞成</Option>
              <Option value="disagree">反对</Option>
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

export default VotingPage;
