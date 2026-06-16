import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import type { Settlement } from '@/types';

const mockSettlement: Settlement = {
  id: 1, contractId: 1, ownerId: 1, ownerName: '业主A', period: '2026年6月',
  amount: 6500, status: 'pending', approvedBy: '', approvedAt: '', remark: '',
  createdAt: '2026-06-01',
};

export default function SettlementDetail() {
  const { id } = useParams();
  const [settlement] = useState(mockSettlement);
  const [remark, setRemark] = useState('');

  return (
    <div className="space-y-4">
      <Link to="/settlements" className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F97316]">
        <ArrowLeft size={16} /> 返回结算列表
      </Link>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F1F5F9]">结算详情 #{id}</h2>
          <StatusBadge status={settlement.status} />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <span className="text-sm text-[#94A3B8]">业主</span>
            <p className="text-[#F1F5F9] mt-0.5">{settlement.ownerName}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">结算周期</span>
            <p className="text-[#F1F5F9] mt-0.5">{settlement.period}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">合同编号</span>
            <p className="text-[#F1F5F9] mt-0.5">#{settlement.contractId}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">创建时间</span>
            <p className="text-[#F1F5F9] mt-0.5">{settlement.createdAt}</p>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[#0F172A] border border-[#334155] text-center mb-6">
          <p className="text-sm text-[#94A3B8] mb-2">结算金额</p>
          <p className="text-4xl font-bold text-[#F97316]">¥{settlement.amount.toLocaleString()}</p>
        </div>

        {settlement.approvedBy && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm text-[#94A3B8]">审批人</span>
              <p className="text-[#F1F5F9] mt-0.5">{settlement.approvedBy}</p>
            </div>
            <div>
              <span className="text-sm text-[#94A3B8]">审批时间</span>
              <p className="text-[#F1F5F9] mt-0.5">{settlement.approvedAt || '-'}</p>
            </div>
          </div>
        )}

        {settlement.status === 'pending' && (
          <>
            <div className="mb-4">
              <label className="block text-sm text-[#94A3B8] mb-1">审批备注</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none resize-none h-20"
                placeholder="输入审批备注"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
                <CheckCircle size={16} /> 审批通过
              </button>
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700">
                <XCircle size={16} /> 驳回
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
