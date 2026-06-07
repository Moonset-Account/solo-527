import React from 'react';
import { Table, Tag, Button, Space, Tooltip, Modal } from 'antd';
import { EyeOutlined, ExclamationCircleOutlined, BookOutlined } from '@ant-design/icons';
import { PriceScatterData, CONDITION_COLORS } from '../types';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface RecordsTableProps {
  data: PriceScatterData[];
  loading?: boolean;
  onViewRecord?: (record: PriceScatterData) => void;
}

const RecordsTable: React.FC<RecordsTableProps> = ({ data, loading, onViewRecord }) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: '记录编号',
      dataIndex: 'record_no',
      key: 'record_no',
      width: 140,
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
      width: 140,
      render: (text: string, record: PriceScatterData) => (
        <Button
          type="link"
          icon={<BookOutlined />}
          onClick={() => navigate(`/book/${record.isbn}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '书名',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '品相',
      dataIndex: 'condition',
      key: 'condition',
      width: 100,
      render: (text: string) => (
        <Tag color={CONDITION_COLORS[text]}>{text}</Tag>
      ),
    },
    {
      title: '回收价',
      dataIndex: 'recycle_price',
      key: 'recycle_price',
      width: 100,
      render: (val: number, record: PriceScatterData) => (
        <span style={{ color: record.is_abnormal ? '#f5222d' : 'inherit', fontWeight: record.is_abnormal ? 'bold' : 'normal' }}>
          ¥{val.toFixed(2)}
        </span>
      ),
    },
    {
      title: '建议价',
      dataIndex: 'suggested_price',
      key: 'suggested_price',
      width: 100,
      render: (val?: number) => (val ? `¥${val.toFixed(2)}` : '-'),
    },
    {
      title: '成交价',
      dataIndex: 'sale_price',
      key: 'sale_price',
      width: 100,
      render: (val?: number) => (val ? `¥${val.toFixed(2)}` : '未售出'),
    },
    {
      title: '毛利率',
      dataIndex: 'profit_margin',
      key: 'profit_margin',
      width: 90,
      render: (val?: number) => {
        if (val === undefined || val === null) return '-';
        const color = val >= 30 ? '#52c41a' : val >= 15 ? '#1890ff' : val > 0 ? '#faad14' : '#f5222d';
        return <span style={{ color, fontWeight: 'bold' }}>{val.toFixed(2)}%</span>;
      },
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
    },
    {
      title: '在库天数',
      dataIndex: 'days_in_stock',
      key: 'days_in_stock',
      width: 100,
      render: (val: number) => {
        const color = val > 30 ? '#f5222d' : val > 15 ? '#faad14' : '#52c41a';
        return <span style={{ color, fontWeight: 'bold' }}>{val}天</span>;
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, record: PriceScatterData) => (
        <Space>
          {record.is_abnormal && (
            <Tooltip title="价格异常">
              <Tag icon={<ExclamationCircleOutlined />} color="red" className="abnormal-tag">
                异常
              </Tag>
            </Tooltip>
          )}
          {record.is_set && (
            <Tooltip title="套装书">
              <Tag color="blue">套装</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: PriceScatterData) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            if (onViewRecord) {
              onViewRecord(record);
            } else {
              Modal.info({
                title: `记录详情 - ${record.record_no}`,
                width: 600,
                content: (
                  <div style={{ lineHeight: 2 }}>
                    <p><strong>ISBN:</strong> {record.isbn}</p>
                    <p><strong>书名:</strong> {record.title}</p>
                    <p><strong>品相:</strong> {record.condition}</p>
                    <p><strong>回收价:</strong> ¥{record.recycle_price.toFixed(2)}</p>
                    <p><strong>建议回收价:</strong> {record.suggested_price ? `¥${record.suggested_price.toFixed(2)}` : '-'}</p>
                    <p><strong>成交价:</strong> {record.sale_price ? `¥${record.sale_price.toFixed(2)}` : '未售出'}</p>
                    <p><strong>毛利率:</strong> {record.profit_margin ? record.profit_margin.toFixed(2) + '%' : '-'}</p>
                    <p><strong>回收渠道:</strong> {record.channel}</p>
                    <p><strong>在库天数:</strong> {record.days_in_stock}天</p>
                    <p><strong>是否套装:</strong> {record.is_set ? '是' : '否'}</p>
                    <p><strong>是否异常:</strong> {record.is_abnormal ? '是' : '否'}</p>
                  </div>
                ),
              });
            }
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="record_no"
      loading={loading}
      scroll={{ x: 1300 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条记录`,
      }}
    />
  );
};

export default RecordsTable;
