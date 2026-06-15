import { useEffect, useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Table,
  Typography,
  Space,
  Alert,
  Spin,
} from "antd";
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  BarcodeOutlined,
  SwapOutlined,
  AlertOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import { api, type ApiSingleResponse } from "../lib/api";
import {
  safetyStockStatusMap,
  auditStatusMap,
  batchStatusMap,
} from "../lib/constants";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "首页看板 | 青禾库存追溯台" }];
};

interface DashboardStats {
  totalBatches: number;
  expiringBatches: number;
  totalInventory: number;
  safetyStock: { NORMAL: number; WARNING: number; CRITICAL: number };
  pendingTransfers: number;
  delayedTransfers: number;
  pendingDiffs: number;
  todayTransactionCount: number;
}

interface ExpiryAlert {
  batch: {
    _id: string;
    batchNo: string;
    sku: string;
    skuName: string;
    expiryDate: string;
    status: string;
  };
  daysRemaining: number;
  alertLevel: "WARNING" | "DANGER" | "CRITICAL";
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          api.get<ApiSingleResponse<DashboardStats>>("/reports/dashboard"),
          api.get<ApiSingleResponse<ExpiryAlert[]>>("/batches/alerts/expiry"),
        ]);
        setStats((statsRes as ApiSingleResponse<DashboardStats>).data);
        setAlerts((alertsRes as ApiSingleResponse<ExpiryAlert[]>).data || []);
      } catch (err) {
        console.error("加载看板数据失败:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const alertColumns = [
    {
      title: "批次号",
      dataIndex: ["batch", "batchNo"],
      render: (v: string) => <Link to={`/batches?batchNo=${v}`}>{v}</Link>,
    },
    { title: "SKU", dataIndex: ["batch", "sku"] },
    { title: "商品名称", dataIndex: ["batch", "skuName"] },
    {
      title: "有效期",
      dataIndex: ["batch", "expiryDate"],
      render: (v: string) => dayjs(v).format("YYYY-MM-DD"),
    },
    {
      title: "剩余天数",
      dataIndex: "daysRemaining",
      render: (v: number, record: ExpiryAlert) => {
        const colorMap: Record<string, string> = {
          WARNING: "orange",
          DANGER: "red",
          CRITICAL: "magenta",
        };
        return <Tag color={colorMap[record.alertLevel]}>{v} 天</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: ["batch", "status"],
      render: (v: string) => {
        const s = batchStatusMap[v as keyof typeof batchStatusMap];
        return <Tag color={s?.color}>{s?.label}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        库存总览看板
      </Typography.Title>

      {stats?.safetyStock.CRITICAL ? (
        <Alert
          message={`有 ${stats.safetyStock.CRITICAL} 个 SKU 库存低于安全库存线，请及时处理`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={<Link to="/safety-stock?status=CRITICAL">查看详情</Link>}
        />
      ) : null}
      {stats?.delayedTransfers ? (
        <Alert
          message={`有 ${stats.delayedTransfers} 个调拨单已延误，请跟进处理`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={<Link to="/transfers?status=DELAYED">查看详情</Link>}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="在库批次"
              value={stats?.totalBatches || 0}
              prefix={<BarcodeOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="即将过期批次"
              value={stats?.expiringBatches || 0}
              valueStyle={{ color: stats && stats.expiringBatches > 0 ? "#cf1322" : undefined }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="当前库存总量"
              value={stats?.totalInventory || 0}
              prefix={<DatabaseOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="安全库存异常"
              value={(stats?.safetyStock.WARNING || 0) + (stats?.safetyStock.CRITICAL || 0)}
              valueStyle={{
                color:
                  stats &&
                  (stats.safetyStock.WARNING > 0 || stats.safetyStock.CRITICAL > 0)
                    ? "#fa8c16"
                    : undefined,
              }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待处理调拨"
              value={stats?.pendingTransfers || 0}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待处理差异"
              value={stats?.pendingDiffs || 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="安全库存状态分布">
            <Space direction="vertical" style={{ width: "100%" }}>
              {(["NORMAL", "WARNING", "CRITICAL"] as const).map((s) => {
                const info = safetyStockStatusMap[s];
                return (
                  <div
                    key={s}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Tag color={info.color}>{info.label}</Tag>
                    </Space>
                    <Typography.Text strong>
                      {stats?.safetyStock[s] || 0} 个 SKU
                    </Typography.Text>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="今日操作">
            <Statistic
              title="今日出入库流水"
              value={stats?.todayTransactionCount || 0}
              prefix={<FieldTimeOutlined />}
              suffix="笔"
            />
            <div style={{ marginTop: 16 }}>
              <Link to="/inventory/transactions">查看流水明细 →</Link>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="快速入口">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Link to="/scan/inbound">📥 扫码入库</Link>
              <Link to="/scan/outbound">📤 扫码出库</Link>
              <Link to="/transfers">🔄 创建调拨申请</Link>
              <Link to="/receipt-diffs">⚠️ 处理签收差异</Link>
              <Link to="/batches">🔍 批次追溯查询</Link>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#fa8c16" }} />
            <span>批次效期预警</span>
            <Tag color="magenta">{alerts.length} 条</Tag>
          </Space>
        }
        extra={<Link to="/batches">查看全部</Link>}
      >
        <Table
          columns={alertColumns}
          dataSource={alerts}
          rowKey={(r) => r.batch._id}
          size="small"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "暂无即将过期批次 🎉" }}
        />
      </Card>
    </div>
  );
}
