'use client';

import { RushOrder } from '@/lib/types';
import { AlertTriangle, User, FileText, GitBranch, Calendar } from 'lucide-react';

interface RushOrderPanelProps {
  rushOrders: RushOrder[];
}

export default function RushOrderPanel({ rushOrders }: RushOrderPanelProps) {
  if (rushOrders.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold text-base mb-3">插单记录明细</h3>
        <div className="text-slate-500 text-sm text-center py-8">当前工单无插单记录</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-pink-400" />
        <h3 className="text-white font-semibold text-base">插单记录明细</h3>
        <span className="bg-pink-500/20 text-pink-400 text-xs px-2 py-0.5 rounded-full">{rushOrders.length} 条</span>
      </div>

      <div className="space-y-3">
        {rushOrders.map((ro) => (
          <div key={ro.id} className="bg-slate-800/60 border border-pink-500/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-pink-400 font-mono text-sm">{ro.id}</span>
              <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-0.5 rounded">优先级提升 +{ro.priorityBoost}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>审批人: {ro.approvedBy}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>插入时间: {ro.insertedAt.replace('T', ' ').slice(0, 16)}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-md p-2.5 border border-slate-600/20">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-medium">审批备注</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{ro.approvalNote}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <GitBranch className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-400 text-xs font-medium">影响范围</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ro.impactScope.map((scope, i) => (
                  <span key={i} className="bg-teal-500/15 text-teal-300 text-[10px] px-2 py-0.5 rounded border border-teal-500/20">
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
              <span>原交期: {ro.originalDeliveryDate}</span>
              <span className="text-pink-400">→ 新交期: {ro.newDeliveryDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
