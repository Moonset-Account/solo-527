import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Select,
  DatePicker,
  Space,
  Button,
  Drawer,
  Descriptions,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { statisticsApi, usersApi } from '../../api';

const { Option } = Select;
const { RangePicker } = DatePicker;

const typeMap = {
  appointment_create: { text: '创建预约', color: 'blue' },
  appointment_cancel: { text: '取消预约', color: 'orange' },
  appointment_complete: { text: '完成预约', color: 'green' },
  waitlist_add: { text: '加入候补', color: 'purple' },
  waitlist_release: { text: '候补释放', color: 'cyan' },
  refund_create: { text: '申请退款', color: 'red' },
  refund_approve: { text: '批准退款', color: 'green' },
  refund_reject: { text: '拒绝退款', color: 'red' },
  schedule_update: { text: '排班变更', color: 'orange' },
  service_update: { text: '服务变更', color: 'blue' },
  counselor_update: { text: '咨询师变更', color: 'purple' },
  other: { text: '其他', color: 'default' },
};

const roleMap = {
  admin: { text: '管理员', color: 'red' },
  dispatcher: { text: '调度员', color: 'orange' },
  counselor: { text: '咨询师', color: 'blue' },
  client: { text: '客户', color: 'green' },
};

function ProcessingRecords() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await usersApi.getList({ page: 1, pageSize: 100 });
      setUsers(result.items || []);
    } catch (error) {
      console.error('加载用户列表失败', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await statisticsApi.getProcessingRecords({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载操作记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(prev => ({ ...prev, ...values }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = (record) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type) => {
        const info = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'name'],
      key: 'operator',
      width: 140,
      render: (name, record) => (
        <div>
          <div>{name || '系统'}</div>
          {record.operator?.role && (
            <Tag style={{ marginTop: 4, fontSize: 11 }} color={roleMap[record.operator.role]?.color}>
              {roleMap[record.operator.role]?.text || record.operator.role}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '关联类型',
      dataIndex: 'relatedType',
      key: 'relatedType',
      width: 100,
      render: (type) => {
        const typeNames = {
          appointment: '预约',
          waitlist: '候补',
          refund: '退款',
          schedule: '排班',
          service: '服务',
        };
        return typeNames[type] || type || '-';
      },
    },
    {
      title: '关联ID',
      dataIndex: 'relatedId',
      key: 'relatedId',
      width: 200,
      render: (id) => id ? <code style={{ fontSize: 11 }}>{id}</code> : '-',
    },
    {
      title: '操作说明',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action_col',
      width: 80,
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card title="操作记录">
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="操作人"
              allowClear
              loading={usersLoading}
              style={{ width: 160 }}
              showSearch
              optionFilterProp="children"
              onChange={(value) => handleSearch({ operatorId: value })}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({roleMap[user.role]?.text || user.role})
                </Option>
              ))}
            </Select>
            <Select
              placeholder="操作类型"
              allowClear
              style={{ width: 160 }}
              onChange={(value) => handleSearch({ type: value })}
            >
              {Object.entries(typeMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
            <Select
              placeholder="关联类型"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleSearch({ relatedType: value })}
            >
              <Option value="appointment">预约</Option>
              <Option value="waitlist">候补</Option>
              <Option value="refund">退款</Option>
              <Option value="schedule">排班</Option>
              <Option value="service">服务</Option>
            </Select>
            <RangePicker
              onChange={(dates) => handleSearch({
                startDate: dates?.[0]?.format('YYYY-MM-DD'),
                endDate: dates?.[1]?.format('YYYY-MM-DD'),
              })}
              allowEmpty={[true, true]}
            />
            <Button onClick={handleReset}>重置</Button>
          </Space>
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
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Card>

      <Drawer
        title="操作记录详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="操作类型">
              <Tag color={typeMap[currentRecord.type]?.color}>
                {typeMap[currentRecord.type]?.text || currentRecord.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {currentRecord.operator?.name || '系统'}
              {currentRecord.operator?.role && (
                <Tag style={{ marginLeft: 8 }} color={roleMap[currentRecord.operator.role]?.color}>
                  {roleMap[currentRecord.operator.role]?.text || currentRecord.operator.role}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="操作人ID">
              {currentRecord.operatorId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="关联类型">
              {currentRecord.relatedType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="关联ID">
              {currentRecord.relatedId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作说明">
              {currentRecord.action || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {currentRecord.remarks || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            {currentRecord.beforeState && (
              <Descriptions.Item label="变更前状态">
                <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(JSON.parse(currentRecord.beforeState), null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {currentRecord.afterState && (
              <Descriptions.Item label="变更后状态">
                <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(JSON.parse(currentRecord.afterState), null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default ProcessingRecords;
