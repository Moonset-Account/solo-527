import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Send,
  AlertTriangle,
  ArrowLeft,
  Hotel,
  Car,
  Ticket,
  HandCoins,
  MoreHorizontal,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { quoteApi, demandApi, supplierApi } from '../services/api';
import { Quote, QuoteItem, QuoteItemType, PaymentNode, Demand, Supplier } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

const itemTypeOptions: { value: QuoteItemType; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'hotel', label: '酒店', icon: Hotel },
  { value: 'vehicle', label: '车辆', icon: Car },
  { value: 'ticket', label: '门票', icon: Ticket },
  { value: 'service', label: '服务', icon: HandCoins },
  { value: 'other', label: '其他', icon: MoreHorizontal },
];

export const QuoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const demandId = searchParams.get('demandId');
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);

  const [formData, setFormData] = useState<{
    demandId: string;
    items: QuoteItem[];
    paymentNodes: PaymentNode[];
  }>({
    demandId: demandId || '',
    items: [],
    paymentNodes: [
      { name: '定金', percentage: 30, amount: 0, status: 'pending' },
      { name: '尾款', percentage: 70, amount: 0, status: 'pending' },
    ],
  });

  const [showLowMarginWarning, setShowLowMarginWarning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [demandsRes, suppliersRes] = await Promise.all([
        demandApi.findAll({ pageSize: 100 }),
        supplierApi.findAll({ pageSize: 100 }),
      ]);
      setDemands(demandsRes.data);
      setSuppliers(suppliersRes.data);

      if (isEdit) {
        const quote = await quoteApi.findOne(id!);
        setFormData({
          demandId: quote.demandId || '',
          items: quote.items || [],
          paymentNodes: quote.paymentNodes || [],
        });
        if (quote.demand) {
          setSelectedDemand(quote.demand);
        }
      } else if (demandId) {
        const demand = demandsRes.data.find((d) => d.id === demandId);
        if (demand) {
          setSelectedDemand(demand);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, demandId]);

  const totals = formData.items.reduce(
    (acc, item) => {
      const cost = item.unitCost * item.quantity;
      const price = item.unitPrice * item.quantity;
      return {
        totalCost: acc.totalCost + cost,
        totalPrice: acc.totalPrice + price,
      };
    },
    { totalCost: 0, totalPrice: 0 }
  );

  const profitMargin = totals.totalPrice > 0
    ? ((totals.totalPrice - totals.totalCost) / totals.totalPrice) * 100
    : 0;

  useEffect(() => {
    setShowLowMarginWarning(profitMargin > 0 && profitMargin < 15);
  }, [profitMargin]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      paymentNodes: prev.paymentNodes.map((node) => ({
        ...node,
        amount: (totals.totalPrice * node.percentage) / 100,
      })),
    }));
  }, [totals.totalPrice]);

  const handleDemandChange = (demandId: string) => {
    setFormData({ ...formData, demandId });
    const demand = demands.find((d) => d.id === demandId);
    setSelectedDemand(demand || null);
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      type: 'hotel',
      name: '',
      quantity: 1,
      unitCost: 0,
      unitPrice: 0,
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const addPaymentNode = () => {
    const newNode: PaymentNode = {
      name: '节点' + (formData.paymentNodes.length + 1),
      percentage: 0,
      amount: 0,
      status: 'pending',
    };
    setFormData({ ...formData, paymentNodes: [...formData.paymentNodes, newNode] });
  };

  const updatePaymentNode = (index: number, field: keyof PaymentNode, value: any) => {
    const newNodes = [...formData.paymentNodes];
    newNodes[index] = { ...newNodes[index], [field]: value };
    setFormData({ ...formData, paymentNodes: newNodes });
  };

  const removePaymentNode = (index: number) => {
    const newNodes = formData.paymentNodes.filter((_, i) => i !== index);
    setFormData({ ...formData, paymentNodes: newNodes });
  };

  const handleSave = async (submitForApproval = false) => {
    if (!formData.demandId) {
      alert('请选择关联的客户需求');
      return;
    }
    if (formData.items.length === 0) {
      alert('请至少添加一个报价项');
      return;
    }

    if (submitForApproval && showLowMarginWarning) {
      if (!confirm('当前报价毛利率低于15%，需要主管审批确认。确定提交吗？')) {
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        if (submitForApproval) {
          await quoteApi.submitForApproval(id!);
        } else {
          await quoteApi.update(id!, formData);
        }
      } else {
        const quote = await quoteApi.create(formData);
        if (submitForApproval) {
          await quoteApi.submitForApproval(quote.id);
        }
      }
      navigate('/quotes');
    } catch (error) {
      console.error('Failed to save quote:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotes')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isEdit ? '编辑报价单' : '新建报价单'}
            </h1>
            <p className="text-slate-500 mt-1">填写报价详情，系统自动计算毛利</p>
          </div>
        </div>

        {showLowMarginWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800">低毛利预警</div>
              <div className="text-sm text-amber-700">
                当前报价毛利率为 {formatPercent(profitMargin)}，低于15%的预警线。提交时需要主管审批确认。
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">关联客户需求</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">选择需求</label>
                  <select
                    value={formData.demandId}
                    onChange={(e) => handleDemandChange(e.target.value)}
                    disabled={isEdit}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">请选择客户需求</option>
                    {demands.map((demand) => (
                      <option key={demand.id} value={demand.id}>
                        {demand.customerName} - {demand.days}天{demand.peopleCount}人
                      </option>
                    ))}
                  </select>
                </div>
                {selectedDemand && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-500">客户姓名</div>
                        <div className="font-medium text-slate-800">{selectedDemand.customerName}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">联系电话</div>
                        <div className="font-medium text-slate-800">{selectedDemand.customerPhone}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">行程天数</div>
                        <div className="font-medium text-slate-800">{selectedDemand.days} 天</div>
                      </div>
                      <div>
                        <div className="text-slate-500">出行人数</div>
                        <div className="font-medium text-slate-800">{selectedDemand.peopleCount} 人</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">报价明细</h3>
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  添加报价项
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    暂无报价项，点击上方按钮添加
                  </div>
                ) : (
                  formData.items.map((item, index) => {
                    const itemType = itemTypeOptions.find((t) => t.value === item.type);
                    const Icon = itemType?.icon || MoreHorizontal;
                    return (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-lg p-4 hover:border-teal-200 transition-colors"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">类型</label>
                            <select
                              value={item.type}
                              onChange={(e) => updateItem(index, 'type', e.target.value as QuoteItemType)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              {itemTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">项目名称</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              placeholder="如：希尔顿酒店标间"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">数量</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">成本价 (元)</label>
                            <input
                              type="number"
                              min="0"
                              value={item.unitCost}
                              onChange={(e) => updateItem(index, 'unitCost', Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">售价 (元)</label>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">小计</label>
                            <div className="text-sm font-medium text-slate-800">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </div>
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            <button
                              onClick={() => removeItem(index)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1">供应商 (可选)</label>
                          <select
                            value={item.supplierId || ''}
                            onChange={(e) => updateItem(index, 'supplierId', e.target.value || undefined)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">选择供应商</option>
                            {suppliers
                              .filter((s) => s.type === item.type || s.type === 'guide')
                              .map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">付款节点</h3>
                <button
                  onClick={addPaymentNode}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  添加节点
                </button>
              </div>
              <div className="space-y-3">
                {formData.paymentNodes.map((node, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={node.name}
                      onChange={(e) => updatePaymentNode(index, 'name', e.target.value)}
                      placeholder="节点名称"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex items-center gap-2 w-40">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={node.percentage}
                        onChange={(e) => updatePaymentNode(index, 'percentage', Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-slate-500 text-sm">%</span>
                    </div>
                    <div className="w-32 text-right text-sm font-medium text-slate-800">
                      {formatCurrency(node.amount)}
                    </div>
                    {formData.paymentNodes.length > 1 && (
                      <button
                        onClick={() => removePaymentNode(index)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="font-semibold text-slate-800 mb-4">报价汇总</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">报价项数</span>
                  <span className="font-medium text-slate-800">{formData.items.length} 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">总成本</span>
                  <span className="font-medium text-slate-800">{formatCurrency(totals.totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">总售价</span>
                  <span className="font-bold text-lg text-teal-600">{formatCurrency(totals.totalPrice)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">毛利额</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(totals.totalPrice - totals.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-500">毛利率</span>
                    <span
                      className={`font-bold ${
                        profitMargin < 15
                          ? 'text-red-600'
                          : profitMargin < 25
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`}
                    >
                      {formatPercent(profitMargin)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  保存草稿
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                  提交审批
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
