import { useEffect, useState } from 'react';
import { Search, MapPin, User, Clock, FileText, CheckCircle2, Circle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { sampleTrackingApi } from '@/api';
import { SampleTracking, TraceLog } from '@/types';
import { cn, formatDateTime, getStatusColor, getStatusText } from '@/utils';

export default function SampleTrackingPage() {
  const [samples, setSamples] = useState<SampleTracking[]>([]);
  const [selectedSample, setSelectedSample] = useState<SampleTracking | null>(null);
  const [filterApplicationId, setFilterApplicationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, any> = { page: 1, size: 20 };
        if (filterApplicationId.trim()) {
          params.applicationId = filterApplicationId.trim();
        }
        const result = await sampleTrackingApi.getList(params);
        setSamples(result.content);
        if (result.content.length > 0 && !selectedSample) {
          setSelectedSample(result.content[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchSamples();
  }, [filterApplicationId]);

  const handleSearch = () => {
    // Trigger re-fetch via useEffect dependency
  };

  const getNodeIcon = (status: string) => {
    const confirmedStatuses = ['COMPLETED', 'ARCHIVED', 'APPROVED', 'SCHEDULED'];
    if (confirmedStatuses.includes(status)) {
      return <CheckCircle2 className="w-5 h-5 text-success-500" />;
    }
    return <Circle className="w-5 h-5 text-neutral-400" />;
  };

  const isNodeConfirmed = (status: string) => {
    const confirmedStatuses = ['COMPLETED', 'ARCHIVED', 'APPROVED', 'SCHEDULED', 'PROCESSING', 'ANALYZING'];
    return confirmedStatuses.includes(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-danger-500">{error}</p>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">样本追踪看板</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <Card.Header>
              <Card.Title>样本列表</Card.Title>
              <Card.Description>选择样本查看流转详情</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="mb-4">
                <Input
                  placeholder="按申请ID筛选..."
                  value={filterApplicationId}
                  onChange={(e) => setFilterApplicationId(e.target.value)}
                  prefix={<Search className="w-4 h-4 text-neutral-400" />}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {samples.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500">
                    {filterApplicationId ? '未找到匹配的样本' : '暂无样本数据'}
                  </div>
                ) : (
                  samples.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => setSelectedSample(sample)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all hover:border-primary-300 hover:bg-primary-50',
                        selectedSample?.id === sample.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-900 truncate">
                          {sample.sampleNo}
                        </span>
                        <Badge
                          variant={
                            sample.status === 'COMPLETED'
                              ? 'success'
                              : sample.status === 'ARCHIVED'
                              ? 'neutral'
                              : sample.status === 'PENDING'
                              ? 'warning'
                              : 'primary'
                          }
                          className="text-[10px]"
                        >
                          {getStatusText(sample.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">{sample.experimentName}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        申请ID: {sample.applicationId}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedSample ? (
            <div className="space-y-4">
              <Card>
                <Card.Header>
                  <Card.Title>样本详情</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">样本编号</p>
                      <p className="text-sm font-medium text-neutral-900 mt-1">{selectedSample.sampleNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">试剂名称</p>
                      <p className="text-sm font-medium text-neutral-900 mt-1">{selectedSample.reagentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">实验名称</p>
                      <p className="text-sm font-medium text-neutral-900 mt-1 truncate">{selectedSample.experimentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">当前位置</p>
                      <p className="text-sm font-medium text-neutral-900 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedSample.currentLocation}
                      </p>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>流转时间线</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="relative pl-6">
                    <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-neutral-200"></div>
                    <div className="space-y-6">
                      {selectedSample.traceLog.map((log: TraceLog, index: number) => (
                        <div key={log.id} className="relative">
                          <div className={cn(
                            'absolute -left-6 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center',
                            isNodeConfirmed(log.status) ? 'border-success-500' : 'border-neutral-300'
                          )}>
                            {getNodeIcon(log.status)}
                          </div>
                          <div className={cn(
                            'p-4 rounded-lg border',
                            isNodeConfirmed(log.status)
                              ? 'bg-success-50 border-success-200'
                              : 'bg-neutral-50 border-neutral-200'
                          )}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    isNodeConfirmed(log.status) ? 'success' : 'neutral'
                                  }
                                  className="text-[10px]"
                                >
                                  {getStatusText(log.status)}
                                </Badge>
                                <span className="text-xs text-neutral-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {log.location}
                                </span>
                              </div>
                              <span className="text-xs text-neutral-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(log.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-neutral-700 mb-1">
                              <User className="w-4 h-4 text-neutral-400" />
                              <span>操作人: {log.operatorName}</span>
                            </div>
                            {log.remark && (
                              <div className="flex items-start gap-2 text-sm text-neutral-600 mt-2">
                                <FileText className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                                <span>{log.remark}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          ) : (
            <Card className="h-[400px] flex items-center justify-center">
              <div className="text-center text-neutral-500">
                <p>请从左侧选择一个样本查看详情</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
