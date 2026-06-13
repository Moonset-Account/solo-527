import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Form, Card, Modal, message, Drawer, Descriptions, List, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, LinkOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, ImportOutlined } from '@ant-design/icons';
import request from '../../utils/request.js';
import dayjs from 'dayjs';

const { Option } = Select;

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTrans, setSelectedTrans] = useState(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [matchForm] = Form.useForm();

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await request.get('/transactions', {
        params: { page, pageSize, ...filters },
      });
      setTransactions(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取流水列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPage(1);
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await request.get(`/transactions/${id}`);
      setDetailData(res.transaction);
      setDetailDrawer(true);
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleMatch = (record) => {
    setSelectedTrans(record);
    setShowMatchModal(true);
    matchForm.setFieldsValue({
      matchAmount: record.amount,
      matchType: 'FULL',
    });
  };

  const handleConfirmMatch = async (values) => {
    try {
      await request.post(`/transactions/${selectedTrans.id}/match`, values);
      message.success('匹配成功');
      setShowMatchModal(false);
      matchForm.resetFields();
      fetchTransactions();
    } catch (error) {
      console.error('匹配失败:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      UNMATCHED: { color: 'red', text: '未匹配' },
      MATCHED: { color: 'green', text: '已匹配' },
      PARTIAL_MATCHED: { color: 'orange', text: '部分匹配' },
      EXCESS: { color: 'purple', text: '超额' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '流水号',
      dataIndex: 'transNo',
      key: 'transNo',
      width: 160,
    },
    {
      title: '交易日期',
      dataIndex: 'transDate',
      key: 'transDate',
      width: 120,
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '交易类型',
      dataIndex: 'transType',
      key: 'transType',
      width: 80,
      render: (type) => {
        return type === 'INCOME' 
          ? <Tag color="green">收入</Tag> 
          : <Tag color="red">支出</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val, record) => (
        <span style={{ color: record.transType === 'INCOME' ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
          {record.transType === 'INCOME' ? '+' : '-'}¥{Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      title: '对方账户',
      dataIndex: 'counterparty',
      key: 'counterparty',
    },
    {
      title: '银行账户',
      dataIndex: 'bankAccount',
      key: 'bankAccount',
      width: 140,
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: '匹配状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '已匹配金额',
      dataIndex: 'matchedAmount',
      key: 'matchedAmount',
      width: 120,
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status !== 'MATCHED' && (
            <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => handleMatch(record)}>
              匹配
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>流水匹配</h2>
        <Space>
          <Button icon={<ImportOutlined />}>导入流水</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchTransactions}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="匹配状态">
            <Select placeholder="全部" style={{ width: 150 }} allowClear>
              <Option value="UNMATCHED">未匹配</Option>
              <Option value="PARTIAL_MATCHED">部分匹配</Option>
              <Option value="MATCHED">已匹配</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="流水号/对方账户" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-section">
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </div>

      <Modal
        title="流水匹配"
        open={showMatchModal}
        onCancel={() => setShowMatchModal(false)}
        footer={null}
        width={500}
      >
        {selectedTrans && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>流水号：{selectedTrans.transNo}</span>
              <span style={{ fontWeight: 600, color: '#52c41a' }}>
                ¥{Number(selectedTrans.amount).toLocaleString()}
              </span>
            </div>
          </div>
        )}
        <Form form={matchForm} layout="vertical" onFinish={handleConfirmMatch}>
          <Form.Item name="billId" label="关联账单">
            <Select placeholder="选择要匹配的账单" showSearch allowClear>
              {/* 实际项目中从接口获取未匹配账单列表 */}
            </Select>
          </Form.Item>
          <Form.Item
            name="matchAmount"
            label="匹配金额"
            rules={[{ required: true, message: '请输入匹配金额' }]}
          >
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item name="matchType" label="匹配类型">
            <Select>
              <Option value="FULL">全额匹配</Option>
              <Option value="PARTIAL">部分匹配</Option>
              <Option value="EXCESS">超额匹配</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowMatchModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认匹配</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="流水详情"
        placement="right"
        width={480}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {detailData && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="流水号">{detailData.transNo}</Descriptions.Item>
              <Descriptions.Item label="交易日期">
                {dayjs(detailData.transDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="交易类型">
                {detailData.transType === 'INCOME' ? '收入' : '支出'}
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                <span style={{ color: detailData.transType === 'INCOME' ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                  {detailData.transType === 'INCOME' ? '+' : '-'}¥{Number(detailData.amount).toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="对方账户">{detailData.counterparty || '-'}</Descriptions.Item>
              <Descriptions.Item label="银行账户">{detailData.bankAccount || '-'}</Descriptions.Item>
              <Descriptions.Item label="摘要">{detailData.summary || '-'}</Descriptions.Item>
              <Descriptions.Item label="匹配状态">{getStatusTag(detailData.status)}</Descriptions.Item>
              <Descriptions.Item label="已匹配金额">
                ¥{Number(detailData.matchedAmount).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="备注">{detailData.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 12 }}>匹配记录</h4>
            <List
              size="small"
              dataSource={detailData.matches || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>匹配金额：¥{Number(item.matchAmount).toLocaleString()}</span>
                        <Badge status="success" text="已匹配" />
                      </Space>
                    }
                    description={
                      <div>
                        <div>类型：{item.matchType}</div>
                        <div>操作人：{item.matchedBy?.name || '-'}</div>
                        <div>时间：{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            {(detailData.matches || []).length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无匹配记录
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default TransactionList;
