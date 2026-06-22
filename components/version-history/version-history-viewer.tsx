"use client";

import { useState, useCallback } from "react";
import { History, ArrowLeftRight, Eye, Clock, User } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { EntityType } from "@/lib/version-history";
import type { VersionHistory, User as UserModel } from "@prisma/client";

type VersionHistoryWithUser = VersionHistory & {
  changedBy: Pick<UserModel, "id" | "name" | "role">;
};

interface VersionHistoryViewerProps {
  entityType: EntityType;
  entityId: string;
  entityName?: string;
}

export function VersionHistoryViewer({
  entityType,
  entityId,
  entityName,
}: VersionHistoryViewerProps) {
  const [selectedVersionA, setSelectedVersionA] = useState<number | null>(null);
  const [selectedVersionB, setSelectedVersionB] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      entityType,
      entityId,
    });
    if (selectedVersionA !== null && selectedVersionB !== null) {
      params.set("versionA", String(selectedVersionA));
      params.set("versionB", String(selectedVersionB));
    }
    return `/api/version-history?${params.toString()}`;
  }, [entityType, entityId, selectedVersionA, selectedVersionB]);

  const { data, loading, error } = useApi<
    | VersionHistoryWithUser[]
    | {
        versionA: VersionHistoryWithUser;
        versionB: VersionHistoryWithUser;
        differences: { field: string; oldValue: unknown; newValue: unknown }[];
      }
  >(showComparison && selectedVersionA && selectedVersionB ? buildUrl() : null);

  const historyUrl = `/api/version-history?entityType=${entityType}&entityId=${entityId}`;
  const { data: historyData } = useApi<VersionHistoryWithUser[]>(historyUrl);

  const handleCompare = () => {
    if (selectedVersionA !== null && selectedVersionB !== null) {
      setShowComparison(true);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "是" : "否";
    if (typeof value === "number") {
      if (value.toString().length > 4) {
        return formatCurrency(value);
      }
      return value.toString();
    }
    if (typeof value === "string") {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return formatDateTime(date);
        }
      } catch {}
      return value;
    }
    return JSON.stringify(value);
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: "名称",
      description: "描述",
      amount: "金额",
      totalAmount: "总金额",
      status: "状态",
      reason: "原因",
      note: "备注",
      version: "版本",
      confirmedAt: "确认时间",
      confirmedById: "确认人",
      currentBudget: "当前预算",
      initialBudget: "初始预算",
      address: "地址",
    };
    return labels[field] || field;
  };

  const entityTypeLabel: Record<EntityType, string> = {
    Quote: "报价",
    QuoteItem: "报价项",
    Addon: "增项",
    Material: "材料",
    SitePhoto: "现场照片",
    Contract: "合同",
    Project: "项目",
    BudgetChange: "预算变更",
  };

  if (showComparison && data && "differences" in data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowComparison(false)}>
            <History className="mr-2 h-4 w-4" />
            返回版本列表
          </Button>
          <div>
            <h2 className="text-xl font-bold">
              版本对比 - {entityName || entityId}
            </h2>
            <p className="text-sm text-muted-foreground">
              版本 v{selectedVersionA} 与 v{selectedVersionB} 的差异对比
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">版本 v{selectedVersionA}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {data.versionA.changedBy.name}
                  <span className="text-xs">({data.versionA.changedBy.role})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(data.versionA.createdAt)}
                </div>
                {data.versionA.changeNote && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    {data.versionA.changeNote}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">版本 v{selectedVersionB}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {data.versionB.changedBy.name}
                  <span className="text-xs">({data.versionB.changedBy.role})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(data.versionB.createdAt)}
                </div>
                {data.versionB.changeNote && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    {data.versionB.changeNote}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              变更详情
            </CardTitle>
            <CardDescription>
              共 {data.differences.length} 处变更
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.differences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                两个版本之间没有差异
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>字段</TableHead>
                    <TableHead>原值 (v{selectedVersionA})</TableHead>
                    <TableHead>新值 (v{selectedVersionB})</TableHead>
                    <TableHead>变化</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.differences.map((diff, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {getFieldLabel(diff.field)}
                      </TableCell>
                      <TableCell className="bg-red-50">
                        {formatValue(diff.oldValue)}
                      </TableCell>
                      <TableCell className="bg-green-50">
                        {formatValue(diff.newValue)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            typeof diff.newValue === "number" &&
                            typeof diff.oldValue === "number"
                              ? diff.newValue > diff.oldValue
                                ? "destructive"
                                : "success"
                              : "default"
                          }
                        >
                          {typeof diff.newValue === "number" &&
                          typeof diff.oldValue === "number"
                            ? diff.newValue > diff.oldValue
                              ? `+${(diff.newValue - diff.oldValue).toFixed(2)}`
                              : `${(diff.newValue - diff.oldValue).toFixed(2)}`
                            : "已修改"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5" />
            {entityTypeLabel[entityType]}版本历史
            {entityName && <span className="text-lg font-normal">- {entityName}</span>}
          </h2>
          <p className="text-sm text-muted-foreground">
            查看所有历史版本，支持版本对比以追踪变更
          </p>
        </div>
        {selectedVersionA !== null && selectedVersionB !== null && (
          <Button onClick={handleCompare}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            对比版本
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-destructive">加载失败: {error.message}</div>
        </div>
      ) : !historyData || historyData.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">暂无版本记录</div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>选择</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>修改人</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>修改说明</TableHead>
                  <TableHead>修改时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <div className="flex gap-2">
                        <input
                          type="radio"
                          name="versionA"
                          checked={selectedVersionA === version.version}
                          onChange={() => setSelectedVersionA(version.version)}
                          className="w-4 h-4"
                        />
                        <input
                          type="radio"
                          name="versionB"
                          checked={selectedVersionB === version.version}
                          onChange={() => setSelectedVersionB(version.version)}
                          className="w-4 h-4"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{version.version}</Badge>
                    </TableCell>
                    <TableCell>{version.changedBy.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {version.changedBy.role === "DESIGNER"
                          ? "设计师"
                          : version.changedBy.role === "CLIENT"
                          ? "客户"
                          : version.changedBy.role === "ADMIN"
                          ? "管理员"
                          : "老板"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {version.changeNote || "-"}
                    </TableCell>
                    <TableCell>{formatDateTime(version.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-4 w-4" />
                        查看快照
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-4">
              <span className="flex items-center gap-2">
                <input type="radio" disabled className="w-4 h-4" />
                版本 A
              </span>
              <span className="flex items-center gap-2">
                <input type="radio" disabled className="w-4 h-4" />
                版本 B
              </span>
              <span>选择两个版本进行对比</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
