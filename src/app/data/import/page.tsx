"use client";

import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, RefreshCw } from "lucide-react";
import { cn, downloadCSV } from "@/utils";
import { parseCSV, mapCSVRow, generateCSV } from "@/lib/csv";
import { validateVisitData, cleanAndCalculateWaitTimes, maskVisitNumber } from "@/lib/validation";

interface ImportPreview {
  total: number;
  valid: number;
  invalid: number;
  errors: { row: number; field: string; message: string }[];
  warnings: { row: number; field: string; message: string }[];
  sample: Record<string, any>[];
  headers: string[];
  detectedColumns: string[];
}

export default function DataImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

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

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setImportStatus("idle");
    setImportResult(null);

    try {
      const content = await file.text();
      const csvResult = parseCSV(content);

      const allErrors: { row: number; field: string; message: string }[] = [];
      const allWarnings: { row: number; field: string; message: string }[] = [];
      const validRows: Record<string, any>[] = [];

      for (let i = 0; i < csvResult.data.length; i++) {
        const rowNum = i + 2;
        const rawRow = csvResult.data[i];
        const mappedRow = mapCSVRow(rawRow);
        const validation = validateVisitData(mappedRow, rowNum);

        if (!validation.valid) {
          allErrors.push(...validation.errors);
        } else {
          const cleaned = cleanAndCalculateWaitTimes(mappedRow);
          cleaned.visitNumberMasked = maskVisitNumber(mappedRow.visitNumber || "");
          validRows.push(cleaned);
        }

        if (validation.warnings.length > 0) {
          allWarnings.push(...validation.warnings);
        }
      }

      const detectedColumns = csvResult.headers.filter(
        (h) => h.includes("时间") || h.includes("号") || h.includes("科室") || h.includes("医生")
      );

      setPreview({
        total: csvResult.rowCount,
        valid: validRows.length,
        invalid: csvResult.rowCount - validRows.length,
        errors: allErrors,
        warnings: allWarnings,
        sample: validRows.slice(0, 5),
        headers: csvResult.headers,
        detectedColumns,
      });
    } catch (error) {
      console.error("Failed to parse CSV:", error);
      setPreview({
        total: 0,
        valid: 0,
        invalid: 0,
        errors: [{ row: 0, field: "file", message: "文件解析失败，请检查文件格式" }],
        warnings: [],
        sample: [],
        headers: [],
        detectedColumns: [],
      });
    }
  };

  const handleImport = async () => {
    if (!uploadedFile) return;

    setImportStatus("processing");
    setImportProgress(0);

    try {
      const content = await uploadedFile.text();
      const csvResult = parseCSV(content);

      let success = 0;
      let failed = 0;
      const total = csvResult.data.length;

      for (let i = 0; i < csvResult.data.length; i++) {
        const rawRow = csvResult.data[i];
        const mappedRow = mapCSVRow(rawRow);
        const validation = validateVisitData(mappedRow);

        if (validation.valid) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 5));
            success++;
          } catch {
            failed++;
          }
        } else {
          failed++;
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setImportResult({ success, failed });
      setImportStatus("success");
    } catch (error) {
      console.error("Import failed:", error);
      setImportStatus("error");
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPreview(null);
    setImportStatus("idle");
    setImportProgress(0);
    setImportResult(null);
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
    const sampleData = [
      {
        "就诊号": "VISIT202606010001",
        "科室编码": "dept-001",
        "医生编码": "doc-001",
        "患者类型": "pt-001",
        "挂号时间": "2026-06-01 08:00:00",
        "签到时间": "2026-06-01 08:05:00",
        "分诊时间": "2026-06-01 08:10:00",
        "叫号时间": "2026-06-01 08:45:00",
        "缴费时间": "2026-06-01 09:15:00",
        "取药时间": "2026-06-01 09:25:00",
      },
    ];
    const csvContent = generateCSV(sampleData, headers);
    downloadCSV(csvContent, "门诊数据导入模板.csv");
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
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                    {preview && ` · 检测到 ${preview.headers.length} 列`}
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
                  <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
                    <div className="flex items-start gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-danger-700">
                        发现 {preview.errors.length} 条数据错误
                      </p>
                    </div>
                    <div className="space-y-1 pl-6 max-h-32 overflow-y-auto">
                      {preview.errors.slice(0, 5).map((error, index) => (
                        <p key={index} className="text-xs text-danger-600">
                          第 {error.row} 行 [{error.field}]: {error.message}
                        </p>
                      ))}
                      {preview.errors.length > 5 && (
                        <p className="text-xs text-danger-500">
                          ...还有 {preview.errors.length - 5} 条错误
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {preview.warnings.length > 0 && (
                  <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-warning-700">
                        发现 {preview.warnings.length} 条数据警告
                      </p>
                    </div>
                    <div className="space-y-1 pl-6 max-h-24 overflow-y-auto">
                      {preview.warnings.slice(0, 3).map((warning, index) => (
                        <p key={index} className="text-xs text-warning-600">
                          第 {warning.row} 行 [{warning.field}]: {warning.message}
                        </p>
                      ))}
                      {preview.warnings.length > 3 && (
                        <p className="text-xs text-warning-500">
                          ...还有 {preview.warnings.length - 3} 条警告
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {preview.sample.length > 0 && (
                  <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200">
                    <p className="text-sm font-medium text-neutral-700 mb-3">
                      数据预览（前{preview.sample.length}条，已脱敏）
                    </p>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-neutral-200">
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">就诊号（脱敏）</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">科室</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">挂号时间</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">叫号时间</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">总等待</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">就诊等待</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.sample.map((row, index) => (
                            <tr key={index} className="border-b border-neutral-100 last:border-b-0">
                              <td className="px-3 py-2 text-xs text-neutral-600 font-mono">
                                {row.visitNumberMasked || "-"}
                              </td>
                              <td className="px-3 py-2 text-xs text-neutral-600">
                                {row.deptId || "-"}
                              </td>
                              <td className="px-3 py-2 text-xs text-neutral-600">
                                {row.registerTime ? String(row.registerTime).slice(0, 16) : "-"}
                              </td>
                              <td className="px-3 py-2 text-xs text-neutral-600">
                                {row.callTime ? String(row.callTime).slice(0, 16) : "-"}
                              </td>
                              <td className="px-3 py-2 text-xs text-neutral-600">
                                {row.waitTotalMinutes != null ? `${row.waitTotalMinutes}分钟` : "-"}
                              </td>
                              <td className="px-3 py-2 text-xs text-neutral-600">
                                {row.waitDoctorMinutes != null ? `${row.waitDoctorMinutes}分钟` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importStatus === "processing" && (
                  <div className="p-4 bg-white rounded-lg shadow-card border border-neutral-200">
                    <div className="flex items-center gap-3 mb-3">
                      <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" />
                      <p className="text-sm font-medium text-neutral-700">正在导入数据...</p>
                      <span className="ml-auto text-sm font-mono text-primary-600">{importProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {importStatus === "success" && importResult && (
                  <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-success-700">导入完成</p>
                        <p className="text-xs text-success-600 mt-1">
                          成功导入 {importResult.success} 条记录
                          {importResult.failed > 0 && `，失败 ${importResult.failed} 条`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {importStatus === "error" && (
                  <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-danger-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-danger-700">导入失败</p>
                        <p className="text-xs text-danger-600 mt-1">
                          请检查网络连接后重试
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {importStatus === "idle" && (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm text-neutral-600 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={preview.valid === 0}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      开始导入 ({preview.valid}条有效记录)
                    </button>
                  </div>
                )}

                {importStatus !== "idle" && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      导入新文件
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
