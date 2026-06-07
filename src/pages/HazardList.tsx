import React, { useEffect, useState } from 'react';
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge, LevelBadge } from '@/components/Badges';
import { HazardDetailPanel } from '@/components/HazardDetailPanel';
import { useFilterStore, useUIStore } from '@/store';
import { hazardApi, masterDataApi, exportApi } from '@/services/api';
import type { Hazard, Team, HazardType, PaginatedResponse } from '@/types';
import { formatDateTime, getFloorLabel, exportToExcel } from '@/utils';

const HazardListPage: React.FC = () => {
  const { criteria } = useFilterStore();
  const { selectedHazardId, isDetailPanelOpen, setSelectedHazardId, setDetailPanelOpen } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedResponse<Hazard> | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardType[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [hazardsRes, teamsRes, typesRes, floorsRes] = await Promise.all([
        hazardApi.getList(page, pageSize, criteria),
        masterDataApi.getTeams(),
        masterDataApi.getHazardTypes(),
        masterDataApi.getFloors(),
      ]);
      setData(hazardsRes);
      setTeams(teamsRes);
      setHazardTypes(typesRes);
      setFloors(floorsRes);
    } catch (error) {
      console.error('Failed to load hazards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [criteria, page]);

  const selectedHazard = data?.items.find((h) => h.id === selectedHazardId) || null;

  const handleViewDetail = (hazard: Hazard) => {
    setSelectedHazardId(hazard.id);
    setDetailPanelOpen(true);
  };

  const handleExport = () => {
    if (data?.items) {
      const exportData = data.items.map((h) => ({
        隐患编号: h.code,
        标题: h.title,
        类型: h.type.name,
        等级: h.level,
        楼层: getFloorLabel(h.inspectionPoint.floor),
        巡检点: h.inspectionPoint.name,
        责任班组: h.team.name,
        状态: h.status,
        发现人: h.discoverer,
        发现时间: formatDateTime(h.discoveredAt),
        截止时间: formatDateTime(h.deadline),
        是否逾期: h.isOverdue ? '是' : '否',
        罚款金额: h.fineAmount || 0,
      }));
      exportToExcel(exportData, `隐患列表_${new Date().toISOString().slice(0, 10)}`);
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="space-y-6">
      <FilterBar
        teams={teams}
        hazardTypes={hazardTypes}
        floors={floors}
        onFilterChange={() => setPage(1)}
      />

      <div className="px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">隐患管理</h1>
            <p className="text-gray-500 mt-1">共 {data?.total || 0} 条隐患记录</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    隐患编号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    等级
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    位置
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    责任班组
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    截止时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <div className="animate-pulse">加载中...</div>
                    </td>
                  </tr>
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  data?.items.map((hazard) => (
                    <tr
                      key={hazard.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        hazard.isOverdue ? 'bg-red-50/50' : ''
                      }`}
                      onClick={() => handleViewDetail(hazard)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-blue-600">{hazard.code}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {hazard.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{hazard.type.name}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <LevelBadge level={hazard.level} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getFloorLabel(hazard.inspectionPoint.floor)}
                        </div>
                        <div className="text-xs text-gray-500">{hazard.inspectionPoint.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{hazard.team.name}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={hazard.status} />
                        {hazard.isOverdue && (
                          <span className="ml-2 text-xs text-red-600 font-medium">逾期</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className={`text-sm ${hazard.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {formatDateTime(hazard.deadline)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(hazard);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > pageSize && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} 条，共 {data.total} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <HazardDetailPanel
        hazard={selectedHazard}
        isOpen={isDetailPanelOpen}
        onClose={() => {
          setDetailPanelOpen(false);
          setSelectedHazardId(null);
        }}
      />
    </div>
  );
};

export default HazardListPage;
