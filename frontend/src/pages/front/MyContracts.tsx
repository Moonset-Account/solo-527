import { useState, useEffect } from 'react';
import { Table, Tag, Button, Descriptions, Modal } from 'antd';
import { FileTextOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { contractApi } from '../../services/api';
import { contractStatusLabels, contractStatusColors, paymentMethodLabels } from '../../utils/enums';
import type { Contract } from '../../types';
import { ContractStatus } from '../../types';

function MyContracts() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Contract[]>([]);
  const [detail, setDetail] = useState<Contract | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await contractApi.list({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        setList(res.data.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { title: '合同编号', dataIndex: 'contractNo', width: 160 },
    { title: '房源', dataIndex: 'spaceName' },
    { title: '租期', render: (_: any, r: Contract) => `${dayjs(r.startDate).format('YYYY-MM-DD')} 至 ${dayjs(r.endDate).format('YYYY-MM-DD')}` },
    { title: '月租金', dataIndex: 'monthlyRent', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: ContractStatus) => <Tag color={contractStatusColors[v]}>{contractStatusLabels[v]}</Tag>,
    },
    {
      title: '操作', width: 100,
      render: (_: any, r: Contract) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>
          <FileTextOutlined /> 我的租约合同
        </h2>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
      <Modal title="合同详情" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={600}>
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="合同编号">{detail.contractNo}</Descriptions.Item>
            <Descriptions.Item label="房源">{detail.spaceName}</Descriptions.Item>
            <Descriptions.Item label="承租人">{detail.tenantName} · {detail.tenantPhone}</Descriptions.Item>
            <Descriptions.Item label="租期">{dayjs(detail.startDate).format('YYYY-MM-DD')} 至 {dayjs(detail.endDate).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="月租金">¥{detail.monthlyRent.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="押金">¥{detail.depositAmount.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="付款方式">{paymentMethodLabels[detail.paymentMethod]} · 每{detail.paymentMonths}个月付一次</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={contractStatusColors[detail.status]}>{contractStatusLabels[detail.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="签署时间">{detail.signedAt ? dayjs(detail.signedAt).format('YYYY-MM-DD HH:mm') : '未签署'}</Descriptions.Item>
            <Descriptions.Item label="签署人">{detail.signedByName || '-'}</Descriptions.Item>
            <Descriptions.Item label="特殊条款">{detail.specialClauses || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default MyContracts;
