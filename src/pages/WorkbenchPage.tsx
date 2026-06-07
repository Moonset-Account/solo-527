import TopNav from '@/components/TopNav';
import FilterPanel from '@/components/FilterPanel';
import PriceMap from '@/components/PriceMap';
import ChartPanel from '@/components/ChartPanel';
import StatusBar from '@/components/StatusBar';
import DetailDrawer from '@/components/DetailDrawer';

export default function WorkbenchPage() {
  return (
    <div className="h-screen w-screen flex flex-col bg-workbench-bg overflow-hidden">
      <TopNav />
      
      <div className="flex-1 flex min-h-0">
        <div className="w-64 flex-shrink-0">
          <FilterPanel />
        </div>
        
        <div className="flex-1 min-w-0 relative">
          <PriceMap />
        </div>
        
        <div className="w-80 flex-shrink-0">
          <ChartPanel />
        </div>
      </div>
      
      <StatusBar />
      <DetailDrawer />
    </div>
  );
}
