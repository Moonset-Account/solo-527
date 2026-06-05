import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Input, message, Modal, Space, Alert } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { PickupRecord } from '@/types';
import { getPickupRecords, verifyPickup } from '@/api/pickup';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待核验' },
  verified: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已拒绝' },
};

const directionMap: Record<string, { color: string; label: string }> = {
  dropoff: { color: 'blue', label: '送园' },
  pickup: { color: 'purple', label: '接园' },
};

export default function PickupVerify() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PickupRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [verifyRemark, setVerifyRemark] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      const res = await getPickupRecords(params);
      setData(res.results);
      setTotal(res.count);
    } catch {
      message.error('获取接送记录失败');
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = (record: PickupRecord, action: 'verified' | 'rejected') => {
    setVerifyRemark('');
    Modal.confirm({
      title: action === 'verified' ? '确认通过核验？' : '确认拒绝核验？',
      content: (
        <div>
          {record.authorized_person === null && action === 'verified' && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message="非授权人员接送，请确认身份！"
              style={{ marginBottom: 12 }}
            />
          )}
          <Input.TextArea
            placeholder="请输入备注（可选）"
            value={verifyRemark}
            onChange={(e) => setVerifyRemark(e.target.value)}
            rows={3}
          />
        </div>
      ),
      onOk: async () => {
        try {
          await verifyPickup(record.id, action, verifyRemark || undefined);
          message.success(action === 'verified' ? '已通过核验' : '已拒绝核验');
          fetchData();
        } catch {
          message.error('操作失败');
        }
      },
    });
  };

  const isUnauthorizedPickup = (record: PickupRecord) => {
    return record.authorized_person === null && record.status === 'pending';
  };

  const columns: ColumnsType<PickupRecord> = [
    { title: '儿童姓名', dataIndex: 'child_name', key: 'child_name' },
    {
      title: '接送方向',
      dataIndex: 'direction',
      key: 'direction',
      render: (v: string) => {
        const d = directionMap[v];
        return d ? <Tag color={d.color}>{d.label}</Tag> : v;
      },
    },
    { title: '授权接送人', dataIndex: 'authorized_person_name', key: 'authorized_person_name', render: (v: string) => v || '-' },
    { title: '实际接送人', dataIndex: 'actual_person_name', key: 'actual_person_name' },
    { title: '实际接送人身份证', dataIndex: 'actual_person_id', key: 'actual_person_id' },
    { title: '接送时间', dataIndex: 'pickup_time', key: 'pickup_time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = statusMap[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleVerify(record, 'verified')}
            >
              通过
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleVerify(record, 'rejected')}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          <Tag color={record.status === 'verified' ? 'green' : 'red'}>
            {record.status === 'verified' ? '已通过' : '已拒绝'}
          </Tag>
        ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>接送核验</h2>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索儿童姓名"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
          onPressEnter={() => { setPage(1); fetchData(); }}
        />
      </div>
      <Table<PickupRecord>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
        rowClassName={(record) => (isUnauthorizedPickup(record) ? 'unauthorized-pickup-row' : '')}
      />
      <style>{`
        .unauthorized-pickup-row {
          background-color: #fff2f0 !important;
        }
        .unauthorized-pickup-row:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
}
