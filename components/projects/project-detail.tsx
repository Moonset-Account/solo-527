"use client";

import { useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge, QuoteStatusBadge, AddonStatusBadge, RepairStatusBadge } from "@/components/ui/status-badges";
import { VersionHistoryViewer } from "@/components/version-history/version-history-viewer";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  FileText,
  PlusCircle,
  Package,
  Image,
  FileCheck,
  Wrench,
  MessageSquare,
  History,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface BudgetSummary {
  initialBudget: number;
  currentBudget: number;
  totalSpent: number;
  budgetVariance: number;
  remainingBudget: number;
  breakdown: {
    quoteTotal: number;
    addonTotal: number;
    otherTotal: number;
  };
  changeCount: number;
}

interface BudgetChange {
  id: string;
  changeType: string;
  description: string;
  oldBudget: { toNumber: () => number };
  newBudget: { toNumber: () => number };
  amount: { toNumber: () => number };
  note: string | null;
  createdAt: string;
  createdBy: { name: string };
}

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [historyEntityType, setHistoryEntityType] = useState<"Project" | "Quote" | "Addon" | "Material" | "SitePhoto" | "Contract">("Project");
  const [selectedEntityId, setSelectedEntityId] = useState<string>(projectId);
  const [selectedEntityName, setSelectedEntityName] = useState<string>("");

  const { data: project, loading, error } = useApi<any>(`/api/projects/${projectId}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-destructive">加载失败: {error?.message || "项目不存在"}</div>
      </div>
    );
  }

  const budgetSummary = project.budgetSummary as BudgetSummary;
  const budgetHistory = project.budgetHistory as BudgetChange[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-muted-foreground">{project.address}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>设计师: {project.designer.name}</span>
            <span>客户: {project.client.name}</span>
            <span>创建时间: {formatDate(project.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            导出项目数据
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>初始预算</CardDescription>
            <CardTitle className="text-xl">
              {formatCurrency(budgetSummary.initialBudget)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>当前预算</CardDescription>
            <CardTitle
              className={`text-xl ${
                budgetSummary.budgetVariance > 0 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {formatCurrency(budgetSummary.currentBudget)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-sm ${
                budgetSummary.budgetVariance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {budgetSummary.budgetVariance > 0 ? "+" : ""}
              {budgetSummary.budgetVariance.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已支出</CardDescription>
            <CardTitle className="text-xl text-blue-600">
              {formatCurrency(budgetSummary.totalSpent)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>剩余预算</CardDescription>
            <CardTitle
              className={`text-xl ${
                budgetSummary.remainingBudget < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(budgetSummary.remainingBudget)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {budgetSummary.breakdown.addonTotal > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              预算变更提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-yellow-700">报价金额: </span>
                <span className="font-semibold">
                  {formatCurrency(budgetSummary.breakdown.quoteTotal)}
                </span>
              </div>
              <div>
                <span className="text-yellow-700">增项金额: </span>
                <span className="font-semibold text-red-600">
                  +{formatCurrency(budgetSummary.breakdown.addonTotal)}
                </span>
              </div>
              <div>
                <span className="text-yellow-700">变更次数: </span>
                <span className="font-semibold">{budgetSummary.changeCount} 次</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            总览
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            报价 ({project._count.quotes})
          </TabsTrigger>
          <TabsTrigger value="addons" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            增项 ({project._count.addons})
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            材料 ({project._count.materials})
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            照片 ({project._count.photos})
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            合同 ({project._count.contracts})
          </TabsTrigger>
          <TabsTrigger value="repairs" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            返修 ({project._count.repairs})
          </TabsTrigger>
          <TabsTrigger value="feedbacks" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            反馈 ({project._count.feedbacks})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                预算变更历史
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无预算变更记录
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>变更类型</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>原预算</TableHead>
                      <TableHead>新预算</TableHead>
                      <TableHead>变更金额</TableHead>
                      <TableHead>操作人</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetHistory.map((bc) => (
                      <TableRow key={bc.id}>
                        <TableCell>
                          <Badge
                            variant={
                              bc.changeType === "ADDON_CONFIRMED"
                                ? "warning"
                                : bc.changeType === "QUOTE_CONFIRMED"
                                ? "info"
                                : "default"
                            }
                          >
                            {bc.changeType === "ADDON_CONFIRMED"
                              ? "增项"
                              : bc.changeType === "QUOTE_CONFIRMED"
                              ? "报价"
                              : bc.changeType}
                          </Badge>
                        </TableCell>
                        <TableCell>{bc.description}</TableCell>
                        <TableCell>{formatCurrency(bc.oldBudget.toNumber())}</TableCell>
                        <TableCell>{formatCurrency(bc.newBudget.toNumber())}</TableCell>
                        <TableCell
                          className={
                            bc.amount.toNumber() >= 0
                              ? "text-red-600 font-semibold"
                              : "text-green-600 font-semibold"
                          }
                        >
                          {bc.amount.toNumber() >= 0 ? "+" : ""}
                          {formatCurrency(bc.amount.toNumber())}
                        </TableCell>
                        <TableCell>{bc.createdBy.name}</TableCell>
                        <TableCell>{bc.note || "-"}</TableCell>
                        <TableCell>{formatDateTime(bc.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>报价记录</CardTitle>
            </CardHeader>
            <CardContent>
              {project.quotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无报价记录
                </div>
              ) : (
                <div className="space-y-4">
                  {project.quotes.map((quote: any) => (
                    <Card key={quote.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            报价 v{quote.version}
                          </CardTitle>
                          <div className="flex items-center gap-3">
                            <QuoteStatusBadge status={quote.status} />
                            <span className="font-semibold text-lg">
                              {formatCurrency(quote.totalAmount)}
                            </span>
                          </div>
                        </div>
                        <CardDescription>
                          创建时间: {formatDateTime(quote.createdAt)}
                          {quote.confirmedAt && ` · 确认时间: ${formatDateTime(quote.confirmedAt)}`}
                          {quote.confirmedBy && ` · 确认人: ${quote.confirmedBy.name}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>项目名称</TableHead>
                              <TableHead>描述</TableHead>
                              <TableHead>数量</TableHead>
                              <TableHead>单位</TableHead>
                              <TableHead>单价</TableHead>
                              <TableHead>总价</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quote.items.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.name}
                                </TableCell>
                                <TableCell>{item.description || "-"}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="font-semibold">
                                  {formatCurrency(item.totalPrice)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm">
                            <History className="mr-2 h-4 w-4" />
                            查看版本历史
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>增项记录</CardTitle>
            </CardHeader>
            <CardContent>
              {project.addons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无增项记录
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>增项名称</TableHead>
                      <TableHead>原因</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>版本</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>提交人</TableHead>
                      <TableHead>确认人</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.addons.map((addon: any) => (
                      <TableRow key={addon.id}>
                        <TableCell className="font-medium">
                          {addon.name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {addon.reason}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          +{formatCurrency(addon.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{addon.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <AddonStatusBadge status={addon.status} />
                        </TableCell>
                        <TableCell>{addon.proposedBy.name}</TableCell>
                        <TableCell>{addon.confirmedBy?.name || "-"}</TableCell>
                        <TableCell>{formatDate(addon.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <History className="mr-1 h-4 w-4" />
                            历史
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>材料清单</CardTitle>
            </CardHeader>
            <CardContent>
              {project.materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无材料记录
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>材料名称</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead>品牌</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>单位</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead>总价</TableHead>
                      <TableHead>供应商</TableHead>
                      <TableHead>版本</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.materials.map((material: any) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.name}
                        </TableCell>
                        <TableCell>{material.specification || "-"}</TableCell>
                        <TableCell>{material.brand || "-"}</TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>{formatCurrency(material.unitPrice)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(material.totalPrice)}
                        </TableCell>
                        <TableCell>{material.supplier || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">v{material.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <History className="mr-1 h-4 w-4" />
                            追溯
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>现场照片</CardTitle>
            </CardHeader>
            <CardContent>
              {project.photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无现场照片
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {project.photos.map((photo: any) => (
                    <Card key={photo.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <Image className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <CardContent className="pt-4">
                        <h4 className="font-medium">{photo.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {photo.category} · {formatDate(photo.takenAt)}
                        </p>
                        {photo.description && (
                          <p className="text-sm mt-2">{photo.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline">v{photo.version}</Badge>
                          <Button variant="outline" size="sm">
                            <History className="mr-1 h-4 w-4" />
                            追溯
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>合同附件</CardTitle>
            </CardHeader>
            <CardContent>
              {project.contracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无合同附件
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>合同名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>文件类型</TableHead>
                      <TableHead>版本</TableHead>
                      <TableHead>签署状态</TableHead>
                      <TableHead>签署人</TableHead>
                      <TableHead>上传时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.contracts.map((contract: any) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          {contract.name}
                        </TableCell>
                        <TableCell>{contract.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{contract.fileType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{contract.version}</Badge>
                        </TableCell>
                        <TableCell>
                          {contract.signedAt ? (
                            <Badge variant="success">已签署</Badge>
                          ) : (
                            <Badge variant="warning">待签署</Badge>
                          )}
                        </TableCell>
                        <TableCell>{contract.signedBy?.name || "-"}</TableCell>
                        <TableCell>{formatDate(contract.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <FileCheck className="mr-1 h-4 w-4" />
                              查看
                            </Button>
                            <Button variant="outline" size="sm">
                              <History className="mr-1 h-4 w-4" />
                              追溯
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repairs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>返修记录</CardTitle>
            </CardHeader>
            <CardContent>
              {project.repairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无返修记录
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>严重程度</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>截止日期</TableHead>
                      <TableHead>上报人</TableHead>
                      <TableHead>处理人</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.repairs.map((repair: any) => (
                      <TableRow
                        key={repair.id}
                        className={repair.isOverdue ? "bg-red-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {repair.title}
                          {repair.isOverdue && (
                            <Badge variant="destructive" className="ml-2">
                              已超时
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {repair.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              repair.severity === "high"
                                ? "destructive"
                                : repair.severity === "medium"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {repair.severity === "high"
                              ? "高"
                              : repair.severity === "medium"
                              ? "中"
                              : "低"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <RepairStatusBadge
                            status={repair.status}
                            isOverdue={repair.isOverdue}
                          />
                        </TableCell>
                        <TableCell>{formatDate(repair.deadline)}</TableCell>
                        <TableCell>{repair.reportedBy.name}</TableCell>
                        <TableCell>{repair.assignedTo?.name || "-"}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>客户反馈</CardTitle>
            </CardHeader>
            <CardContent>
              {project.feedbacks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无客户反馈
                </div>
              ) : (
                <div className="space-y-4">
                  {project.feedbacks.map((feedback: any) => (
                    <Card key={feedback.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-medium">
                                {feedback.client.name?.[0] || "?"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {feedback.client.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(feedback.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">
                              {feedback.category}
                            </Badge>
                            {feedback.rating && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={
                                      i < feedback.rating
                                        ? "text-yellow-500"
                                        : "text-gray-300"
                                    }
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                            {feedback.resolvedAt ? (
                              <Badge variant="success">已解决</Badge>
                            ) : (
                              <Badge variant="warning">待处理</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">{feedback.content}</p>
                        {feedback.resolution && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">解决方案:</p>
                            <p className="text-sm">{feedback.resolution}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              处理人: {feedback.resolvedBy?.name} ·{" "}
                              {formatDateTime(feedback.resolvedAt)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            版本追溯
          </CardTitle>
          <CardDescription>
            选择实体类型查看完整的版本历史，支持版本对比
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
            <Button
              variant={historyEntityType === "Project" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                setHistoryEntityType("Project");
                setSelectedEntityId(projectId);
                setSelectedEntityName(project.name);
              }}
            >
              <BarChart3 className="h-6 w-6" />
              <span>项目</span>
            </Button>
            <Button
              variant={historyEntityType === "Quote" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                if (project.quotes.length > 0) {
                  setHistoryEntityType("Quote");
                  setSelectedEntityId(project.quotes[0].id);
                  setSelectedEntityName(`报价 v${project.quotes[0].version}`);
                }
              }}
            >
              <FileText className="h-6 w-6" />
              <span>报价</span>
            </Button>
            <Button
              variant={historyEntityType === "Addon" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                if (project.addons.length > 0) {
                  setHistoryEntityType("Addon");
                  setSelectedEntityId(project.addons[0].id);
                  setSelectedEntityName(project.addons[0].name);
                }
              }}
            >
              <PlusCircle className="h-6 w-6" />
              <span>增项</span>
            </Button>
            <Button
              variant={historyEntityType === "Material" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                if (project.materials.length > 0) {
                  setHistoryEntityType("Material");
                  setSelectedEntityId(project.materials[0].id);
                  setSelectedEntityName(project.materials[0].name);
                }
              }}
            >
              <Package className="h-6 w-6" />
              <span>材料</span>
            </Button>
            <Button
              variant={historyEntityType === "SitePhoto" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                if (project.photos.length > 0) {
                  setHistoryEntityType("SitePhoto");
                  setSelectedEntityId(project.photos[0].id);
                  setSelectedEntityName(project.photos[0].name);
                }
              }}
            >
              <Image className="h-6 w-6" />
              <span>照片</span>
            </Button>
            <Button
              variant={historyEntityType === "Contract" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                if (project.contracts.length > 0) {
                  setHistoryEntityType("Contract");
                  setSelectedEntityId(project.contracts[0].id);
                  setSelectedEntityName(project.contracts[0].name);
                }
              }}
            >
              <FileCheck className="h-6 w-6" />
              <span>合同</span>
            </Button>
          </div>

          {historyEntityType !== "Project" && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <label className="text-sm font-medium mb-2 block">选择{historyEntityType === "Quote" ? "报价" : historyEntityType === "Addon" ? "增项" : historyEntityType === "Material" ? "材料" : historyEntityType === "SitePhoto" ? "照片" : "合同"}：</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedEntityId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedEntityId(id);
                  let name = "";
                  if (historyEntityType === "Quote") {
                    const q = project.quotes.find((q: any) => q.id === id);
                    name = `报价 v${q?.version}`;
                  } else if (historyEntityType === "Addon") {
                    const a = project.addons.find((a: any) => a.id === id);
                    name = a?.name || "";
                  } else if (historyEntityType === "Material") {
                    const m = project.materials.find((m: any) => m.id === id);
                    name = m?.name || "";
                  } else if (historyEntityType === "SitePhoto") {
                    const p = project.photos.find((p: any) => p.id === id);
                    name = p?.name || "";
                  } else if (historyEntityType === "Contract") {
                    const c = project.contracts.find((c: any) => c.id === id);
                    name = c?.name || "";
                  }
                  setSelectedEntityName(name);
                }}
              >
                {historyEntityType === "Quote" && project.quotes.map((q: any) => (
                  <option key={q.id} value={q.id}>报价 v{q.version}</option>
                ))}
                {historyEntityType === "Addon" && project.addons.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
                {historyEntityType === "Material" && project.materials.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                {historyEntityType === "SitePhoto" && project.photos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {historyEntityType === "Contract" && project.contracts.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <VersionHistoryViewer
            entityType={historyEntityType}
            entityId={selectedEntityId}
            entityName={selectedEntityName || (historyEntityType === "Project" ? project.name : "")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
