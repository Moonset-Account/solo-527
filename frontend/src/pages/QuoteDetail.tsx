import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  GitCompare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Clock,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { quoteApi } from '../services/api';
import { Quote } from '../types';
import { formatCurrency, formatDateTime, formatPercent } from '../utils/format';

export const QuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [versions, setVersions] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState<number>(1);
  const [compareVersion2, setCompareVersion2] = useState<number>(1);
  const [compareData, setCompareData] = useState<any>(null);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const [quoteData, versionsData] = await Promise.all([
        quoteApi.findOne(id!),
        quoteApi.getVersions(id!),
      ]);
      setQuote(quoteData);
      setVersions(versionsData);
      if (versionsData.length >= 2) {
        setCompareVersion1(versionsData[0].version);
        setCompareVersion2(versionsData[versionsData.length - 1].version);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const handleCompare = async () => {
    if (compareVersion1 === compareVersion2) {
      alert('请选择不同的版本进行对比');
      return;
    }
    try {
      const data = await quoteApi.compareVersions(id!, compareVersion1, compareVersion2);
      setCompareData(data);
    } catch (error) {
      console.error('Failed to compare versions:', error);
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin < 15) return 'text-red-600';
    if (margin < 25) return 'text-amber-600';
    return 'text-green-600';
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

  if (!quote) {
    return (
      <Layout>
        <div className="text-center py-12 text-slate-500">报价单不存在</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/quotes')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">
                  报价单 #{quote.id.slice(0, 8)}
                </h1>
                <StatusBadge status={quote.status} type="quote" />
              </div>
              <p className="text-slate-500 mt-1">
                版本 {quote.version} | 创建于 {formatDateTime(quote.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {versions.length > 1 && (
              <button
                onClick={() => setShowCompare(!showCompare)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showCompare
                    ? 'bg-purple-100 text-purple-700'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <GitCompare size={18} />
                版本对比
              </button>
            )}
            <button
              onClick={() => navigate(`/quotes/${quote.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              <Edit2 size={18} />
              编辑
            </button>
          </div>
        </div>

        {showCompare && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">版本对比</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">版本 1:</span>
                <select
                  value={compareVersion1}
                  onChange={(e) => setCompareVersion1(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>v{v.version}</option>
                  ))}
                </select>
              </div>
              <span className="text-slate-400">VS</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">版本 2:</span>
                <select
                  value={compareVersion2}
                  onChange={(e) => setCompareVersion2(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>v{v.version}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCompare}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              >
                对比
              </button>
            </div>
            {compareData && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-slate-600">项目</th>
                      <th className="text-left px-4 py-2 text-slate-600">版本 {compareVersion1}</th>
                      <th className="text-left px-4 py-2 text-slate-600">版本 {compareVersion2}</th>
                      <th className="text-left px-4 py-2 text-slate-600">差异</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-2 text-slate-700">总售价</td>
                      <td className="px-4 py-2">{formatCurrency(compareData.version1?.totalPrice || 0)}</td>
                      <td className="px-4 py-2">{formatCurrency(compareData.version2?.totalPrice || 0)}</td>
                      <td className={`px-4 py-2 font-medium ${
                        (compareData.version2?.totalPrice || 0) > (compareData.version1?.totalPrice || 0)
                          ? 'text-green-600'
                          : (compareData.version2?.totalPrice || 0) < (compareData.version1?.totalPrice || 0)
                          ? 'text-red-600'
                          : 'text-slate-500'
                      }`}>
                        {(compareData.version2?.totalPrice || 0) - (compareData.version1?.totalPrice || 0) >= 0 ? '+' : ''}
                        {formatCurrency((compareData.version2?.totalPrice || 0) - (compareData.version1?.totalPrice || 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-700">总成本</td>
                      <td className="px-4 py-2">{formatCurrency(compareData.version1?.totalCost || 0)}</td>
                      <td className="px-4 py-2">{formatCurrency(compareData.version2?.totalCost || 0)}</td>
                      <td className="px-4 py-2">
                        {(compareData.version2?.totalCost || 0) - (compareData.version1?.totalCost || 0) >= 0 ? '+' : ''}
                        {formatCurrency((compareData.version2?.totalCost || 0) - (compareData.version1?.totalCost || 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-700">毛利率</td>
                      <td className="px-4 py-2">{formatPercent(compareData.version1?.profitMargin || 0)}</td>
                      <td className="px-4 py-2">{formatPercent(compareData.version2?.profitMargin || 0)}</td>
                      <td className={`px-4 py-2 font-medium ${
                        (compareData.version2?.profitMargin || 0) > (compareData.version1?.profitMargin || 0)
                          ? 'text-green-600'
                          : (compareData.version2?.profitMargin || 0) < (compareData.version1?.profitMargin || 0)
                          ? 'text-red-600'
                          : 'text-slate-500'
                      }`}>
                        {(compareData.version2?.profitMargin || 0) - (compareData.version1?.profitMargin || 0) >= 0 ? '+' : ''}
                        {formatPercent((compareData.version2?.profitMargin || 0) - (compareData.version1?.profitMargin || 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-700">报价项数</td>
                      <td className="px-4 py-2">{compareData.version1?.items?.length || 0} 项</td>
                      <td className="px-4 py-2">{compareData.version2?.items?.length || 0} 项</td>
                      <td className="px-4 py-2">
                        {(compareData.version2?.items?.length || 0) - (compareData.version1?.items?.length || 0) >= 0 ? '+' : ''}
                        {(compareData.version2?.items?.length || 0) - (compareData.version1?.items?.length || 0)} 项
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {quote.requiresManagerApproval && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800">需要主管审批</div>
              <div className="text-sm text-amber-700">
                该报价毛利率为 {formatPercent(quote.profitMargin)}，低于15%预警线，已自动标记为主管审批
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">客户信息</h3>
              {quote.demand && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">客户姓名</div>
                    <div className="font-medium text-slate-800">{quote.demand.customerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">联系电话</div>
                    <div className="font-medium text-slate-800">{quote.demand.customerPhone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">行程</div>
                    <div className="font-medium text-slate-800">{quote.demand.days} 天</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">人数</div>
                    <div className="font-medium text-slate-800">{quote.demand.peopleCount} 人</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">报价明细</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase">类型</th>
                      <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase">项目</th>
                      <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">数量</th>
                      <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">成本价</th>
                      <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">售价</th>
                      <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 text-sm">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                            {item.type === 'hotel' ? '酒店' :
                             item.type === 'vehicle' ? '车辆' :
                             item.type === 'ticket' ? '门票' :
                             item.type === 'service' ? '服务' : '其他'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-slate-800">{item.name}</td>
                        <td className="py-3 text-sm text-right text-slate-700">{item.quantity}</td>
                        <td className="py-3 text-sm text-right text-slate-500">{formatCurrency(item.unitCost)}</td>
                        <td className="py-3 text-sm text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-sm text-right font-medium text-slate-800">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">付款节点</h3>
              <div className="space-y-3">
                {quote.paymentNodes.map((node, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{node.name}</div>
                        <div className="text-sm text-slate-500">{node.percentage}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-800">{formatCurrency(node.amount)}</div>
                      <StatusBadge status={node.status} type="payment" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">金额汇总</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">总成本</span>
                  <span className="font-medium text-slate-800">{formatCurrency(quote.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">总售价</span>
                  <span className="font-bold text-xl text-teal-600">{formatCurrency(quote.totalPrice)}</span>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500">毛利额</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(quote.totalPrice - quote.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">毛利率</span>
                    <span className={`font-bold text-lg ${getMarginColor(quote.profitMargin)}`}>
                      {formatPercent(quote.profitMargin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">版本历史</h3>
              <div className="space-y-3">
                {versions.map((v, index) => (
                  <div
                    key={v.version}
                    className={`p-3 rounded-lg border ${
                      v.version === quote.version
                        ? 'border-teal-200 bg-teal-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                          v{v.version}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {formatCurrency(v.totalPrice)}
                          </div>
                          <div className="text-xs text-slate-500">
                            毛利率 {formatPercent(v.profitMargin)}
                          </div>
                        </div>
                      </div>
                      {v.version === quote.version && (
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">当前</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{formatDateTime(v.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">创建信息</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-medium">
                    {quote.createdBy?.name?.charAt(0) || '-'}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{quote.createdBy?.name || '-'}</div>
                    <div className="text-sm text-slate-500">创建人</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={14} />
                  <span>创建于 {formatDateTime(quote.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
