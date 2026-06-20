'use client';

import { useState, useMemo } from 'react';
import { Route, Search, Clock, User, Shield, Wrench, CheckCircle, FileText, AlertTriangle, ChevronRight, Filter, Eye, Download, Plus, ArrowRight } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getStatusText, getPriorityColor, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

const mockTickets = [
  {
    id: 'TK20240320001',
    title: '客户申请退货但已超过7天',
    customerName: '王小明',
    status: 'PROCESSING',
    priority: 'MEDIUM',
    category: '退换货',
    createdAt: '2024-03-20T10:00:00Z',
    currentSlaRule: '高优先级工单响应规则',
    currentSlaRuleId: '1',
  },
  {
    id: 'TK20240320002',
    title: '收到的商品有划痕，要求换货',
    customerName: '李小红',
    status: 'PROCESSING',
    priority: 'HIGH',
    category: '质量问题',
    createdAt: '2024-03-20T09:00:00Z',
    currentSlaRule: '高优先级工单响应规则',
    currentSlaRuleId: '1',
  },
  {
    id: 'TK20240319005',
    title: '客户对处理结果不满意，要求升级投诉',
    customerName: '周大龙',
    status: 'ESCALATED',
    priority: 'HIGH',
    category: '客户服务',
    createdAt: '2024-03-19T14:00:00Z',
    currentSlaRule: 'VIP客户专属规则',
    currentSlaRuleId: '4',
  },
];

const mockTrajectories = [
  {
    id: 't1',
    ticketId: 'TK20240320001',
    actionType: 'CREATE',
    description: '工单创建',
    improvementAction: null,
    beforeState: {},
    afterState: {
      status: 'PENDING',
      priority: 'MEDIUM',
      assignee: null,
      slaRuleId: null,
    },
    slaRuleId: null,
    slaRuleSnapshot: null,
    operatorId: 'u1',
    operatorName: '系统自动',
    createdAt: '2024-03-20T10:00:00Z',
  },
  {
    id: 't2',
    ticketId: 'TK20240320001',
    actionType: 'SLA_CHANGE',
    description: 'SLA规则变更',
    improvementAction: '根据工单类别为退换货，自动匹配"高优先级工单响应规则"，确保响应时效',
    beforeState: {
      slaRuleId: null,
      slaRuleName: '未设置',
      responseTime: null,
      resolutionTime: null,
    },
    afterState: {
      slaRuleId: '1',
      slaRuleName: '高优先级工单响应规则',
      responseTime: 15,
      resolutionTime: 240,
    },
    slaRuleId: '1',
    slaRuleSnapshot: {
      id: '1',
      name: '高优先级工单响应规则',
      responseTime: 15,
      resolutionTime: 240,
      version: 3,
    },
    operatorId: 'u2',
    operatorName: '张经理',
    createdAt: '2024-03-20T10:05:00Z',
  },
  {
    id: 't3',
    ticketId: 'TK20240320001',
    actionType: 'STATUS_CHANGE',
    description: '状态变更：待处理 → 处理中',
    improvementAction: null,
    beforeState: {
      status: 'PENDING',
    },
    afterState: {
      status: 'PROCESSING',
      assignee: '客服小王',
    },
    slaRuleId: null,
    slaRuleSnapshot: null,
    operatorId: 'u3',
    operatorName: '客服小王',
    createdAt: '2024-03-20T10:08:00Z',
  },
  {
    id: 't4',
    ticketId: 'TK20240320001',
    actionType: 'IMPROVEMENT',
    description: '添加改进措施：特殊情况处理方案',
    improvementAction: '客户因特殊情况（疫情管控导致快递延误，实际签收时间较晚），经主管审批同意按特殊情况处理，准予退货。已在知识库补充"疫情特殊情况处理指南"，并更新SLA规则中关于"7天"的计算说明文档。',
    beforeState: {
      hasImprovement: false,
    },
    afterState: {
      hasImprovement: true,
      improvementType: 'process_optimization',
      knowledgeUpdated: true,
      slaDocumentUpdated: true,
    },
    slaRuleId: null,
    slaRuleSnapshot: null,
    operatorId: 'u2',
    operatorName: '张经理',
    createdAt: '2024-03-20T11:30:00Z',
  },
  {
    id: 't5',
    ticketId: 'TK20240320001',
    actionType: 'SLA_CHANGE',
    description: 'SLA规则版本更新：响应时间延长至30分钟',
    improvementAction: '因客户情况特殊，经申请将响应时效从15分钟调整为30分钟，避免SLA违规。已记录原因，后续考虑是否需要优化SLA规则对特殊情况的自动适配。',
    beforeState: {
      slaRuleId: '1',
      slaRuleName: '高优先级工单响应规则',
      responseTime: 15,
      resolutionTime: 240,
      version: 3,
    },
    afterState: {
      slaRuleId: '1',
      slaRuleName: '高优先级工单响应规则（特殊调整）',
      responseTime: 30,
      resolutionTime: 240,
      version: 3,
    },
    slaRuleId: '1',
    slaRuleSnapshot: {
      id: '1',
      name: '高优先级工单响应规则',
      responseTime: 15,
      resolutionTime: 240,
      version: 3,
    },
    operatorId: 'u2',
    operatorName: '张经理',
    createdAt: '2024-03-20T14:20:00Z',
  },
  {
    id: 't6',
    ticketId: 'TK20240320001',
    actionType: 'RESOLVE',
    description: '工单解决：已同意客户退货申请',
    improvementAction: '已与客户沟通，告知退货流程和注意事项，客户表示理解和满意。',
    beforeState: {
      status: 'PROCESSING',
    },
    afterState: {
      status: 'RESOLVED',
      resolution: '已退货退款',
      customerSatisfaction: 5,
    },
    slaRuleId: null,
    slaRuleSnapshot: null,
    operatorId: 'u3',
    operatorName: '客服小王',
    createdAt: '2024-03-20T15:45:00Z',
  },
];

