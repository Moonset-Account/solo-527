import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, FlaskConical, Package, Clock, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StatusTag from '@/components/ui/StatusTag';
import { complianceApi, reagentApi } from '@/api';
import { ComplianceDashboard as ComplianceDashboardType, ComplianceCheck, Reagent } from '@/types';
import { cn, formatDate, getExpireStatus, getStatusText } from '@/utils';

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<ComplianceDashboardType | null>(null);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [hazardousReagents, setHazardousReagents] = useState<Reagent[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, checksData, reagentsData] = await Promise.all([
        complianceApi.getDashboard(),
        complianceApi.getChecks({}),
        reagentApi.getList({ size: 100 }),
      ]);
      setDashboard(dashboardData);
      setChecks(checksData);
      const hazardous = reagentsData.content.filter((r) => r.hazardLabels.length > 0);
      setHazardousReagents(hazardous);
    } catch (error) {
      console.error('加载合规数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pieData = dashboard
    ? [
        { name: '合规', value: dashboard.overallComplianceRate, color: '#10b981' },
        { name: '警告', value: 15, color: '#f59e0b' },
        { name: '不合规', value: 100 - dashboard.overallComplianceRate - 15, color: '#ef4444' },
      ]
    : [];

  const expiringItems = checks.filter((c) => c.status !== 'COMPLIANT' && c.checkType === 'EXPIRATION');

  const statCards = [
    {
      title: '整体合规率',
      value: `${dashboard?.overallComplianceRate ?? 0}%`,
      icon: <ShieldAlert className="w-6 h-6 text-primary-500" />,
      bg: 'bg-primary-50',
    },
    {
      title: '即将过期',
      value: dashboard?.expiringSoon ?? 0,
      icon: <Clock className="w-6 h-6 text-warning-500" />,
      bg: 'bg-warning-50',
    },
    {
      title: '危化品数量',
      value: dashboard?.hazardousCount ?? 0,
      icon: <AlertTriangle className="w-6 h-6 text-danger-500" />,
      bg: 'bg-danger-50',
    },
    {
      title: '试剂总数',
      value: dashboard?.totalReagents ?? 0,
      icon: <Package className="w-6 h-6 text-neutral-500" />,
      bg: 'bg-neutral-50',
    },
  ];

  const hazardousColumns = [
    {
      key: 'name',
      title: '试剂名称',
      dataIndex: 'name' as keyof Reagent,
      render: (record: Reagent) => (
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-danger-500" />
          <span className="font-medium">{record.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      title: '类别',
      render: (record: Reagent) => (
        <div className="flex flex-wrap gap-1">
          {record.hazardLabels.slice(0, 2).map((label) => (
            <Badge key={label.id} variant="danger">
              {label.name}
            </Badge>
          ))}
          {record.hazardLabels.length > 2 && (
            <Badge variant="neutral">+{record.hazardLabels.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      title: '库存',
      render: (record: Reagent) => (
        <span>
          {record.totalQuantity - record.usedQuantity} / {record.totalQuantity} {record.unit}
        </span>
      ),
    },
    {
      key: 'expireDate',
      title: '有效期',
      render: (record: Reagent) => {
        const status = getExpireStatus(record.expireDate);
        return (
          <span
            className={cn(
              status === 'expired' && 'text-danger-600 font-medium',
              status === 'warning' && 'text-warning-600'
            )}
          >
            {formatDate(record.expireDate)}
          </span>
        );
      },
    },
    {
      key: 'storageLocation',
      title: '存储位置',
      render: (record: Reagent) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="w-3 h-3 text-neutral-400" />
          {record.storageLocation}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary-500" />
            安全合规看板
          </h1>
          <p className="text-neutral-500 mt-1">实时监控试剂安全合规状态</p>
        </div>
        <Button onClick={loadData}>刷新数据</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className={cn('p-4', stat.bg)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">{stat.title}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <Card.Header>
            <Card.Title>合规状态分布</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center text-neutral-500">
                  加载中...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card className="col-span-2">
          <Card.Header>
            <Card.Title>过期预警</Card.Title>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <div className="text-center py-8 text-neutral-500">加载中...</div>
            ) : expiringItems.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">暂无过期预警</div>
            ) : (
              <div className="space-y-3">
                {expiringItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 rounded-lg border flex items-center justify-between',
                      item.status === 'NON_COMPLIANT'
                        ? 'bg-danger-50 border-danger-200'
                        : 'bg-warning-50 border-warning-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={cn(
                          'w-5 h-5',
                          item.status === 'NON_COMPLIANT' ? 'text-danger-500' : 'text-warning-500'
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            'font-medium',
                            item.status === 'NON_COMPLIANT' ? 'text-danger-700' : 'text-warning-700'
                          )}
                        >
                          {item.reagentName}
                        </p>
                        <p
                          className={cn(
                            'text-sm',
                            item.status === 'NON_COMPLIANT' ? 'text-danger-600' : 'text-warning-600'
                          )}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <StatusTag status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>危化品列表</Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <Table
            columns={hazardousColumns}
            data={hazardousReagents}
            loading={loading}
            rowKey={(record: Reagent) => record.id}
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>合规检查记录</Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <Table
            columns={[
              {
                key: 'reagentName',
                title: '试剂名称',
                dataIndex: 'reagentName' as keyof ComplianceCheck,
              },
              {
                key: 'checkType',
                title: '检查类型',
                render: (record: ComplianceCheck) => (
                  <Badge variant="neutral">{getStatusText(record.checkType)}</Badge>
                ),
              },
              {
                key: 'status',
                title: '状态',
                render: (record: ComplianceCheck) => <StatusTag status={record.status} />,
              },
              {
                key: 'description',
                title: '说明',
                dataIndex: 'description' as keyof ComplianceCheck,
              },
              {
                key: 'checkedAt',
                title: '检查时间',
                render: (record: ComplianceCheck) => formatDate(record.checkedAt, 'yyyy-MM-dd HH:mm'),
              },
            ]}
            data={checks}
            loading={loading}
            rowKey={(record: ComplianceCheck) => record.id}
          />
        </Card.Content>
      </Card>
    </div>
  );
}
