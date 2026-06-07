import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import Sidebar from '../components/Sidebar';
import FilterBar from '../components/FilterBar';
import AnomalySummary from '../components/AnomalySummary';
import PerspectiveTabs from '../components/PerspectiveTabs';
import FunnelView from '../components/FunnelView';
import ChannelQualityView from '../components/ChannelQualityView';
import ConsultantLoadView from '../components/ConsultantLoadView';
import FollowUpTrendView from '../components/FollowUpTrendView';
import type { ViewPerspective } from '../../shared/types';

const perspectiveViewMap: Record<ViewPerspective, { primary: React.ReactNode; secondary?: React.ReactNode }> = {
  project: {
    primary: <FunnelView />,
    secondary: <ChannelQualityView />,
  },
  consultant: {
    primary: <ConsultantLoadView />,
    secondary: <FunnelView />,
  },
  channel: {
    primary: <ChannelQualityView />,
    secondary: <FunnelView />,
  },
  stage: {
    primary: <FunnelView />,
    secondary: <ConsultantLoadView />,
  },
  month: {
    primary: <FollowUpTrendView />,
    secondary: <FunnelView />,
  },
};

export default function Index() {
  const { perspective, filterParams, fetchAnomaliesData } = useDashboardStore();

  useEffect(() => {
    fetchAnomaliesData();
  }, [filterParams, fetchAnomaliesData]);

  const views = perspectiveViewMap[perspective];

  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <FilterBar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <AnomalySummary />

          <PerspectiveTabs />

          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>{views.primary}</div>
              <div>{views.secondary}</div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {perspective !== 'consultant' && perspective !== 'stage' && <ConsultantLoadView />}
              {perspective !== 'month' && perspective !== 'channel' && <FollowUpTrendView />}
              {perspective === 'channel' && <FollowUpTrendView />}
              {perspective === 'consultant' && <FollowUpTrendView />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
