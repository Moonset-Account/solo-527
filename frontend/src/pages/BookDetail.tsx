import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  message,
  Space,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  HistoryOutlined,
  BookOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { booksAPI, pricingAPI, recycleRecordsAPI } from '../services/api';
import {
  Book,
  RecycleRecord,
  PricingHistory,
  PriceComparison,
  CONDITIONS,
  CONDITION_COLORS,
} from '../types';

const BookDetail: React.FC = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [records, setRecords] = useState<RecycleRecord[]>([]);
  const [histories, setHistories] = useState<PricingHistory[]>([]);
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchBook = async () => {
    if (!isbn) return;
    try {
      const data = await booksAPI.getBookByIsbn(isbn);
      setBook(data);
    } catch (error) {
      console.error('获取书籍信息失败:', error);
      message.error('获取书籍信息失败');
    }
  };

  const fetchRecords = async () => {
    if (!isbn) return;
    try {
      const data = await recycleRecordsAPI.getRecords({ isbn, limit: 100 });
      setRecords(data);
    } catch (error) {
      console.error('获取回收记录失败:', error);
    }
  };

  const fetchHistory = async () => {
    if (!isbn) return;
    try {
      const data = await pricingAPI.getHistory(isbn);
      setHistories(data);
    } catch (error) {
      console.error('获取定价历史失败:', error);
    }
  };

  const fetchComparison = async () => {
    if (!isbn) return;
    try {
      const data = await pricingAPI.getComparison(isbn);
      setComparisons(data);
    } catch (error) {
      console.error('获取价格对比失败:', error);
    }
  };

  useEffect(() => {
    fetchBook();
    fetchRecords();
    fetchHistory();
    fetchComparison();
  }, [isbn]);

  const handleUpdatePrice = () => {
    if (!book) return;
    form.resetFields();
    setPriceModalVisible(true);
  };

  const handlePriceSubmit = async (values: any) => {
    if (!book) return;
    setLoading(true);
    try {
      await pricingAPI.updatePrice(book.id, {
        condition: values.condition,
        new_price: values.new_price,
        operator: values.operator || '系统管理员',
        change_reason: values.change_reason,
      });
      message.success('价格更新成功');
      setPriceModalVisible(false);
      fetchBook();
      fetchHistory();
      fetchComparison();
    } catch (error) {
      console.error('更新价格失败:', error);
      message.error('更新价格失败');
    } finally {
      setLoading(false);
    }
  };

  const recordColumns = [
    {
      title: '记录编号',
      dataIndex: 'record_no',
      key: 'record_no',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: '品相',
      dataIndex: 'condition',
      key: 'condition',
      render: (text: string) => <Tag color={CONDITION_COLORS[text]}>{text}</Tag>,
    },
    {
      title: '回收价',
      dataIndex: 'recycle_price',
      key: 'recycle_price',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '成交价',
      dataIndex: 'sale_price',
      key: 'sale_price',
      render: (val?: number) => (val ? `¥${val.toFixed(2)}` : '未售出'),
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
    },
    {
      title: '回收日期',
      dataIndex: 'recycle_date',
      key: 'recycle_date',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '在库天数',
      dataIndex: 'days_in_stock',
      key: 'days_in_stock',
      render: (val: number) => {
        const color = val > 30 ? '#f5222d' : val > 15 ? '#faad14' : '#52c41a';
        return <span style={{ color, fontWeight: 'bold' }}>{val}天</span>;
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: RecycleRecord) => (
        <Space>
          {record.is_sold ? (
            <Tag color="green">已售出</Tag>
          ) : (
            <Tag color="orange">在库</Tag>
          )}
          {record.is_abnormal && <Tag color="red">异常</Tag>}
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: '品相',
      dataIndex: 'condition',
      key: 'condition',
      render: (text: string) => <Tag color={CONDITION_COLORS[text]}>{text}</Tag>,
    },
    {
      title: '改前价格',
      dataIndex: 'old_price',
      key: 'old_price',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '改后价格',
      dataIndex: 'new_price',
      key: 'new_price',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '变动',
      dataIndex: 'price_change',
      key: 'price_change',
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
    },
    {
      title: '生效时间',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '改价原因',
      dataIndex: 'change_reason',
      key: 'change_reason',
    },
  ];

  const priceComparisonChart = {
    title: {
      text: '改价前后成交对比',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['平均成交价', '销售数量'],
      bottom: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: comparisons.map((c) => `${c.condition}\n${c.version.slice(0, 10)}`),
    },
    yAxis: [
      {
        type: 'value',
        name: '成交价 (元)',
      },
      {
        type: 'value',
        name: '销售数量',
      },
    ],
    series: [
      {
        name: '改前均价',
        type: 'bar',
        data: comparisons.map((c) => c.before_stats.avg_sale_price || 0),
        itemStyle: { color: '#faad14' },
      },
      {
        name: '改后均价',
        type: 'bar',
        data: comparisons.map((c) => c.after_stats.avg_sale_price || 0),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '改前销量',
        type: 'line',
        yAxisIndex: 1,
        data: comparisons.map((c) => c.before_stats.total_sales),
        itemStyle: { color: '#fa8c16' },
      },
      {
        name: '改后销量',
        type: 'line',
        yAxisIndex: 1,
        data: comparisons.map((c) => c.after_stats.total_sales),
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  if (!book) {
    return <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card title={<span><BookOutlined style={{ marginRight: 8 }} />{book.title}</span>} style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="ISBN">{book.isbn}</Descriptions.Item>
          <Descriptions.Item label="作者">{book.author || '-'}</Descriptions.Item>
          <Descriptions.Item label="出版社">{book.publisher || '-'}</Descriptions.Item>
          <Descriptions.Item label="出版日期">{book.publish_date || '-'}</Descriptions.Item>
          <Descriptions.Item label="分类">{book.category || '-'}</Descriptions.Item>
          <Descriptions.Item label="套装书">
            {book.is_set ? `是 (${book.set_count}册)` : '否'}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={16} style={{ marginTop: 24 }}>
          {(() => {
            const priceFieldMap: Record<string, keyof Book> = {
              '全新': 'suggested_price_new',
              '九成新': 'suggested_price_like_new',
              '八成新': 'suggested_price_good',
              '七成新': 'suggested_price_fair',
              '六成新及以下': 'suggested_price_poor',
            };
            return CONDITIONS.map((cond) => {
              const priceField = priceFieldMap[cond.value];
              const price = priceField ? (book as any)[priceField] : 0;
              return (
                <Col span={4} key={cond.value}>
                  <Statistic
                    title={cond.value}
                    value={price || 0}
                    prefix="¥"
                    valueStyle={{ color: CONDITION_COLORS[cond.value] }}
                  />
                </Col>
              );
            });
          })()}
          <Col span={4}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleUpdatePrice}
              block
              style={{ marginTop: 30 }}
            >
              修改定价
            </Button>
          </Col>
        </Row>
      </Card>

      {comparisons.length > 0 && (
        <Card
          title={<span><BarChartOutlined style={{ marginRight: 8 }} />改价效果对比</span>}
          style={{ marginBottom: 16 }}
        >
          <ReactECharts option={priceComparisonChart} style={{ height: 400 }} />
        </Card>
      )}

      <Card
        title={<span><HistoryOutlined style={{ marginRight: 8 }} />定价变更历史</span>}
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={historyColumns}
          dataSource={histories}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card title="回收记录明细">
        <Table
          columns={recordColumns}
          dataSource={records}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="修改定价"
        open={priceModalVisible}
        onCancel={() => setPriceModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handlePriceSubmit}>
          <Form.Item
            name="condition"
            label="品相"
            rules={[{ required: true, message: '请选择品相' }]}
          >
            <Select options={CONDITIONS} placeholder="选择品相" />
          </Form.Item>
          <Form.Item
            name="new_price"
            label="新价格"
            rules={[{ required: true, message: '请输入新价格' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.5} prefix="¥" />
          </Form.Item>
          <Form.Item name="operator" label="操作人" initialValue="系统管理员">
            <Input placeholder="请输入操作人姓名" />
          </Form.Item>
          <Form.Item name="change_reason" label="改价原因">
            <Input.TextArea rows={3} placeholder="请输入改价原因" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPriceModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookDetail;
