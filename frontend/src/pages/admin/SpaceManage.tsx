import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Input, Select, Space, Modal, Form, InputNumber,
  DatePicker, message, Popconfirm, Descriptions, Row, Col, Card, Divider,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { spaceApi } from '../../services/api';
import {
  spaceStatusLabels, spaceStatusColors, spaceTypeLabels,
} from '../../utils/enums';
import { SpaceType, SpaceStatus } from '../../types';
import type { Space } from '../../types';

function SpaceManage() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Space[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<SpaceType | undefined>();
  const [status, setStatus] = useState<SpaceStatus | undefined>();
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState<Space | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await spaceApi.list({ page, pageSize, keyword, type, status });
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

  const handleDelete = async (id: string) => {
    try {
      const res = await spaceApi.remove(id);
      if (res.success) {
        message.success('删除成功');
        fetchData();
      }
    } catch { }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        name: values.name,
        type: values.type,
        address: values.address,
        building: values.building,
        floor: values.floor,
        area: values.area,
        capacity: values.capacity,
        description: values.description,
        facilities: values.facilities,
        landlordName: values.landlordName,
        landlordPhone: values.landlordPhone,
        prices: values.prices?.filter((p: any) => p.priceType).map((p: any) => ({
          ...p,
          effectiveDate: p.effectiveDate?.toDate() || new Date(),
          expireDate: p.expireDate?.toDate() || null,
        })) || [],
      };
      const res = await spaceApi.create(data);
      if (res.success) {
        message.success('创建成功');
        setModal(false);
        form.resetFields();
        fetchData();
      }
    } catch { }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await spaceApi.detail(id);
      if (res.success && res.data) {
        setDetail(res.data);
      }
    } catch { }
  };

  const columns = [
    { title: '房源编号', dataIndex: 'code', width: 140 },
    { title: '房源名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 100, render: (v: SpaceType) => <Tag>{spaceTypeLabels[v]}</Tag> },
    { title: '面积(㎡)', dataIndex: 'area', width: 80 },
    { title: '容量(人)', dataIndex: 'capacity', width: 80 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: SpaceStatus) => <Tag color={spaceStatusColors[v]}>{spaceStatusLabels[v]}</Tag>,
    },
    { title: '房东', dataIndex: 'landlordName', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 140, render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', width: 180,
      render: (_: any, r: Space) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r.id)}>详情</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: '确认删除？',
              content: '删除后不可恢复',
              onOk: () => handleDelete(r.id),
            });
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="middle" wrap>
          <Input placeholder="搜索名称/编号/地址" prefix={<SearchOutlined />} allowClear style={{ width: 260 }}
            value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
          <Select placeholder="类型" allowClear style={{ width: 140 }} value={type} onChange={(v) => { setType(v); setPage(1); }}
            options={Object.entries(spaceTypeLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          <Select placeholder="状态" allowClear style={{ width: 140 }} value={status} onChange={(v) => { setStatus(v); setPage(1); }}
            options={Object.entries(spaceStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)}>新增房源</Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{
          current: page, pageSize, total,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title="新增房源"
        open={modal}
        onCancel={() => { setModal(false); form.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="房源名称" rules={[{ required: true }]}>
                <Input placeholder="例如：张江科技园A座301" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="房源类型" rules={[{ required: true }]}>
                <Select options={Object.entries(spaceTypeLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="address" label="地址" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="building" label="楼栋" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="floor" label="楼层" rules={[{ required: true }]}>
                <Input placeholder="如：3F" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="area" label="面积(㎡)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="capacity" label="容纳人数" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="房源介绍">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="facilities" label="配套设施">
            <Input placeholder="用逗号分隔，如：空调,WIFI,打印机" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="landlordName" label="房东名称">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="landlordPhone" label="房东电话">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">价格设置（可添加多个）</Divider>
          <Form.List name="prices">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'priceType']} rules={[{ required: true, message: '必填' }]}>
                      <Select placeholder="类型" style={{ width: 100 }} options={[
                        { value: '月租', label: '月租' },
                        { value: '日租', label: '日租' },
                        { value: '小时', label: '小时' },
                        { value: '半天', label: '半天' },
                      ]} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'unitPrice']} rules={[{ required: true, message: '必填' }]}>
                      <InputNumber placeholder="单价" min={0} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'unit']} rules={[{ required: true, message: '必填' }]}>
                      <Select placeholder="单位" style={{ width: 80 }} options={[
                        { value: '月', label: '月' },
                        { value: '天', label: '天' },
                        { value: '小时', label: '小时' },
                        { value: '半天', label: '半天' },
                      ]} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'minimumCharge']}>
                      <InputNumber placeholder="最低消费" min={0} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'depositAmount']}>
                      <InputNumber placeholder="押金" min={0} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'effectiveDate']} rules={[{ required: true, message: '必填' }]}>
                      <DatePicker placeholder="生效日" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>删除</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加价格
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 24, textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => { setModal(false); form.resetFields(); }}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="房源详情"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
        width={640}
      >
        {detail && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="房源编号">{detail.code}</Descriptions.Item>
              <Descriptions.Item label="房源名称">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="类型/状态">
                <Tag>{spaceTypeLabels[detail.type]}</Tag>
                <Tag color={spaceStatusColors[detail.status]}>{spaceStatusLabels[detail.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="地址">{detail.address} · {detail.building} {detail.floor}</Descriptions.Item>
              <Descriptions.Item label="面积/容量">{detail.area}㎡ · 容纳{detail.capacity}人</Descriptions.Item>
              <Descriptions.Item label="介绍">{detail.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="设施">{detail.facilities || '-'}</Descriptions.Item>
              <Descriptions.Item label="房东">{detail.landlordName || '-'} · {detail.landlordPhone || '-'}</Descriptions.Item>
            </Descriptions>
            {detail.prices.length > 0 && (
              <>
                <Divider orientation="left">价格信息</Divider>
                <Row gutter={8}>
                  {detail.prices.filter(p => p.isActive).map((p) => (
                    <Col key={p.id}>
                      <Card size="small" style={{ minWidth: 140 }}>
                        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#f5222d' }}>¥{p.unitPrice}/{p.unit}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>{p.priceType}</div>
                        {p.minimumCharge && <div style={{ fontSize: 12 }}>最低：¥{p.minimumCharge}</div>}
                        {p.depositAmount && <div style={{ fontSize: 12 }}>押金：¥{p.depositAmount}</div>}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SpaceManage;
