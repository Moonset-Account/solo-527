import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@remix-run/react';
import { api } from '~/utils/api';

const fieldLabelMap: Record<string, string> = {
  applicantName: '申请人姓名',
  applicantPhone: '联系电话',
  applicantIdCard: '身份证号',
  applicantEmail: '电子邮箱',
  applicantAddress: '居住地址',
  housingType: '住房类型',
  hasPetExperience: '养宠经验',
  workSchedule: '工作时间',
  monthlyBudget: '月度预算',
  adoptionReason: '领养原因',
  'emergencyContact.name': '紧急联系人姓名',
  'emergencyContact.phone': '紧急联系人电话',
  veterinaryInfo: '兽医信息',
};

export default function AdoptionEdit() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = !!params.id;
  const [loading, setLoading] = useState(false);
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
    if (isEdit) {
      loadApplication();
    }
  }, [params.id]);

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

  const loadApplication = async () => {
    setLoading(true);
    try {
      const result: any = await api.get(`/adoptions/${params.id}`);
      const app = result.data;
      setFormData({
        petId: app.petId?._id || app.petId || '',
        applicantName: app.applicantName || '',
        applicantPhone: app.applicantPhone || '',
        applicantIdCard: app.applicantIdCard || '',
        applicantEmail: app.applicantEmail || '',
        applicantAddress: app.applicantAddress || '',
        housingType: app.housingType || '',
        hasPetExperience: app.hasPetExperience || false,
        currentPets: app.currentPets || '',
        familyMembers: app.familyMembers || '',
        hasChildren: app.hasChildren || false,
        workSchedule: app.workSchedule || '',
        monthlyBudget: app.monthlyBudget || '',
        adoptionReason: app.adoptionReason || '',
        emergencyContact: {
          name: app.emergencyContact?.name || '',
          phone: app.emergencyContact?.phone || '',
          relationship: app.emergencyContact?.relationship || '',
        },
        veterinaryInfo: app.veterinaryInfo || '',
        trainerId: app.trainerId?._id || app.trainerId || '',
      });
    } catch (error) {
      console.error('Load application error:', error);
      alert('加载失败');
      navigate('/adoptions');
    } finally {
      setLoading(false);
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
      
      if (isEdit) {
        await api.put(`/adoptions/${params.id}`, data);
        alert('更新成功');
        navigate(`/adoptions/${params.id}`);
      } else {
        const result: any = await api.post('/adoptions', data);
        alert('创建成功');
        navigate('/adoptions');
      }
    } catch (error: any) {
      alert(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card card-body">加载中...</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{isEdit ? '编辑领养申请' : '新建领养申请'}</span>
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
              <input
                type="text"
                className="form-control"
                value={formData.applicantName}
                onChange={(e) => handleChange('applicantName', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">联系电话<span className="required">*</span></label>
              <input
                type="tel"
                className="form-control"
                value={formData.applicantPhone}
                onChange={(e) => handleChange('applicantPhone', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">身份证号</label>
              <input
                type="text"
                className="form-control"
                value={formData.applicantIdCard}
                onChange={(e) => handleChange('applicantIdCard', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">电子邮箱</label>
              <input
                type="email"
                className="form-control"
                value={formData.applicantEmail}
                onChange={(e) => handleChange('applicantEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">居住地址</label>
            <input
              type="text"
              className="form-control"
              value={formData.applicantAddress}
              onChange={(e) => handleChange('applicantAddress', e.target.value)}
            />
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
              <input
                type="number"
                className="form-control"
                value={formData.familyMembers}
                onChange={(e) => handleChange('familyMembers', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">月度预算(元)</label>
              <input
                type="number"
                className="form-control"
                value={formData.monthlyBudget}
                onChange={(e) => handleChange('monthlyBudget', e.target.value)}
              />
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">工作时间</label>
              <input
                type="text"
                className="form-control"
                value={formData.workSchedule}
                onChange={(e) => handleChange('workSchedule', e.target.value)}
                placeholder="如：朝九晚五"
              />
            </div>
            <div className="form-group">
              <label className="form-label">现有宠物</label>
              <input
                type="text"
                className="form-control"
                value={formData.currentPets}
                onChange={(e) => handleChange('currentPets', e.target.value)}
                placeholder="请描述现有宠物情况"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">领养原因</label>
            <textarea
              className="form-control"
              value={formData.adoptionReason}
              onChange={(e) => handleChange('adoptionReason', e.target.value)}
              rows={3}
            />
          </div>

          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: '1.5rem' }}>紧急联系人</h4>
          
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                type="text"
                className="form-control"
                value={formData.emergencyContact.name}
                onChange={(e) => handleChange('emergencyContact.name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">电话</label>
              <input
                type="tel"
                className="form-control"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleChange('emergencyContact.phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">关系</label>
              <input
                type="text"
                className="form-control"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleChange('emergencyContact.relationship', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">兽医信息</label>
            <input
              type="text"
              className="form-control"
              value={formData.veterinaryInfo}
              onChange={(e) => handleChange('veterinaryInfo', e.target.value)}
              placeholder="常用宠物医院/兽医"
            />
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
