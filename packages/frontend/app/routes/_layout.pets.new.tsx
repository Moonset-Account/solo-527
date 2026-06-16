import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@remix-run/react';
import { api } from '~/utils/api';

export default function PetNew() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = !!params.id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    petNo: '',
    name: '',
    species: 'dog',
    breed: '',
    gender: 'unknown',
    birthday: '',
    weight: '',
    color: '',
    chipNo: '',
    sterilized: false,
    healthStatus: 'healthy',
    temperament: '',
    dietaryNotes: '',
    medicalNotes: '',
    trainerId: '',
    status: 'pending',
    vaccineStatus: {
      rabies: false,
      distemper: false,
      parvovirus: false,
      catPlague: false,
    },
  });

  useEffect(() => {
    loadTrainers();
    if (isEdit) {
      loadPet();
    }
  }, [params.id]);

  const loadTrainers = async () => {
    try {
      const result: any = await api.get('/users/trainers');
      setTrainers(result.data || []);
    } catch (error) {
      console.error('Load trainers error:', error);
    }
  };

  const loadPet = async () => {
    setLoading(true);
    try {
      const result: any = await api.get(`/pets/${params.id}`);
      const pet = result.data;
      setFormData({
        petNo: pet.petNo || '',
        name: pet.name || '',
        species: pet.species || 'dog',
        breed: pet.breed || '',
        gender: pet.gender || 'unknown',
        birthday: pet.birthday ? pet.birthday.substring(0, 10) : '',
        weight: pet.weight || '',
        color: pet.color || '',
        chipNo: pet.chipNo || '',
        sterilized: pet.sterilized || false,
        healthStatus: pet.healthStatus || 'healthy',
        temperament: pet.temperament || '',
        dietaryNotes: pet.dietaryNotes || '',
        medicalNotes: pet.medicalNotes || '',
        trainerId: pet.trainerId?._id || pet.trainerId || '',
        status: pet.status || 'pending',
        vaccineStatus: {
          rabies: pet.vaccineStatus?.rabies || false,
          distemper: pet.vaccineStatus?.distemper || false,
          parvovirus: pet.vaccineStatus?.parvovirus || false,
          catPlague: pet.vaccineStatus?.catPlague || false,
        },
      });
    } catch (error) {
      console.error('Load pet error:', error);
      alert('加载失败');
      navigate('/pets');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('vaccineStatus')) {
      setFormData((prev) => ({
        ...prev,
        vaccineStatus: {
          ...prev.vaccineStatus,
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
        weight: formData.weight ? parseFloat(formData.weight as string) : undefined,
      };
      
      if (isEdit) {
        await api.put(`/pets/${params.id}`, data);
        alert('更新成功');
      } else {
        await api.post('/pets', data);
        alert('创建成功');
      }
      navigate('/pets');
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
    <div>
      <div className="card">
        <div className="card-header">
        <span className="card-title">{isEdit ? '编辑宠物档案' : '新增宠物档案'}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>返回</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">宠物编号</label>
              <input
                type="text"
                className="form-control"
                value={formData.petNo}
                onChange={(e) => handleChange('petNo', e.target.value)}
                placeholder="系统自动生成"
              />
            </div>
            <div className="form-group">
              <label className="form-label">宠物名称<span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="请输入宠物名称"
                required
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">物种<span className="required">*</span></label>
              <select className="form-control" value={formData.species} onChange={(e) => handleChange('species', e.target.value)}>
                <option value="dog">狗</option>
                <option value="cat">猫</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">品种</label>
              <input
                type="text"
                className="form-control"
                value={formData.breed}
                onChange={(e) => handleChange('breed', e.target.value)}
                placeholder="请输入品种"
              />
            </div>
            <div className="form-group">
              <label className="form-label">性别</label>
              <select className="form-control" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="unknown">未知</option>
                <option value="male">公</option>
                <option value="female">母</option>
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">出生日期</label>
              <input
                type="date"
                className="form-control"
                value={formData.birthday}
                onChange={(e) => handleChange('birthday', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">体重(kg)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="请输入体重"
              />
            </div>
            <div className="form-group">
              <label className="form-label">毛色</label>
              <input
                type="text"
                className="form-control"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="请输入毛色"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">芯片号</label>
              <input
                type="text"
                className="form-control"
                value={formData.chipNo}
                onChange={(e) => handleChange('chipNo', e.target.value)}
                placeholder="请输入芯片号"
              />
            </div>
            <div className="form-group">
              <label className="form-label">训练师</label>
              <select className="form-control" value={formData.trainerId} onChange={(e) => handleChange('trainerId', e.target.value)}>
                <option value="">请选择</option>
                {trainers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">健康状态</label>
              <select className="form-control" value={formData.healthStatus} onChange={(e) => handleChange('healthStatus', e.target.value)}>
                <option value="healthy">健康</option>
                <option value="sick">生病</option>
                <option value="recovering">康复中</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">状态</label>
              <select className="form-control" value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="pending">待寄养</option>
                <option value="fostering">寄养中</option>
                <option value="adopted">已领养</option>
                <option value="returned">已退回</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">疫苗接种情况</label>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.vaccineStatus.rabies}
                  onChange={(e) => handleChange('vaccineStatus.rabies', e.target.checked)}
                />
                狂犬疫苗
              </label>
              {formData.species === 'dog' && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.vaccineStatus.distemper}
                      onChange={(e) => handleChange('vaccineStatus.distemper', e.target.checked)}
                    />
                    犬瘟热
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.vaccineStatus.parvovirus}
                      onChange={(e) => handleChange('vaccineStatus.parvovirus', e.target.checked)}
                    />
                    细小病毒
                  </label>
                </>
              )}
              {formData.species === 'cat' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.vaccineStatus.catPlague}
                    onChange={(e) => handleChange('vaccineStatus.catPlague', e.target.checked)}
                  />
                  猫瘟
                </label>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.sterilized}
                  onChange={(e) => handleChange('sterilized', e.target.checked)}
                />
                已绝育
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">性格特点</label>
            <textarea
              className="form-control"
              value={formData.temperament}
              onChange={(e) => handleChange('temperament', e.target.value)}
              placeholder="请描述性格特点"
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">饮食注意</label>
              <textarea
                className="form-control"
                value={formData.dietaryNotes}
                onChange={(e) => handleChange('dietaryNotes', e.target.value)}
                placeholder="饮食相关注意事项"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-label">医疗记录</label>
              <textarea
                className="form-control"
                value={formData.medicalNotes}
                onChange={(e) => handleChange('medicalNotes', e.target.value)}
                placeholder="病史、用药等医疗相关记录"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
