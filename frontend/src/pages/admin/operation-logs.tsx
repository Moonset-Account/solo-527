import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Select,
  DatePicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import {
  OperationLog,
  OperationType,
  OperationTypeLabels,
  User,
  PageResult,
} from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface QueryParams {
  page?: number;
  pageSize?: number;
  module?: string;
  operationType?: OperationType;
  startDate?: string;
  endDate?: string;
  operatorId?: string;
}

const OperationLogsPage = () => {
  const [data, setData] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [queryParams, setQueryParams] = useState<QueryParams>({});
  const [operators, setOperators] = useState<User[]>([]);
  const modules = [
    '用户管理',
    '服务管理',
    '预约管理',
    '宠物管理',
    '报表中心',
    '系统',
    '认证',
  ];

  const fetchData = async (params?: QueryParams) => {
    setLoading(true);
    try {
      const mergedParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...queryParams,
        ...params,
      };
      const result: PageResult<OperationLog> = await request.get('/operation-logs', {
        params: mergedParams,
      });
      setData(result.data || []);
      setPagination({
        current: result.page || 1,
        pageSize: result.pageSize || 10,
        total: result.total || 0,
      });
    } catch (error) {
      console.error('获取操作日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const result: PageResult<User> = await request.get('/users');
      setOperators(result.data || []);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOperators();
  }, []);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ page: 1, ...queryParams });
  };

  const handleReset = () => {
    setQueryParams({});
    setPagination({ current: 1, pageSize: 10, total: 0 });
    fetchData({ page: 1 });
  };

  const columns: ColumnsType<OperationLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      width: 180,
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'name'],
      key: 'operatorName',
      render: (_, record) => record.operator?.name || record.operator?.username || '-',
      width: 120,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 100,
      render: (type: OperationType) => {
        const colorMap: Record<OperationType, string> = {
          [OperationType.CREATE]: 'green',
          [OperationType.UPDATE]: 'blue',
          [OperationType.DELETE]: 'red',
          [OperationType.LOGIN]: 'cyan',
          [OperationType.LOGOUT]: 'default',
          [OperationType.APPROVE]: 'purple',
          [OperationType.REJECT]: 'orange',
          [OperationType.CANCEL]: 'gold',
          [OperationType.COMPLETE]: 'geekblue',
          [OperationType.EXPORT]: 'magenta',
          [OperationType.OTHER]: 'default',
        };
        return (
          <Tag color={colorMap[type]}>
            {OperationTypeLabels[type] || type}
          </Tag>
        );
      },
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId',
      render: (value) => value || '-',
      width: 200,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (value) => value || '-',
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (value) => value || '-',
      width: 130,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select
          placeholder="选择模块"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, module: value }))}
        >
          {modules.map((module) => (
            <Option key={module} value={module}>
              {module}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="操作类型"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, operationType: value }))}
        >
          {Object.values(OperationType).map((type) => (
            <Option key={type} value={type}>
              {OperationTypeLabels[type]}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="操作人"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 150 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, operatorId: value }))}
        >
          {operators.map((user) => (
            <Option key={user.id} value={user.id} label={user.name}>
              {user.name}
            </Option>
          ))}
        </Select>
        <RangePicker
          showTime
          placeholder={['开始日期', '结束日期']}
          onChange={(dates: [Dayjs | null, Dayjs | null] | null) =>
            setQueryParams((prev) => ({
              ...prev,
              startDate: dates?.[0]?.toISOString(),
              endDate: dates?.[1]?.toISOString(),
            }))
          }
        />
        <Button type="primary" onClick={handleSearch}>
          查询
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
            fetchData({ page, pageSize });
          },
        }}
      />
    </div>
  );
};

export default OperationLogsPage;
