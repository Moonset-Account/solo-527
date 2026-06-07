import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Spin, Tag, Statistic, Row, Col, Input } from 'antd';
import { DownloadOutlined, WarningOutlined, SearchOutlined } from '@ant-design/icons';
import { useFilterStore } from '@/store/useFilterStore';
import { apiService } from '@/services/api';
import { ChurnWarningResponse, ChurnMember } from '@/types';

const { Search } = Input;

const ChurnWarningList: React.FC = () => {
  const { filters } = useFilterStore();
  const [data, setData] = useState<ChurnWarningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getChurnWarning(filters, 200);
      setData(result);
    } catch (error) {
      console.error('加载流失预警失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = apiService.exportChurnWarning(filters);
    window.open(url, '_blank');
  };

  const getRiskTag = (level: string) => {
    const colorMap: Record<string, string> = {
      '高风险': 'red',
      '中风险': 'gold',
      '低风险': 'green',
    };
    return <Tag color={colorMap[level]}>{level}</Tag>;
  };

  const filteredMembers = data?.members?.filter(m => 
    m.name.includes(searchText) || 
    m.member_type.includes(searchText) ||
    m.store.includes(searchText)
  ) || [];

  const columns = [
    {
      title: '会员ID',
      dataIndex: 'member_id',
      key: 'member_id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Search
            placeholder="搜索姓名"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={confirm}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={confirm} size="small">
              确定
            </Button>
            <Button onClick={clearFilters} size="small">
              重置
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value: any, record: ChurnMember) => 
        record.name.includes(value as string),
    },
    {
      title: '会员类型',
      dataIndex: 'member_type',
      key: 'member_type',
    },
    {
      title: '所属门店',
      dataIndex: 'store',
      key: 'store',
    },
    {
      title: '入会日期',
      dataIndex: 'join_date',
      key: 'join_date',
    },
    {
      title: '最后训练',
      dataIndex: 'last_checkin',
      key: 'last_checkin',
    },
    {
      title: '未训练天数',
      dataIndex: 'days_inactive',
      key: 'days_inactive',
      sorter: (a: ChurnMember, b: ChurnMember) => a.days_inactive - b.days_inactive,
      render: (days: number) => (
        <span style={{ 
          color: days >= 30 ? '#ff4d4f' : days >= 14 ? '#faad14' : 'inherit',
          fontWeight: 500 
        }}>
          {days} 天
        </span>
      ),
    },
    {
      title: '周均频次',
      dataIndex: 'avg_weekly_freq',
      key: 'avg_weekly_freq',
      render: (freq: number) => `${freq.toFixed(1)} 次/周`,
      sorter: (a: ChurnMember, b: ChurnMember) => a.avg_weekly_freq - b.avg_weekly_freq,
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: getRiskTag,
      filters: [
        { text: '高风险', value: '高风险' },
        { text: '中风险', value: '中风险' },
        { text: '低风险', value: '低风险' },
      ],
      onFilter: (value: any, record: ChurnMember) => record.risk_level === value,
    },
  ];

  if (loading) {
    return (
      <div className="card-section" style={{ textAlign: 'center', padding: '40px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="card-section">
      <div className="card-header">
        <div className="card-title">
          <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          流失预警列表
          {data && (
            <span className="warning-badge">
              共 {data.high_risk_count + data.medium_risk_count + data.low_risk_count} 人
            </span>
          )}
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出全部
          </Button>
        </Space>
      </div>

      {data?.warnings?.map((warning, idx) => (
        <div key={idx} className="sample-warning">
          ⚠️ {warning}
        </div>
      ))}

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="高风险流失"
            value={data?.high_risk_count || 0}
            valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
            prefix={<WarningOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="中风险流失"
            value={data?.medium_risk_count || 0}
            valueStyle={{ color: '#faad14', fontSize: 20 }}
            prefix={<WarningOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="低风险流失"
            value={data?.low_risk_count || 0}
            valueStyle={{ color: '#52c41a', fontSize: 20 }}
            prefix={<WarningOutlined />}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredMembers}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="member_id"
        size="middle"
      />
    </div>
  );
};

export default ChurnWarningList;
