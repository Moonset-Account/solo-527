import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { groupClassApi, memberApi } from '@/utils/api';
import StatusBadge from '@/components/StatusBadge';
import type { GroupClass, Member } from '../../shared/types';

export default function GroupClasses() {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bookModal, setBookModal] = useState<GroupClass | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState(0);
  const [form, setForm] = useState({ name: '', coach_id: 0, start_time: '', end_time: '', max_capacity: 10 });

  useEffect(() => {
    groupClassApi.list().then(setClasses).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await groupClassApi.create(form);
    setShowModal(false);
    const list = await groupClassApi.list();
    setClasses(list);
  };

  const handleBook = async () => {
    if (!bookModal || !selectedMember) return;
    await groupClassApi.book(bookModal.id, selectedMember);
    setBookModal(null);
    const list = await groupClassApi.list();
    setClasses(list);
  };

  const openBook = async (gc: GroupClass) => {
    setBookModal(gc);
    const mList = await memberApi.list();
    setMembers(mList);
    setSelectedMember(0);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />创建团课</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((gc) => {
          const pct = gc.max_capacity > 0 ? (gc.current_bookings / gc.max_capacity) * 100 : 0;
          const barColor = pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-amber-500' : 'bg-success';
          return (
            <div key={gc.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{gc.name}</h3>
                <StatusBadge status={gc.status} />
              </div>
              <div className="text-sm text-gray-500 mb-2">
                <div>教练 ID: {gc.coach_id}</div>
                <div>{gc.start_time?.slice(0, 16).replace('T', ' ')} - {gc.end_time?.slice(11, 16)}</div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500"><Users className="w-3 h-3 inline" /> 容量</span>
                  <span className="font-medium">{gc.current_bookings}/{gc.max_capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
              {gc.status === 'scheduled' && gc.current_bookings < gc.max_capacity && (
                <button onClick={() => openBook(gc)} className="btn-primary w-full text-sm">预约</button>
              )}
            </div>
          );
        })}
        {classes.length === 0 && <p className="text-gray-400 text-center py-12 col-span-3">暂无团课</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">创建团课</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="课程名称" className="input-field" required />
              <input type="number" value={form.coach_id || ''} onChange={(e) => setForm({ ...form, coach_id: Number(e.target.value) })} placeholder="教练ID" className="input-field" required />
              <input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input-field" required />
              <input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input-field" required />
              <input type="number" value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: Number(e.target.value) })} placeholder="最大容量" className="input-field" required />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">创建</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bookModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setBookModal(null)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">预约团课 - {bookModal.name}</h3>
            <select value={selectedMember} onChange={(e) => setSelectedMember(Number(e.target.value))} className="input-field mb-3">
              <option value={0}>选择会员</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name} - {m.phone}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={handleBook} disabled={!selectedMember} className="btn-primary flex-1 disabled:opacity-50">确认预约</button>
              <button onClick={() => setBookModal(null)} className="btn-secondary flex-1">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
