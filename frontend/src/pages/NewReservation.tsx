import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Field {
  id: string;
  name: string;
  area: number;
}

export default function NewReservation() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');
  const [formData, setFormData] = useState({
    equipment_id: '',
    field_id: '',
    crop: '',
    start_time: '',
    end_time: '',
    price_type: 'member',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [equipRes, fieldsRes] = await Promise.all([
        axios.get('/api/equipment?status=available'),
        axios.get('/api/fields')
      ]);
      setEquipment(equipRes.data);
      setFields(fieldsRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const checkConflict = async () => {
    if (!formData.equipment_id || !formData.start_time || !formData.end_time) return;
    
    try {
      const response = await axios.post('/api/reservations/check-conflict', {
        equipment_id: formData.equipment_id,
        start_time: formData.start_time,
        end_time: formData.end_time
      });
      
      if (response.data.hasConflict) {
        setConflictWarning(`⚠️ 时间冲突：该时段已有预约，您的预约将进入候补队列`);
      } else {
        setConflictWarning('');
      }
    } catch (error) {
      console.error('检查冲突失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/reservations', {
        ...formData,
        member_id: user?.id
      });

      if (response.data.status === 'waitlisted') {
        alert('该时段已有预约，您的预约已进入候补队列');
      } else {
        alert('预约提交成功！');
      }
      navigate('/reservations');
    } catch (error: any) {
      console.error('提交预约失败:', error);
      alert(error.response?.data?.message || '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (['equipment_id', 'start_time', 'end_time'].includes(name)) {
      setTimeout(checkConflict, 300);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/reservations" className="text-gray-500 hover:text-gray-700">
          ← 返回列表
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">新建预约</h1>
        <p className="text-gray-500 mt-1">填写以下信息提交农机作业预约申请</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">📋 基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">选择设备 *</label>
              <select
                name="equipment_id"
                value={formData.equipment_id}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="">请选择设备</option>
                {equipment.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.status === 'available' ? '可用' : '不可用'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">选择地块 *</label>
              <select
                name="field_id"
                value={formData.field_id}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="">请选择地块</option>
                {fields.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.area}亩)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="label">作物类型 *</label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="">请选择作物</option>
              <option value="小麦">小麦</option>
              <option value="水稻">水稻</option>
              <option value="玉米">玉米</option>
              <option value="大豆">大豆</option>
              <option value="花生">花生</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">⏰ 作业时间</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">开始时间 *</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                min={dayjs().format('YYYY-MM-DDTHH:mm')}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">结束时间 *</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                min={formData.start_time || dayjs().format('YYYY-MM-DDTHH:mm')}
                className="input-field"
                required
              />
            </div>
          </div>

          {conflictWarning && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
              {conflictWarning}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">💰 价格类型</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'member', label: '社员自用', desc: '70% 价格', recommend: true },
              { value: 'subsidy', label: '合作社补贴', desc: '50% 价格（需审批）' },
              { value: 'commercial', label: '跨村租赁', desc: '130% 价格' }
            ].map(option => (
              <label
                key={option.value}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.price_type === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="price_type"
                  value={option.value}
                  checked={formData.price_type === option.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-gray-500 mt-1">{option.desc}</p>
                {option.recommend && (
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                    推荐
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">📝 备注</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="填写特殊要求或备注信息..."
            className="input-field resize-none"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/reservations')}
            className="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? '提交中...' : '提交预约'}
          </button>
        </div>
      </form>
    </div>
  );
}
