import { useState } from 'react';
import { Database, Server, BarChart3, ArrowRight, ChevronDown, ChevronUp, Layers, Clock, Shield } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export function ArchitectureInfo() {
  const [expanded, setExpanded] = useState(false);

  const pipelineSteps = [
    {
      icon: Database,
      title: '数据源层',
      description: 'WMS / ERP / OMS 业务系统',
      details: ['库存异动实时推送', '批次主数据同步', '订单出库回传', '退货入库登记'],
      color: 'bg-slate-100 text-slate-600',
    },
    {
      icon: Layers,
      title: 'ETL 处理层',
      description: '数据清洗与标准化',
      details: ['空值/异常值处理', '批次关联匹配', '库龄自动计算', '指标预聚合'],
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Server,
      title: '数据存储层',
      description: 'PostgreSQL + ClickHouse',
      details: ['PG: 主数据/维表', 'CH: 流水表/聚合表', '双写一致性保证', 'TTL自动清理'],
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: BarChart3,
      title: '可视化层',
      description: 'Apache Superset + 定制前端',
      details: ['仪表盘零代码搭建', '自定义SQL查询', '权限细粒度控制', '导出多格式报告'],
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const cacheStrategies = [
    { label: '实时数据', ttl: '1分钟', scenario: '库存数量、出库流水' },
    { label: '近线数据', ttl: '15分钟', scenario: '周转率、库龄分布' },
    { label: '离线数据', ttl: '每日', scenario: '月度报表、历史趋势' },
  ];

  return (
    <div className="card">
      <div
        className="card-header cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-500" />
          <h3 className="card-title">技术架构说明</h3>
          <InfoTooltip
            title="系统架构"
            content="基于 Apache Superset + ClickHouse + PostgreSQL 构建的现代数据栈，支持亿级数据秒级查询。"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            可公开 · 数据已脱敏
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="card-body space-y-6">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              数据管道架构
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {pipelineSteps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className={`rounded-lg p-4 border border-slate-200 ${idx < 3 ? 'pr-6' : ''}`}>
                    <div className={`w-10 h-10 rounded-lg ${step.color} flex items-center justify-center mb-3`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <h5 className="font-medium text-slate-800 text-sm mb-1">{step.title}</h5>
                    <p className="text-xs text-slate-500 mb-2">{step.description}</p>
                    <ul className="text-xs text-slate-500 space-y-0.5">
                      {step.details.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                  {idx < 3 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                      <div className="w-6 h-6 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                缓存策略
              </h4>
              <div className="space-y-2">
                {cacheStrategies.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.scenario}</p>
                    </div>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                      TTL: {item.ttl}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                数据安全与口径
              </h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-700 mb-1">对外公开版限制</p>
                  <ul className="text-xs text-slate-500 space-y-0.5">
                    <li>• 供应商联系人、成本价等敏感字段已脱敏</li>
                    <li>• 数据为抽样子集，不代表真实业务规模</li>
                    <li>• 禁止转发或用于商业用途</li>
                  </ul>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-700 mb-1">口径一致性保证</p>
                  <ul className="text-xs text-slate-500 space-y-0.5">
                    <li>• 所有指标使用统一的计算逻辑</li>
                    <li>• 时间窗口筛选对所有图表生效</li>
                    <li>• 空值处理规则：未录入按0计算</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 mb-3">关键技术选型</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <p className="font-semibold text-blue-700 mb-1">Apache Superset</p>
                <p className="text-xs text-blue-600">
                  企业级数据可视化平台，支持30+图表类型，细粒度权限控制。
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <p className="font-semibold text-green-700 mb-1">ClickHouse</p>
                <p className="text-xs text-green-600">
                  列式存储OLAP引擎，亿级数据亚秒查询，专门面向分析场景优化。
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                <p className="font-semibold text-purple-700 mb-1">PostgreSQL</p>
                <p className="text-xs text-purple-600">
                  成熟的关系型数据库，存储主数据和维度表，保证事务一致性。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
