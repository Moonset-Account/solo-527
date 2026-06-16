import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Home, DollarSign, Calendar } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import type { Room, Appointment, Contract, WorkOrder } from '@/types';

const mockRoom: Room = {
  id: 1, name: '望京SOHO-A1201', address: '朝阳区望京SOHO A座1201', area: 85,
  unitType: '一室一厅', status: 'vacant', monthlyRent: 6500, images: [],
  vacantDays: 12, createdAt: '2026-01-01', updatedAt: '2026-06-16',
};

const mockAppointments: Appointment[] = [
  { id: 1, roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生', consultantId: 1, consultantName: '顾问A', appointmentTime: '2026-06-17T09:00:00', duration: 60, status: 'confirmed', remark: '', createdAt: '2026-06-16' },
  { id: 2, roomId: 1, roomName: '望京SOHO-A1201', tenantId: 2, tenantName: '李女士', consultantId: 2, consultantName: '顾问B', appointmentTime: '2026-06-18T14:00:00', duration: 60, status: 'pending', remark: '', createdAt: '2026-06-16' },
];

const mockContracts: Contract[] = [
  { id: 1, templateId: 1, roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生', ownerId: 1, ownerName: '业主A', startDate: '2026-03-01', endDate: '2027-02-28', monthlyRent: 6500, deposit: 13000, status: 'archived', content: '', signedAt: '2026-02-28', createdAt: '2026-02-25' },
];

const mockWorkOrders: WorkOrder[] = [
  { id: 1, type: 'repair', roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生', assigneeId: 1, assigneeName: '维修师傅A', status: 'completed', description: '水龙头漏水', followUpResult: '已修复', satisfaction: 5, createdAt: '2026-05-20', completedAt: '2026-05-21' },
];

const tabs = ['预约记录', '合同记录', '工单记录'] as const;

export default function RoomDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<number>(0);
  const room = mockRoom;

  return (
    <div className="space-y-4">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F97316]">
        <ArrowLeft size={16} /> 返回房源列表
      </Link>

      <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#F1F5F9]">{room.name}</h2>
          <StatusBadge status={room.status} />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#94A3B8]" />
            <span className="text-sm text-[#CBD5E1]">{room.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Home size={16} className="text-[#94A3B8]" />
            <span className="text-sm text-[#CBD5E1]">{room.area}㎡ · {room.unitType}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-[#94A3B8]" />
            <span className="text-sm text-[#F97316] font-medium">¥{room.monthlyRent}/月</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#94A3B8]" />
            <span className="text-sm text-[#CBD5E1]">空置 {room.vacantDays} 天</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155]">
        <div className="flex border-b border-[#334155]">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === i
                  ? 'text-[#F97316] border-b-2 border-[#F97316]'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="px-4 py-2 text-left text-[#94A3B8]">租客</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">预约时间</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">顾问</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">状态</th>
                </tr>
              </thead>
              <tbody>
                {mockAppointments.map((a) => (
                  <tr key={a.id} className="border-b border-[#334155]/50">
                    <td className="px-4 py-2 text-[#CBD5E1]">{a.tenantName}</td>
                    <td className="px-4 py-2 text-[#CBD5E1]">{a.appointmentTime.replace('T', ' ')}</td>
                    <td className="px-4 py-2 text-[#CBD5E1]">{a.consultantName}</td>
                    <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 1 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="px-4 py-2 text-left text-[#94A3B8]">租客</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">租期</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">月租</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">状态</th>
                </tr>
              </thead>
              <tbody>
                {mockContracts.map((c) => (
                  <tr key={c.id} className="border-b border-[#334155]/50">
                    <td className="px-4 py-2 text-[#CBD5E1]">{c.tenantName}</td>
                    <td className="px-4 py-2 text-[#CBD5E1]">{c.startDate} ~ {c.endDate}</td>
                    <td className="px-4 py-2 text-[#CBD5E1]">¥{c.monthlyRent}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 2 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="px-4 py-2 text-left text-[#94A3B8]">类型</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">描述</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">负责人</th>
                  <th className="px-4 py-2 text-left text-[#94A3B8]">状态</th>
                </tr>
              </thead>
              <tbody>
                {mockWorkOrders.map((w) => (
                  <tr key={w.id} className="border-b border-[#334155]/50">
                    <td className="px-4 py-2 text-[#CBD5E1]">{w.type === 'repair' ? '维修' : w.type === 'clean' ? '保洁' : '巡检'}</td>
                    <td className="px-4 py-2 text-[#CBD5E1]">{w.description}</td>
                    <td className="px-4 py-2 text-[#CBD5E1]">{w.assigneeName}</td>
                    <td className="px-4 py-2"><StatusBadge status={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
