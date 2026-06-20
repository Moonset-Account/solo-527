import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import useAuthStore from '@/stores/auth';
import {
  getInvoiceConfig,
  updateInvoiceConfig,
  getPrepaidConfig,
  updatePrepaidConfig,
  getCashForecastConfig,
  updateCashForecastConfig,
} from '@/api/configs';
import type { InvoiceConfig, PrepaidConfig, CashForecastConfig } from '@/types';

type TabKey = 'invoice' | 'prepaid' | 'cash';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'invoice', label: '发票申请' },
  { key: 'prepaid', label: '预存余额' },
  { key: 'cash', label: '现金预测' },
];

export default function ConfigCenter() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<TabKey>('invoice');

  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null);
  const [prepaidConfig, setPrepaidConfig] = useState<PrepaidConfig | null>(null);
  const [cashConfig, setCashConfig] = useState<CashForecastConfig | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({ approval_required: false, auto_apply_threshold: 0 });
  const [prepaidForm, setPrepaidForm] = useState({ balance_threshold: 0, warning_enabled: false });
  const [cashForm, setCashForm] = useState({ forecast_window_days: 0, confidence_threshold: 0 });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<TabKey, boolean>>({ invoice: false, prepaid: false, cash: false });

  useEffect(() => {
    (async () => {
      try {
        const [invoiceRes, prepaidRes, cashRes] = await Promise.all([
          getInvoiceConfig(),
          getPrepaidConfig(),
          getCashForecastConfig(),
        ]);
        setInvoiceConfig(invoiceRes.data);
        setPrepaidConfig(prepaidRes.data);
        setCashConfig(cashRes.data);
        setInvoiceForm({
          approval_required: invoiceRes.data.approval_required,
          auto_apply_threshold: invoiceRes.data.auto_apply_threshold,
        });
        setPrepaidForm({
          balance_threshold: prepaidRes.data.balance_threshold,
          warning_enabled: prepaidRes.data.warning_enabled,
        });
        setCashForm({
          forecast_window_days: cashRes.data.forecast_window_days,
          confidence_threshold: cashRes.data.confidence_threshold,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveInvoice = async () => {
    setSaving((s) => ({ ...s, invoice: true }));
    try {
      const res = await updateInvoiceConfig(invoiceForm);
      setInvoiceConfig(res.data);
    } finally {
      setSaving((s) => ({ ...s, invoice: false }));
    }
  };

  const savePrepaid = async () => {
    setSaving((s) => ({ ...s, prepaid: true }));
    try {
      const res = await updatePrepaidConfig(prepaidForm);
      setPrepaidConfig(res.data);
    } finally {
      setSaving((s) => ({ ...s, prepaid: false }));
    }
  };

  const saveCash = async () => {
    setSaving((s) => ({ ...s, cash: true }));
    try {
      const res = await updateCashForecastConfig(cashForm);
      setCashConfig(res.data);
    } finally {
      setSaving((s) => ({ ...s, cash: false }));
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">加载中...</div>;

  const renderLastModified = (name: string, time: string) => (
    <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
      上次修改: {name} 于 {new Date(time).toLocaleString('zh-CN')}
    </p>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">配置中心</h1>
        <Link
          to="/config/changelog"
          className="text-sm text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
        >
          查看变更日志
        </Link>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'invoice' && invoiceConfig && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">是否需要审批</label>
            <button
              onClick={() => isAdmin && setInvoiceForm({ ...invoiceForm, approval_required: !invoiceForm.approval_required })}
              disabled={!isAdmin}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                invoiceForm.approval_required ? 'bg-amber-500' : 'bg-gray-200'
              } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  invoiceForm.approval_required ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">自动申请阈值</label>
            <input
              type="number"
              min={0}
              value={invoiceForm.auto_apply_threshold}
              onChange={(e) => isAdmin && setInvoiceForm({ ...invoiceForm, auto_apply_threshold: Number(e.target.value) })}
              readOnly={!isAdmin}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                !isAdmin ? 'bg-gray-50' : ''
              }`}
            />
          </div>
          {renderLastModified(invoiceConfig.updated_by_name, invoiceConfig.updated_at)}
          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                onClick={saveInvoice}
                disabled={saving.invoice}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#f59e0b' }}
              >
                <Save className="w-4 h-4" />
                {saving.invoice ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'prepaid' && prepaidConfig && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">余额阈值</label>
            <input
              type="number"
              min={0}
              value={prepaidForm.balance_threshold}
              onChange={(e) => isAdmin && setPrepaidForm({ ...prepaidForm, balance_threshold: Number(e.target.value) })}
              readOnly={!isAdmin}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                !isAdmin ? 'bg-gray-50' : ''
              }`}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">是否启用预警</label>
            <button
              onClick={() => isAdmin && setPrepaidForm({ ...prepaidForm, warning_enabled: !prepaidForm.warning_enabled })}
              disabled={!isAdmin}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prepaidForm.warning_enabled ? 'bg-amber-500' : 'bg-gray-200'
              } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prepaidForm.warning_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {renderLastModified(prepaidConfig.updated_by_name, prepaidConfig.updated_at)}
          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                onClick={savePrepaid}
                disabled={saving.prepaid}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#f59e0b' }}
              >
                <Save className="w-4 h-4" />
                {saving.prepaid ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cash' && cashConfig && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预测窗口天数</label>
            <input
              type="number"
              min={0}
              value={cashForm.forecast_window_days}
              onChange={(e) => isAdmin && setCashForm({ ...cashForm, forecast_window_days: Number(e.target.value) })}
              readOnly={!isAdmin}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                !isAdmin ? 'bg-gray-50' : ''
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">置信度阈值 (0-1)</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={cashForm.confidence_threshold}
              onChange={(e) => isAdmin && setCashForm({ ...cashForm, confidence_threshold: Number(e.target.value) })}
              readOnly={!isAdmin}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                !isAdmin ? 'bg-gray-50' : ''
              }`}
            />
          </div>
          {renderLastModified(cashConfig.updated_by_name, cashConfig.updated_at)}
          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                onClick={saveCash}
                disabled={saving.cash}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#f59e0b' }}
              >
                <Save className="w-4 h-4" />
                {saving.cash ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
