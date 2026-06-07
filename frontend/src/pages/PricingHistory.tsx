import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Input,
  Button,
  Space,
  Select,
  message,
  Descriptions,
  Modal,
} from 'antd';
import { SearchOutlined, BarChartOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { pricingAPI } from '../services/api';
import { PricingHistory, CONDITIONS, CONDITION_COLORS } from '../types';

const PricingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [histories, setHistories] = useState<PricingHistory[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<PricingHistory[]>([]);
  const [isbnKeyword, setIsbnKeyword] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const allHistories: PricingHistory[] = [];
      
      const versionsData = await pricingAPI.getVersions();
      setVersions(versionsData);
      
      const dummyIsbns = ['9787544270878', '9787111213826', '9787544291189'];
      for (const isbn of dummyIsbns) {
        try {
          const data = await pricingAPI.getHistory(isbn);
          allHistories.push(...data);
        } catch (e) {
          // skip
        }
      }
      
      setHistories(allHistories);
      setFilteredHistories(allHistories);
    } catch (error) {
      console.error('获取改价记录失败:', error);
      message.error('获取改价记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  useEffect(() => {
    let filtered = histories;
    if (isbnKeyword) {
      filtered = filtered.filter((h) => h.isbn.includes(isbnKeyword));
    }
    if (conditionFilter) {
      filtered = filtered.filter((h) => h.condition === conditionFilter);
    }
    setFilteredHistories(filtered);
  }, [isbnKeyword, conditionFilter, histories]);

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 180,
      render: (text: string) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
      width: 150,
      render: (text: string, record: PricingHistory) => (
        <Button
          type="link"
          icon={<BookOutlined />}
          onClick={() => navigate(`/book/${record.isbn}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '品相',
      dataIndex: 'condition',
      key: 'condition',
      width: 100,
      render: (text: string) => <Tag color={CONDITION_COLORS[text]}>{text}</Tag>,
    },
    {
      title: '改前价格',
      dataIndex: 'old_price',
      key: 'old_price',
      width: 100,
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '改后价格',
      dataIndex: 'new_price',
      key: 'new_price',
      width: 100,
      render: (val: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>¥{val.toFixed(2)}</span>
      ),
    },
    {
      title: '价格变动',
      dataIndex: 'price_change',
      key: 'price_change',
      width: 100,
      render: (val: number) => {
        const color = val > 0 ? '#52c41a' : val < 0 ? '#f5222d' : '#666';
        const sign = val > 0 ? '+' : '';
        return <span style={{ color, fontWeight: 'bold' }}>{sign}¥{val.toFixed(2)}</span>;
      },
    },
    {
      title: '变动比例',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 100,
      render: (val?: number) => {
        if (val === undefined || val === null) return '-';
        const color = val > 0 ? '#52c41a' : val < 0 ? '#f5222d' : '#666';
        const sign = val > 0 ? '+' : '';
        return <span style={{ color, fontWeight: 'bold' }}>{sign}{val.toFixed(2)}%</span>;
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '生效时间',
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '改价原因',
      dataIndex: 'change_reason',
      key: 'change_reason',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: PricingHistory) => (
        <Button
          type="link"
          icon={<BarChartOutlined />}
          onClick={() => navigate(`/book/${record.isbn}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const versionColumns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: '生效时间',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '变更数量',
      dataIndex: 'change_count',
      key: 'change_count',
      render: (val: number) => `${val} 条`,
    },
  ];

  return (
    <div>
      <Card
        title="改价记录查询"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Input
              placeholder="搜索ISBN"
              prefix={<SearchOutlined />}
              value={isbnKeyword}
              onChange={(e) => setIsbnKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="按品相筛选"
              value={conditionFilter}
              onChange={setConditionFilter}
              style={{ width: 150 }}
              allowClear
              options={CONDITIONS}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredHistories}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条改价记录`,
          }}
        />
      </Card>

      <Card title="定价版本统计">
        <Table
          columns={versionColumns}
          dataSource={versions}
          rowKey="version"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default PricingHistoryPage;
