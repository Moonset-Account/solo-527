import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, History, Search } from 'lucide-react';
import { useAppStore } from '@/store';
import { reagentApi, configApi } from '@/api';
import { Reagent, HazardLabel } from '@/types';
import { formatDate, getExpireStatus, confirmDialog } from '@/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import StatusTag from '@/components/ui/StatusTag';

const tabOptions = [
  { value: 'list', label: '试剂批次管理' },
  { value: 'add', label: '新增试剂' },
];

export default function ConfigReagents() {
  const user = useAppStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Reagent[]>([]);
  const [labels, setLabels] = useState<HazardLabel[]>([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Reagent | null>(null);
  const [formData, setFormData] = useState<Partial<Reagent>>({});
  const [selectedHistory, setSelectedHistory] = useState<Reagent | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, labelRes] = await Promise.all([
        reagentApi.getList({ page, size: 10, keyword }),
        configApi.getHazardLabels(),
      ]);
      setData(res.content);
      setTotal(res.total);
      setLabels(labelRes);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, keyword]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'add') {
      setEditingItem(null);
      setFormData({});
      setModalOpen(true);
    }
  };

  const handleEdit = (record: Reagent) => {
    setEditingItem(record);
    setFormData({
      name: record.name,
      casNo: record.casNo,
      batchNo: record.batchNo,
      specification: record.specification,
      totalQuantity: record.totalQuantity,
      unit: record.unit,
      expireDate: record.expireDate,
      storageLocation: record.storageLocation,
      hazardLabels: record.hazardLabels,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog('确定要删除该试剂吗？');
    if (!confirmed) return;
    try {
      await reagentApi.delete(id);
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleViewHistory = (record: Reagent) => {
    setSelectedHistory(record);
    setHistoryModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const hazardLabelIds = formData.hazardLabels?.map((l) => l.id) || [];
      const payload = {
        ...formData,
        hazardLabels: labels.filter((l) => hazardLabelIds.includes(l.id)),
        createdBy: user?.id,
      };
      if (editingItem) {
        await reagentApi.update(editingItem.id, payload);
      } else {
        await reagentApi.create(payload);
      }
      setModalOpen(false);
      setActiveTab('list');
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const columns = [
    { key: 'id', title: '试剂编号', dataIndex: 'id' as const },
    { key: 'name', title: '名称', dataIndex: 'name' as const },
    { key: 'casNo', title: 'CAS号', dataIndex: 'casNo' as const },
    { key: 'batchNo', title: '批次号', dataIndex: 'batchNo' as const },
    {
      key: 'stock',
      title: '库存',
      render: (record: Reagent) => (
        <span>{record.totalQuantity - record.usedQuantity}/{record.totalQuantity} {record.unit}</span>
      ),
    },
    {
      key: 'expireDate',
      title: '有效期',
      render: (record: Reagent) => (
        <div className="flex items-center gap-2">
          <span>{formatDate(record.expireDate)}</span>
          <StatusTag status={getExpireStatus(record.expireDate).toUpperCase()} showText={false} />
        </div>
      ),
    },
    {
      key: 'hazardLabels',
      title: '危化标签',
      render: (record: Reagent) => (
        <div className="flex flex-wrap gap-1">
          {record.hazardLabels?.map((label) => (
            <Badge key={label.id} variant="danger">{label.name}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (record: Reagent) => (
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">试剂批次配置</h1>
        <p className="text-sm text-neutral-500 mt-1">管理实验室试剂批次信息和危化标签</p>
      </div>

      <div className="flex items-center gap-4 mb-6 border-b border-neutral-200">
        {tabOptions.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="搜索试剂名称、CAS号、批次号"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          prefix={<Search className="w-4 h-4 text-neutral-400" />}
          className="w-80"
        />
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? '编辑试剂' : '新增试剂'}
        width={600}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingItem ? '保存' : '创建'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">试剂名称</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入试剂名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">CAS号</label>
              <Input
                value={formData.casNo || ''}
                onChange={(e) => setFormData({ ...formData, casNo: e.target.value })}
                placeholder="请输入CAS号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">批次号</label>
              <Input
                value={formData.batchNo || ''}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                placeholder="请输入批次号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">规格</label>
              <Input
                value={formData.specification || ''}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                placeholder="请输入规格"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">总数量</label>
              <Input
                type="number"
                value={formData.totalQuantity || ''}
                onChange={(e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) })}
                placeholder="请输入总数量"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">单位</label>
              <Input
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="如：瓶、g、ml"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">有效期</label>
              <Input
                type="date"
                value={formData.expireDate || ''}
                onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">存储位置</label>
              <Input
                value={formData.storageLocation || ''}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                placeholder="请输入存储位置"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">危化标签</label>
            <Select
              multiple
              options={labels.map((l) => ({ value: l.id, label: l.name }))}
              value={formData.hazardLabels?.map((l) => l.id) || []}
              onChange={(val) => {
                const ids = Array.isArray(val) ? val : [val];
                setFormData({ ...formData, hazardLabels: labels.filter((l) => ids.includes(l.id as any)) });
              }}
              placeholder="选择危化标签"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="操作历史"
        width={500}
      >
        {selectedHistory && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">创建时间</span>
              <span className="text-neutral-900">{formatDate(selectedHistory.createdAt, 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">创建人</span>
              <span className="text-neutral-900">{selectedHistory.createdBy}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">更新时间</span>
              <span className="text-neutral-900">{formatDate(selectedHistory.updatedAt, 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
