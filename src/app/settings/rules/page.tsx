'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileCheck2, Check } from 'lucide-react';
import { useState } from 'react';

export default function RulesPage() {
  const [rules, setRules] = useState([
    { id: '1', name: '客户姓名必填', description: '新增线索时客户姓名为必填项', enabled: true, category: '基础字段' },
    { id: '2', name: '手机号格式校验', description: '校验手机号是否为11位有效号码', enabled: true, category: '基础字段' },
    { id: '3', name: '预算范围校验', description: '最大预算不得小于最小预算', enabled: true, category: '基础字段' },
    { id: '4', name: '最小面积限制', description: '房屋面积不得小于20㎡', enabled: false, category: '基础字段' },
    { id: '5', name: '7天未跟进自动回收', description: '超过7天无跟进记录自动回收到公海池', enabled: true, category: '回收规则' },
    { id: '6', name: '超期提醒', description: '距离自动回收前2天提醒负责人', enabled: true, category: '回收规则' },
    { id: '7', name: '量房后必须报价', description: '上传量房记录后3天内必须进入报价阶段', enabled: false, category: '跟进规则' },
    { id: '8', name: '禁止重复手机号', description: '同一手机号不允许创建多条线索', enabled: true, category: '去重规则' },
  ]);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const categories = [...new Set(rules.map((r) => r.category))];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary-500" />
                校验规则配置
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">配置线索录入和跟进过程中的数据校验和自动化规则</p>
            </div>
            <Button leftIcon={<Check className="h-4 w-4" />}>保存设置</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat}>
                  <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">{cat}</div>
                  <div className="space-y-2">
                    {rules
                      .filter((r) => r.category === cat)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{r.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>
                          </div>
                          <button
                            onClick={() => toggleRule(r.id)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              r.enabled ? 'bg-primary-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                r.enabled ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
