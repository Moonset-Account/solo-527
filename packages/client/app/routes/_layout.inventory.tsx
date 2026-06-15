import { useEffect, useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import { Link, Outlet, useLocation } from "@remix-run/react";
import {
  Card,
  Table,
  Tag,
  Input,
  Button,
  Space,
  Typography,
  Tabs,
  Select,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { Inventory, InventoryTransaction } from "@qinghe/shared";
import { api, type ApiListResponse } from "../lib/api";
import { inventoryStatusMap, operationTypeMap, temperatureZoneMap } from "../lib/constants";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "库存管理 | 青禾库存追溯台" }];
};

export default function InventoryPage() {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState(location.pathname.includes("transactions") ? "transactions" : "stock");

  const [stockData, setStockData] = useState<Inventory[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(20);
  const [stockSku, setStockSku] = useState("");
  const [stockBatch, setStockBatch] = useState("");
  const [stockLocation, setStockLocation] = useState("");
  const [stockStatus, setStockStatus] = useState<string>();

  const [txData, setTxData] = useState<InventoryTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(20);
  const [txSku, setTxSku] = useState("");
  const [txBatch, setTxBatch] = useState("");
  const [txType, setTxType] = useState<string>();
  const [txDateRange, setTxDateRange] = useState<any>();

  const fetchStock = async () => {
    setStockLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(stockPage));
      params.append("pageSize", String(stockPageSize));
      if (stockSku) params.append("sku", stockSku);
      if (stockBatch) params.append("batchNo", stockBatch);
      if (stockLocation) params.append("locationCode", stockLocation);
      if (stockStatus) params.append("status", stockStatus);
      const res = await api.get<ApiListResponse<Inventory>>(
        `/inventory?${params.toString()}`
      );
      const list = res as ApiListResponse<Inventory>;
      setStockData(list.data.data);
      setStockTotal(list.data.total);
    } finally {
      setStockLoading(false);
    }
  };

  const fetchTx = async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(txPage));
      params.append("pageSize", String(txPageSize));
      if (txSku) params.append("sku", txSku);
      if (txBatch) params.append("batchNo", txBatch);
      if (txType) params.append("operationType", txType);
      if (txDateRange && txDateRange[0]) {
        params.append("startDate", txDateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", txDateRange[1].format("YYYY-MM-DD"));
      }
      const res = await api.get<ApiListResponse<InventoryTransaction>>(
        `/inventory/transactions?${params.toString()}`
      );
      const list = res as ApiListResponse<InventoryTransaction>;
      setTxData(list.data.data);
      setTxTotal(list.data.total);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (activeKey === "stock") fetchStock();
  }, [stockPage, stockPageSize]);

  useEffect(() => {
    if (activeKey === "transactions") fetchTx();
  }, [txPage, txPageSize]);

  const stockColumns = [
    { title: "批次号", dataIndex: "batchNo", render: (v: string) => <Link to={`/batches?batchNo=${v}`}>{v}</Link> },
    { title: "SKU", dataIndex: "sku" },
    { title: "商品名称", dataIndex: "skuName" },
    { title: "库位", dataIndex: "locationCode" },
    {
      title: "库存数量",
      dataIndex: "quantity",
      render: (v: number, r: Inventory) => `${v}${r.unit}`,
    },
    {
      title: "可用/预留",
      render: (r: Inventory) => (
        <span>
          <Tag color="green">{r.availableQuantity}</Tag>/
          <Tag color="orange">{r.reservedQuantity}</Tag>
        </span>
      ),
    },
    {
      title: "有效期",
      dataIndex: "expiryDate",
      render: (v: Date) => {
        const days = dayjs(v).diff(dayjs(), "day");
        return (
          <Tag color={days <= 3 ? "red" : days <= 7 ? "orange" : "green"}>
            {dayjs(v).format("YYYY-MM-DD")}
          </Tag>
        );
      },
    },
    {
      title: "温区",
      dataIndex: "temperatureZone",
      render: (v: string) => temperatureZoneMap[v as keyof typeof temperatureZoneMap],
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (v: string) => {
        const info = inventoryStatusMap[v as keyof typeof inventoryStatusMap];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
  ];

  const txColumns = [
    { title: "流水号", dataIndex: "transactionNo" },
    {
      title: "操作类型",
      dataIndex: "operationType",
      render: (v: string) => operationTypeMap[v as keyof typeof operationTypeMap],
    },
    { title: "批次号", dataIndex: "batchNo" },
    { title: "SKU", dataIndex: "sku" },
    { title: "商品名称", dataIndex: "skuName" },
    {
      title: "数量",
      dataIndex: "quantity",
      render: (v: number, r: InventoryTransaction) => `${v}${r.unit}`,
    },
    {
      title: "库位流向",
      render: (r: InventoryTransaction) =>
        r.fromLocationCode ? `${r.fromLocationCode} → ${r.toLocationCode || "-"}` : r.toLocationCode || "-",
    },
    { title: "关联单号", dataIndex: "referenceNo", render: (v: string) => v || "-" },
    {
      title: "操作原因",
      dataIndex: "reason",
      render: (v: string) => v || "-",
      ellipsis: true,
    },
    { title: "操作人", dataIndex: "operator" },
    {
      title: "操作时间",
      dataIndex: "operationTime",
      render: (v: Date) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        库存管理
      </Typography.Title>

      <Card>
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            {
              key: "stock",
              label: "当前库存",
              children: (
                <>
                  <Space style={{ marginBottom: 16 }} wrap>
                    <Input
                      placeholder="搜索 SKU"
                      prefix={<SearchOutlined />}
                      value={stockSku}
                      onChange={(e) => setStockSku(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Input
                      placeholder="批次号"
                      value={stockBatch}
                      onChange={(e) => setStockBatch(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Input
                      placeholder="库位"
                      value={stockLocation}
                      onChange={(e) => setStockLocation(e.target.value)}
                      style={{ width: 160 }}
                    />
                    <Select
                      placeholder="状态"
                      allowClear
                      style={{ width: 140 }}
                      value={stockStatus}
                      onChange={(v) => setStockStatus(v)}
                      options={Object.entries(inventoryStatusMap).map(([k, v]) => ({
                        label: v.label,
                        value: k,
                      }))}
                    />
                    <Button type="primary" onClick={fetchStock}>
                      查询
                    </Button>
                  </Space>
                  <Table
                    columns={stockColumns}
                    dataSource={stockData}
                    rowKey="_id"
                    loading={stockLoading}
                    pagination={{
                      current: stockPage,
                      pageSize: stockPageSize,
                      total: stockTotal,
                      onChange: (p, ps) => {
                        setStockPage(p);
                        setStockPageSize(ps);
                      },
                      showSizeChanger: true,
                      showTotal: (t) => `共 ${t} 条`,
                    }}
                  />
                </>
              ),
            },
            {
              key: "transactions",
              label: "出入库流水",
              children: (
                <>
                  <Space style={{ marginBottom: 16 }} wrap>
                    <Input
                      placeholder="搜索 SKU"
                      prefix={<SearchOutlined />}
                      value={txSku}
                      onChange={(e) => setTxSku(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Input
                      placeholder="批次号"
                      value={txBatch}
                      onChange={(e) => setTxBatch(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Select
                      placeholder="操作类型"
                      allowClear
                      style={{ width: 160 }}
                      value={txType}
                      onChange={(v) => setTxType(v)}
                      options={Object.entries(operationTypeMap).map(([k, v]) => ({
                        label: v,
                        value: k,
                      }))}
                    />
                    <Button type="primary" onClick={fetchTx}>
                      查询
                    </Button>
                  </Space>
                  <Table
                    columns={txColumns}
                    dataSource={txData}
                    rowKey="_id"
                    loading={txLoading}
                    pagination={{
                      current: txPage,
                      pageSize: txPageSize,
                      total: txTotal,
                      onChange: (p, ps) => {
                        setTxPage(p);
                        setTxPageSize(ps);
                      },
                      showSizeChanger: true,
                      showTotal: (t) => `共 ${t} 条`,
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
      <Outlet />
    </div>
  );
}
