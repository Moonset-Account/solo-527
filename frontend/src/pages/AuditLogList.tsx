import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Form,
  DatePicker,
  message,
  Descriptions,
  Drawer,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { auditLogApi, userApi } from '../api';
import type { AuditLog, User } from '../types';
import { AuditActionType, UserRole } from '../types';
import {
  auditActionTypeText,
  userRoleText,
  formatDate,
} from '../utils';

const { RangePicker } = DatePicker;

export default function AuditLogList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [entityType, setEntityType] = useState<string | undefined>();
  const [actionType, setActionType] = useState<AuditActionType | undefined>();
  const [userId, setUserId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<any>();

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<AuditLog | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  const entityTypes = ['Alert', 'Asset', 'User', 'BatchTask', 'Vulnerability'];

  useEffect(() => {
    loadData();
    loadUsers();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await auditLogApi.getList({
        page,
        pageSize,
        userId,
        entityType,
        actionType,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      });
      if (res.success) {
        setData(res.data?.items || []);
        setTotal(res.data?.totalCount || 0);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await userApi.getList({ page: 1, pageSize: 100 });
      if (res.success) {
        setUsers(res.data?.items || []);
      }
    } catch {
      // ignore
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setEntityType(undefined);
    setActionType(undefined);
    setUserId(undefined);
    setDateRange(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleView = (record: AuditLog) => {
    setCurrentLog(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => formatDate(t),
    },
    {
      title: '操作人',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'userRole',
      key: 'userRole',
      width: 90,
      render: (r: UserRole) => userRoleText[r],
    },
    {
      title: '操作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 110,
      render: (t: AuditActionType) => (
        <Tag>{auditActionTypeText[t]}</Tag>
      ),
    },
    {
      title: '实体类型',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 100,
    },
    {
      title: '实体ID',
      dataIndex: 'entityId',
      key: 'entityId',
      width: 80,
    },
    {
      title: '说明',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: AuditLog) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Form layout="inline">
          <Form.Item label="操作人">
            <Select
              placeholder="全部"
              value={userId}
              onChange={setUserId}
              style={{ width: 130 }}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.userName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="实体类型">
            <Select
              placeholder="全部"
              value={entityType}
              onChange={setEntityType}
              style={{ width: 130 }}
              allowClear
            >
              {entityTypes.map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="操作类型">
            <Select
              placeholder="全部"
              value={actionType}
              onChange={setActionType}
              style={{ width: 130 }}
              allowClear
            >
              {Object.entries(auditActionTypeText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="操作时间">
            <RangePicker value={dateRange} onChange={setDateRange} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Drawer
        title="日志详情"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentLog && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="操作时间">{formatDate(currentLog.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="操作人">{currentLog.userName}</Descriptions.Item>
            <Descriptions.Item label="用户角色">{userRoleText[currentLog.userRole]}</Descriptions.Item>
            <Descriptions.Item label="操作类型">{auditActionTypeText[currentLog.actionType]}</Descriptions.Item>
            <Descriptions.Item label="实体类型">{currentLog.entityType}</Descriptions.Item>
            <Descriptions.Item label="实体ID">{currentLog.entityId || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作说明">{currentLog.remark || '-'}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentLog.ipAddress}</Descriptions.Item>
            {currentLog.oldValue && (
              <Descriptions.Item label="变更前">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, maxHeight: 200, overflow: 'auto' }}>
                  {currentLog.oldValue}
                </pre>
              </Descriptions.Item>
            )}
            {currentLog.newValue && (
              <Descriptions.Item label="变更后">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, maxHeight: 200, overflow: 'auto' }}>
                  {currentLog.newValue}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
