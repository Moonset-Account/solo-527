import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  DatePicker,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  GiftOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { benefitsApi, BenefitListItem, membersApi } from '../services/api';
import { benefitTypeMap, formatDate, formatNumber } from '../lib/constants';

const BenefitsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: members } = useQuery({
    queryKey: ['members', 'all'],
    queryFn: () => membersApi.list({ pageSize: 1000, page: 1 }),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['benefits', page, pageSize, filters],
    queryFn: () => benefitsApi.list({ page, pageSize, ...filters }),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data };
      if (payload.expiresAt) {
        payload.expiresAt = payload.expiresAt.toISOString();
      }
      return benefitsApi.create(payload);
    },
    onSuccess: () => {
      message.success('权益已发放');
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
    },
  });

  const useBenefit = (id: string) => {
    benefitsApi.use(id).then(() => {
      message.success('已标记为使用');
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
    });
  };

  const columns: ColumnsType<BenefitListItem> = [
    {
      title: '权益名称',
      dataIndex: 'name',
      width: 200,
      render: (name, r) => {
        const t = benefitTypeMap[r.type] || {};
        return (
          <Space>
            <Tag color={t.color as any}>
              <GiftOutlined /> {t.label}
            </Tag>
            <span style={{ fontWeight: 500 }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (d) => d || '—',
    },
    {
      title: '价值',
      dataIndex: 'value',
      width: 100,
      render: (v) => (v ? <span style={{ color: '#FA8C16', fontWeight: 600 }}>¥{formatNumber(v)}</span> : '—'),
    },
    {
      title: '会员',
      key: 'member',
      width: 200,
      render: (_, r) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#722ED1' }}>
            {r.userName?.slice(0, 1)}
          </Avatar>
          <div>
            <div>{r.userName}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{r.memberNo}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isUsed',
      width: 100,
      render: (used) =>
        used ? (
          <Tag color="default">已使用</Tag>
        ) : (
          <Tag color="green">未使用</Tag>
        ),
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      width: 160,
      render: (d, r) =>
        r.isUsed ? formatDate(d) : '—',
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      width: 160,
      render: (d) => d ? formatDate(d) : '长期有效',
    },
    {
      title: '发放时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (d) => formatDate(d),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          {!r.isUsed && (
            <Button type="link" size="small" onClick={() => useBenefit(r.id)}>
              标记使用
            </Button>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => benefitsApi.remove(r.id).then(() => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['benefits'] }); })}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSearch = (values: any) => {
    const newFilters: any = {};
    if (values.memberId) newFilters.memberId = values.memberId;
    if (values.type) newFilters.type = values.type;
    if (values.isUsed !== undefined) newFilters.isUsed = values.isUsed;
    setFilters(newFilters);
    setPage(1);
  };

  const stats = {
    total: data?.total || 0,
    unused: data?.items?.filter((i) => !i.isUsed).length || 0,
    used: data?.items?.filter((i) => i.isUsed).length || 0,
    totalValue:
      data?.items?.reduce((sum: number, i) => sum + parseFloat(i.value || '0'), 0) || 0,
  };

  return (
    <div>
      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
          <div className="filter-row">
            <Form.Item name="memberId">
              <Select
                allowClear
                placeholder="按会员筛选"
                style={{ width: 240 }}
                showSearch
                optionFilterProp="label"
                options={members?.items?.map((m: any) => ({
                  value: m.id,
                  label: `${m.userName}（${m.memberNo}）`,
                }))}
              />
            </Form.Item>
            <Form.Item name="type">
              <Select allowClear placeholder="权益类型" style={{ width: 120 }} options={Object.entries(benefitTypeMap).map(([v, l]) => ({ value: v, label: l.label }))} />
            </Form.Item>
            <Form.Item name="isUsed">
              <Select allowClear placeholder="使用状态" style={{ width: 120 }} options={[{ value: 'false', label: '未使用' }, { value: 'true', label: '已使用' }]} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">查询</Button>
                <Button onClick={() => { setFilters({}); refetch(); }}>重置</Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </div>

      <Card
        title={`会员权益（${stats.total}）`}
        extra={
          <Space>
            <Tag color="green">未使用 {stats.unused}</Tag>
            <Tag>已使用 {stats.used}</Tag>
            <Tag color="orange">总价值 ¥{formatNumber(stats.totalValue)}</Tag>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
              发放权益
            </Button>
          </Space>
        }
      >
        <Table<BenefitListItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal title="发放会员权益" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={520} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)} initialValues={{ type: 'discount', isUsed: false }}>
          <Form.Item label="选择会员" name="memberId" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="搜索学员姓名或会员号"
              options={members?.items?.map((m: any) => ({
                value: m.id,
                label: `${m.userName}（${m.memberNo}）- ${m.campName}`,
              }))}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="权益类型" name="type" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={Object.entries(benefitTypeMap).map(([v, l]) => ({ value: v, label: l.label }))} />
            </Form.Item>
            <Form.Item label="价值（元）" name="value" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="权益名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="如：下期营9折优惠券" />
          </Form.Item>
          <Form.Item label="权益说明" name="description">
            <Input.TextArea rows={3} placeholder="详细说明权益内容和使用方式" />
          </Form.Item>
          <Form.Item label="过期时间" name="expiresAt">
            <DatePicker style={{ width: '100%' }} showTime placeholder="不选则长期有效" />
          </Form.Item>
          <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                发放
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BenefitsPage;
