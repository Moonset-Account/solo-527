import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, History, Wrench, Calendar, User } from 'lucide-react';
import { useAppStore } from '@/store';
import { configApi } from '@/api';
import { MaintenanceConfig } from '@/types';
import { formatDate, getExpireStatus, confirmDialog } from '@/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatusTag from '@/components/ui/StatusTag';

const cycleOptions = [
  { value: 7, label: '每周' },
  { value: 15, label: '每两周' },
  { value: 30, label: '每月' },
  { value: 60, label: '每两月' },
  { value: 90, label: '每季度' },
  { value: 180, label: '每半年' },
  { value: 365, label: '每年' },
];

export default function ConfigMaintenance() {
  const user = useAppStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MaintenanceConfig[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceConfig | null>(null);
  const [formData, setFormData] = useState<Partial<MaintenanceConfig>>({});
  const [selectedHistory, setSelectedHistory] = useState<MaintenanceConfig | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await configApi.getMaintenanceConfigs();
      setData(res);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setModalOpen(true);
  };

  const handleEdit = (record: MaintenanceConfig) => {
    setEditingItem(record);
    setFormData({
      deviceName: record.deviceName,
      problemTemplate: record.problemTemplate,
      solutionTemplate: record.solutionTemplate,
      maintenanceCycleDays: record.maintenanceCycleDays,
      lastMaintenanceDate: record.lastMaintenanceDate,
      nextMaintenanceDate: record.nextMaintenanceDate,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog('确定要删除该维保计划吗？');
    if (!confirmed) return;
    try {
      await configApi.updateMaintenanceConfig(id, { id });
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleViewHistory = (record: MaintenanceConfig) => {
    setSelectedHistory(record);
    setHistoryModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await configApi.updateMaintenanceConfig(editingItem.id, formData);
      } else {
        await configApi.createMaintenanceConfig({
          ...formData,
          updatedBy: user?.id,
          updatedByName: user?.name,
        });
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const getMaintenanceStatus = (nextDate: string): string => {
    const status = getExpireStatus(nextDate);
    if (status === 'expired') return 'NON_COMPLIANT';
    if (status === 'warning') return 'WARNING';
    return 'COMPLIANT';
  };

  const columns = [
    { key: 'deviceName', title: '设备名称', dataIndex: 'deviceName' as const },
    {
      key: 'lastMaintenanceDate',
      title: '上次维保时间',
      render: (record: MaintenanceConfig) => formatDate(record.lastMaintenanceDate),
    },
    {
      key: 'nextMaintenanceDate',
      title: '下次维保时间',
      render: (record: MaintenanceConfig) => (
        <div className="flex items-center gap-2">
          <span>{formatDate(record.nextMaintenanceDate)}</span>
          <StatusTag status={getMaintenanceStatus(record.nextMaintenanceDate)} showText={false} />
        </div>
      ),
    },
    {
      key: 'maintenanceCycleDays',
      title: '维保周期',
      render: (record: MaintenanceConfig) => (
        <span>{record.maintenanceCycleDays}天</span>
      ),
    },
    {
      key: 'updatedByName',
      title: '负责人',
      render: (record: MaintenanceConfig) => (
        <div className="flex items-center gap-1">
          <User className="w-4 h-4 text-neutral-400" />
          <span>{record.updatedByName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (record: MaintenanceConfig) => (
        <StatusTag status={getMaintenanceStatus(record.nextMaintenanceDate)} />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (record: MaintenanceConfig) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleViewHistory(record)}>
            <History className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">维保问题配置</h1>
          <p className="text-sm text-neutral-500 mt-1">管理设备维保计划和问题处理模板</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          新增维保计划
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">正常设备</p>
              <p className="text-xl font-bold text-neutral-900">
                {data.filter((d) => getMaintenanceStatus(d.nextMaintenanceDate) === 'COMPLIANT').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">即将到期</p>
              <p className="text-xl font-bold text-neutral-900">
                {data.filter((d) => getMaintenanceStatus(d.nextMaintenanceDate) === 'WARNING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">已过期</p>
              <p className="text-xl font-bold text-neutral-900">
                {data.filter((d) => getMaintenanceStatus(d.nextMaintenanceDate) === 'NON_COMPLIANT').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        rowKey="id"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? '编辑维保计划' : '新增维保计划'}
        width={600}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingItem ? '保存' : '创建'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">设备名称</label>
            <Input
              value={formData.deviceName || ''}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              placeholder="请输入设备名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">维保周期</label>
              <Select
                options={cycleOptions}
                value={formData.maintenanceCycleDays || ''}
                onChange={(val) => setFormData({ ...formData, maintenanceCycleDays: val as number })}
                placeholder="选择维保周期"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">上次维保日期</label>
              <Input
                type="date"
                value={formData.lastMaintenanceDate || ''}
                onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">下次维保日期</label>
            <Input
              type="date"
              value={formData.nextMaintenanceDate || ''}
              onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">常见问题模板</label>
            <Input
              value={formData.problemTemplate || ''}
              onChange={(e) => setFormData({ ...formData, problemTemplate: e.target.value })}
              placeholder="如：压力异常、峰形异常、基线漂移"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">解决方案模板</label>
            <Input
              value={formData.solutionTemplate || ''}
              onChange={(e) => setFormData({ ...formData, solutionTemplate: e.target.value })}
              placeholder="如：检查色谱柱、清洗管路、更换流动相"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="维保记录历史"
        width={500}
      >
        {selectedHistory && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">设备名称</span>
              <span className="text-neutral-900 font-medium">{selectedHistory.deviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">维保周期</span>
              <span className="text-neutral-900">{selectedHistory.maintenanceCycleDays}天</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">上次维保</span>
              <span className="text-neutral-900">{formatDate(selectedHistory.lastMaintenanceDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">下次维保</span>
              <span className="text-neutral-900">{formatDate(selectedHistory.nextMaintenanceDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">更新人</span>
              <span className="text-neutral-900">{selectedHistory.updatedByName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">更新时间</span>
              <span className="text-neutral-900">{formatDate(selectedHistory.updatedAt, 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
            <div className="pt-3 border-t border-neutral-100">
              <p className="text-sm text-neutral-500 mb-1">常见问题</p>
              <p className="text-sm text-neutral-900">{selectedHistory.problemTemplate}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">解决方案</p>
              <p className="text-sm text-neutral-900">{selectedHistory.solutionTemplate}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
