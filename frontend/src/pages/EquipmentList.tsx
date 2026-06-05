import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Equipment {
  id: string;
  name: string;
  type: 'tractor' | 'transplanter' | 'drone' | 'other';
  model: string;
  serial_number: string;
  status: 'available' | 'in_use' | 'maintenance' | 'broken';
  total_hours: number;
  purchase_date: string;
}

const typeLabels: Record<string, string> = {
  tractor: '拖拉机',
  transplanter: '插秧机',
  drone: '无人机',
  other: '其他设备'
};

const statusLabels: Record<string, string> = {
  available: '可用',
  in_use: '使用中',
  maintenance: '维修中',
  broken: '故障'
};

const typeIcons: Record<string, string> = {
  tractor: '🚜',
  transplanter: '🌾',
  drone: '🛸',
  other: '🔧'
};

export default function EquipmentList() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    keyword: ''
  });
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  const fetchEquipment = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.keyword) params.append('keyword', filters.keyword);

      const response = await axios.get(`/api/equipment?${params.toString()}`);
      setEquipment(response.data);
    } catch (error) {
      console.error('获取设备列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">设备档案</h1>
          <p className="text-gray-500 mt-1">管理和查看合作社所有农机设备</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary">
            + 添加设备
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="label">设备类型</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field min-w-[150px]"
            >
              <option value="">全部类型</option>
              <option value="tractor">拖拉机</option>
              <option value="transplanter">插秧机</option>
              <option value="drone">无人机</option>
              <option value="other">其他设备</option>
            </select>
          </div>
          <div>
            <label className="label">设备状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field min-w-[150px]"
            >
              <option value="">全部状态</option>
              <option value="available">可用</option>
              <option value="in_use">使用中</option>
              <option value="maintenance">维修中</option>
              <option value="broken">故障</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label">搜索</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="搜索设备名称或型号..."
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <Link
              key={item.id}
              to={`/equipment/${item.id}`}
              className="border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-primary-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl">
                  {typeIcons[item.type]}
                </div>
                <span className={`status-badge status-${item.status}`}>
                  {statusLabels[item.status]}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">型号：{item.model || '-'}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">{typeLabels[item.type]}</span>
                <span className="text-sm font-medium text-gray-600">
                  累计 {item.total_hours} 小时
                </span>
              </div>
            </Link>
          ))}
        </div>

        {equipment.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🚜</div>
            <p>暂无设备数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
