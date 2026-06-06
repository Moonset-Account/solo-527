"use client";

import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { cn } from "@/utils";

interface ImportPreview {
  total: number;
  valid: number;
  invalid: number;
  errors: { row: number; message: string }[];
  sample: Record<string, any>[];
}

export default function DataImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [importProgress, setImportProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setImportStatus("idle");
    setPreview({
      total: 1258,
      valid: 1245,
      invalid: 13,
      errors: [
        { row: 45, message: "挂号时间格式不正确" },
        { row: 128, message: "科室编码不存在" },
        { row: 256, message: "等待时间计算异常" },
        { row: 512, message: "患者类型编码无效" },
      ],
      sample: [
        { visitNumber: "VISIT202606010001", dept: "内科", doctor: "张医生", registerTime: "2026-06-01 08:15:00", waitTotal: 45 },
        { visitNumber: "VISIT202606010002", dept: "外科", doctor: "李医生", registerTime: "2026-06-01 08:20:00", waitTotal: 32 },
        { visitNumber: "VISIT202606010003", dept: "儿科", doctor: "王医生", registerTime: "2026-06-01 08:30:00", waitTotal: 58 },
      ],
    });
  };

  const handleImport = () => {
    setImportStatus("processing");
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImportStatus("success");
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPreview(null);
    setImportStatus("idle");
    setImportProgress(0);
  };

  const downloadTemplate = () => {
    const headers = [
      "就诊号",
      "科室编码",
      "医生编码",
      "患者类型",
      "挂号时间",
      "签到时间",
      "分诊时间",
      "叫号时间",
      "缴费时间",
      "取药时间",
    ];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "门诊数据导入模板.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">批量数据导入</h1>
          <p className="text-sm text-neutral-500 mt-1">
            上传CSV格式的门诊流程数据，系统将自动进行数据校验、清洗和脱敏处理
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg border border-primary-100">
          <div className="p-2 bg-primary-100 rounded-lg">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-800">数据规范说明</p>
            <p className="text-xs text-primary-600 mt-0.5">
              请确保CSV文件包含必要字段，时间格式使用 yyyy-MM-dd HH:mm:ss，个人信息将自动脱敏
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 bg-white rounded-md hover:bg-primary-50 border border-primary-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            下载模板
          </button>
        </div>

        {!uploadedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-300 bg-white hover:border-primary-400 hover:bg-neutral-50"
            )}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-base font-medium text-neutral-700 mb-1">
              拖拽CSV文件到此处上传
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              或点击下方按钮选择文件
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              选择文件
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-neutral-400 mt-4">支持 .csv 格式，最大 50MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-card border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800">{uploadedFile.name}</p>
                  <p className="text-xs text-neutral-500">
                    {(uploadedFile.size / 1024).toFixed(2)} KB · {preview?.total || 0} 条记录
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {preview && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200 text-center">
                    <p className="text-2xl font-bold text-neutral-800 font-mono">
                      {preview.total}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">总记录数</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200 text-center">
                    <p className="text-2xl font-bold text-success-600 font-mono">
                      {preview.valid}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">有效记录</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200 text-center">
                    <p className="text-2xl font-bold text-danger-500 font-mono">
                      {preview.invalid}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">异常记录</p>
                  </div>
                </div>

                {preview.errors.length > 0 && (
                  <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-warning-700">
                        发现 {preview.errors.length} 条数据异常
                      </p>
                    </div>
                    <div className="space-y-1 pl-6">
                      {preview.errors.slice(0, 3).map((error, index) => (
                        <p key={index} className="text-xs text-warning-600">
                          第 {error.row} 行: {error.message}
                        </p>
                      ))}
                      {preview.errors.length > 3 && (
                        <p className="text-xs text-warning-500">
                          ...还有 {preview.errors.length - 3} 条异常
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200">
                  <p className="text-sm font-medium text-neutral-700 mb-3">数据预览（前3条）</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">就诊号</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">科室</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">医生</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">挂号时间</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">总等待</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample.map((row, index) => (
                          <tr key={index} className="border-b border-neutral-100 last:border-b-0">
                            <td className="px-3 py-2 text-xs text-neutral-600 font-mono">{row.visitNumber}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{row.dept}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{row.doctor}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{row.registerTime}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{row.waitTotal}分钟</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {importStatus === "idle" && (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors"
                    >
                      确认导入
                    </button>
                  </div>
                )}

                {importStatus === "processing" && (
                  <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-700">正在导入数据...</span>
                      <span className="text-sm font-medium text-primary-600">{importProgress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {importStatus === "success" && (
                  <div className="p-6 bg-success-50 rounded-lg border border-success-200 text-center">
                    <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-success-700">数据导入成功</p>
                    <p className="text-sm text-success-600 mt-1">
                      共成功导入 {preview.valid} 条记录，已自动完成脱敏处理
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-4 px-4 py-2 text-sm text-success-700 bg-white border border-success-300 rounded-md hover:bg-success-50 transition-colors"
                    >
                      继续导入
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-800 mb-3">数据处理规则</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm font-medium text-neutral-700 mb-1">数据脱敏</p>
              <p className="text-xs text-neutral-500">
                患者姓名、就诊号、身份证号等敏感信息自动哈希脱敏
              </p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm font-medium text-neutral-700 mb-1">缺失值处理</p>
              <p className="text-xs text-neutral-500">
                时间戳缺失标记为异常，科室/医生缺失归类为"未分配"
              </p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm font-medium text-neutral-700 mb-1">异常值检测</p>
              <p className="text-xs text-neutral-500">
                等待时间超出P95分位数或小于0标记为异常
              </p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm font-medium text-neutral-700 mb-1">权限控制</p>
              <p className="text-xs text-neutral-500">
                导入数据按用户权限范围进行行级过滤
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
