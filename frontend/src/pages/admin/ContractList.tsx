import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Input, Select, DatePicker, Space, Modal, Form,
  message, Descriptions, Row, Col, Card, List, Progress,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EyeOutlined, DownloadOutlined,
  FileTextOutlined, CheckOutlined, StopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { contractApi } from '../../services/api';
import {
  contractStatusLabels, contractStatusColors,
  billStatusLabels, billStatusColors, paymentMethodLabels,
} from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import { UserRole, ContractStatus, BillStatus, PaymentMethod } from '../../types';
import type { Contract, Bill } from '../../types';

const { RangePicker } = DatePicker;

function ContractList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ContractStatus | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [signModal, setSignModal] = useState(false);
  const [current, setCurrent] = useState<Contract | null>(null);
  const [form] = Form.useForm();
  const [signForm] = Form.useForm();

  const canCreate = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance || user.role === UserRole.ConsultantManager);
  const canSign = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);
  const canExport = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await contractApi.list({
        page, pageSize, keyword, status,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      if (res.success && res.data) {
        setList(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => { setPage(1); fetchData(); };

  const handleExport = async () => {
    try {
      const blob: any = await contractApi.exportContracts({
        keyword, status,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracts_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { }
  };

  const handleCreate = async (values: any) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate.toDate(),
        endDate: values.endDate.toDate(),
      };
      const res = await contractApi.create(data);
      if (res.success) {
        message.success('合同创建成功');
        setCreateModal(false);
        form.resetFields();
        fetchData();
      }
    } catch { }
  };

  const handleSign = async (values: any) => {
    if (!current) return;
    try {
      const res = await contractApi.sign(current.id, values);
      if (res.success) {
        message.success('合同已签署');
        setSignModal(false);
        signForm.resetFields();
        fetchData();
      }
    } catch { }
  };

  const handleTerminate = (record: Contract) => {
    Modal.confirm({
      title: '确认终止合同？',
      content: '终止后房源将变为可租状态',
      okText: '确认终止',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await contractApi.terminate(record.id, '管理员操作终止');
          if (res.success) {
            message.success('合同已终止');
            fetchData();
          }
        } catch { }
      },
    });
  };

  const columns = [
    { title: '合同编号', dataIndex: 'contractNo', width: 160, fixed: 'left' as const },
    { title: '租客', render: (_: any, r: Contract) => `${r.tenantName} · ${r.tenantPhone}` },
    { title: '房源', dataIndex: 'spaceName' },
    { title: '租期', render: (_: any, r: Contract) => `${dayjs(r.startDate).format('YYYY-MM-DD')} 至 ${dayjs(r.endDate).format('YYYY-MM-DD')}` },
    { title: '月租金', dataIndex: 'monthlyRent', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '押金', dataIndex: 'depositAmount', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: ContractStatus) => <Tag color={contractStatusColors[v]}>{contractStatusLabels[v]}</Tag>,
    },
    { title: '签署人', dataIndex: 'signedByName', render: (v: string) => v || '-' },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_: any, r: Contract) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/admin/contracts/${r.id}`)}>详情</Button>
          {canSign && r.status === ContractStatus.Draft && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { setCurrent(r); setSignModal(true); }}>签署</Button>
          )}
          {r.status === ContractStatus.Active && (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleTerminate(r)}>终止</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="middle" wrap>
          <Input placeholder="搜索合同编号/租客姓名/电话" prefix={<SearchOutlined />} allowClear style={{ width: 260 }}
            value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
          <Select placeholder="状态" allowClear style={{ width: 140 }} value={status} onChange={(v) => { setStatus(v); setPage(1); }}
            options={Object.entries(contractStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          <RangePicker value={dateRange} onChange={setDateRange as any} />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Space>
          {canExport && <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>}
          {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>创建合同</Button>}
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal title="创建合同" open={createModal} onCancel={() => { setCreateModal(false); form.resetFields(); }} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenantName" label="租客姓名" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tenantPhone" label="联系电话" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="tenantCompany" label="公司名称"><Input /></Form.Item>
          <Form.Item name="spaceId" label="房源" rules={[{ required: true }]}>
            <Select options={[
              { value: list[0]?.id || '1', label: list[0]?.spaceName || '示例房源' },
            ]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结束日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="monthlyRent" label="月租金(元)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="depositAmount" label="押金(元)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentMonths" label="付款月数" rules={[{ required: true }]}>
                <Select options={[
                  { value: 1, label: '月付' },
                  { value: 3, label: '季付' },
                  { value: 6, label: '半年付' },
                  { value: 12, label: '年付' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="paymentMethod" label="付款方式" rules={[{ required: true }]}>
            <Select options={Object.entries(paymentMethodLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="terms" label="合同条款"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="specialClauses" label="特殊约定"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => { setCreateModal(false); form.resetFields(); }}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="签署合同" open={signModal} onCancel={() => { setSignModal(false); signForm.resetFields(); }} footer={null}>
        <Form form={signForm} layout="vertical" onFinish={handleSign}>
          <Form.Item name="contractFile" label="合同文件URL"><Input /></Form.Item>
          <Form.Item name="remarks" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setSignModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认签署</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ContractList;
