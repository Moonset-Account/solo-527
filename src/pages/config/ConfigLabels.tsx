import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Palette, Tag, Info } from 'lucide-react';
import { configApi } from '@/api';
import { HazardLabel } from '@/types';
import { confirmDialog } from '@/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';

const colorOptions = [
  { value: '#EF4444', label: '红色' },
  { value: '#F97316', label: '橙色' },
  { value: '#EAB308', label: '黄色' },
  { value: '#22C55E', label: '绿色' },
  { value: '#3B82F6', label: '蓝色' },
  { value: '#8B5CF6', label: '紫色' },
  { value: '#EC4899', label: '粉色' },
  { value: '#6B7280', label: '灰色' },
];

const iconOptions = [
  { value: 'icon-explosive', label: '爆炸物' },
  { value: 'icon-flammable', label: '易燃物' },
  { value: 'icon-oxidizing', label: '氧化性' },
  { value: 'icon-corrosive', label: '腐蚀性' },
  { value: 'icon-toxic', label: '毒性' },
  { value: 'icon-irritant', label: '刺激性' },
  { value: 'icon-health-hazard', label: '健康危害' },
  { value: 'icon-environmental', label: '环境危害' },
];

export default function ConfigLabels() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HazardLabel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HazardLabel | null>(null);
  const [formData, setFormData] = useState<Partial<HazardLabel>>({});
  const [selectedColor, setSelectedColor] = useState('#EF4444');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await configApi.getHazardLabels();
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
    setSelectedColor('#EF4444');
    setModalOpen(true);
  };

  const handleEdit = (record: HazardLabel) => {
    setEditingItem(record);
    setFormData({
      code: record.code,
      name: record.name,
      description: record.description,
      iconClass: record.iconClass,
      precautionaryMeasures: record.precautionaryMeasures,
    });
    setSelectedColor('#EF4444');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog('确定要删除该标签吗？');
    if (!confirmed) return;
    try {
      await configApi.updateHazardLabel(id, { id });
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await configApi.updateHazardLabel(editingItem.id, formData);
      } else {
        await configApi.createHazardLabel(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">危化标签配置</h1>
          <p className="text-sm text-neutral-500 mt-1">管理危险化学品标签和警示信息</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          新增标签
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((label) => (
          <Card key={label.id} className="hover:shadow-md transition-shadow">
            <Card.Content>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{label.name}</h3>
                    <p className="text-xs text-neutral-500">{label.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(label)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(label.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Palette className="w-4 h-4 text-neutral-400" />
                  <span>颜色: </span>
                  <div
                    className="w-4 h-4 rounded-full border border-neutral-200"
                    style={{ backgroundColor: selectedColor }}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Info className="w-4 h-4 text-neutral-400" />
                  <span className="truncate">{label.description}</span>
                </div>
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500">
                    <span className="font-medium">防范措施: </span>
                    {label.precautionaryMeasures}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? '编辑标签' : '新增标签'}
        width={500}
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">标签编码</label>
              <Input
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如：GHS01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">标签名称</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入名称"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">标签颜色</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === color.value ? 'border-neutral-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">图标</label>
            <Select
              options={iconOptions}
              value={formData.iconClass || ''}
              onChange={(val) => setFormData({ ...formData, iconClass: val as string })}
              placeholder="选择图标"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">描述</label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入标签描述"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">防范措施</label>
            <Textarea
              value={formData.precautionaryMeasures || ''}
              onChange={(e) => setFormData({ ...formData, precautionaryMeasures: e.target.value })}
              placeholder="请输入防范措施"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
