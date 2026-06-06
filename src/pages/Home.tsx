import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { BarChart3, Download, Table2 } from 'lucide-react';
import { useETL } from '../hooks/useETL';
import { useFilterStore } from '../stores/filterStore';
import { FilterPanel } from '../components/Filters/FilterPanel';
import { KPICard } from '../components/Cards/KPICard';
import { LearningPathFunnel } from '../components/Charts/LearningPathFunnel';
import { CorrectRateChart } from '../components/Charts/CorrectRateChart';
import { CohortComparisonChart } from '../components/Charts/CohortComparisonChart';
import { DetailDrawer } from '../components/Modals/DetailDrawer';
import { ViewManager } from '../components/Common/ViewManager';
import { DataQualityAlert } from '../components/Common/DataQualityAlert';
import { EmptyState } from '../components/Common/EmptyState';
import { ActivityType, DropoutStudent } from '../data/types';
import { exportToExcel } from '../utils/export';

export default function Home() {
  const {
    kpis,
    funnel,
    totalStudents,
    correctRates,
    cohortMetrics,
    validation,
    activities,
    courses,
    chapters,
    students,
    getDropoutStudentsByType,
  } = useETL();
  
  const filters = useFilterStore();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | null>(null);
  const [dropoutStudents, setDropoutStudents] = useState<DropoutStudent[]>([]);
  
  const handleNodeClick = (activityType: ActivityType) => {
    const students = getDropoutStudentsByType(activityType);
    setSelectedActivityType(activityType);
    setDropoutStudents(students);
    setDrawerOpen(true);
  };
  
  const handleViewDetail = () => {
    setSelectedActivityType(null);
    setDropoutStudents([]);
    setDrawerOpen(true);
  };
  
  const handleQuickExport = () => {
    exportToExcel(
      activities,
      filters as any,
      students,
      courses,
      chapters,
      '学习路径数据'
    );
  };
  
  const hasData = activities.length > 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">学习路径分析仪表盘</h1>
                <p className="text-xs text-gray-500">课程运营数据可视化分析平台</p>
              </div>
            </div>
            
            <Space>
              <ViewManager />
              <Button
                icon={<Table2 size={16} />}
                onClick={handleViewDetail}
              >
                查看明细
              </Button>
              <Button
                type="primary"
                icon={<Download size={16} />}
                onClick={handleQuickExport}
              >
                导出数据
              </Button>
            </Space>
          </div>
        </div>
      </header>
      
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>
          
          <div className="flex-1 min-w-0">
            <DataQualityAlert validation={validation} />
            
            {!hasData ? (
              <EmptyState onReset={filters.resetFilters} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {kpis.map((kpi, index) => (
                    <KPICard
                      key={kpi.title}
                      data={kpi}
                      delay={index * 50}
                    />
                  ))}
                </div>
                
                <div className="mb-6">
                  <LearningPathFunnel
                    data={funnel}
                    totalStudents={totalStudents}
                    onNodeClick={handleNodeClick}
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <CorrectRateChart data={correctRates} />
                  <CohortComparisonChart data={cohortMetrics} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      
      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activityType={selectedActivityType}
        dropoutStudents={dropoutStudents}
      />
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
