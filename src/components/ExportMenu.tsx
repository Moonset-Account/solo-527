import { useState, useEffect, useRef } from 'react';
import { Download, FileImage, FileText } from 'lucide-react';
import { exportAsPNG, exportAsPDF } from '@/utils/export';
import { useDataStore } from '@/store/dataStore';

interface ExportMenuProps {
  targetId: string;
}

export default function ExportMenu({ targetId }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nullCount = useDataStore((s) => s.nullCount);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const date = new Date().toISOString().slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e5c7]/10 hover:bg-[#00e5c7]/20 text-[#00e5c7] text-sm font-medium transition-colors"
      >
        <Download size={16} />
        导出
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-lg bg-[#22252d] border border-white/10 shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => {
              exportAsPNG(targetId, `调度报告_${date}`);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
          >
            <FileImage size={16} />
            导出 PNG
          </button>
          <button
            onClick={() => {
              exportAsPDF(targetId, `调度报告_${date}`, nullCount);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
          >
            <FileText size={16} />
            导出 PDF
          </button>
        </div>
      )}
    </div>
  );
}
