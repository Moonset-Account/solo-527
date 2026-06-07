'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info,
  Loader2,
  Database,
  Send,
} from 'lucide-react';

interface ImportResult {
  importType: string;
  fileName: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  missingReport: any;
  preview: any[];
  dbWriteExecuted?: boolean;
  dbWriteSuccess?: number;
  dbWriteFailed?: number;
  successfulIds?: string[];
}

interface ImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (result: ImportResult) => void;
}

export default function ImportPanel({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportPanelProps) {
  const [importType, setImportType] = useState<'attendance' | 'scores' | 'students'>('attendance');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingWrite, setConfirmingWrite] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    } else {
      setError('请上传 CSV 或 Excel 文件');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    if (importType === 'attendance') {
      csvContent = '学号,姓名,课程,周次,出勤状态,日期,备注\n';
      csvContent += '2024001,张三,高等数学,1,present,2024-03-01,准时到课\n';
      csvContent += '2024002,李四,高等数学,1,absent,2024-03-01,病假\n';
    } else if (importType === 'scores') {
      csvContent = '学号,姓名,课程,周次,作业分数,测验分数,备注\n';
      csvContent += '2024001,张三,高等数学,1,95,88,完成良好\n';
      csvContent += '2024002,李四,高等数学,1,78,65,需要加强\n';
    } else {
      csvContent = '学号,姓名,性别,班级,手机号,邮箱,家庭住址,经度,纬度\n';
      csvContent += '2024001,张三,男,计算机2301,13800138000,zhangsan@university.edu.cn,北京市海淀区,116.397,39.908\n';
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${importType}_import_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePreview = async () => {
    if (!file) {
      setError('请选择要导入的文件');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);
      formData.append('confirmWrite', 'false');

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('导入失败');
      }

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '导入失败');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('导入过程中发生错误，请稍后重试');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmWrite = async () => {
    if (!file) return;

    setIsWriting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);
      formData.append('confirmWrite', 'true');

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('入库失败');
      }

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setConfirmingWrite(false);
        onImportSuccess?.(data.data);
      } else {
        setError(data.error || '入库失败');
      }
    } catch (err) {
      console.error('Write error:', err);
      setError('入库过程中发生错误，请稍后重试');
    } finally {
      setIsWriting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setConfirmingWrite(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800">批量导入数据</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              导入数据类型
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'attendance', label: '出勤数据', icon: '📊' },
                { key: 'scores', label: '成绩数据', icon: '📝' },
                { key: 'students', label: '学生信息', icon: '👥' },
              ].map((type) => (
                <button
                  key={type.key}
                  onClick={() => {
                    setImportType(type.key as any);
                    if (!result) resetForm();
                  }}
                  disabled={!!result && result.dbWriteExecuted}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    importType === type.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${result?.dbWriteExecuted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <p className={`text-sm font-medium ${
                    importType === type.key ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {type.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>首次导入请下载模板，按格式填写后上传</span>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Download className="w-4 h-4" />
              下载导入模板
            </button>
          </div>

          {!result && (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-medium text-green-700">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      重新选择
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload
                      className={`w-12 h-12 mx-auto ${
                        isDragging ? 'text-blue-500' : 'text-gray-400'
                      }`}
                    />
                    <p className="font-medium text-gray-700">
                      拖拽文件到这里，或点击选择文件
                    </p>
                    <p className="text-sm text-gray-500">
                      支持 CSV、Excel 格式，最大 10MB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handlePreview}
                disabled={!file || isImporting}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  !file || isImporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    正在解析数据...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    预览导入数据
                  </>
                )}
              </button>
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {result.totalRecords}
                  </p>
                  <p className="text-sm text-gray-500">总记录数</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {result.successfulRecords}
                  </p>
                  <p className="text-sm text-gray-500">校验通过</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {result.failedRecords}
                  </p>
                  <p className="text-sm text-gray-500">校验失败</p>
                </div>
              </div>

              {result.dbWriteExecuted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="font-medium text-green-700 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    数据库写入完成
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    成功写入 {result.dbWriteSuccess} 条，失败 {result.dbWriteFailed} 条
                  </p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="font-medium text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    错误详情
                  </p>
                  <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>...还有 {result.errors.length - 10} 条错误</li>
                    )}
                  </ul>
                </div>
              )}

              {result.missingReport && result.missingReport.totalMissing > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    缺失值检测
                  </p>
                  <p className="text-sm text-amber-600">
                    共检测到 {result.missingReport.totalMissing} 个缺失值，
                    缺失率 {(result.missingReport.missingRate * 100).toFixed(1)}%
                  </p>
                </div>
              )}

              {result.preview && result.preview.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">数据预览（前 5 条）</p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(result.preview[0]).map((key) => (
                            <th
                              key={key}
                              className="px-3 py-2 text-left font-medium text-gray-600"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {result.preview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, vIdx) => (
                              <td key={vIdx} className="px-3 py-2 text-gray-700">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!result.dbWriteExecuted ? (
                <div className="space-y-3">
                  {result.failedRecords > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-700 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      存在校验失败的记录，仅会导入校验通过的数据
                    </div>
                  )}
                  
                  {confirmingWrite ? (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-700 mb-3">
                        确认要将校验通过的数据写入数据库吗？此操作不可撤销。
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmingWrite(false)}
                          disabled={isWriting}
                          className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleConfirmWrite}
                          disabled={isWriting}
                          className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isWriting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              写入中...
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4" />
                              确认入库
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={resetForm}
                        className="flex-1 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        重新导入
                      </button>
                      <button
                        onClick={() => setConfirmingWrite(true)}
                        disabled={result.successfulRecords === 0}
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                        确认入库
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    继续导入
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    完成
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
