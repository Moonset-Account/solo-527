import React, { useState } from 'react';
import { X, Clock, MapPin, Users, AlertTriangle, FileText, Camera, MessageSquare, ChevronDown, ChevronUp, CloudRain } from 'lucide-react';
import { Hazard } from '@/types';
import { StatusBadge, LevelBadge } from './Badges';
import { formatDateTime, getFloorLabel, formatCurrency } from '@/utils';
import dayjs from 'dayjs';

interface HazardDetailPanelProps {
  hazard: Hazard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HazardDetailPanel: React.FC<HazardDetailPanelProps> = ({ hazard, isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'rectification']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  if (!isOpen || !hazard) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">隐患详情</h2>
            <p className="text-sm text-gray-500 mt-0.5">{hazard.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <StatusBadge status={hazard.status} />
            <LevelBadge level={hazard.level} />
            {hazard.isOverdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                已逾期
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900">{hazard.title}</h3>
            <p className="mt-2 text-gray-600">{hazard.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">巡检点</p>
                <p className="text-sm font-medium text-gray-900">{hazard.inspectionPoint.name}</p>
                <p className="text-xs text-gray-500">{getFloorLabel(hazard.inspectionPoint.floor)} · {hazard.inspectionPoint.area}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">责任班组</p>
                <p className="text-sm font-medium text-gray-900">{hazard.team.name}</p>
                <p className="text-xs text-gray-500">{hazard.team.leader}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">发现时间</p>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(hazard.discoveredAt)}</p>
                <p className="text-xs text-gray-500">发现人: {hazard.discoverer}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">整改截止</p>
                <p className={`text-sm font-medium ${hazard.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDateTime(hazard.deadline)}
                </p>
                <p className="text-xs text-gray-500">
                  {hazard.closedAt ? `关闭时间: ${formatDateTime(hazard.closedAt)}` : 
                   hazard.isOverdue ? `已逾期 ${dayjs().diff(dayjs(hazard.deadline), 'day')} 天` : 
                   `剩余 ${dayjs(hazard.deadline).diff(dayjs(), 'day')} 天`}
                </p>
              </div>
            </div>
          </div>

          {hazard.fineAmount && (
            <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div>
                <p className="text-sm text-orange-700 font-medium">罚款金额</p>
                <p className="text-2xl font-bold text-orange-600 font-mono mt-1">{formatCurrency(hazard.fineAmount)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hazard.fineStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
                hazard.fineStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {hazard.fineStatus === 'confirmed' ? '已确认' :
                 hazard.fineStatus === 'rejected' ? '已驳回' : '待确认'}
              </span>
            </div>
          )}

          <Section title="发现照片" icon={<Camera className="h-4 w-4" />} expanded={expandedSections.includes('photos')} onToggle={() => toggleSection('photos')}>
            <div className="grid grid-cols-3 gap-3">
              {hazard.discoveryPhotos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {hazard.discoveryPhotos.length === 0 && (
                <p className="col-span-3 text-sm text-gray-400 text-center py-8">暂无照片</p>
              )}
            </div>
          </Section>

          <Section title="整改记录" icon={<FileText className="h-4 w-4" />} expanded={expandedSections.includes('rectification')} onToggle={() => toggleSection('rectification')}>
            <div className="space-y-4">
              {hazard.rectificationRecords.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">暂无整改记录</p>
              ) : (
                hazard.rectificationRecords.map((record, idx) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">第 {idx + 1} 次整改</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        record.reviewResult === 'pass' ? 'bg-green-100 text-green-700' :
                        record.reviewResult === 'reject' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.reviewResult === 'pass' ? '复查通过' :
                         record.reviewResult === 'reject' ? '复查驳回' : '待复查'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{record.description}</p>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {record.photos.map((photo) => (
                        <div key={photo.id} className="aspect-square rounded overflow-hidden bg-gray-100">
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {record.reviewReason && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-xs text-red-500 font-medium mb-1">驳回原因</p>
                        <p className="text-sm text-red-700">{record.reviewReason}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      提交于 {formatDateTime(record.submittedAt)}
                      {record.reviewedAt && ` · 复查于 ${formatDateTime(record.reviewedAt)}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Section>

          {hazard.rejectReasons.length > 0 && (
            <Section title="历史驳回原因" icon={<MessageSquare className="h-4 w-4" />} expanded={expandedSections.includes('rejects')} onToggle={() => toggleSection('rejects')}>
              <div className="space-y-2">
                {hazard.rejectReasons.map((reason, idx) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm text-red-700">{reason}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {hazard.appealRecords.length > 0 && (
            <Section title="申诉记录" icon={<CloudRain className="h-4 w-4" />} expanded={expandedSections.includes('appeals')} onToggle={() => toggleSection('appeals')}>
              <div className="space-y-4">
                {hazard.appealRecords.map((appeal) => (
                  <div key={appeal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        appeal.status === 'approved' ? 'bg-green-100 text-green-700' :
                        appeal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appeal.status === 'approved' ? '申诉通过' :
                         appeal.status === 'rejected' ? '申诉驳回' : '待处理'}
                      </span>
                      <span className="text-xs text-gray-400">{formatDateTime(appeal.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{appeal.reason}</p>
                    {appeal.weatherEvidence && appeal.weatherEvidence.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">天气佐证</p>
                        <div className="flex gap-2 flex-wrap">
                          {appeal.weatherEvidence.slice(0, 5).map((w) => (
                            <span key={w.date} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {w.date}: {w.weather}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {appeal.stopWorkEvidence && appeal.stopWorkEvidence.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">停工记录</p>
                        {appeal.stopWorkEvidence.map((s) => (
                          <div key={s.id} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded inline-block">
                            {s.startDate} ~ {s.endDate}: {s.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, expanded, onToggle, children }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-700">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  );
};
