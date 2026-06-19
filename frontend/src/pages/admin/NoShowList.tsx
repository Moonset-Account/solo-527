import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Input, Select, DatePicker, Space, Modal, Form,
  message, Descriptions, Radio, Empty,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, CheckOutlined, ReloadOutlined,
  UserOutlined, PhoneOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentApi } from '../../services/api';
import {
  noShowHandleResultLabels, noShowHandleResultColors,
  appointmentStatusLabels, appointmentStatusColors,
} from '../../utils/enums';
import { NoShowHandleResult } from '../../types';
import type { NoShowRecord } from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

function NoShowList() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<NoShowRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [isHandled, setIsHandled] = useState<boolean | undefined>();
  const [handleResult, setHandleResult] = useState<NoShowHandleResult | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [handleModal, setHandleModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [current, setCurrent] = useState<NoShowRecord | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.noShowList({
        page,
        pageSize,
        keyword,
        isHandled,
        handleResult,
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

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleHandle = async (values: any) => {
    if (!current) return;
    try {
      const res = await appointmentApi.handleNoShow(current.id, {
        reason: values.reason,
        handleResult: values.handleResult,
        handleDetail: values.handleDetail,
        penaltyDetail: values.penaltyDetail,
      });
      if (res.success) {
        message.success('处理完成');
        setHandleModal(false);
        form.resetFields();
        fetchData();
      }
    } catch { }
  };

  const pendingCount = list.filter((r) => !r.isHandled).length;

  const columns = [
    { title: '爽约记录ID', dataIndex: 'id', width: 100, render: (v: string) => v.substring(0, 8) + '...' },
    { title: '预约编号', dataIndex: 'appointmentNo', width: 160 },
    { title: '客户', render: (_: any, r: NoShowRecord) => `${r.customerName} · ${r.customerPhone}` },
    {
      title: '爽约日期', dataIndex: 'noShowDate', width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    { title: '客户原因', dataIndex: 'reason', render: (v: string) => v || '-' },
    {
      title: '处理状态', dataIndex: 'isHandled', width: 100,
      render: (v: boolean, r: NoShowRecord) => v
        ? <Tag color={noShowHandleResultColors[r.handleResult]}>{noShowHandleResultLabels[r.handleResult]}</Tag>
        : <Tag color="orange">待处理</Tag>,
    },
    { title: '处理人', dataIndex: 'handlerName', width: 100, render: (v: string) => v || '-' },
    {
      title: '处理时间', dataIndex: 'handledAt', width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作', width: 180,
      render: (_: any, r: NoShowRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrent(r); setDetailModal(true); }}>详情</Button>
          {!r.isHandled && (
            <Button type="primary" size="small" onClick={() => { setCurrent(r); setHandleModal(true); }} icon={<CheckOutlined />}>
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
            <ExclamationCircleOutlined /> 待处理：{pendingCount} 条
          </Tag>
        </Space>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索客户姓名/电话/预约编号"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="处理状态"
            allowClear
            style={{ width: 140 }}
            value={isHandled === undefined ? undefined : (isHandled ? 'true' : 'false')}
            onChange={(v) => {
              if (v === undefined) setIsHandled(undefined);
              else setIsHandled(v === 'true');
            }}
            options={[
              { value: 'false', label: '待处理' },
              { value: 'true', label: '已处理' },
            ]}
          />
          <Select
            placeholder="处理结果"
            allowClear
            style={{ width: 160 }}
            value={handleResult}
            onChange={setHandleResult}
            options={Object.entries(noShowHandleResultLabels).map(([k, v]) => ({ value: Number(k), label: v }))}
          />
          <RangePicker value={dateRange} onChange={setDateRange as any} />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title="爽约详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={<Button onClick={() => setDetailModal(false)}>关闭</Button>}
        width={600}
      >
        {current && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="预约编号">{current.appointmentNo}</Descriptions.Item>
            <Descriptions.Item label="客户">
              <UserOutlined /> {current.customerName} · <PhoneOutlined /> {current.customerPhone}
            </Descriptions.Item>
            <Descriptions.Item label="爽约日期">{dayjs(current.noShowDate).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="爽约原因">{current.reason || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理状态">
              {current.isHandled
                ? <Tag color={noShowHandleResultColors[current.handleResult]}>{noShowHandleResultLabels[current.handleResult]}</Tag>
                : <Tag color="orange">待处理</Tag>}
            </Descriptions.Item>
            {current.isHandled && (
              <>
                <Descriptions.Item label="处理说明">{current.handleDetail || '-'}</Descriptions.Item>
                <Descriptions.Item label="处罚措施">{current.penaltyDetail || '-'}</Descriptions.Item>
                <Descriptions.Item label="处理人">{current.handlerName || '-'}</Descriptions.Item>
                <Descriptions.Item label="处理时间">{current.handledAt ? dayjs(current.handledAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="处理爽约"
        open={handleModal}
        onCancel={() => { setHandleModal(false); form.resetFields(); }}
        footer={null}
        width={560}
      >
        {current && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
            <div><strong>客户：</strong>{current.customerName} · {current.customerPhone}</div>
            <div><strong>预约编号：</strong>{current.appointmentNo}</div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleHandle}>
          <Form.Item name="reason" label="确认爽约原因" rules={[{ required: true, message: '请填写爽约原因' }]}>
            <TextArea rows={3} placeholder="请填写具体爽约原因" />
          </Form.Item>
          <Form.Item name="handleResult" label="处理结果" rules={[{ required: true, message: '请选择处理结果' }]}>
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio value={NoShowHandleResult.NoPenalty}>无处罚</Radio>
              <Radio value={NoShowHandleResult.Warning}>警告</Radio>
              <Radio value={NoShowHandleResult.DepositDeducted}>扣除押金</Radio>
              <Radio value={NoShowHandleResult.Blacklisted}>加入黑名单</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="handleDetail" label="处理说明" rules={[{ required: true, message: '请填写处理说明' }]}>
            <TextArea rows={3} placeholder="请详细说明处理过程" />
          </Form.Item>
          <Form.Item name="penaltyDetail" label="处罚措施（如有）">
            <TextArea rows={2} placeholder="例如：扣除押金500元，半年内禁止预约等" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setHandleModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认处理</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default NoShowList;
