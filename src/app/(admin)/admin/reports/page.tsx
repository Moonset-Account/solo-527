'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  RefreshCw,
  Star,
  Clock,
  DollarSign,
  Award,
  User,
  Calendar,
  AlertTriangle,
  Package,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { mockRepurchaseReport, mockQualityReport, mockTechnicians } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

export default function ReportsPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [activeTab, setActiveTab] = useState('repurchase');

  useEffect(() => {
    setCurrentPageTitle('数据报表');
  }, [setCurrentPageTitle]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">数据报表中心</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">2024年6月</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="repurchase" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                会员复购报表
              </TabsTrigger>
              <TabsTrigger value="quality" className="gap-2">
                <Star className="h-4 w-4" />
                服务质量报表
              </TabsTrigger>
              <TabsTrigger value="revenue" className="gap-2">
                <DollarSign className="h-4 w-4" />
                营收统计报表
              </TabsTrigger>
            </TabsList>

            {/* 会员复购报表 */}
            <TabsContent value="repurchase" className="mt-0 space-y-6">
              {/* 核心指标 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">总客户数</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockRepurchaseReport.total_customers}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-success-50 text-success-600">
                        <RefreshCw className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">复购客户数</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockRepurchaseReport.repeat_customers}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-accent-50 text-accent-600">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">复购率</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockRepurchaseReport.repurchase_rate}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">平均复购周期</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockRepurchaseReport.avg_repurchase_cycle}<span className="text-sm font-normal ml-1">天</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 月度趋势 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">月度复购趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRepurchaseReport.monthly_data.map((month, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-dark-700">{month.month}</span>
                          <span className="text-sm text-dark-500">
                            新增 {month.new_customers} | 复购 {month.repeat_customers} | 营收 {formatCurrency(month.revenue)}
                          </span>
                        </div>
                        <div className="h-8 bg-dark-100 rounded-lg overflow-hidden flex">
                          <div
                            className="bg-primary-500 h-full"
                            style={{ width: `${(month.new_customers / (month.new_customers + month.repeat_customers)) * 100}%` }}
                          />
                          <div
                            className="bg-success-500 h-full"
                            style={{ width: `${(month.repeat_customers / (month.new_customers + month.repeat_customers)) * 100}%` }}
                          />
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-dark-500">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                            新客户
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-success-500" />
                            复购客户
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 说明 */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <h4 className="font-medium text-primary-900 mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  复购数据说明
                </h4>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• 每次服务完成后，系统自动更新会员复购统计数据</li>
                  <li>• 返修工单处理完成后，也会反映到会员复购报表中</li>
                  <li>• 复购率 = 复购客户数 / 总客户数 × 100%</li>
                  <li>• 平均复购周期 = 客户两次消费之间的平均天数</li>
                </ul>
              </div>
            </TabsContent>

            {/* 服务质量报表 */}
            <TabsContent value="quality" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">总服务数</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockQualityReport.total_services}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-danger-50 text-danger-600">
                        <RefreshCw className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">返修次数</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockQualityReport.repair_count}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-warning-50 text-warning-600">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">返修率</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockQualityReport.repair_rate}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-success-50 text-success-600">
                        <Star className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">平均评分</p>
                        <p className="text-2xl font-bold text-dark-900 font-display">
                          {mockQualityReport.avg_quality_score}
                          <span className="text-sm font-normal ml-1">分</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 技师绩效排行 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">技师绩效排行</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>排名</TableHead>
                        <TableHead>技师</TableHead>
                        <TableHead>服务次数</TableHead>
                        <TableHead>返修次数</TableHead>
                        <TableHead>返修率</TableHead>
                        <TableHead>平均评分</TableHead>
                        <TableHead>绩效等级</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockQualityReport.technician_performance.map((tech, index) => (
                        <TableRow key={tech.technician_id}>
                          <TableCell>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-amber-100 text-amber-700' :
                              index === 1 ? 'bg-dark-200 text-dark-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-dark-100 text-dark-600'
                            }`}>
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                                {tech.technician_name.charAt(0)}
                              </div>
                              <span className="font-medium text-dark-900">
                                {tech.technician_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{tech.total_services}</TableCell>
                          <TableCell>{tech.repair_count}</TableCell>
                          <TableCell>
                            <span className={tech.repair_count / tech.total_services > 0.05 ? 'text-danger-600' : 'text-success-600'}>
                              {((tech.repair_count / tech.total_services) * 100).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              <span className="font-medium">{tech.avg_score}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tech.avg_score >= 4.7 ? 'success' :
                                tech.avg_score >= 4.5 ? 'primary' :
                                tech.avg_score >= 4.3 ? 'warning' : 'danger'
                              }
                              size="sm"
                            >
                              {
                                tech.avg_score >= 4.7 ? '优秀' :
                                tech.avg_score >= 4.5 ? '良好' :
                                tech.avg_score >= 4.3 ? '合格' : '待改进'
                              }
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 营收统计报表 */}
            <TabsContent value="revenue" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-dark-500 mb-1">本月营收</p>
                        <p className="text-2xl font-bold text-success-600 font-display">
                          {formatCurrency(397000)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-success-50 text-success-600">
                        <DollarSign className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-success-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      较上月增长 12.5%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-dark-500 mb-1">配件销售</p>
                        <p className="text-2xl font-bold text-primary-600 font-display">
                          {formatCurrency(156000)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                        <Package className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-dark-500">
                      占总营收 39.3%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-dark-500 mb-1">服务收入</p>
                        <p className="text-2xl font-bold text-purple-600 font-display">
                          {formatCurrency(241000)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                        <Wrench className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-dark-500">
                      占总营收 60.7%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">营收构成分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: '保养服务', value: 128000, percentage: 32.2 },
                      { name: '检测服务', value: 45000, percentage: 11.3 },
                      { name: '维修服务', value: 68000, percentage: 17.1 },
                      { name: '配件销售', value: 112000, percentage: 28.2 },
                      { name: '会员收入', value: 29000, percentage: 7.3 },
                      { name: '其他收入', value: 15000, percentage: 3.8 },
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-dark-700">{item.name}</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(item.value)} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
