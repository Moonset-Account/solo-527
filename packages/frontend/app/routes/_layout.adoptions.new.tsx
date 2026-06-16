import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { api } from '~/utils/api';

export default function AdoptionNew() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    petId: '',
    applicantName: '',
    applicantPhone: '',
    applicantIdCard: '',
    applicantEmail: '',
    applicantAddress: '',
    housingType: '',
    hasPetExperience: false,
    currentPets: '',
    familyMembers: '',
    hasChildren: false,
    workSchedule: '',
    monthlyBudget: '',
    adoptionReason: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    veterinaryInfo: '',
    trainerId: '',
  });

  useEffect(() => {
    loadPets();
    loadTrainers();
  }, []);

  const loadPets = async () => {
    try {
      const result: any = await api.get('/pets', { params: { pageSize: 100 } });
      setPets(result.data || []);
    } catch (error) {
      console.error('Load pets error:', error);
    }
  };

  const loadTrainers = async () => {
    try {
      const result: any = await api.get('/users/trainers');
      setTrainers(result.data || []);
    } catch (error) {
      console.error('Load trainers error:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('emergencyContact.')) {
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field.split('.')[1]]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = {
        ...formData,
        familyMembers: formData.familyMembers ? parseInt(formData.familyMembers as string) : undefined,
        monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget as string) : undefined,
      };
      
      const result: any = await api.post('/adoptions', data);
      alert('创建成功');
      navigate('/adoptions');
    } catch (error: any) {
      alert(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">新建领养申请</span>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>返回</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">宠物<span className="required">*</span></label>
              <select className="form-control" value={formData.petId} onChange={(e) => handleChange('petId', e.target.value)} required>
                <option value="">请选择宠物</option>
                {pets.map((pet) => (
                  <option key={pet._id} value={pet._id}>{pet.name} ({pet.petNo})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">训练师</label>
              <select className="form-control" value={formData.trainerId} onChange={(e) => handleChange('trainerId', e.target.value)}>
                <option value="">请选择训练师</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>申请人信息</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">申请人姓名<span className="required">*</span></label>
              <input type="text" className="form-control" value={formData.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">联系电话<span className="required">*</span></label>
              <input type="tel" className="form-control" value={formData.applicantPhone} onChange={(e) => handleChange('applicantPhone', e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">身份证号</label>
              <input type="text" className="form-control" value={formData.applicantIdCard} onChange={(e) => handleChange('applicantIdCard', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">电子邮箱</label>
              <input type="email" className="form-control" value={formData.applicantEmail} onChange={(e) => handleChange('applicantEmail', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">居住地址</label>
            <input type="text" className="form-control" value={formData.applicantAddress} onChange={(e) => handleChange('applicantAddress', e.target.value)} />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">住房类型</label>
              <select className="form-control" value={formData.housingType} onChange={(e) => handleChange('housingType', e.target.value)}>
                <option value="">请选择</option>
                <option value="apartment">公寓</option>
                <option value="house">独栋</option>
                <option value="villa">别墅</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">家庭成员数</label>
              <input type="number" className="form-control" value={formData.familyMembers} onChange={(e) => handleChange('familyMembers', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">月度预算(元)</label>
              <input type="number" className="form-control" value={formData.monthlyBudget} onChange={(e) => handleChange('monthlyBudget', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">有无养宠经验</label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="hasPetExperience" checked={!formData.hasPetExperience} onChange={() => handleChange('hasPetExperience', false)} />
                  无
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="hasPetExperience" checked={formData.hasPetExperience} onChange={() => handleChange('hasPetExperience', true)} />
                  有
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">是否有孩子</label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="hasChildren" checked={!formData.hasChildren} onChange={() => handleChange('hasChildren', false)} />
                  无
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="hasChildren" checked={formData.hasChildren} onChange={() => handleChange('hasChildren', true)} />
                  有
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">领养原因</label>
            <textarea className="form-control" value={formData.adoptionReason} onChange={(e) => handleChange('adoptionReason', e.target.value)} rows={3} />
          </div>

          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: '1.5rem' }}>紧急联系人</h4>
          
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input type="text" className="form-control" value={formData.emergencyContact.name} onChange={(e) => handleChange('emergencyContact.name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">电话</label>
              <input type="tel" className="form-control" value={formData.emergencyContact.phone} onChange={(e) => handleChange('emergencyContact.phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">关系</label>
              <input type="text" className="form-control" value={formData.emergencyContact.relationship} onChange={(e) => handleChange('emergencyContact.relationship', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
