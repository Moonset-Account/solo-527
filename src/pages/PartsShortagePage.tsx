import { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  ArrowRight,
  Calendar,
  FileText,
  User,
  MapPin,
  Wrench,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Timeline from '@/components/ui/Timeline';
import Modal from '@/components/ui/Modal';
import { partsShortages, servicePackages, workstations } from '@/data/mockData';
import { PartsShortage, PartsShortageStatus, PartsShortagePriority, PartStatus } from '@/types';
import { cn } from '@/lib/utils';

function getStatusBadgeType(status: string): 'danger' | 'warning' | 'success' | 'gray' {
  switch (status) {
    case PartsShortageStatus.Open:
      return 'danger';
    case PartsShortageStatus.InProgress:
      return 'warning';
    case PartsShortageStatus.Resolved:
      return 'success';
    case PartsShortageStatus.Closed:
      return 'gray';
    default:
      return 'gray';
  }
}

function getPriorityBadgeType(priority: string): 'danger' | 'warning' | 'info' | 'gray' {
  switch (priority) {
    case PartsShortagePriority.Urgent:
      return 'danger';
    case PartsShortagePriority.High:
      return 'danger';
    case PartsShortagePriority.Medium:
      return 'warning';
    case PartsShortagePriority.Low:
      return 'info';
    default:
      return 'gray';
  }
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'accent' | 'success' | 'danger';
  trend?: number;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-green-50 text-green-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={cn('p-3 rounded-xl', colorClasses[color])}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-4">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">+{trend}%</span>
          <span className="text-sm text-gray-400">较上周</span>
        </div>
      )}
    </div>
  );
}

interface ShortageRowProps {
  shortage: PartsShortage;
  isExpanded: boolean;
  onToggle: () => void;
}

