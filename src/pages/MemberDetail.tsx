import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Package as PkgIcon, CalendarCheck, Activity, Snowflake, ScrollText } from 'lucide-react';
import { useMemberStore } from '@/stores/memberStore';
import { usePackageStore } from '@/stores/packageStore';
import { useFreezeStore } from '@/stores/freezeStore';
import { bodyTestApi } from '@/utils/api';
import { freezeApi } from '@/utils/api';
import StatusBadge from '@/components/StatusBadge';
import type { BodyTest, Freeze } from '../../shared/types';

const tabs = [
  { key: 'packages', label: '套餐', icon: PkgIcon },
  { key: 'appointments', label: '预约', icon: CalendarCheck },
  { key: 'bodyTests', label: '体测', icon: Activity },
  { key: 'freezes', label: '冻结', icon: Snowflake },
  { key: 'auditLog', label: '审计', icon: ScrollText },
];

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentMember, loading, fetchMember, updateMember } = useMemberStore();
  const { memberPackages, fetchMemberPackages, packageTypes, fetchPackageTypes, purchasePackage } = usePackageStore();
  const { fetchMemberFreezes, createFreeze } = useFreezeStore();
  const [activeTab, setActiveTab] = useState('packages');
  const [bodyTests, setBodyTests] = useState<BodyTest[]>([]);
  const [freezes, setFreezes] = useState<Freeze[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', gender: '', birthday: '', notes: '' });
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [showFreeze, setShowFreeze] = useState(false);
  const [freezeForm, setFreezeForm] = useState({ member_package_id: 0, start_date: '', end_date: '', reason: '' });

  const memberId = Number(id);

  useEffect(() => {
    if (memberId) {
      fetchMember(memberId);
      fetchMemberPackages(memberId);
      fetchPackageTypes(true);
      bodyTestApi.getMemberBodyTests(memberId).then(setBodyTests).catch(() => {});
      freezeApi.getMemberFreezes(memberId).then(setFreezes).catch(() => {});
    }
  }, [memberId]);

  useEffect(() => {
    if (currentMember) {
      setEditForm({
        name: currentMember.name, phone: currentMember.phone,
        email: currentMember.email || '', gender: currentMember.gender || '',
        birthday: currentMember.birthday || '', notes: currentMember.notes || '',
      });
    }
  }, [currentMember]);

  if (loading || !currentMember) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;

  const handleEdit = async () => {
    await updateMember(memberId, editForm);
    setEditing(false);
    fetchMember(memberId);
  };

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    await purchasePackage(memberId, selectedPkg, paidAmount);
    setShowPurchase(false);
    fetchMemberPackages(memberId);
  };

  const handleFreeze = async () => {
    await createFreeze({ member_id: memberId, ...freezeForm });
    setShowFreeze(false);
    freezeApi.getMemberFreezes(memberId).then(setFreezes);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">基本信息</h3>
          <button onClick={() => setEditing(!editing)} className="p-1.5 text-accent hover:bg-orange-50 rounded"><Edit2 className="w-4 h-4" /></button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input-field" placeholder="姓名" />
            <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="input-field" placeholder="手机号" />
            <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="input-field" placeholder="邮箱" />
            <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="input-field">
              <option value="">未选择</option><option value="male">男</option><option value="female">女</option>
            </select>
            <input value={editForm.birthday} onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })} type="date" className="input-field" />
            <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="input-field" rows={2} placeholder="备注" />
            <div className="flex gap-2"><button onClick={handleEdit} className="btn-primary text-sm">保存</button><button onClick={() => setEditing(false)} className="btn-secondary text-sm">取消</button></div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <InfoRow label="姓名" value={currentMember.name} />
            <InfoRow label="手机号" value={currentMember.phone} />
            <InfoRow label="邮箱" value={currentMember.email || '-'} />
            <InfoRow label="性别" value={currentMember.gender === 'male' ? '男' : currentMember.gender === 'female' ? '女' : '-'} />
            <InfoRow label="生日" value={currentMember.birthday || '-'} />
            <div className="flex items-center gap-2"><span className="text-gray-500 w-16">状态</span><StatusBadge status={currentMember.status} /></div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors ${activeTab === tab.key ? 'text-accent border-b-2 border-accent font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'packages' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowPurchase(true)} className="btn-primary text-sm">购买套餐</button>
            </div>
            {memberPackages.length === 0 ? <p className="text-gray-400 text-center py-8">暂无套餐</p> : (
              <div className="space-y-2">
                {memberPackages.map((mp) => (
                  <div key={mp.id} className="card !p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">套餐 #{mp.package_type_id}</span>
                      <span className="text-sm text-gray-500 ml-2">剩余 {mp.remaining_sessions}/{mp.total_sessions} 次</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">到期: {mp.expiry_date.slice(0, 10)}</span>
                      <StatusBadge status={mp.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bodyTests' && (
          <div>{bodyTests.length === 0 ? <p className="text-gray-400 text-center py-8">暂无体测记录</p> : (
            <table className="w-full text-sm"><thead><tr className="table-header"><th className="px-3 py-2">日期</th><th className="px-3 py-2">身高</th><th className="px-3 py-2">体重</th><th className="px-3 py-2">体脂率</th><th className="px-3 py-2">肌肉量</th></tr></thead>
            <tbody className="divide-y">{bodyTests.map((bt) => (<tr key={bt.id} className="hover:bg-gray-50"><td className="px-3 py-2">{bt.test_date?.slice(0,10)}</td><td className="px-3 py-2">{bt.height || '-'}</td><td className="px-3 py-2">{bt.weight || '-'}</td><td className="px-3 py-2">{bt.body_fat ? `${bt.body_fat}%` : '-'}</td><td className="px-3 py-2">{bt.muscle_mass || '-'}</td></tr>))}</tbody></table>
          )}</div>
        )}

        {activeTab === 'freezes' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowFreeze(true)} className="btn-primary text-sm">申请冻结</button>
            </div>
            {freezes.length === 0 ? <p className="text-gray-400 text-center py-8">暂无冻结记录</p> : (
              <table className="w-full text-sm"><thead><tr className="table-header"><th className="px-3 py-2">开始</th><th className="px-3 py-2">结束</th><th className="px-3 py-2">天数</th><th className="px-3 py-2">状态</th></tr></thead>
              <tbody className="divide-y">{freezes.map((f) => (<tr key={f.id} className="hover:bg-gray-50"><td className="px-3 py-2">{f.start_date?.slice(0,10)}</td><td className="px-3 py-2">{f.end_date?.slice(0,10)}</td><td className="px-3 py-2">{f.extra_days}</td><td className="px-3 py-2"><StatusBadge status={f.status} /></td></tr>))}</tbody></table>
            )}
          </div>
        )}

        {activeTab === 'appointments' && <p className="text-gray-400 text-center py-8">请前往预约管理查看</p>}
        {activeTab === 'auditLog' && <p className="text-gray-400 text-center py-8">请前往审计日志查看</p>}
      </div>

      {showPurchase && (
        <Modal title="购买套餐" onClose={() => setShowPurchase(false)}>
          <div className="space-y-3">
            <select value={selectedPkg} onChange={(e) => setSelectedPkg(Number(e.target.value))} className="input-field">
              <option value={0}>选择套餐</option>
              {packageTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name} - ¥{pt.price}</option>)}
            </select>
            <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="input-field" placeholder="实付金额" />
            <button onClick={handlePurchase} className="btn-primary w-full">确认购买</button>
          </div>
        </Modal>
      )}

      {showFreeze && (
        <Modal title="申请冻结" onClose={() => setShowFreeze(false)}>
          <div className="space-y-3">
            <select value={freezeForm.member_package_id} onChange={(e) => setFreezeForm({ ...freezeForm, member_package_id: Number(e.target.value) })} className="input-field">
              <option value={0}>选择会员套餐</option>
              {memberPackages.filter((mp) => mp.status === 'active').map((mp) => <option key={mp.id} value={mp.id}>套餐 #{mp.id}</option>)}
            </select>
            <input type="date" value={freezeForm.start_date} onChange={(e) => setFreezeForm({ ...freezeForm, start_date: e.target.value })} className="input-field" />
            <input type="date" value={freezeForm.end_date} onChange={(e) => setFreezeForm({ ...freezeForm, end_date: e.target.value })} className="input-field" />
            <textarea value={freezeForm.reason} onChange={(e) => setFreezeForm({ ...freezeForm, reason: e.target.value })} className="input-field" rows={2} placeholder="冻结原因" />
            <button onClick={handleFreeze} className="btn-primary w-full">提交申请</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center gap-2"><span className="text-gray-500 w-16">{label}</span><span className="text-gray-800">{value}</span></div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
