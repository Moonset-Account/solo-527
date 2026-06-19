import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, CheckCircle } from 'lucide-react';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import StatusTag from '@/components/ui/StatusTag';
import Loading from '@/components/ui/Loading';
import { applicationApi } from '@/api';
import { useAppStore } from '@/store';
import { RequisitionApplication, ApplicationStatus } from '@/types';
import { formatDateTime } from '@/utils';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'SCHEDULED', label: '已排期' },
  { value: 'COMPLETED', label: '已完成' },
];

export default function ApplicationList() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const [loading, setLoading] = React.useState(false);
  const [applications, setApplications] = React.useState<RequisitionApplication[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [status, setStatus] = React.useState<string>('');
  const [keyword, setKeyword] = React.useState('');

  const fetchApplications = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await applicationApi.getList({ page, size: pageSize, status });
      let list = result.content;
      if (keyword) {
        const kw = keyword.toLowerCase();
        list = list.filter(
          (a) =>
            a.id.toLowerCase().includes(kw) ||
            a.reagentName.toLowerCase().includes(kw) ||
            a.applicantName.toLowerCase().includes(kw)
        );
      }
      setApplications(list);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, keyword]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const columns = [
    {
      key: 'id',
      title: '申请编号',
      dataIndex: 'id' as const,
      width: 120,
    },
    {
      key: 'reagentName',
      title: '试剂名称',
      dataIndex: 'reagentName' as const,
    },
    {
      key: 'quantity',
      title: '数量',
      dataIndex: 'quantity' as const,
      width: 80,
      align: 'center' as const,
      render: (record: RequisitionApplication) => `${record.quantity} ${record.reagentName ? '瓶' : ''}`,
    },
    {
      key: 'applicantName',
      title: '申请人',
      dataIndex: 'applicantName' as const,
      width: 100,
    },
    {
      key: 'createdAt',
      title: '申请时间',
      dataIndex: 'createdAt' as const,
      width: 180,
      render: (record: RequisitionApplication) => formatDateTime(record.createdAt),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      width: 100,
      render: (record: RequisitionApplication) => <StatusTag status={record.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      align: 'center' as const,
      render: (record: RequisitionApplication) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/application/${record.id}`)}
          >
            <Eye className="w-4 h-4" />
            详情
          </Button>
          {user?.role === 'ADMIN' && record.status === 'PENDING' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/application/${record.id}`)}
            >
              <CheckCircle className="w-4 h-4" />
              审核
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading && applications.length === 0) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">领用申请</h1>
        <p className="mt-1 text-sm text-neutral-500">管理试剂领用申请</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <Select
            options={statusOptions}
            value={status}
            onChange={(v) => setStatus(String(v))}
            className="w-40"
          />
          <Input
            placeholder="搜索申请编号、试剂名称、申请人"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            prefix={<Search className="w-4 h-4 text-neutral-400" />}
            className="w-80"
          />
          <Button type="submit">搜索</Button>
        </form>
        <div className="flex-1" />
        <Button onClick={() => navigate('/application/new')}>
          <Plus className="w-4 h-4" />
          新建申请
        </Button>
      </div>

      <Table
        columns={columns}
        data={applications}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: handlePageChange,
        }}
      />
    </div>
  );
}
