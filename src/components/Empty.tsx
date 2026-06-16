import { Inbox } from 'lucide-react';

interface EmptyProps {
  text?: string;
}

export default function Empty({ text = '暂无数据' }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#64748B]">
      <Inbox size={48} className="mb-3 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
