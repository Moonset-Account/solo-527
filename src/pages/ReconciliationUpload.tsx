import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { createReconciliation } from '@/api/reconciliation';

const ACCEPTED_TYPES = ['.xlsx', '.xls', '.csv'];
const ACCEPTED_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';

export default function ReconciliationUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const isValidFile = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_TYPES.includes(ext);
  };

  const handleFileSelect = (f: File) => {
    if (!isValidFile(f)) {
      setError('仅支持 .xlsx, .xls, .csv 文件');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  const handleSubmit = async () => {
    if (!projectName.trim() || !clientName.trim() || !file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    const formData = new FormData();
    formData.append('project_name', projectName);
    formData.append('client_name', clientName);
    formData.append('file', file);

    try {
      await createReconciliation(formData);
      setProgress(100);
      navigate('/reconciliation');
    } catch {
      setError('上传失败，请重试');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">上传对账单</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">项目名称</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="请输入项目名称"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">客户名称</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="请输入客户名称"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">对账单文件</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-amber-400 bg-amber-50'
                : file
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Upload className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="p-1 hover:bg-emerald-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-emerald-500" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">拖拽文件到此处，或点击选择文件</p>
                <p className="text-xs text-gray-400">支持 {ACCEPTED_TYPES.join(', ')} 格式</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>上传中...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: '#f59e0b' }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!projectName.trim() || !clientName.trim() || !file || uploading}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1e293b' }}
          >
            {uploading ? '上传中...' : '提交'}
          </button>
          <button
            onClick={() => navigate('/reconciliation')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
