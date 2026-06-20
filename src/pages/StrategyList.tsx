import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Row,
  Col,
  Card,
  Tag,
  message,
  Switch,
  Typography,
  Modal,
  Descriptions,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { strategiesApi } from '@/api';
import type { Strategy, StrategyStatus } from '../../shared/types';
import { STRATEGY_STATUS_LABELS } from '../../shared/types';
import { StatusTag } from '@/components/StatusTag';
import { useUserStore } from '@/store/user';

const { Option } = Select;
const { Title, Text } = Typography;

const StrategyList: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);

  const [data, setData] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    strategy: Strategy | null;
  }>({ visible: false, strategy: null });

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const result = await strategiesApi.getList({
        page,
        pageSize,
        status: values.status,
        keyword: values.keyword,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    loadData();
  };

  const handleToggle = async (id: string, checked: boolean) => {
    try {
      await strategiesApi.toggle(id);
      message.success(checked ? '策略已启用' : '策略已停用');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const viewDetail = (strategy: Strategy) => {
    setDetailModal({ visible: true, strategy });
  };

  const columns: ColumnsType<Strategy> = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: StrategyStatus, record) => (
        <Space>
          <Switch
            size="small"
            checked={status === 'ACTIVE'}
            onChange={(checked) => handleToggle(record.id, checked)}
          />
          <StatusTag type="strategyStatus" value={status} />
        </Space>
      ),
    },
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v) => <Tag color="blue">v{v}</Tag>,
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/strategies/${record.id}/edit`)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <Space>
                <SettingOutlined style={{ color: '#1890ff' }} />
                策略配置管理
              </Space>
            </Title>
            <Text type="secondary">管理设备告警的触发条件和自动响应策略</Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/strategies/create')}
            >
              新建策略
            </Button>
          </Col>
        </Row>

        <Form form={form} layout="inline">
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 150 }}>
              {(Object.keys(STRATEGY_STATUS_LABELS) as StrategyStatus[]).map((status) => (
                <Option key={status} value={status}>
                  {STRATEGY_STATUS_LABELS[status]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="策略名称/描述" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="策略详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, strategy: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, strategy: null })}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              if (detailModal.strategy) {
                navigate(`/strategies/${detailModal.strategy.id}/edit`);
                setDetailModal({ visible: false, strategy: null });
              }
            }}
          >
            编辑策略
          </Button>,
        ]}
        width={700}
      >
        {detailModal.strategy && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <StatusTag type="strategyStatus" value={detailModal.strategy.status} />
              <Tag color="blue">v{detailModal.strategy.version}</Tag>
            </Space>
            <Title level={5} style={{ marginBottom: 16 }}>
              {detailModal.strategy.name}
            </Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="描述">
                {detailModal.strategy.description}
              </Descriptions.Item>
              <Descriptions.Item label="触发条件">
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    margin: 0,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(detailModal.strategy.triggerCondition, null, 2)}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="执行动作">
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    margin: 0,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(detailModal.strategy.action, null, 2)}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {detailModal.strategy.createdByName}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detailModal.strategy.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(detailModal.strategy.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StrategyList;
