import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '@/components/StatusBadge';
import type { Room, VacancyStats } from '@/types';

const mockRooms: Room[] = [
  { id: 1, name: '望京SOHO-A1201', address: '朝阳区望京SOHO A座1201', area: 85, unitType: '一室一厅', status: 'vacant', monthlyRent: 6500, images: [], vacantDays: 12, createdAt: '2026-01-01', updatedAt: '2026-06-16' },
  { id: 2, name: '中关村-B0803', address: '海淀区中关村B座0803', area: 60, unitType: '单间', status: 'rented', monthlyRent: 4200, images: [], vacantDays: 0, createdAt: '2026-01-15', updatedAt: '2026-06-10' },
  { id: 3, name: '望京SOHO-A1203', address: '朝阳区望京SOHO A座1203', area: 110, unitType: '两室一厅', status: 'maintenance', monthlyRent: 8800, images: [], vacantDays: 5, createdAt: '2026-02-01', updatedAt: '2026-06-14' },
  { id: 4, name: '朝阳区-C0502', address: '朝阳区建国路C座0502', area: 75, unitType: '一室一厅', status: 'reserved', monthlyRent: 5800, images: [], vacantDays: 0, createdAt: '2026-03-01', updatedAt: '2026-06-12' },
  { id: 5, name: '海淀区-D1101', address: '海淀区西二旗D座1101', area: 95, unitType: '两室一厅', status: 'vacant', monthlyRent: 7200, images: [], vacantDays: 25, createdAt: '2026-01-20', updatedAt: '2026-06-16' },
  { id: 6, name: '望京SOHO-B0905', address: '朝阳区望京SOHO B座0905', area: 50, unitType: '单间', status: 'rented', monthlyRent: 3500, images: [], vacantDays: 0, createdAt: '2026-04-01', updatedAt: '2026-06-08' },
];

const mockVacancy: VacancyStats[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return { date: d.toISOString().slice(0, 10), totalRooms: 120, vacantRooms: 14 + Math.floor(Math.random() * 8), vacancyRate: (14 + Math.floor(Math.random() * 8)) / 120 };
});

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'vacant', label: '空置' },
  { value: 'rented', label: '已租' },
  { value: 'maintenance', label: '维修' },
  { value: 'reserved', label: '预留' },
];

const kanbanColumns: { status: Room['status']; label: string; color: string }[] = [
  { status: 'vacant', label: '空置', color: 'border-emerald-500/50' },
  { status: 'rented', label: '已租', color: 'border-blue-500/50' },
  { status: 'maintenance', label: '维修', color: 'border-amber-500/50' },
  { status: 'reserved', label: '预留', color: 'border-purple-500/50' },
];

function KanbanCard({ room }: { room: Room }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    card.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(500px) rotateX(0) rotateY(0)';
    }
  };

  return (
    <Link to={`/rooms/${room.id}`}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="bg-[#0F172A] rounded-lg p-3 border border-[#334155] hover:border-[#F97316]/50 transition-transform duration-150 cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#F1F5F9] truncate">{room.name}</span>
          <StatusBadge status={room.status} />
        </div>
        <p className="text-xs text-[#94A3B8] mb-1">{room.address}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#94A3B8]">{room.area}㎡ · {room.unitType}</span>
          <span className="text-sm font-medium text-[#F97316]">¥{room.monthlyRent}</span>
        </div>
      </div>
    </Link>
  );
}

export default function RoomList() {
  const [statusFilter, setStatusFilter] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [unitType, setUnitType] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const filtered = mockRooms.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (areaSearch && !r.address.includes(areaSearch) && !r.name.includes(areaSearch)) return false;
    if (unitType && r.unitType !== unitType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#F1F5F9]">房源列表</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-[#F97316] text-white' : 'text-[#94A3B8] hover:bg-[#334155]'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg ${viewMode === 'kanban' ? 'bg-[#F97316] text-white' : 'text-[#94A3B8] hover:bg-[#334155]'}`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155]">
          <Filter size={16} className="text-[#94A3B8]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm text-[#F1F5F9] outline-none"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155]">
          <Search size={16} className="text-[#94A3B8]" />
          <input
            type="text"
            placeholder="搜索区域/地址"
            value={areaSearch}
            onChange={(e) => setAreaSearch(e.target.value)}
            className="bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#64748B] w-40"
          />
        </div>
        <select
          value={unitType}
          onChange={(e) => setUnitType(e.target.value)}
          className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
        >
          <option value="" className="bg-[#1E293B]">全部户型</option>
          <option value="单间" className="bg-[#1E293B]">单间</option>
          <option value="一室一厅" className="bg-[#1E293B]">一室一厅</option>
          <option value="两室一厅" className="bg-[#1E293B]">两室一厅</option>
        </select>
      </div>

      {viewMode === 'table' ? (
        <>
          <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">房源名称</th>
                  <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">地址</th>
                  <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">面积</th>
                  <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">户型</th>
                  <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">月租</th>
                  <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
                  <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">空置天数</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((room) => (
                  <tr key={room.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                    <td className="px-4 py-3">
                      <Link to={`/rooms/${room.id}`} className="text-[#F97316] hover:underline">{room.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{room.address}</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{room.area}㎡</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{room.unitType}</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">¥{room.monthlyRent}</td>
                    <td className="px-4 py-3"><StatusBadge status={room.status} /></td>
                    <td className="px-4 py-3 text-[#CBD5E1]">
                      {room.vacantDays > 0 ? (
                        <span className={room.vacantDays > 15 ? 'text-rose-400 font-medium' : ''}>{room.vacantDays}天</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#1E293B] rounded-lg p-5 border border-[#334155]">
            <h3 className="text-sm font-medium text-[#F1F5F9] mb-3">空置率趋势 (近30天)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockVacancy}>
                <defs>
                  <linearGradient id="roomVacancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                <Area type="monotone" dataKey="vacancyRate" stroke="#F97316" fill="url(#roomVacancy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {kanbanColumns.map((col) => (
            <div key={col.status} className={`rounded-lg border-t-2 ${col.color} bg-[#1E293B] border border-[#334155]`}>
              <div className="px-3 py-2 border-b border-[#334155]">
                <span className="text-sm font-medium text-[#F1F5F9]">{col.label}</span>
                <span className="ml-2 text-xs text-[#94A3B8]">
                  {filtered.filter((r) => r.status === col.status).length}
                </span>
              </div>
              <div className="p-2 space-y-2">
                {filtered
                  .filter((r) => r.status === col.status)
                  .map((room) => (
                    <KanbanCard key={room.id} room={room} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
