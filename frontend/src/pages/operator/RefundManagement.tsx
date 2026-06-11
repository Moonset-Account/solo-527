import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Modal, Input, message, Alert } from 'antd';
import { BellOutlined, CheckOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import { refundApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import OperationPanel from '@/components/OperationPanel';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const RefundManagement: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SearchFilterValues>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processModal, setProcessModal] = useState<{ type: 'approve' | 'reject'; record: any } | null>(null);
  const [processRemark, setProcessRemark] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await refundApi.list({ ...filters, pageNum, pageSize });
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

  const handleSendReminder = async (id: number) => {
    await refundApi.sendReminder(id);
    message.success('提醒已发送');
    loadData();
  };

  const handleProcess = async () => {
    if (!processModal) return;
    if (processModal.type === 'approve') {
      await refundApi.approve(processModal.record.id, { remark: processRemark });
      message.success('已通过退款申请，课时已回写');
    } else {
      await refundApi.reject(processModal.record.id, { remark: processRemark });
      message.success('已拒绝退款申请');
    }
    setProcessModal(null);
    setProcessRemark('');
    loadData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '订单ID', dataIndex: 'orderId', width: 100 },
    { title: '用户ID', dataIndex: 'userId', width: 100 },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      width: 120,
      render: (v: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{v}</span>
      ),
    },
    {
      title: '已消耗课时',
      dataIndex: 'consumedHours',
      width: 110,
      render: (v: number) => (v != null ? `${v} 小时` : '-'),
    },
    {
      title: '课时回写',
      dataIndex: 'hoursWrittenBack',
      width: 100,
      render: (v: boolean) =>
        v ? <Tag color="success">已回写</Tag> : <Tag color="warning">未回写</Tag>,
    },
    {
      title: '异常提醒',
      dataIndex: 'reminderSent',
      width: 100,
      render: (v: boolean, r: any) => (
        <>
          {v ? (
            <Tag color="blue">已发送 {dayjs(r.reminderSentAt).format('MM-DD HH:mm')}</Tag>
          ) : (
            <Tag color="red">未发送</Tag>
          )}
        </>
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
    { title: '退款原因', dataIndex: 'refundReason', ellipsis: true },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 260,
      render: (_: any, record: any) => (
        <Space wrap>
          {record.status === 'PENDING' && !record.reminderSent && (
            <Button
              size="small"
              icon={<BellOutlined />}
              onClick={() => handleSendReminder(record.id)}
            >
              发提醒
            </Button>
          )}
          {record.status === 'PENDING' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => setProcessModal({ type: 'approve', record })}
              >
                通过
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => setProcessModal({ type: 'reject', record })}
              >
                拒绝
              </Button>
            </>
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

  const pendingAbnormalCount = data.filter(
    (r) => r.status === 'PENDING' && !r.reminderSent && dayjs(r.createdAt).isBefore(dayjs().subtract(3, 'day'))
  ).length;

  return (
    <div>
      <Title level={3}>退款异常</Title>

      {pendingAbnormalCount > 0 && (
        <Alert
          message={
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              有 {pendingAbnormalCount} 条退款申请超过 3 天未处理，请及时发送提醒或处理
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <SearchFilter
        keywordPlaceholder="搜索订单ID"
        statusOptions={[
          { label: '待处理', value: 'PENDING' },
          { label: '已通过', value: 'APPROVED' },
          { label: '已拒绝', value: 'REJECTED' },
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
        scroll={{ x: 1400 }}
      />

      <Modal
        title={processModal?.type === 'approve' ? '通过退款申请' : '拒绝退款申请'}
        open={!!processModal}
        onCancel={() => setProcessModal(null)}
        onOk={handleProcess}
      >
        {processModal?.type === 'approve' && (
          <Alert
            message="通过后将自动回写学员的课时消耗数据"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <p><strong>订单ID:</strong> {processModal?.record?.orderId}</p>
        <p><strong>退款金额:</strong> ¥{processModal?.record?.refundAmount}</p>
        {processModal?.type === 'approve' && (
          <p><strong>回写课时:</strong> {processModal?.record?.consumedHours || 0} 小时</p>
        )}
        <p style={{ marginTop: 12 }}><strong>处理备注:</strong></p>
        <TextArea
          rows={3}
          value={processRemark}
          onChange={(e) => setProcessRemark(e.target.value)}
          placeholder={processModal?.type === 'approve' ? '请输入通过备注' : '请输入拒绝原因'}
        />
      </Modal>

      <OperationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        bizType="REFUND"
        bizId={selectedItem?.id}
        title={`退款申请 #${selectedItem?.id}`}
      />
    </div>
  );
};

export default RefundManagement;
