'use client';

import { WorkOrder, ProcessStep, PriorityAdjustment } from '@/lib/types';
import { getWorkshopById } from '@/lib/mock-data';
import { Clock, AlertCircle, Package, Wrench, Zap, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onPriorityAdjust: (woId: string, newPriority: number, reason: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  delayed: 'bg-red-500',
  planned: 'bg-slate-500',
};

const statusLabels: Record<string, string> = {
  pending: '待排产',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '已延期',
  planned: '待排产',
};

const causeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  capacity: { label: '产能', color: 'text-red-400', icon: <Zap className="w-3 h-3" /> },
  material: { label: '缺料', color: 'text-amber-400', icon: <Package className="w-3 h-3" /> },
  equipment: { label: '设备', color: 'text-purple-400', icon: <Wrench className="w-3 h-3" /> },
  rush_order: { label: '插单', color: 'text-pink-400', icon: <AlertCircle className="w-3 h-3" /> },
  cross_shop_transfer: { label: '转单', color: 'text-teal-400', icon: <ArrowRight className="w-3 h-3" /> },
};

export default function WorkOrderDetail({ workOrder, onPriorityAdjust }: WorkOrderDetailProps) {
  const [expanded, setExpanded] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [newPriority, setNewPriority] = useState(workOrder.priority);
  const [reason, setReason] = useState('');

  const handleAdjust = () => {
    if (newPriority !== workOrder.priority && reason.trim()) {
      onPriorityAdjust(workOrder.id, newPriority, reason);
      setAdjusting(false);
      setReason('');
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-base">工单详情</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${statusColors[workOrder.status]}`}>
            {statusLabels[workOrder.status]}
          </span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
        <div><span className="text-slate-500">工单号</span><div className="text-slate-200 font-mono">{workOrder.orderNo}</div></div>
        <div><span className="text-slate-500">客户</span><div className="text-slate-200">{workOrder.customer}</div></div>
        <div><span className="text-slate-500">产品</span><div className="text-slate-200">{workOrder.product}</div></div>
        <div><span className="text-slate-500">数量</span><div className="text-slate-200">{workOrder.quantity.toLocaleString()}</div></div>
        <div><span className="text-slate-500">交期</span><div className="text-slate-200">{workOrder.deliveryDate}</div></div>
        <div><span className="text-slate-500">总延期</span><div className="text-red-400 font-medium">{workOrder.totalDelayHours}h</div></div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400 text-xs">优先级:</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((p) => (
            <div key={p} className={`w-6 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${
              p <= workOrder.priority ? (p <= 1 ? 'bg-red-500' : p <= 2 ? 'bg-amber-500' : 'bg-slate-600') : 'bg-slate-700/50'
            } ${p <= workOrder.priority ? 'text-white' : 'text-slate-500'}`}>
              {p}
            </div>
          ))}
        </div>
        <button
          onClick={() => { setAdjusting(!adjusting); setNewPriority(workOrder.priority); }}
          className="ml-auto text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded hover:bg-indigo-500/30 transition-colors"
        >
          {adjusting ? '取消' : '调整优先级'}
        </button>
      </div>

      {adjusting && (
        <div className="bg-slate-800/60 border border-indigo-500/20 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">新优先级:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={`w-7 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                    newPriority === p ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入调整原因（必填）"
            className="w-full bg-slate-900/60 border border-slate-600/30 rounded-md px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
            rows={2}
          />
          <button
            onClick={handleAdjust}
            disabled={newPriority === workOrder.priority || !reason.trim()}
            className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            确认调整
          </button>
        </div>
      )}

      {expanded && (
        <div className="space-y-2">
          <div className="text-slate-400 text-xs font-medium mb-1">工序流程</div>
          {workOrder.processSteps.map((step) => (
            <ProcessStepRow key={step.id} step={step} />
          ))}
        </div>
      )}

      {workOrder.priorityAdjustments.length > 0 && (
        <div className="mt-4 border-t border-slate-700/50 pt-3">
          <div className="text-slate-400 text-xs font-medium mb-2">优先级调整记录</div>
          {workOrder.priorityAdjustments.map((adj) => (
            <AdjustmentRecord key={adj.id} adjustment={adj} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProcessStepRow({ step }: { step: ProcessStep }) {
  const workshop = getWorkshopById(step.workshopId);
  return (
    <div className={`flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2 text-xs border-l-2 ${
      step.status === 'delayed' ? 'border-l-red-500' : step.status === 'in_progress' ? 'border-l-blue-500' : step.status === 'completed' ? 'border-l-emerald-500' : 'border-l-slate-600'
    }`}>
      <span className="text-slate-500 w-5 text-right">{step.stepIndex + 1}</span>
      <span className="text-slate-200 w-20">{step.name}</span>
      <span className="text-slate-500 w-16">{workshop?.name || '-'}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${statusColors[step.status]}`}>
        {statusLabels[step.status]}
      </span>
      {step.delayHours > 0 && (
        <span className="text-red-400 flex items-center gap-0.5">
          <Clock className="w-3 h-3" />+{step.delayHours}h
        </span>
      )}
      <div className="flex gap-1 ml-auto">
        {step.delayCauses.map((cause, i) => {
          const info = causeLabels[cause];
          return (
            <span key={i} className={`flex items-center gap-0.5 text-[10px] ${info.color}`}>
              {info.icon}{info.label}
            </span>
          );
        })}
        {step.materialShortages.map((ms, i) => (
          <span key={i} className="flex items-center gap-0.5 text-[10px] text-amber-400">
            <Package className="w-3 h-3" />{ms.materialName}
          </span>
        ))}
      </div>
    </div>
  );
}

function AdjustmentRecord({ adjustment }: { adjustment: PriorityAdjustment }) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-2.5 text-xs space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-slate-300">{adjustment.adjustedBy} · {adjustment.adjustedAt.replace('T', ' ').slice(0, 16)}</span>
        <span className="flex items-center gap-1">
          <span className="text-slate-400">P{adjustment.oldPriority}</span>
          <ArrowRight className="w-3 h-3 text-indigo-400" />
          <span className="text-indigo-400 font-medium">P{adjustment.newPriority}</span>
        </span>
      </div>
      <div className="text-slate-400">{adjustment.reason}</div>
      <div className="flex items-center gap-2">
        <span className="text-red-400">调整前延期风险: {adjustment.beforeDelayRisk}%</span>
        <ArrowRight className="w-3 h-3 text-indigo-400" />
        <span className="text-emerald-400">调整后: {adjustment.afterDelayRisk}%</span>
      </div>
      {adjustment.affectedDownstreamSteps.length > 0 && (
        <div className="text-slate-500">
          影响下游工序: {adjustment.affectedDownstreamSteps.map((s) => s.split('-').pop()).join(', ')}
        </div>
      )}
    </div>
  );
}
