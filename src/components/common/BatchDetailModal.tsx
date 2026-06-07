import { X, Calendar, MapPin, Package, Truck, AlertTriangle, ArrowRight } from 'lucide-react';
import { mockBatches, mockSKUs, mockLocations, mockSuppliers, mockOutbound, mockReturns, mockInbound } from '../../data/mockData';
import { EmptyState } from './EmptyState';

interface BatchDetailModalProps {
  batchId: string;
  onClose: () => void;
}

export function BatchDetailModal({ batchId, onClose }: BatchDetailModalProps) {
  const batch = mockBatches.find(b => b.id === batchId);
  const sku = batch ? mockSKUs.find(s => s.id === batch.skuId) : null;
  const location = batch ? mockLocations.find(l => l.id === batch.locationId) : null;
  const supplier = batch ? mockSuppliers.find(s => s.id === batch.supplierId) : null;
  const batchOutbound = mockOutbound.filter(o => o.batchId === batchId);
  const batchReturns = mockReturns.filter(r => r.batchId === batchId);
  const batchInbound = mockInbound.find(i => i.batchId === batchId);

  if (!batch || !sku) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full">
          <div className="p-6">
            <EmptyState type="no-result" title="批次不存在" description="未找到该批次信息" />
            <button className="btn btn-primary w-full mt-4" onClick={onClose}>关闭</button>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const daysToExpiry = Math.floor((new Date(batch.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const ageDays = Math.floor((today.getTime() - new Date(batch.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
  const totalOutbound = batchOutbound.reduce((sum, o) => sum + o.quantity, 0);
  const totalReturns = batchReturns.reduce((sum, r) => sum + r.quantity, 0);
  const currentQty = batch.quantity - totalOutbound + totalReturns;

  const expiryStatus = daysToExpiry <= 0
    ? { label: '已过期', class: 'bg-danger-100 text-danger-700' }
    : daysToExpiry <= 30
    ? { label: '临期', class: 'bg-danger-100 text-danger-700' }
    : daysToExpiry <= 90
    ? { label: '近效期', class: 'bg-warning-100 text-warning-700' }
    : { label: '正常', class: 'bg-success-100 text-success-700' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800">批次详情</h3>
            <p className="text-sm text-slate-500">{sku.name}</p>
          </div>
          <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-600">{batch.batchNo}</span>
                <span className={`badge ${expiryStatus.class}`}>{expiryStatus.label}</span>
              </div>
              <p className="text-sm text-slate-500">{sku.category} · {sku.unit}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-slate-800">{currentQty}</div>
              <div className="text-xs text-slate-500">当前库存</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary-600">{totalOutbound}</div>
              <div className="text-xs text-slate-500">累计出库</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-success-600">{ageDays}</div>
              <div className="text-xs text-slate-500">库龄(天)</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className={`text-2xl font-bold ${daysToExpiry <= 30 ? 'text-danger-600' : daysToExpiry <= 90 ? 'text-warning-600' : 'text-success-600'}`}>
                {daysToExpiry > 0 ? daysToExpiry : 0}
              </div>
              <div className="text-xs text-slate-500">距效期(天)</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                日期信息
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">生产日期</span>
                  <span className="text-slate-700">{batch.productionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">入库日期</span>
                  <span className="text-slate-700">{batch.receivedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">有效期至</span>
                  <span className={`font-medium ${daysToExpiry <= 30 ? 'text-danger-600' : 'text-slate-700'}`}>
                    {batch.expiryDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">保质期</span>
                  <span className="text-slate-700">{sku.shelfLifeDays}天</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                位置与供应
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">仓库仓位</span>
                  <span className="text-slate-700 font-mono">{location?.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">所属库区</span>
                  <span className="text-slate-700">{location?.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">供应商</span>
                  <span className="text-slate-700">{supplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">联系人</span>
                  <span className="text-slate-700">{supplier?.contact}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              流转记录
            </h4>

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

              <div className="space-y-4">
                {batchInbound && (
                  <div className="relative flex gap-4 pl-10">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-success-500 border-4 border-white shadow" />
                    <div className="flex-1 bg-success-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-success-700">入库</span>
                        <span className="text-xs text-success-600">{batchInbound.receivedDate}</span>
                      </div>
                      <p className="text-sm text-success-600">
                        入库 {batchInbound.quantity} {sku.unit} · {supplier?.name}
                      </p>
                    </div>
                  </div>
                )}

                {batchOutbound.map(out => (
                  <div key={out.id} className="relative flex gap-4 pl-10">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-primary-500 border-4 border-white shadow" />
                    <div className="flex-1 bg-primary-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-primary-700">出库</span>
                        <span className="text-xs text-primary-600">{out.shippedDate}</span>
                      </div>
                      <p className="text-sm text-primary-600">
                        出库 {out.quantity} {sku.unit} · 发往 {out.destination}
                      </p>
                    </div>
                  </div>
                ))}

                {batchReturns.map(ret => (
                  <div key={ret.id} className="relative flex gap-4 pl-10">
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-warning-500 border-4 border-white shadow" />
                    <div className="flex-1 bg-warning-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-warning-700">退货</span>
                        <span className="text-xs text-warning-600">{ret.returnDate}</span>
                      </div>
                      <p className="text-sm text-warning-600">
                        退货 {ret.quantity} {sku.unit} · 原因: {ret.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {daysToExpiry <= 90 && daysToExpiry > 0 && (
            <div className="mt-6 near-expiry-alert">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning-700 mb-1">近效期处理建议</p>
                  <ul className="text-xs text-warning-600 space-y-0.5">
                    <li>• 建议优先出库此批次商品，执行先进先出</li>
                    <li>• 可考虑绑定促销或专区销售加速周转</li>
                    <li>• 评估是否需要调拨至动销更快的门店</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
          <button className="btn btn-primary">
            <ArrowRight className="w-4 h-4" />
            查看完整溯源
          </button>
        </div>
      </div>
    </div>
  );
}