function ShortageRow({ shortage, isExpanded, onToggle }: ShortageRowProps) {
  const affectedServices = shortage.nodes?.map((n) => n.partName).join(', ') || shortage.title;
  const affectedWorkstations = '1号工位, 3号工位';

  const processTimeline = useMemo(() => {
    const nodes: {
      title: string;
      description: string;
      time: string;
      status: 'success' | 'warning' | 'info' | 'primary' | 'default';
    }[] = [
      {
        title: '已上报',
        description: `上报人：${shortage.reporterName || '未知'}`,
        time: shortage.createdAt
          ? new Date(shortage.createdAt).toLocaleDateString('zh-CN')
          : '--',
        status: 'success',
      },
    ];

    const firstNode = shortage.nodes?.[0];
    if (firstNode) {
      if (firstNode.status === PartStatus.Ordered || firstNode.status === PartStatus.Arrived) {
        nodes.push({
          title: '已下单',
          description: `供应商：${firstNode.supplier || '待确认'}`,
          time: firstNode.createdAt
            ? new Date(firstNode.createdAt).toLocaleDateString('zh-CN')
            : '--',
          status: 'info',
        });
      }

      if (firstNode.status === PartStatus.Ordered) {
        nodes.push({
          title: '在途',
          description: '运输中',
          time: firstNode.expectedArrivalDate
            ? `预计 ${new Date(firstNode.expectedArrivalDate).toLocaleDateString('zh-CN')}`
            : '待确认',
          status: 'warning',
        });
      }

      if (firstNode.status === PartStatus.Arrived) {
        nodes.push({
          title: '到货',
          description: '已到货验收',
          time: firstNode.arrivedAt
            ? new Date(firstNode.arrivedAt).toLocaleDateString('zh-CN')
            : '--',
          status: 'success',
        });
        nodes.push({
          title: '上架',
          description: '已入库上架',
          time: firstNode.arrivedAt
            ? new Date(firstNode.arrivedAt).toLocaleDateString('zh-CN')
            : '--',
          status: 'success',
        });
      }
    }

    if (shortage.status === PartsShortageStatus.Open) {
      nodes.push({
        title: '待处理',
        description: '等待采购处理',
        time: '--',
        status: 'default',
      });
    }

    return nodes;
  }, [shortage]);

  return (
    <>
      <tr
        className={cn(
          'cursor-pointer transition-colors border-l-4',
          shortage.status === PartsShortageStatus.Open && 'border-l-red-500',
          shortage.status === PartsShortageStatus.InProgress && 'border-l-accent-500',
          shortage.status === PartsShortageStatus.Resolved && 'border-l-green-500',
          isExpanded ? 'bg-primary-50' : 'hover:bg-gray-50'
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{shortage.title}</p>
              <p className="text-xs text-gray-500">{shortage.shortageNo}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1">
            {shortage.nodes?.slice(0, 2).map((node, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                {node.partName}
              </span>
            ))}
            {shortage.nodes && shortage.nodes.length > 2 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                +{shortage.nodes.length - 2}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm text-gray-600">{affectedWorkstations}</span>
        </td>
        <td className="px-4 py-4">
          <StatusBadge
            status={getStatusBadgeType(shortage.status as string)}
            text={shortage.status as string}
            dot
          />
        </td>
        <td className="px-4 py-4">
          <StatusBadge
            status={getPriorityBadgeType(shortage.priority as string)}
            text={shortage.priority as string}
          />
        </td>
        <td className="px-4 py-4">
          <span className="text-sm text-gray-500">
            {shortage.createdAt
              ? new Date(shortage.createdAt).toLocaleDateString('zh-CN')
              : '--'}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  处理节点时间线
                </h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <Timeline items={processTimeline} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-accent-500" />
                    产能影响提示
                  </h4>
                  <div className="bg-accent-50 rounded-lg p-3 border border-accent-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-accent-800">
                          受影响技师产能下降
                        </p>
                        <p className="text-xs text-accent-600 mt-1">
                          预计影响 2 名技师，产能下降约 30%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-500" />
                    缺货详情
                  </h4>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">配件数量</span>
                      <span className="text-gray-700 font-medium">
                        {shortage.nodes?.reduce((sum, n) => sum + n.shortageQuantity, 0) || 0} 件
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">预计费用</span>
                      <span className="text-accent-600 font-medium">
                        ¥{shortage.nodes?.reduce((sum, n) => sum + (n.totalPrice || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">处理人</span>
                      <span className="text-gray-700">
                        {shortage.handlerName || '待分配'}
                      </span>
                    </div>
                  </div>
                </div>
                {shortage.status !== PartsShortageStatus.Resolved && (
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-1">
                      <ArrowRight className="w-4 h-4" />
                      更新节点
                    </button>
                    <button className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      标记解决
                    </button>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PartsShortagePage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedWorkstations, setSelectedWorkstations] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    partName: '',
    expectedDate: '',
    remarks: '',
  });

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    return {
      pending: partsShortages.filter((s) => s.status === PartsShortageStatus.Open).length,
      processing: partsShortages.filter((s) => s.status === PartsShortageStatus.InProgress).length,
      resolved: partsShortages.filter((s) => s.status === PartsShortageStatus.Resolved).length,
      weeklyNew: partsShortages.filter(
        (s) => s.createdAt && new Date(s.createdAt) >= weekStart
      ).length,
    };
  }, []);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleServiceToggle = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleWorkstationToggle = (id: string) => {
    setSelectedWorkstations((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    setIsModalOpen(false);
    setFormData({ partName: '', expectedDate: '', remarks: '' });
    setSelectedServices([]);
    setSelectedWorkstations([]);
  };

  return (
    <AdminLayout title="配件缺货处理" className="bg-gray-50">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="待处理"
            value={stats.pending}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="danger"
            trend={15}
          />
          <StatCard
            title="处理中"
            value={stats.processing}
            icon={<Clock className="w-6 h-6" />}
            color="accent"
          />
          <StatCard
            title="已解决"
            value={stats.resolved}
            icon={<CheckCircle className="w-6 h-6" />}
            color="success"
            trend={8}
          />
          <StatCard
            title="本周新增"
            value={stats.weeklyNew}
            icon={<TrendingUp className="w-6 h-6" />}
            color="primary"
          />
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                缺货列表
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                共 {partsShortages.length} 条缺货记录
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              登记缺货
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    配件名称
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    影响服务
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    影响工位
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    优先级
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    上报时间
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-12">
                    展开
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partsShortages.map((shortage) => (
                  <ShortageRow
                    key={shortage.id}
                    shortage={shortage}
                    isExpanded={expandedId === shortage.id}
                    onToggle={() => handleToggleExpand(shortage.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="登记缺货"
          size="lg"
          footer={
            <>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                提交登记
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配件名称
              </label>
              <input
                type="text"
                value={formData.partName}
                onChange={(e) =>
                  setFormData({ ...formData, partName: e.target.value })
                }
                placeholder="请输入配件名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                影响服务
                <span className="text-xs text-gray-400 font-normal ml-2">
                  （多选）
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {servicePackages.slice(0, 6).map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => handleServiceToggle(sp.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      selectedServices.includes(sp.id)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {sp.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                影响工位
                <span className="text-xs text-gray-400 font-normal">（多选）</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {workstations.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkstationToggle(ws.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
                      selectedWorkstations.includes(ws.id)
                        ? 'bg-accent-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <Wrench className="w-3 h-3" />
                    {ws.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                预计到货时间
              </label>
              <input
                type="date"
                value={formData.expectedDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                备注
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="请输入备注信息..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
