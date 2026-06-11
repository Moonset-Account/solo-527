import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { distributionApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import OperationPanel from '@/components/OperationPanel';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

const DistributionCommission: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SearchFilterValues>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [settleModal, setSettleModal] = useState<any>(null);
  const [settleRemark, setSettleRemark] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await distributionApi.commissions({ ...filters, pageNum, pageSize });
      setData(result.records || []);
      setTotal(result.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, pageNum, pageSize]);

  const handleSearch = (values: SearchFilterValues) => {
    setFilters(values);
    setPageNum(1);
  };

  const handleSettle = async () => {
    if (!settleModal) return;
    await distributionApi.settleCommission(settleModal.id, { remark: settleRemark });
    message.success('结算成功');
    setSettleModal(null);
    setSettleRemark('');
    loadData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '分销人ID', dataIndex: 'distributorId', width: 120 },
    { title: '关联订单ID', dataIndex: 'orderId', width: 120 },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      width: 120,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '佣金比例',
      dataIndex: 'commissionRate',
      width: 100,
      render: (v: number) => `${v}%`,
    },
    {
      title: '佣金金额',
      dataIndex: 'commissionAmount',
      width: 120,
      render: (v: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{v}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.text || v}</Tag>
      ),
    },
    {
      title: '结算时间',
      dataIndex: 'settledAt',
      width: 160,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'PENDING' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setSettleModal(record)}
            >
              结算
            </Button>
          )}
          <Button size="small" onClick={() => {
            setSelectedItem(record);
            setPanelOpen(true);
          }}>
            操作面板
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>分销佣金</Title>

      <SearchFilter
        keywordPlaceholder="搜索"
        statusOptions={[
          { label: '待结算', value: 'PENDING' },
          { label: '已结算', value: 'SETTLED' },
        ]}
        onSearch={handleSearch}
      />

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPageNum(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="结算佣金"
        open={!!settleModal}
        onCancel={() => setSettleModal(null)}
        onOk={handleSettle}
      >
        <p><strong>订单ID:</strong> {settleModal?.orderId}</p>
        <p><strong>佣金金额:</strong> <span style={{ color: '#ff4d4f', fontSize: 18 }}>¥{settleModal?.commissionAmount}</span></p>
        <p style={{ marginTop: 12 }}><strong>结算备注:</strong></p>
        <Input.TextArea
          rows={3}
          value={settleRemark}
          onChange={(e) => setSettleRemark(e.target.value)}
          placeholder="请输入结算备注"
        />
      </Modal>

      <OperationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        bizType="COMMISSION"
        bizId={selectedItem?.id}
        title={`佣金 #${selectedItem?.id}`}
      />
    </div>
  );
};

export default DistributionCommission;
