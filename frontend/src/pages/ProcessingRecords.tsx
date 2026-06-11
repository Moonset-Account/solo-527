import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Input, Select, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { recruitmentApi } from '../api/recruitment';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const ProcessingRecords: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionTypeFilter, setActionTypeFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadRecords();
  }, [page, pageSize, actionTypeFilter, keyword]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await recruitmentApi.getProcessingRecords({
        actionType: actionTypeFilter,
        page,
        pageSize,
      });
      if (res.success) {
        setData(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionTypeMap: Record<string, { label: string; color: string }> = {
    submit: { label: '提交', color: 'blue' },
    status_change: { label: '状态变更', color: 'orange' },
    score_update: { label: '评分更新', color: 'purple' },
    interview_schedule: { label: '面试安排', color: 'cyan' },
    interview_complete: { label: '面试完成', color: 'green' },
    dispute_raise: { label: '争议提起', color: 'red' },
    dispute_resolve: { label: '争议解决', color: 'gold' },
  };

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 120,
      render: (type: string) => {
        const info = actionTypeMap[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 100,
    },
    {
      title: '操作详情',
      dataIndex: 'actionDetail',
      key: 'actionDetail',
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text: string) => text || '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>处理记录</Title>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索候选人"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="操作类型"
            value={actionTypeFilter}
            onChange={(value) => setActionTypeFilter(value)}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(actionTypeMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.label}</Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default ProcessingRecords;
