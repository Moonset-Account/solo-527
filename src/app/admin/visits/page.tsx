'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Calendar, Eye, Edit2, Trash2, Image as ImageIcon, Upload, Share2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { getAllVisits, getAllPhotos, deleteVisit, updateVisitStatus } from '@/lib/services/data';
import { formatDate, getVisitStatusLabel, getVisitStatusColor } from '@/lib/utils/format';
import type { Visit, Photo } from '@/lib/types';

export default function VisitsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    const [visitsData, photosData] = await Promise.all([
      getAllVisits(),
      getAllPhotos(),
    ]);
    setVisits(visitsData);
    setPhotos(photosData);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    init();
  }, []);

  const handleDelete = async (visit: Visit) => {
    if (!confirm(`确定要删除 "${visit.location}" 的探访记录吗？此操作不可恢复。`)) {
      return;
    }
    await deleteVisit(visit.id);
    router.refresh();
    loadData();
  };

  const handleSubmitForReview = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'submitted');
    loadData();
  };

  const handlePublish = async (visit: Visit) => {
    const approvedCount = photos.filter(
      (p) => p.visit_id === visit.id && p.review_status === 'approved',
    ).length;
    if (approvedCount === 0) {
      if (!confirm('该探访还没有已审核通过的照片，确定要直接发布吗？')) {
        return;
      }
    }
    await updateVisitStatus(visit.id, 'published');
    loadData();
  };

  const handleUnpublish = async (visit: Visit) => {
    if (!confirm('确定取消发布吗？公开页将不再显示此探访。')) {
      return;
    }
    await updateVisitStatus(visit.id, 'draft');
    loadData();
  };

  const filteredVisits = statusFilter === 'all'
    ? visits
    : visits.filter(v => v.status === statusFilter);

  const getPhotoCount = (visitId: string) => {
    return photos.filter(p => p.visit_id === visitId).length;
  };

  const getApprovedPhotoCount = (visitId: string) => {
    return photos.filter(p => p.visit_id === visitId && p.review_status === 'approved').length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">探访记录</h1>
          <p className="text-gray-500">管理项目探访记录和照片</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            className="w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'draft', label: '草稿' },
              { value: 'submitted', label: '已提交' },
              { value: 'published', label: '已发布' },
            ]}
          />
          <Link href="/admin/visits/new">
            <Button icon={Plus}>
              新建探访记录
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">总探访次数</p>
            <p className="text-3xl font-bold text-gray-900 font-serif">{visits.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">已发布</p>
            <p className="text-3xl font-bold text-green-600 font-serif">{visits.filter(v => v.status === 'published').length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">待审核</p>
            <p className="text-3xl font-bold text-yellow-600 font-serif">{visits.filter(v => v.status === 'submitted').length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">探访日期</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地点</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">照片数量</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.map((visit) => {
                const photoCount = getPhotoCount(visit.id);
                const approvedCount = getApprovedPhotoCount(visit.id);
                return (
                  <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(visit.visit_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{visit.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {approvedCount}/{photoCount} 已通过
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getVisitStatusColor(visit.status)}>
                        {getVisitStatusLabel(visit.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/visits/${visit.id}`}>
                          <Button variant="ghost" size="sm" icon={Edit2}>
                            编辑
                          </Button>
                        </Link>
                        {visit.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Upload}
                            onClick={() => handleSubmitForReview(visit)}
                            className="text-yellow-600"
                          >
                            提交
                          </Button>
                        )}
                        {visit.status === 'submitted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Share2}
                            onClick={() => handlePublish(visit)}
                            className="text-green-600"
                          >
                            发布
                          </Button>
                        )}
                        {visit.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnpublish(visit)}
                            className="text-gray-500"
                          >
                            取消发布
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(visit)}
                          className="text-red-500"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
