'use client';

import { useState } from 'react';
import { Check, X, ZoomIn, User, Calendar, MapPin } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { mockPhotos, mockVisits } from '@/lib/mock/data';
import { formatDate, getReviewStatusLabel, getReviewStatusColor } from '@/lib/utils/format';
import type { Photo } from '@/lib/types';

export default function PhotosPage() {
  const [photos, setPhotos] = useState(mockPhotos);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const filteredPhotos = statusFilter === 'all'
    ? photos
    : photos.filter(p => p.review_status === statusFilter);

  const getVisitInfo = (visitId: string) => {
    return mockVisits.find(v => v.id === visitId);
  };

  const handleApprove = (photoId: string) => {
    setPhotos(photos.map(p => p.id === photoId ? { ...p, review_status: 'approved' as const } : p));
  };

  const handleReject = (photoId: string) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason) {
      setPhotos(photos.map(p => p.id === photoId ? {
        ...p,
        review_status: 'rejected' as const,
        review_notes: reason,
      } : p));
    }
  };

  const handleBatchApprove = () => {
    const pending = photos.filter(p => p.review_status === 'pending');
    if (pending.length > 0 && confirm(`确定通过 ${pending.length} 张照片审核？`)) {
      setPhotos(photos.map(p => p.review_status === 'pending' ? { ...p, review_status: 'approved' as const } : p));
    }
  };

  const openPreview = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsPreviewOpen(true);
  };

  const pendingCount = photos.filter(p => p.review_status === 'pending').length;
  const approvedCount = photos.filter(p => p.review_status === 'approved').length;
  const rejectedCount = photos.filter(p => p.review_status === 'rejected').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">照片审核</h1>
          <p className="text-gray-500">审核探访照片，确保内容适合公开发布</p>
        </div>
        {pendingCount > 0 && (
          <Button variant="secondary" onClick={handleBatchApprove}>
            批量通过 ({pendingCount})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">待审核</p>
            <p className="text-3xl font-bold text-yellow-600 font-serif">{pendingCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">已通过</p>
            <p className="text-3xl font-bold text-green-600 font-serif">{approvedCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">已拒绝</p>
            <p className="text-3xl font-bold text-red-600 font-serif">{rejectedCount}</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Select
          className="w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'pending', label: '待审核' },
            { value: 'approved', label: '已通过' },
            { value: 'rejected', label: '已拒绝' },
            { value: 'all', label: '全部' },
          ]}
        />
        <span className="text-sm text-gray-500">共 {filteredPhotos.length} 张照片</span>
      </div>

      {filteredPhotos.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">暂无照片</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => {
            const visit = getVisitInfo(photo.visit_id);
            return (
              <Card key={photo.id} hover>
                <div
                  className="relative aspect-video cursor-pointer group"
                  onClick={() => openPreview(photo)}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || '照片'}
                    className="w-full h-full object-cover rounded-t-2xl"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className={getReviewStatusColor(photo.review_status)}>
                      {getReviewStatusLabel(photo.review_status)}
                    </Badge>
                  </div>
                </div>
                <CardBody>
                  {photo.caption && (
                    <p className="text-gray-900 font-medium mb-2">{photo.caption}</p>
                  )}
                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    {visit && (
                      <>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {visit.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(visit.visit_date)}
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      上传于 {formatDate(photo.created_at)}
                    </div>
                  </div>

                  {photo.review_notes && (
                    <div className="p-3 bg-gray-50 rounded-xl mb-4 text-sm">
                      <p className="text-gray-500 mb-1">审核备注：</p>
                      <p className="text-gray-700">{photo.review_notes}</p>
                    </div>
                  )}

                  {photo.review_status === 'pending' && (
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        className="flex-1"
                        icon={Check}
                        onClick={() => handleApprove(photo.id)}
                      >
                        通过
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        icon={X}
                        onClick={() => handleReject(photo.id)}
                      >
                        拒绝
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={selectedPhoto?.caption || '照片预览'}
        size="lg"
      >
        {selectedPhoto && (
          <div>
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.caption || '照片'}
              className="w-full rounded-xl mb-4"
            />
            {selectedPhoto.caption && (
              <p className="text-gray-900 font-medium mb-2">{selectedPhoto.caption}</p>
            )}
            {selectedPhoto.description && (
              <p className="text-gray-600">{selectedPhoto.description}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
