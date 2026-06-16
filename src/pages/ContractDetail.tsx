import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import type { Contract } from '@/types';

const mockContract: Contract = {
  id: 1, templateId: 1, roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生',
  ownerId: 1, ownerName: '业主A', startDate: '2026-03-01', endDate: '2027-02-28',
  monthlyRent: 6500, deposit: 13000, status: 'owner_signed', content: '长租公寓租赁合同\n\n甲方(业主)：业主A\n乙方(租客)：张先生\n\n第一条 租赁房屋\n甲方将位于朝阳区望京SOHO A座1201的房屋出租给乙方。\n\n第二条 租赁期限\n租赁期自2026年3月1日至2027年2月28日。\n\n第三条 租金\n月租金为人民币6500元，押金为人民币13000元。',
  signedAt: '2026-06-15', createdAt: '2026-06-13',
};

const steps = [
  { key: 'draft', label: '草稿' },
  { key: 'owner_signed', label: '业主签署' },
  { key: 'tenant_signed', label: '租客签署' },
  { key: 'archived', label: '归档' },
] as const;

export default function ContractDetail() {
  const { id } = useParams();
  const [contract] = useState(mockContract);

  const currentIndex = steps.findIndex((s) => s.key === contract.status);

  return (
    <div className="space-y-4">
      <Link to="/contracts" className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F97316]">
        <ArrowLeft size={16} /> 返回合同列表
      </Link>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F1F5F9]">合同详情 #{id}</h2>
          <StatusBadge status={contract.status} />
        </div>

        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= currentIndex
                    ? 'bg-[#F97316] text-white'
                    : 'bg-[#334155] text-[#94A3B8]'
                }`}>
                  {i < currentIndex ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span className={`mt-1 text-xs ${i <= currentIndex ? 'text-[#F97316]' : 'text-[#64748B]'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 mb-5 ${i < currentIndex ? 'bg-[#F97316]' : 'bg-[#334155]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-sm text-[#94A3B8]">房源</span>
            <p className="text-[#F1F5F9] mt-0.5">{contract.roomName}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">业主</span>
            <p className="text-[#F1F5F9] mt-0.5">{contract.ownerName}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">租客</span>
            <p className="text-[#F1F5F9] mt-0.5">{contract.tenantName}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">租期</span>
            <p className="text-[#F1F5F9] mt-0.5">{contract.startDate} ~ {contract.endDate}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">月租金</span>
            <p className="text-[#F97316] font-medium mt-0.5">¥{contract.monthlyRent}</p>
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">押金</span>
            <p className="text-[#F1F5F9] mt-0.5">¥{contract.deposit}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {contract.status === 'draft' && (
            <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]">
              <FileText size={16} /> 发送业主签署
            </button>
          )}
          {contract.status === 'owner_signed' && (
            <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]">
              <FileText size={16} /> 发送租客签署
            </button>
          )}
          {contract.status === 'tenant_signed' && (
            <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
              <CheckCircle size={16} /> 确认归档
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155]">
        <h3 className="text-base font-medium text-[#F1F5F9] mb-3">合同内容预览</h3>
        <div className="bg-[#0F172A] rounded-lg p-4 text-sm text-[#CBD5E1] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
          {contract.content}
        </div>
      </div>
    </div>
  );
}
