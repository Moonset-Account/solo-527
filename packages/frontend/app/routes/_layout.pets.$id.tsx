import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from '@remix-run/react';
import { api } from '~/utils/api';
import { formatDate, formatDateTime, petStatusLabels, petStatusColors, speciesLabels, healthStatusLabels, genderLabels, recordTypeLabels, actionLabels } from '~/utils/formatters';

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [flowRecords, setFlowRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [petRes, trainingRes, flowRes] = await Promise.all([
        api.get(`/pets/${id}`),
        api.get('/training', { params: { petId: id, pageSize: 10 } }),
        api.get('/flow-records', { params: { relatedId: id, recordType: 'pet_profile', pageSize: 20 } }),
      ]);
      
      setPet((petRes as any).data);
      setTrainingRecords((trainingRes as any).data || []);
      setFlowRecords((flowRes as any).data || []);
    } catch (error) {
      console.error('Load pet detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card card-body">加载中...</div>;
  }

  if (!pet) {
    return <div className="card card-body">宠物不存在</div>;
  }

  const calculateAge = () => {
    if (!pet.birthday) return '-';
    const birth = new Date(pet.birthday);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years === 0) {
      return `${Math.max(months, 1)}个月`;
    }
    return `${years}岁${months > 0 ? months + '个月' : ''}`;
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← 返回</button>
            <div>
              <h3 style={{ margin: 0 }}>{pet.name}</h3>
              <div className="text-sm text-muted">{pet.petNo}</div>
            </div>
            <span className={`badge badge-${petStatusColors[pet.status]} badge-lg`}>
              {petStatusLabels[pet.status]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/pets/${id}/edit`)}>编辑</button>
          </div>
        </div>

        <div className="tabs" style={{ padding: '0 1.25rem', margin: 0 }}>
          <div
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            基本信息
          </div>
          <div
            className={`tab ${activeTab === 'training' ? 'active' : ''}`}
            onClick={() => setActiveTab('training')}
          >
            训练记录 ({trainingRecords.length})
          </div>
          <div
            className={`tab ${activeTab === 'flow' ? 'active' : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            流转记录 ({flowRecords.length})
          </div>
        </div>

        <div className="card-body">
          {activeTab === 'info' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }} className="detail-grid">
                <div>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>基础信息</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <InfoRow label="物种" value={speciesLabels[pet.species]} />
                    <InfoRow label="品种" value={pet.breed} />
                    <InfoRow label="性别" value={genderLabels[pet.gender]} />
                    <InfoRow label="年龄" value={calculateAge()} />
                    <InfoRow label="体重" value={pet.weight ? `${pet.weight} kg` : '-'} />
                    <InfoRow label="毛色" value={pet.color} />
                    <InfoRow label="芯片号" value={pet.chipNo} />
                    <InfoRow label="是否绝育" value={pet.sterilized ? '是' : '否'} />
                  </div>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>其他信息</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <InfoRow label="健康状态" value={
                      <span className={`badge badge-${pet.healthStatus === 'healthy' ? 'success' : pet.healthStatus === 'sick' ? 'danger' : 'warning'}`}>
                        {healthStatusLabels[pet.healthStatus]}
                      </span>
                    } />
                    <InfoRow label="训练师" value={pet.trainerId?.name || '-'} />
                    <InfoRow label="创建人" value={pet.createdBy?.name || '-'} />
                    <InfoRow label="创建时间" value={formatDateTime(pet.createdAt)} />
                    <InfoRow label="更新时间" value={formatDateTime(pet.updatedAt)} />
                    <InfoRow label="寄养开始时间" value={formatDate(pet.fosterStartTime)} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }} className="detail-grid">
                <div>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>疫苗接种</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {pet.vaccineStatus?.rabies && <span className="badge badge-success">狂犬疫苗 ✓</span>}
                    {pet.species === 'dog' && pet.vaccineStatus?.distemper && <span className="badge badge-success">犬瘟热 ✓</span>}
                    {pet.species === 'dog' && pet.vaccineStatus?.parvovirus && <span className="badge badge-success">细小病毒 ✓</span>}
                    {pet.species === 'cat' && pet.vaccineStatus?.catPlague && <span className="badge badge-success">猫瘟 ✓</span>}
                    {Object.values(pet.vaccineStatus || {}).every(v => !v) && (
                      <span className="text-muted text-sm">暂无接种记录</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>性格特点</h4>
                  <p className="text-sm">{pet.temperament || '暂无描述'}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>饮食注意</h4>
                <p className="text-sm">{pet.dietaryNotes || '暂无'}</p>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>医疗记录</h4>
                <p className="text-sm">{pet.medicalNotes || '暂无'}</p>
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="text-sm text-muted">共 {trainingRecords.length} 条记录</span>
                <button className="btn btn-primary btn-sm">+ 添加训练记录</button>
              </div>
              {trainingRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🎓</div>
                  <div className="empty-state-text">暂无训练记录</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {trainingRecords.map((record) => (
                    <div key={record._id} className="card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div className="font-medium">{record.trainingType ? ({
                            obedience: '服从训练',
                            socialization: '社会化',
                            behavior_correction: '行为纠正',
                            agility: '敏捷训练',
                            basic_commands: '基础指令',
                            other: '其他'
                          })[record.trainingType] : record.trainingType}</div>
                          <div className="text-sm text-muted">{formatDate(record.trainingDate)} · 训练师：{record.trainerName}</div>
                        </div>
                        <span className={`badge badge-${record.performance === 'excellent' ? 'success' : record.performance === 'good' ? 'primary' : record.performance === 'poor' ? 'danger' : 'warning'}`}>
                          {record.performance === 'excellent' ? '优秀' : record.performance === 'good' ? '良好' : record.performance === 'poor' ? '较差' : '一般'}
                        </span>
                      </div>
                      <div className="text-sm">{record.trainingContent}</div>
                      {(record.beforeBehavior || record.afterBehavior) && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                          <div className="text-sm text-muted mb-2">训练前后变化</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="training-diff">
                            <div>
                              <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>训练前</div>
                              <div className="text-sm">{record.beforeBehavior || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>训练后</div>
                              <div className="text-sm">{record.afterBehavior || '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'flow' && (
            <div>
              {flowRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📜</div>
                  <div className="empty-state-text">暂无流转记录</div>
                </div>
              ) : (
                <div className="timeline">
                  {flowRecords.map((record) => (
                    <div key={record._id} className="timeline-item">
                      <div className="timeline-header">
                        <span className="timeline-title">{record.actionLabel}</span>
                        <span className="timeline-time">{formatDateTime(record.createdAt)}</span>
                      </div>
                      <div className="timeline-content">
                        <div style={{ marginBottom: '0.5rem' }}>{record.description}</div>
                        {record.changedFields && record.changedFields.length > 0 && (
                          <div className="text-sm">
                            <span className="text-muted">变更字段：</span>
                            {record.changedFields.join('、')}
                          </div>
                        )}
                        <div className="text-sm text-muted mt-2">
                          操作人：{record.operatorName}
                          ({record.operatorRole === 'admin' ? '管理员' : record.operatorRole === 'trainer' ? '训练师' : '审核员'})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
          .training-diff {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
      <span className="text-muted">{label}</span>
      <span>{value === null || value === undefined || value === '' ? '-' : value}</span>
    </div>
  );
}