const actionTypeColors: Record<string, string> = {
  CREATE: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  STATUS_CHANGE: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  SLA_CHANGE: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  IMPROVEMENT: 'bg-green-500/10 text-green-700 border-green-500/20',
  RESOLVE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
};

const actionTypeIcons: Record<string, React.ReactNode> = {
  CREATE: <FileText className="h-4 w-4" />,
  STATUS_CHANGE: <Shield className="h-4 w-4" />,
  SLA_CHANGE: <Shield className="h-4 w-4" />,
  IMPROVEMENT: <Wrench className="h-4 w-4" />,
  RESOLVE: <CheckCircle className="h-4 w-4" />,
};

const actionTypeLabels: Record<string, string> = {
  CREATE: '工单创建',
  STATUS_CHANGE: '状态变更',
  SLA_CHANGE: 'SLA变更',
  IMPROVEMENT: '改进动作',
  RESOLVE: '工单解决',
};

const categories = ['全部工单', '退换货', '质量问题', '物流', '客户服务', '促销活动'];
const actionTypes = [
  { value: 'all', label: '全部动作' },
  { value: 'CREATE', label: '工单创建' },
  { value: 'STATUS_CHANGE', label: '状态变更' },
  { value: 'SLA_CHANGE', label: 'SLA变更' },
  { value: 'IMPROVEMENT', label: '改进动作' },
  { value: 'RESOLVE', label: '工单解决' },
];

