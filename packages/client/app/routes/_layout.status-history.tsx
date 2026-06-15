import { useEffect, useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import {
  Card,
  Table,
  Tag,
  Select,
  Input,
  Button,
  Space,
  Typography,
  Descriptions,
  Modal,
} from "antd";
import { SearchOutlined, HistoryOutlined } from "@ant-design/icons";
import type { StatusHistory } from "@qinghe/shared";
import { api, type ApiListResponse } from "~/lib/api";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "状态历史 | 青禾库存追溯台" }];
};

const entityTypeLabel: Record<string, string> = {
  BATCH: "批次",
  INVENTORY: "库存",
  TRANSFER: "调拨",
  RECEIPT_DIFF: "签收差异",
  SAFETY_STOCK: "安全库存",
  LOCATION: "库位",
};

export default function StatusHistoryPage() {
  const [data, setData] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [entityType, setEntityType] = useState<string>();
  const [entityId, setEntityId] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<StatusHistory | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));
      if (entityType) params.append("entityType", entityType);
      if (entityId) params.append("entityId", entityId);
      const res = await api.get<ApiListResponse<StatusHistory>>(
        `/status-history?${params.toString()}`
      );
      const list = res as ApiListResponse<StatusHistory>;
      setData(list.data.data);
      setTotal(list.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const columns = [
    {
      title: "操作时间",
      dataIndex: "operationTime",
      render: (v: Date) => dayjs(v).format("YYYY-MM-DD HH:mm:ss"),
      width: 180,
      sorter: (a: StatusHistory, b: StatusHistory) =>
        new Date(a.operationTime).getTime() - new Date(b.operationTime).getTime(),
    },
    {
      title: "对象类型",
      dataIndex: "entityType",
      render: (v: string) => <Tag color="blue">{entityTypeLabel[v] || v}</Tag>,
      width: 100,
    },
    { title: "对象ID", dataIndex: "entityId", width: 180 },
    {
      title: "原状态",
      dataIndex: "fromStatus",
      render: (v: string) => v || <Tag color="default">初始</Tag>,
      width: 120,
    },
    { title: "新状态", dataIndex: "toStatus", width: 120 },
    { title: "变更原因", dataIndex: "reason", ellipsis: true },
    { title: "操作人", dataIndex: "operator", width: 120 },
    {
      title: "操作",
      key: "actions",
      width: 80,
      render: (_: any, record: StatusHistory) => (
        <Button
          size="small"
          onClick={() => {
            setCurrentRecord(record);
            setDetailModalOpen(true);
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        <Space>
          <HistoryOutlined />
          状态变更历史
        </Space>
      </Typography.Title>

      <Card>
        <Typography.Paragraph type="secondary">
          记录所有业务对象的状态变更，包括批次、库存、库位、调拨、签收差异、安全库存。
          每条变更都保留原因、操作人与时间，可用于审计追溯。
        </Typography.Paragraph>

        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="对象类型"
            allowClear
            style={{ width: 180 }}
            value={entityType}
            onChange={(v) => setEntityType(v)}
            options={Object.entries(entityTypeLabel).map(([k, v]) => ({
              label: v,
              value: k,
            }))}
          />
          <Input
            placeholder="对象ID"
            prefix={<SearchOutlined />}
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={fetchData}>
            查询
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="状态变更详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="操作时间">
              {dayjs(currentRecord.operationTime).format("YYYY-MM-DD HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="对象类型">
              {entityTypeLabel[currentRecord.entityType] || currentRecord.entityType}
            </Descriptions.Item>
            <Descriptions.Item label="对象ID">
              {currentRecord.entityId}
            </Descriptions.Item>
            <Descriptions.Item label="原状态">
              {currentRecord.fromStatus || "初始状态"}
            </Descriptions.Item>
            <Descriptions.Item label="新状态">
              <Tag color="blue">{currentRecord.toStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="变更原因">
              {currentRecord.reason}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {currentRecord.operator}
            </Descriptions.Item>
            {currentRecord.extraData && Object.keys(currentRecord.extraData).length > 0 && (
              <Descriptions.Item label="附加信息">
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(currentRecord.extraData, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
