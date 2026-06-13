import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { getRepairTypeLabel } from '@/utils/format';
import UrgencyBadge from '@/components/UrgencyBadge';
import type { RepairType, Urgency } from '@/types';

const buildings = Array.from({ length: 10 }, (_, i) => `${i + 1}号楼`);
const repairTypes: RepairType[] = ['plumbing', 'electrical', 'furniture', 'door_window', 'network', 'other'];
const urgencyLevels: Urgency[] = ['low', 'medium', 'high', 'critical'];

interface PhotoFile {
  file: File;
  preview: string;
  progress: number;
}

export default function RepairSubmit() {
  const createRepair = useAppStore((s) => s.createRepair);
  const [building, setBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [repairType, setRepairType] = useState<RepairType | ''>('');
  const [urgency, setUrgency] = useState<Urgency | ''>('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid = building && roomNumber && repairType && urgency && description.length >= 10;

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newPhotos: PhotoFile[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f), progress: 0 }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    newPhotos.forEach((p) => simulateUpload(p));
  }, []);

  const simulateUpload = (photo: PhotoFile) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setPhotos((prev) => prev.map((p) => (p.preview === photo.preview ? { ...p, progress } : p)));
    }, 200);
  };

  const removePhoto = (preview: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.preview === preview);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.preview !== preview);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const res = await createRepair({
        building,
        roomNumber,
        repairType: repairType as RepairType,
        urgency: urgency as Urgency,
        description,
      });
      setResult({ id: res.id });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
          <h2 className="mb-2 text-xl font-bold text-slate-800">提交成功</h2>
          <p className="mb-1 text-slate-600">申请单号: <span className="font-mono font-semibold">{result.id}</span></p>
          <p className="mb-6 text-sm text-slate-500">您的报修申请已成功提交，请耐心等待审核</p>
          <Link to={`/repair/track/${result.id}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            查看进度
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">报修申请</h1>
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">宿舍楼 <span className="text-red-500">*</span></label>
              <select value={building} onChange={(e) => setBuilding(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">请选择</option>
                {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">房间号 <span className="text-red-500">*</span></label>
              <input type="text" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="如 301" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">报修类型 <span className="text-red-500">*</span></label>
            <select value={repairType} onChange={(e) => setRepairType(e.target.value as RepairType)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">请选择</option>
              {repairTypes.map((t) => <option key={t} value={t}>{getRepairTypeLabel(t)}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">紧急程度 <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {urgencyLevels.map((u) => (
                <button key={u} type="button" onClick={() => setUrgency(u)} className={`rounded-lg border px-4 py-2 text-sm transition-colors ${urgency === u ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                  <UrgencyBadge urgency={u} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">问题描述 <span className="text-red-500">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} minLength={10} placeholder="请详细描述报修问题（至少10个字）" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            {description.length > 0 && description.length < 10 && <p className="mt-1 text-xs text-red-500">至少需要10个字</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">照片上传</label>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/30" onClick={() => fileInputRef.current?.click()}>
              <Upload size={32} className="mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">拖拽照片到此处或点击上传</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </div>
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {photos.map((p) => (
                  <div key={p.preview} className="group relative">
                    <img src={p.preview} alt="" className="h-20 w-full rounded-lg object-cover" />
                    {p.progress < 100 && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                        <span className="text-xs font-medium text-white">{Math.round(p.progress)}%</span>
                      </div>
                    )}
                    <button onClick={() => removePhoto(p.preview)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={!isValid || submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> 提交中...</> : '提交报修'}
          </button>
        </div>
      </div>
    </div>
  );
}
