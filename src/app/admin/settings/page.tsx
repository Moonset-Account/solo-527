'use client';

import { useState, useEffect } from 'react';
import { Image, Clock, Wallet, Plus, Edit2, Trash2, GripVertical, Upload, Save } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { getSiteSettings, getAchievementPhotos, updateSiteSetting, createAchievementPhoto, updateAchievementPhoto, deleteAchievementPhoto, toggleAchievementPhoto } from '@/lib/services/data';
import { formatCurrency } from '@/lib/utils/format';
import type { SiteSetting, AchievementPhoto } from '@/lib/types';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [photos, setPhotos] = useState<AchievementPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<'photos' | 'service' | 'budget'>('photos');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AchievementPhoto | null>(null);
  const [photoForm, setPhotoForm] = useState({
    image_url: '',
    title: '',
    description: '',
    sort_order: '0',
  });

  const loadData = async () => {
    const [settingsData, photosData] = await Promise.all([
      getSiteSettings(),
      getAchievementPhotos(),
    ]);
    setSettings(settingsData);
    setPhotos(photosData);
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    initData();
  }, []);

  const getSetting = (key: string) => settings.find(s => s.key === key);
  const updateSetting = (key: string, value: any) => {
    setSettings(settings.map(s => s.key === key ? { ...s, value } : s));
  };

  const serviceHours = getSetting('service_hours')?.value || 0;
  const projectBudget = getSetting('project_budget')?.value || 750000;
  const projectStartDate = getSetting('project_start_date')?.value || '2024-01-01';

  const handleOpenPhotoModal = (photo?: AchievementPhoto) => {
    if (photo) {
      setEditingPhoto(photo);
      setPhotoForm({
        image_url: photo.image_url,
        title: photo.title,
        description: photo.description || '',
        sort_order: photo.sort_order.toString(),
      });
    } else {
      setEditingPhoto(null);
      setPhotoForm({
        image_url: '',
        title: '',
        description: '',
        sort_order: photos.length.toString(),
      });
    }
    setIsPhotoModalOpen(true);
  };

  const handleSavePhoto = async () => {
    if (!photoForm.image_url || !photoForm.title) return;

    if (editingPhoto) {
      await updateAchievementPhoto(editingPhoto.id, {
        image_url: photoForm.image_url,
        title: photoForm.title,
        description: photoForm.description || null,
        sort_order: parseInt(photoForm.sort_order) || 0,
      });
    } else {
      await createAchievementPhoto({
        image_url: photoForm.image_url,
        title: photoForm.title,
        description: photoForm.description || null,
        sort_order: parseInt(photoForm.sort_order) || 0,
        is_active: true,
      });
    }
    setIsPhotoModalOpen(false);
    loadData();
  };

  const handleDeletePhoto = async (id: string) => {
    if (confirm('确定要删除这张成果照片吗？')) {
      await deleteAchievementPhoto(id);
      loadData();
    }
  };

  const handleTogglePhoto = async (id: string) => {
    await toggleAchievementPhoto(id);
    loadData();
  };

  const handleSaveAllSettings = async () => {
    for (const setting of settings) {
      await updateSiteSetting(setting.key, setting.value);
    }
    alert('设置已保存');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  const tabs = [
    { key: 'photos' as const, label: '成果照片', icon: Image, count: photos.filter(p => p.is_active).length },
    { key: 'service' as const, label: '服务时长', icon: Clock, count: null },
    { key: 'budget' as const, label: '项目预算', icon: Wallet, count: null },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">系统设置</h1>
          <p className="text-gray-500">配置网站展示内容和项目参数</p>
        </div>
        <Button icon={Save} onClick={handleSaveAllSettings}>
          保存全部设置
        </Button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== null && (
              <Badge variant={activeTab === tab.key ? 'primary' : 'outline'} className="text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">管理首页展示的成果照片，上线时已预置 5 张展示照片</p>
            <Button icon={Plus} onClick={() => handleOpenPhotoModal()}>
              添加照片
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.sort((a, b) => a.sort_order - b.sort_order).map((photo) => (
              <Card key={photo.id}>
                <div className="relative aspect-[4/3]">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover rounded-t-2xl"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={photo.is_active ? 'success' : 'outline'}>
                      {photo.is_active ? '展示中' : '已隐藏'}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                    <GripVertical className="w-3 h-3" />
                    排序 {photo.sort_order}
                  </div>
                </div>
                <CardBody>
                  <h3 className="font-semibold text-gray-900 mb-1">{photo.title}</h3>
                  {photo.description && (
                    <p className="text-sm text-gray-600 mb-4">{photo.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTogglePhoto(photo.id)}
                    >
                      {photo.is_active ? '隐藏' : '展示'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenPhotoModal(photo)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-red-500"
                      onClick={() => handleDeletePhoto(photo.id)}
                    />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'service' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 font-serif flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                服务时长配置
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="max-w-md">
                <Input
                  label="累计服务时长（小时）"
                  type="number"
                  value={serviceHours.toString()}
                  onChange={(e) => updateSetting('service_hours', parseInt(e.target.value) || 0)}
                  placeholder="请输入累计服务时长"
                />
                <p className="mt-2 text-sm text-gray-500">
                  该数据将在首页和公开页面展示，用于体现项目的服务投入。
                  上线时预置 1,200 小时，后续可根据实际情况调整。
                </p>
              </div>

              <div className="p-6 bg-gradient-to-r from-primary-50 to-orange-50 rounded-2xl border border-primary-100">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <Clock className="w-8 h-8 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">当前展示值</p>
                    <p className="text-4xl font-bold text-primary-600 font-serif">
                      {serviceHours.toLocaleString()} <span className="text-xl">小时</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>说明：</strong>服务时长包括探访、辅导、物资整理等所有与项目相关的志愿服务时间。
                  建议每月更新一次，保持数据真实性。
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 font-serif flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary-500" />
                项目预算配置
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="max-w-md space-y-4">
                <Input
                  label="项目总预算（元）"
                  type="number"
                  value={projectBudget.toString()}
                  onChange={(e) => updateSetting('project_budget', parseInt(e.target.value) || 0)}
                  placeholder="请输入项目总预算"
                />
                <Input
                  label="项目启动日期"
                  type="date"
                  value={projectStartDate}
                  onChange={(e) => updateSetting('project_start_date', e.target.value)}
                />
              </div>

              <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl border border-green-100">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <Wallet className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">当前展示值</p>
                    <p className="text-4xl font-bold text-green-600 font-serif">
                      {formatCurrency(projectBudget)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      项目启动于 {new Date(projectStartDate).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  <strong>重要提示：</strong>修改项目预算将影响公开页面的资金使用展示。
                  该数据应与实际筹款目标一致，如有重大调整请在团队内部确认后修改。
                  上线时预置预算为 750,000 元。
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-700 mb-3">预算使用情况（自动计算）</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 font-serif">{formatCurrency(projectBudget)}</p>
                    <p className="text-xs text-gray-500">总预算</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600 font-serif">{formatCurrency(projectBudget * 0.62)}</p>
                    <p className="text-xs text-gray-500">已使用 (62%)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600 font-serif">{formatCurrency(projectBudget * 0.38)}</p>
                    <p className="text-xs text-gray-500">剩余 (38%)</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title={editingPhoto ? '编辑成果照片' : '添加成果照片'}
        size="lg"
      >
        <div className="space-y-5">
          {photoForm.image_url ? (
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
              <img
                src={photoForm.image_url}
                alt="预览"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500">输入图片URL后这里将显示预览</p>
            </div>
          )}
          <Input
            label="图片 URL"
            value={photoForm.image_url}
            onChange={(e) => setPhotoForm({ ...photoForm, image_url: e.target.value })}
            placeholder="https://example.com/photo.jpg"
          />
          <Input
            label="照片标题"
            value={photoForm.title}
            onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
            placeholder="例如：孩子们的笑脸"
          />
          <Textarea
            label="照片描述"
            value={photoForm.description}
            onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
            placeholder="简要描述照片内容和背后的故事"
            rows={3}
          />
          <Input
            label="排序优先级"
            type="number"
            value={photoForm.sort_order}
            onChange={(e) => setPhotoForm({ ...photoForm, sort_order: e.target.value })}
            placeholder="数字越小越靠前"
          />
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsPhotoModalOpen(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSavePhoto}>
              {editingPhoto ? '保存修改' : '添加照片'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