export default function TrajectoryPage() {
  const [selectedTicketId, setSelectedTicketId] = useState('TK20240320001');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部工单');
  const [selectedActionType, setSelectedActionType] = useState('all');

  const selectedTicket = mockTickets.find(t => t.id === selectedTicketId);

  const filteredTrajectories = useMemo(() => {
    return mockTrajectories.filter(traj => {
      const matchesTicket = traj.ticketId === selectedTicketId;
      const matchesSearch = !searchQuery ||
        traj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (traj.improvementAction?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAction = selectedActionType === 'all' || traj.actionType === selectedActionType;
      return matchesTicket && matchesSearch && matchesAction;
    });
  }, [selectedTicketId, searchQuery, selectedActionType]);

  const stats = useMemo(() => {
    const ticketTraj = mockTrajectories.filter(t => t.ticketId === selectedTicketId);
    return {
      total: ticketTraj.length,
      slaChanges: ticketTraj.filter(t => t.actionType === 'SLA_CHANGE').length,
      improvements: ticketTraj.filter(t => t.actionType === 'IMPROVEMENT').length,
      duration: '5小时45分钟',
    };
  }, [selectedTicketId]);

  const renderDiff = (before: Record<string, any>, after: Record<string, any>) => {
    const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
    
    return (
      <div className="space-y-2">
        {allKeys.map(key => {
          const beforeVal = before[key];
          const afterVal = after[key];
          const hasChange = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
          
          if (!hasChange) return null;
          
          return (
            <div key={key} className="flex items-start gap-4 p-2 bg-slate-50 rounded">
              <span className="text-sm font-medium text-slate-700 min-w-[120px]">{key}:</span>
              <div className="flex-1">
                {beforeVal !== undefined && beforeVal !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">变更前</span>
                    <span className="text-sm text-red-600 line-through">
                      {typeof beforeVal === 'boolean' ? (beforeVal ? '是' : '否') : String(beforeVal)}
                    </span>
                  </div>
                )}
                {afterVal !== undefined && afterVal !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">变更后</span>
                    <span className="text-sm text-green-600 font-medium">
                      {typeof afterVal === 'boolean' ? (afterVal ? '是' : '否') : String(afterVal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageWrapper title="处理轨迹与复盘" description="完整记录每一个工单的处理全过程">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">处理轨迹与复盘</h1>
            <p className="text-slate-500 mt-1">完整记录每一个工单的处理全过程，包括改进动作、SLA变更、状态流转</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出轨迹
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">工单列表</CardTitle>
              <CardDescription>选择工单查看轨迹</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 px-2">
                {mockTickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTicketId === ticket.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500">{ticket.id}</span>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{ticket.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(ticket.status)} variant="outline">
                        {getStatusText(ticket.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{ticket.customerName}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-slate-200">
            {selectedTicket && (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-slate-500">{selectedTicket.id}</span>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {selectedTicket.category}
                        </Badge>
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {getStatusText(selectedTicket.status)}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedTicket.title}</h2>
                      <p className="text-slate-500 mt-1">
                        客户：{selectedTicket.customerName} · 创建于 {formatDate(selectedTicket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm text-slate-600">
                        当前SLA：<span className="font-medium">{selectedTicket.currentSlaRule}</span>
                      </span>
                    </div>
                    <Link href={`/sla`} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                      查看规则 <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-500 mb-1">轨迹总数</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-500 mb-1">SLA变更</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.slaChanges}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-500 mb-1">改进动作</p>
                      <p className="text-2xl font-bold text-green-600">{stats.improvements}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-500 mb-1">处理时长</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.duration}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="搜索轨迹描述或改进动作..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                    <div className="w-full sm:w-40">
                      <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                        <SelectTrigger>
                          <SelectValue placeholder="动作类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-200 to-transparent" />
                    
                    <div className="space-y-6">
                      {filteredTrajectories.map((traj, index) => (
                        <div key={traj.id} className="relative pl-16">
                          <div className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center ${
                            traj.actionType === 'CREATE' ? 'bg-blue-500' :
                            traj.actionType === 'STATUS_CHANGE' ? 'bg-indigo-500' :
                            traj.actionType === 'SLA_CHANGE' ? 'bg-amber-500' :
                            traj.actionType === 'IMPROVEMENT' ? 'bg-green-500' :
                            'bg-emerald-500'
                          }`}>
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          
                          <Card className="border-slate-200 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={actionTypeColors[traj.actionType]}>
                                    {actionTypeIcons[traj.actionType]}
                                    {actionTypeLabels[traj.actionType]}
                                  </Badge>
                                </div>
                                <span className="text-sm text-slate-500">{formatDate(traj.createdAt)}</span>
                              </div>
                              <CardTitle className="text-base mt-1">{traj.description}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <User className="h-3 w-3" />
                                {traj.operatorName}
                              </CardDescription>
                            </CardHeader>
                            
                            {Object.keys(traj.beforeState).length > 0 || Object.keys(traj.afterState).length > 0 ? (
                              <CardContent className="pt-0">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                  <p className="text-xs font-medium text-slate-500 mb-2">变更对比</p>
                                  {renderDiff(traj.beforeState as Record<string, any>, traj.afterState as Record<string, any>)}
                                </div>
                              </CardContent>
                            ) : null}
                            
                            {traj.improvementAction && (
                              <CardContent className="pt-0 mt-2">
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Wrench className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">改进动作</span>
                                  </div>
                                  <p className="text-sm text-green-700">{traj.improvementAction}</p>
                                </div>
                              </CardContent>
                            )}
                            
                            {traj.slaRuleSnapshot && (
                              <CardContent className="pt-0 mt-2">
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm font-medium text-amber-800">SLA规则快照</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-amber-700">规则名称：</span>
                                      <span className="text-amber-900">{(traj.slaRuleSnapshot as any).name}</span>
                                    </div>
                                    <div>
                                      <span className="text-amber-700">版本：</span>
                                      <span className="text-amber-900">v{(traj.slaRuleSnapshot as any).version}</span>
                                    </div>
                                    <div>
                                      <span className="text-amber-700">响应时间：</span>
                                      <span className="text-amber-900">{(traj.slaRuleSnapshot as any).responseTime}分钟</span>
                                    </div>
                                    <div>
                                      <span className="text-amber-700">解决时间：</span>
                                      <span className="text-amber-900">{(traj.slaRuleSnapshot as any).resolutionTime}分钟</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
