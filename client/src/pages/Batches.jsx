import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  message,
  Divider,
  Row,
  Col,
  Descriptions,
  List,
} from 'antd';
import { PlusOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { batches, stores, ingredients, lossReasons, lossReports } from '../api/index.js';

const { TextArea } = Input;

function Batches() {
  const [batchList, setBatchList] = useState([]);
  const [storeList, setStoreList] = useState([]);
  const [ingredientList, setIngredientList] = useState([]);
  const [lossReasonList, setLossReasonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [lossModal, setLossModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [batchForm] = Form.useForm();
  const [lossForm] = Form.useForm();
  const [batchIngredients, setBatchIngredients] = useState([]);
  const [lossIngredients, setLossIngredients] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
    stores.list().then(setStoreList);
    ingredients.list().then(setIngredientList);
    lossReasons.list({ isActive: true }).then(setLossReasonList);
  }, []);

  const loadData = () => {
    setLoading(true);
    batches.list(filters).then((data) => {
      setBatchList(data);
      setLoading(false);
    });
  };

  const handleCreateBatch = () => {
    setSelectedBatch(null);
    setBatchIngredients([]);
    batchForm.resetFields();
    setBatchModal(true);
  };

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields();
      const data = {
        ...values,
        bakingTime: values.bakingTime.toISOString(),
        ingredients: batchIngredients,
      };
      await batches.create(data);
      message.success('批次创建成功');
      setBatchModal(false);
      loadData();
    } catch (err) {
      message.error('创建失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleViewDetail = async (record) => {
    const detail = await batches.get(record.id);
    setCurrentDetail(detail);
    setDetailModal(true);
  };

  const handleCreateLoss = (record) => {
    setSelectedBatch(record);
    setLossIngredients([]);
    lossForm.resetFields();
    lossForm.setFieldsValue({
      storeId: record.storeId,
      batchId: record.id,
      lossAmount: 0,
      reportTime: dayjs(),
    });
    setLossModal(true);
  };

  const handleLossSubmit = async () => {
    try {
      const values = await lossForm.validateFields();
      const totalValue = lossIngredients.reduce((sum, ing) => sum + ing.quantity * ing.unitPrice, 0);
      const data = {
        ...values,
        reportTime: values.reportTime.toISOString(),
        lossValue: totalValue,
        ingredients: lossIngredients,
      };
      await lossReports.create(data);
      message.success('报损单创建成功');
      setLossModal(false);
      loadData();
    } catch (err) {
      message.error('创建失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const addBatchIngredient = () => {
    setBatchIngredients([...batchIngredients, { ingredientId: null, quantity: 0, unit: 'kg' }]);
  };

  const updateBatchIngredient = (index, field, value) => {
    const list = [...batchIngredients];
    list[index][field] = value;
    if (field === 'ingredientId') {
      const ing = ingredientList.find((i) => i.id === value);
      if (ing) list[index].unit = ing.unit;
    }
    setBatchIngredients(list);
  };

  const removeBatchIngredient = (index) => {
    setBatchIngredients(batchIngredients.filter((_, i) => i !== index));
  };

  const addLossIngredient = () => {
    setLossIngredients([...lossIngredients, { ingredientId: null, quantity: 0, unit: 'kg', unitPrice: 0 }]);
  };

  const updateLossIngredient = (index, field, value) => {
    const list = [...lossIngredients];
    list[index][field] = value;
    if (field === 'ingredientId') {
      const ing = ingredientList.find((i) => i.id === value);
      if (ing) list[index].unit = ing.unit;
    }
    setLossIngredients(list);
  };

  const removeLossIngredient = (index) => {
    setLossIngredients(lossIngredients.filter((_, i) => i !== index));
  };

  const batchColumns = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
    { title: '门店', dataIndex: ['store', 'name'], key: 'store' },
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    { title: '计划数量', dataIndex: 'planQuantity', key: 'planQuantity' },
    { title: '实际数量', dataIndex: 'actualQuantity', key: 'actualQuantity' },
    {
      title: '烘焙时间',
      dataIndex: 'bakingTime',
      key: 'bakingTime',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const colors = { PENDING: 'gold', BAKING: 'blue', COMPLETED: 'green', CANCELLED: 'default' };
        const labels = { PENDING: '待烘焙', BAKING: '烘焙中', COMPLETED: '已完成', CANCELLED: '已取消' };
        return <Tag color={colors[s]}>{labels[s]}</Tag>;
      },
    },
    { title: '报损单数', dataIndex: 'lossReports', key: 'lossCount', render: (r) => r?.length || 0 },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          <Button size="small" type="primary" danger icon={<ExclamationCircleOutlined />} onClick={() => handleCreateLoss(record)}>
            报损
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">烘焙批次与报损登记</h2>
        <p className="page-desc">登记每日烘焙生产批次，并对损耗产品进行报损处理</p>
      </div>

      <div className="filter-bar">
        <Space>
          <Select
            placeholder="选择门店"
            style={{ width: 180 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, storeId: v })}
            options={storeList.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="批次状态"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, status: v })}
            options={[
              { label: '待烘焙', value: 'PENDING' },
              { label: '烘焙中', value: 'BAKING' },
              { label: '已完成', value: 'COMPLETED' },
            ]}
          />
          <DatePicker.RangePicker onChange={(dates) => {
            if (dates) {
              setFilters({ ...filters, startDate: dates[0].toISOString(), endDate: dates[1].toISOString() });
            } else {
              const { startDate, endDate, ...rest } = filters;
              setFilters(rest);
            }
          }} />
          <Button type="primary" onClick={loadData}>查询</Button>
          <Button onClick={handleCreateBatch} icon={<PlusOutlined />} type="primary">
            新建批次
          </Button>
        </Space>
      </div>

      <Table columns={batchColumns} dataSource={batchList} rowKey="id" loading={loading} />

      <Modal
        title={selectedBatch ? '编辑批次' : '新建烘焙批次'}
        open={batchModal}
        onCancel={() => setBatchModal(false)}
        onOk={handleBatchSubmit}
        width={800}
      >
        <Form form={batchForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storeId" label="门店" rules={[{ required: true }]}>
                <Select options={storeList.map((s) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
                <Input placeholder="如：奶油面包" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="planQuantity" label="计划数量" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actualQuantity" label="实际数量" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bakingTime" label="烘焙时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="operator" label="操作人">
            <Input />
          </Form.Item>

          <Divider orientation="left">食材用料</Divider>
          {batchIngredients.map((ing, index) => (
            <Row gutter={8} key={index} style={{ marginBottom: 8 }}>
              <Col span={8}>
                <Select
                  placeholder="选择食材"
                  value={ing.ingredientId}
                  onChange={(v) => updateBatchIngredient(index, 'ingredientId', v)}
                  style={{ width: '100%' }}
                  options={ingredientList.map((i) => ({ label: i.name, value: i.id }))}
                />
              </Col>
              <Col span={6}>
                <InputNumber
                  placeholder="数量"
                  min={0}
                  value={ing.quantity}
                  onChange={(v) => updateBatchIngredient(index, 'quantity', v)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <Input value={ing.unit} onChange={(e) => updateBatchIngredient(index, 'unit', e.target.value)} placeholder="单位" />
              </Col>
              <Col span={4}>
                <Button danger size="small" onClick={() => removeBatchIngredient(index)}>删除</Button>
              </Col>
            </Row>
          ))}
          <Button onClick={addBatchIngredient} icon={<PlusOutlined />}>添加食材</Button>
        </Form>
      </Modal>

      <Modal
        title="创建报损单"
        open={lossModal}
        onCancel={() => setLossModal(false)}
        onOk={handleLossSubmit}
        width={800}
      >
        <Form form={lossForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storeId" label="门店" rules={[{ required: true }]}>
                <Select disabled options={storeList.map((s) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lossReasonId" label="报损原因" rules={[{ required: true }]}>
                <Select options={lossReasonList.map((r) => ({ label: r.name, value: r.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="lossAmount" label="损耗数量" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reportTime" label="报损时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reporter" label="上报人">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="损耗说明">
            <TextArea rows={2} />
          </Form.Item>

          <Divider orientation="left">损耗食材明细</Divider>
          {lossIngredients.map((ing, index) => (
            <Row gutter={8} key={index} style={{ marginBottom: 8 }}>
              <Col span={6}>
                <Select
                  placeholder="食材"
                  value={ing.ingredientId}
                  onChange={(v) => updateLossIngredient(index, 'ingredientId', v)}
                  style={{ width: '100%' }}
                  options={ingredientList.map((i) => ({ label: i.name, value: i.id }))}
                />
              </Col>
              <Col span={5}>
                <InputNumber
                  placeholder="数量"
                  min={0}
                  value={ing.quantity}
                  onChange={(v) => updateLossIngredient(index, 'quantity', v)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <Input value={ing.unit} onChange={(e) => updateLossIngredient(index, 'unit', e.target.value)} placeholder="单位" />
              </Col>
              <Col span={5}>
                <InputNumber
                  placeholder="单价"
                  min={0}
                  precision={2}
                  value={ing.unitPrice}
                  onChange={(v) => updateLossIngredient(index, 'unitPrice', v)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <Input value={(ing.quantity * ing.unitPrice).toFixed(2)} disabled placeholder="金额" />
              </Col>
            </Row>
          ))}
          <Button onClick={addLossIngredient} icon={<PlusOutlined />}>添加损耗食材</Button>
          {lossIngredients.length > 0 && (
            <div style={{ marginTop: 8, textAlign: 'right', fontWeight: 'bold' }}>
              合计金额：¥{lossIngredients.reduce((sum, ing) => sum + ing.quantity * ing.unitPrice, 0).toFixed(2)}
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="批次详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[<Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>]}
        width={700}
      >
        {currentDetail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="批次号">{currentDetail.batchNo}</Descriptions.Item>
              <Descriptions.Item label="门店">{currentDetail.store?.name}</Descriptions.Item>
              <Descriptions.Item label="产品名称">{currentDetail.productName}</Descriptions.Item>
              <Descriptions.Item label="烘焙时间">{dayjs(currentDetail.bakingTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="计划数量">{currentDetail.planQuantity}</Descriptions.Item>
              <Descriptions.Item label="实际数量">{currentDetail.actualQuantity}</Descriptions.Item>
              <Descriptions.Item label="操作人">{currentDetail.operator || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="green">{currentDetail.status}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">食材用料</Divider>
            <List
              size="small"
              dataSource={currentDetail.ingredients}
              renderItem={(item) => (
                <List.Item>
                  {item.ingredient?.name} - {item.quantity} {item.unit}
                </List.Item>
              )}
            />
            {currentDetail.lossReports?.length > 0 && (
              <>
                <Divider orientation="left">关联报损单</Divider>
                <List
                  size="small"
                  dataSource={currentDetail.lossReports}
                  renderItem={(item) => (
                    <List.Item>
                      {item.reportNo} - 金额 ¥{item.lossValue} - {item.approvalStatus}
                    </List.Item>
                  )}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

export default Batches;
