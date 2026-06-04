import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  Row,
  Col,
  Table,
  Divider,
  Statistic,
  Alert,
  message,
  Modal,
  Tabs,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { quoteService } from '../../services/quoteService';
import { Quote, QuoteStatus, ProfitWarningLevel, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface QuoteItem {
  id?: string;
  [key: string]: any;
}

export default function QuoteForm() {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('hotels');
  const [changeDescription, setChangeDescription] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { data: quote, isLoading } = useQuery(
    ['quote', id],
    () => quoteService.getById(id!),
    {
      enabled: !!id,
      onSuccess: (data) => {
        form.setFieldsValue(data.data);
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data, desc }: { id: string; data: Partial<Quote>; desc?: string }) =>
      quoteService.update(id, data, desc),
    {
      onSuccess: () => {
        message.success('报价已保存');
        queryClient.invalidateQueries(['quote', id]);
      },
      onError: () => message.error('保存失败'),
    }
  );

  const submitMutation = useMutation(() => quoteService.submitForApproval(id!), {
    onSuccess: () => {
      message.success('已提交审批');
      queryClient.invalidateQueries(['quote', id]);
      setShowSubmitModal(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '提交失败');
    },
  });

  const [hotels, setHotels] = useState<QuoteItem[]>([]);
  const [transportation, setTransportation] = useState<QuoteItem[]>([]);
  const [tickets, setTickets] = useState<QuoteItem[]>([]);
  const [meals, setMeals] = useState<QuoteItem[]>([]);
  const [guides, setGuides] = useState<QuoteItem[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<QuoteItem[]>([]);
  const [serviceFee, setServiceFee] = useState(0);

  useEffect(() => {
    if (quote?.data) {
      setHotels(quote.data.hotels || []);
      setTransportation(quote.data.transportation || []);
      setTickets(quote.data.tickets || []);
      setMeals(quote.data.meals || []);
      setGuides(quote.data.guides || []);
      setOtherExpenses(quote.data.otherExpenses || []);
      setServiceFee(quote.data.serviceFee || 0);
    }
  }, [quote]);

  const calculateTotals = () => {
    let totalCost = 0;

    hotels.forEach((h) => {
      h.totalCost = Number(h.nights || 0) * Number(h.costPerNight || 0);
      totalCost += h.totalCost;
    });

    transportation.forEach((t) => {
      t.totalCost = Number(t.days || 0) * Number(t.costPerDay || 0);
      totalCost += t.totalCost;
    });

    tickets.forEach((t) => {
      t.totalCost = Number(t.quantity || 0) * Number(t.costPerTicket || 0);
      totalCost += t.totalCost;
    });

    meals.forEach((m) => {
      m.totalCost = Number(m.count || 0) * Number(m.costPerPerson || 0);
      totalCost += m.totalCost;
    });

    guides.forEach((g) => {
      g.totalCost = Number(g.days || 0) * Number(g.costPerDay || 0);
      totalCost += g.totalCost;
    });

    otherExpenses.forEach((o) => {
      totalCost += Number(o.amount || 0);
    });

    const totalPrice = totalCost + Number(serviceFee || 0);
    const profit = Number(serviceFee || 0);
    const profitMargin = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;

    return { totalCost, totalPrice, profit, profitMargin };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    const values = await form.validateFields();
    const data: Partial<Quote> = {
      ...values,
      hotels,
      transportation,
      tickets,
      meals,
      guides,
      otherExpenses,
      serviceFee,
    };
    updateMutation.mutate({ id: id!, data, desc: changeDescription });
  };

  const handleSubmit = () => {
    if (totals.profitMargin < 10) {
      setShowSubmitModal(true);
    } else {
      submitMutation.mutate();
    }
  };

  const addItem = (setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>, defaultItem: QuoteItem) => {
    setter((prev) => [...prev, { ...defaultItem, id: Date.now().toString() }]);
  };

  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>,
    items: QuoteItem[],
    id: string
  ) => {
    setter(items.filter((item) => item.id !== id));
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>,
    items: QuoteItem[],
    id: string,
    field: string,
    value: any
  ) => {
    setter(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const renderItemTable = (
    items: QuoteItem[],
    setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>,
    columns: any[],
    defaultItem: QuoteItem
  ) => (
    <>
      <Table
        dataSource={items}
        rowKey="id"
        columns={[
          ...columns,
          {
            title: '操作',
            key: 'actions',
            width: 80,
            render: (_: any, record: QuoteItem) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeItem(setter, items, record.id!)}
              />
            ),
          },
        ]}
        pagination={false}
        size="small"
      />
      <Button
        type="dashed"
        style={{ width: '100%', marginTop: 8 }}
        icon={<PlusOutlined />}
        onClick={() => addItem(setter, defaultItem)}
      >
        添加
      </Button>
    </>
  );

  const canSubmit = [QuoteStatus.DRAFT, QuoteStatus.REJECTED].includes(quote?.data.status as QuoteStatus);
  const isSupervisor = [UserRole.ADMIN, UserRole.SUPERVISOR].includes(user?.role as UserRole);

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotes')}>
          返回列表
        </Button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          编辑报价单 - {quote?.data.itineraryName} (v{quote?.data.version})
        </span>
        <Tag color={quote?.data.status === QuoteStatus.DRAFT ? 'default' : 'orange'}>
          {quote?.data.status}
        </Tag>
      </Space>

      {totals.profitMargin < 10 && (
        <Alert
          message={
            totals.profitMargin < 5
              ? '极低毛利率警告'
              : '低毛利率提示'
          }
          description={`当前毛利率仅为 ${totals.profitMargin.toFixed(1)}%，${totals.profitMargin < 5 ? '无法提交审批' : '提交后需要主管特别关注'}`}
          type={totals.profitMargin < 5 ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={24}>
        <Col span={18}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="itineraryName" label="行程名称" rules={[{ required: true }]}>
                    <Input placeholder="请输入行程名称" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="travelStartDate" label="开始日期">
                    <Input placeholder="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="travelEndDate" label="结束日期">
                    <Input placeholder="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card title="费用明细">
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="酒店" key="hotels">
                {renderItemTable(
                  hotels,
                  setHotels,
                  [
                    { title: '酒店名称', dataIndex: 'name', width: 200, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.name} onChange={(e) => updateItem(setHotels, hotels, record.id!, 'name', e.target.value)} />
                    )},
                    { title: '星级', dataIndex: 'starRating', width: 100, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={1} max={5} value={record.starRating} onChange={(v) => updateItem(setHotels, hotels, record.id!, 'starRating', v)} />
                    )},
                    { title: '房型', dataIndex: 'roomType', width: 150, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.roomType} onChange={(e) => updateItem(setHotels, hotels, record.id!, 'roomType', e.target.value)} />
                    )},
                    { title: '晚数', dataIndex: 'nights', width: 100, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={1} value={record.nights} onChange={(v) => updateItem(setHotels, hotels, record.id!, 'nights', v)} />
                    )},
                    { title: '单价(晚)', dataIndex: 'costPerNight', width: 120, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={0} value={record.costPerNight} onChange={(v) => updateItem(setHotels, hotels, record.id!, 'costPerNight', v)} />
                    )},
                    { title: '小计', dataIndex: 'totalCost', width: 120, render: (cost: number) => `¥${cost?.toLocaleString() || 0}` },
                    { title: '供应商', dataIndex: 'supplier', width: 150, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.supplier} onChange={(e) => updateItem(setHotels, hotels, record.id!, 'supplier', e.target.value)} />
                    )},
                  ],
                  { name: '', starRating: 4, roomType: '标准间', nights: 1, costPerNight: 0, supplier: '' }
                )}
              </TabPane>

              <TabPane tab="交通" key="transportation">
                {renderItemTable(
                  transportation,
                  setTransportation,
                  [
                    { title: '类型', dataIndex: 'type', width: 120, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.type} onChange={(e) => updateItem(setTransportation, transportation, record.id!, 'type', e.target.value)} />
                    )},
                    { title: '描述', dataIndex: 'description', width: 200, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.description} onChange={(e) => updateItem(setTransportation, transportation, record.id!, 'description', e.target.value)} />
                    )},
                    { title: '车型', dataIndex: 'vehicleType', width: 120, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.vehicleType} onChange={(e) => updateItem(setTransportation, transportation, record.id!, 'vehicleType', e.target.value)} />
                    )},
                    { title: '天数', dataIndex: 'days', width: 100, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={1} value={record.days} onChange={(v) => updateItem(setTransportation, transportation, record.id!, 'days', v)} />
                    )},
                    { title: '单价(天)', dataIndex: 'costPerDay', width: 120, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={0} value={record.costPerDay} onChange={(v) => updateItem(setTransportation, transportation, record.id!, 'costPerDay', v)} />
                    )},
                    { title: '小计', dataIndex: 'totalCost', width: 120, render: (cost: number) => `¥${cost?.toLocaleString() || 0}` },
                    { title: '供应商', dataIndex: 'supplier', width: 150, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.supplier} onChange={(e) => updateItem(setTransportation, transportation, record.id!, 'supplier', e.target.value)} />
                    )},
                  ],
                  { type: '', description: '', vehicleType: '', days: 1, costPerDay: 0, supplier: '' }
                )}
              </TabPane>

              <TabPane tab="门票" key="tickets">
                {renderItemTable(
                  tickets,
                  setTickets,
                  [
                    { title: '景点', dataIndex: 'attraction', width: 200, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.attraction} onChange={(e) => updateItem(setTickets, tickets, record.id!, 'attraction', e.target.value)} />
                    )},
                    { title: '数量', dataIndex: 'quantity', width: 100, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={1} value={record.quantity} onChange={(v) => updateItem(setTickets, tickets, record.id!, 'quantity', v)} />
                    )},
                    { title: '单价', dataIndex: 'costPerTicket', width: 120, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={0} value={record.costPerTicket} onChange={(v) => updateItem(setTickets, tickets, record.id!, 'costPerTicket', v)} />
                    )},
                    { title: '小计', dataIndex: 'totalCost', width: 120, render: (cost: number) => `¥${cost?.toLocaleString() || 0}` },
                    { title: '供应商', dataIndex: 'supplier', width: 150, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.supplier} onChange={(e) => updateItem(setTickets, tickets, record.id!, 'supplier', e.target.value)} />
                    )},
                  ],
                  { attraction: '', quantity: 1, costPerTicket: 0, supplier: '' }
                )}
              </TabPane>

              <TabPane tab="餐饮" key="meals">
                {renderItemTable(
                  meals,
                  setMeals,
                  [
                    { title: '类型', dataIndex: 'type', width: 120, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.type} onChange={(e) => updateItem(setMeals, meals, record.id!, 'type', e.target.value)} />
                    )},
                    { title: '份数', dataIndex: 'count', width: 100, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={1} value={record.count} onChange={(v) => updateItem(setMeals, meals, record.id!, 'count', v)} />
                    )},
                    { title: '单价(人)', dataIndex: 'costPerPerson', width: 120, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={0} value={record.costPerPerson} onChange={(v) => updateItem(setMeals, meals, record.id!, 'costPerPerson', v)} />
                    )},
                    { title: '小计', dataIndex: 'totalCost', width: 120, render: (cost: number) => `¥${cost?.toLocaleString() || 0}` },
                    { title: '描述', dataIndex: 'description', width: 200, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.description} onChange={(e) => updateItem(setMeals, meals, record.id!, 'description', e.target.value)} />
                    )},
                  ],
                  { type: '正餐', count: 1, costPerPerson: 0, description: '' }
                )}
              </TabPane>

              <TabPane tab="导游" key="guides">
                {renderItemTable(
                  guides,
                  setGuides,
                  [
                    { title: '类型', dataIndex: 'type', width: 120, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.type} onChange={(e) => updateItem(setGuides, guides, record.id!, 'type', e.target.value)} />
                    )},
                    { title: '语种', dataIndex: 'language', width: 120, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.language} onChange={(e) => updateItem(setGuides, guides, record.id!, 'language', e.target.value)} />
                    )},
                    { title: '天数', dataIndex: 'days', width: 100, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={1} value={record.days} onChange={(v) => updateItem(setGuides, guides, record.id!, 'days', v)} />
                    )},
                    { title: '单价(天)', dataIndex: 'costPerDay', width: 120, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={0} value={record.costPerDay} onChange={(v) => updateItem(setGuides, guides, record.id!, 'costPerDay', v)} />
                    )},
                    { title: '小计', dataIndex: 'totalCost', width: 120, render: (cost: number) => `¥${cost?.toLocaleString() || 0}` },
                  ],
                  { type: '全程陪同', language: '中文', days: 1, costPerDay: 0 }
                )}
              </TabPane>

              <TabPane tab="其他" key="other">
                {renderItemTable(
                  otherExpenses,
                  setOtherExpenses,
                  [
                    { title: '描述', dataIndex: 'description', width: 300, render: (_: any, record: QuoteItem) => (
                      <Input size="small" value={record.description} onChange={(e) => updateItem(setOtherExpenses, otherExpenses, record.id!, 'description', e.target.value)} />
                    )},
                    { title: '金额', dataIndex: 'amount', width: 200, render: (_: any, record: QuoteItem) => (
                      <InputNumber size="small" min={0} style={{ width: '100%' }} value={record.amount} onChange={(v) => updateItem(setOtherExpenses, otherExpenses, record.id!, 'amount', v)} />
                    )},
                  ],
                  { description: '', amount: 0 }
                )}
              </TabPane>
            </Tabs>
          </Card>

          <Card title="备注" style={{ marginTop: 16 }}>
            <Form form={form}>
              <Form.Item name="remarks">
                <TextArea rows={3} placeholder="内部备注" />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={6}>
          <Card title="费用汇总" size="small">
            <Row gutter={[0, 16]}>
              <Col span={24}>
                <Statistic title="总成本" value={totals.totalCost} prefix="¥" />
              </Col>
              <Col span={24}>
                <div style={{ marginBottom: 8 }}>服务费</div>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={serviceFee}
                  onChange={setServiceFee}
                  prefix="¥"
                  addonAfter={<span style={{ color: '#52c41a' }}>毛利</span>}
                />
              </Col>
              <Divider style={{ margin: '12px 0' }} />
              <Col span={24}>
                <Statistic title="总价" value={totals.totalPrice} prefix="¥" />
              </Col>
              <Col span={24}>
                <Statistic
                  title="毛利率"
                  value={totals.profitMargin}
                  suffix="%"
                  valueStyle={{
                    color: totals.profitMargin < 5 ? '#ff4d4f' : totals.profitMargin < 10 ? '#fa8c16' : '#3f8600',
                  }}
                />
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 8 }}>修改说明（可选）</div>
              <TextArea
                rows={2}
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="描述本次修改内容"
              />
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block onClick={handleSave} loading={updateMutation.isLoading}>
                保存
              </Button>
              {canSubmit && (
                <Button
                  type="primary"
                  block
                  danger={totals.profitMargin < 10}
                  onClick={handleSubmit}
                  loading={submitMutation.isLoading}
                >
                  {totals.profitMargin < 10 ? '提交审批（低毛利）' : '提交审批'}
                </Button>
              )}
              <Button block onClick={() => navigate('/quotes')}>
                取消
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="低毛利确认"
        open={showSubmitModal}
        onOk={() => submitMutation.mutate()}
        onCancel={() => setShowSubmitModal(false)}
        confirmLoading={submitMutation.isLoading}
        okText="确认提交"
        cancelText="取消"
      >
        <p>当前报价毛利率为 <strong style={{ color: '#fa8c16' }}>{totals.profitMargin.toFixed(1)}%</strong>，低于正常水平（10%）。</p>
        <p>提交后主管将收到低毛利预警通知，需要特别审批。</p>
        <p>是否确认提交？</p>
      </Modal>
    </div>
  );
}
