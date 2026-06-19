'use client';

import { useState, useMemo } from 'react';
import { Card, Button, StatusBadge } from '@/components/ui';
import { mockConfigVersions } from '@/lib/mockData';
import type { ConfigVersion } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  GitCompare,
  RotateCcw,
  CheckCircle2,
  Circle,
  Clock,
  User,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

function jsonToLines(obj: unknown): string[] {
  return JSON.stringify(obj, null, 2).split('\n');
}

function computeDiff(left: unknown, right: unknown): { leftLines: DiffLine[]; rightLines: DiffLine[] } {
  const leftStrLines = jsonToLines(left);
  const rightStrLines = jsonToLines(right);

  const leftLines: DiffLine[] = [];
  const rightLines: DiffLine[] = [];

  let i = 0;
  let j = 0;
  let leftLineNum = 1;
  let rightLineNum = 1;

  while (i < leftStrLines.length || j < rightStrLines.length) {
    if (i < leftStrLines.length && j < rightStrLines.length && leftStrLines[i] === rightStrLines[j]) {
      leftLines.push({ type: 'unchanged', content: leftStrLines[i], lineNumber: leftLineNum++ });
      rightLines.push({ type: 'unchanged', content: rightStrLines[j], lineNumber: rightLineNum++ });
      i++;
      j++;
    } else {
      let foundMatch = false;
      for (let k = j + 1; k < Math.min(j + 10, rightStrLines.length); k++) {
        if (i < leftStrLines.length && leftStrLines[i] === rightStrLines[k]) {
          for (let m = j; m < k; m++) {
            rightLines.push({ type: 'added', content: rightStrLines[m], lineNumber: rightLineNum++ });
            leftLines.push({ type: 'unchanged', content: '', lineNumber: -1 });
          }
          j = k;
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) {
        for (let k = i + 1; k < Math.min(i + 10, leftStrLines.length); k++) {
          if (j < rightStrLines.length && leftStrLines[k] === rightStrLines[j]) {
            for (let m = i; m < k; m++) {
              leftLines.push({ type: 'removed', content: leftStrLines[m], lineNumber: leftLineNum++ });
              rightLines.push({ type: 'unchanged', content: '', lineNumber: -1 });
            }
            i = k;
            foundMatch = true;
            break;
          }
        }
      }
      if (!foundMatch) {
        if (i < leftStrLines.length) {
          leftLines.push({ type: 'removed', content: leftStrLines[i], lineNumber: leftLineNum++ });
          rightLines.push({ type: 'unchanged', content: '', lineNumber: -1 });
          i++;
        }
        if (j < rightStrLines.length) {
          rightLines.push({ type: 'added', content: rightStrLines[j], lineNumber: rightLineNum++ });
          leftLines.push({ type: 'unchanged', content: '', lineNumber: -1 });
          j++;
        }
      }
    }
  }

  return { leftLines, rightLines };
}

function DiffView({
  title,
  lines,
  side,
}: {
  title: string;
  lines: DiffLine[];
  side: 'left' | 'right';
}) {
  const getLineClass = (type: DiffLine['type']) => {
    if (side === 'left') {
      if (type === 'removed') return 'bg-danger-50 text-danger-700';
      if (type === 'added') return 'bg-zinc-50 text-zinc-300';
      return 'text-zinc-700';
    } else {
      if (type === 'added') return 'bg-green-50 text-green-700';
      if (type === 'removed') return 'bg-zinc-50 text-zinc-300';
      return 'text-zinc-700';
    }
  };

  const getPrefix = (type: DiffLine['type']) => {
    if (side === 'left') {
      if (type === 'removed') return '-';
    } else {
      if (type === 'added') return '+';
    }
    return ' ';
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-zinc-200">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
        <span className="text-sm font-medium text-zinc-700">{title}</span>
      </div>
      <div className="flex-1 overflow-auto bg-white font-mono text-xs">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 border-b border-zinc-50 px-2 py-0.5 ${getLineClass(line.type)}`}
          >
            <span className="w-10 shrink-0 select-none text-right text-zinc-400">
              {line.lineNumber > 0 ? line.lineNumber : ''}
            </span>
            <span className="w-4 shrink-0 select-none font-bold">
              {getPrefix(line.type)}
            </span>
            <pre className="flex-1 whitespace-pre-wrap break-words">
              {line.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VersionsPage() {
  const [versions] = useState<ConfigVersion[]>(
    [...mockConfigVersions].sort((a, b) => b.version - a.version)
  );
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<ConfigVersion | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const leftVersion = versions.find((v) => v.id === selectedLeft) ?? null;
  const rightVersion = versions.find((v) => v.id === selectedRight) ?? null;

  const diffResult = useMemo(() => {
    if (!leftVersion || !rightVersion) return null;
    return computeDiff(leftVersion.snapshot, rightVersion.snapshot);
  }, [leftVersion, rightVersion]);

  const handleSelectForCompare = (version: ConfigVersion, side: 'left' | 'right') => {
    if (side === 'left') {
      setSelectedLeft(version.id);
    } else {
      setSelectedRight(version.id);
    }
  };

  const clearSelection = () => {
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const handleRollbackClick = (version: ConfigVersion) => {
    if (version.is_current) return;
    setRollbackTarget(version);
    setShowConfirm(true);
  };

  const confirmRollback = () => {
    if (!rollbackTarget) return;
    alert(`已回退到版本 v${rollbackTarget.version}：${rollbackTarget.change_summary}`);
    setShowConfirm(false);
    setRollbackTarget(null);
  };

  const cancelRollback = () => {
    setShowConfirm(false);
    setRollbackTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/rules">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                返回规则列表
              </Button>
            </Link>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">规则版本管理</h1>
          <p className="mt-1 text-sm text-zinc-500">查看规则历史版本，支持版本对比与回退</p>
        </div>
      </div>

      <Card title="版本时间轴">
        <div className="relative">
          <div className="absolute bottom-0 left-5 top-0 w-0.5 bg-zinc-200" />
          <div className="space-y-4">
            {versions.map((version) => {
              const isLeftSelected = selectedLeft === version.id;
              const isRightSelected = selectedRight === version.id;

              return (
                <div key={version.id} className="relative pl-12">
                  <div
                    className={`absolute left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      version.is_current
                        ? 'border-brand-600 bg-brand-50'
                        : isLeftSelected || isRightSelected
                          ? 'border-warn-500 bg-warn-50'
                          : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {version.is_current ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-600" />
                    ) : isLeftSelected || isRightSelected ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-warn-600" />
                    ) : (
                      <Circle className="h-3 w-3 text-zinc-400" />
                    )}
                  </div>

                  <div
                    className={`rounded-lg border p-4 transition-colors ${
                      isLeftSelected || isRightSelected
                        ? 'border-warn-300 bg-warn-50/40'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-zinc-900">
                            v{version.version}
                          </span>
                          {version.is_current && (
                            <StatusBadge status="in_progress">当前版本</StatusBadge>
                          )}
                          {isLeftSelected && (
                            <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              已选作对比（左）
                            </span>
                          )}
                          {isRightSelected && (
                            <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              已选作对比（右）
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-700">{version.change_summary}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {version.created_by_name ?? version.created_by}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDateTime(version.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant={isLeftSelected ? 'primary' : 'secondary'}
                            onClick={() => handleSelectForCompare(version, 'left')}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                            选左侧
                          </Button>
                          <Button
                            size="sm"
                            variant={isRightSelected ? 'primary' : 'secondary'}
                            onClick={() => handleSelectForCompare(version, 'right')}
                          >
                            选右侧
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {!version.is_current && (
                          <Button
                            size="sm"
                            variant="warn"
                            onClick={() => handleRollbackClick(version)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            回退到此版本
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-zinc-500" />
            <span>版本差异对比</span>
          </div>
        }
        extra={
          (selectedLeft || selectedRight) && (
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" />
              清除选择
            </Button>
          )
        }
      >
        {!leftVersion || !rightVersion ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitCompare className="mb-3 h-10 w-10 text-zinc-300" />
            <p className="text-sm text-zinc-500">请在上方时间轴中选择两个版本进行对比</p>
            <p className="mt-1 text-xs text-zinc-400">分别点击「选左侧」和「选右侧」按钮</p>
          </div>
        ) : diffResult ? (
          <div className="flex min-h-[500px] flex-col gap-4 lg:flex-row">
            <DiffView
              title={`v${leftVersion.version}${leftVersion.is_current ? '（当前）' : ''}`}
              lines={diffResult.leftLines}
              side="left"
            />
            <div className="flex items-center justify-center lg:block">
              <ChevronRight className="h-6 w-6 text-zinc-400 lg:rotate-0" />
            </div>
            <DiffView
              title={`v${rightVersion.version}${rightVersion.is_current ? '（当前）' : ''}`}
              lines={diffResult.rightLines}
              side="right"
            />
          </div>
        ) : null}

        {diffResult && (
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-danger-50" />
              删除/变更
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-green-50" />
              新增/变更
            </span>
          </div>
        )}
      </Card>

      {showConfirm && rollbackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warn-50">
                <AlertTriangle className="h-5 w-5 text-warn-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">确认回退版本</h3>
            </div>

            <div className="mb-6 space-y-3 rounded-lg bg-zinc-50 p-4">
              <div className="text-sm">
                <span className="text-zinc-500">目标版本：</span>
                <span className="font-semibold text-zinc-900">v{rollbackTarget.version}</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">变更说明：</span>
                <span className="text-zinc-700">{rollbackTarget.change_summary}</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-500">创建时间：</span>
                <span className="text-zinc-700">{formatDateTime(rollbackTarget.created_at)}</span>
              </div>
            </div>

            <p className="mb-6 text-sm text-zinc-600">
              回退后，当前生效的规则配置将被替换为该版本的快照。此操作不可撤销，建议先对比差异确认后再执行。
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelRollback}>
                取消
              </Button>
              <Button variant="danger" onClick={confirmRollback}>
                <RotateCcw className="h-4 w-4" />
                确认回退
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
