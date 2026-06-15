import { useEffect, useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import {
  Card,
  Table,
  Tag,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  Typography,
  message,
  Drawer,
  Descriptions,
  Progress,
  List,
  Row,
  Col,
  Statistic,
  Divider,
  Alert,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { SafetyStock, SafetyStockDrilldown, Transfer } from "@qinghe/shared";
import { api, type ApiListResponse, type ApiSingleResponse } from "../lib/api";
import {
  safetyStockStatusMap,
  delayReasonCategoryMap,
  auditStatusMap,
} from "../lib/constants";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "安全库存 | 青禾库存追溯台" }];
};

export default function SafetyStockPage() {
  const [data, setData] = useState<SafetyStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sku, setSku] = useState("");
  const [status, setStatus] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldown, setDrilldown] = useState<SafetyStockDrilldown | null>(null);
  const [quickTransferModalOpen, setQuickTransferModalOpen] = useState(false);
  const [currentSafetyStock, setCurrentSafetyStock] = useState<SafetyStock | null>(null);
  const [createForm] = Form.useForm();
  const [quickTransferForm] = Form.useForm();
  const [stats, setStats] = useState<{ NORMAL: number; WARNING: number; CRITICAL: number }>({
    NORMAL: 0,
    WARNING: 0,
    CRITICAL: 0,
  });

  const openQuickTransfer = (item: SafetyStock) => {
    setCurrentSafetyStock(item);
    quickTransferForm.setFieldsValue({
      sku: item.sku,
      skuName: item.skuName,
      quantity: item.reorderQuantity,
      unit: item.unit,
      type: "EMERGENCY",
      fromLocation: "SUPPLIER",
      toLocation: "A-01-01-01",
      supplier: item.supplier || "",
      relatedSafetyStockId: item._id,
      plannedDate: dayjs(),
      expectedDate: dayjs().add(item.leadTimeDays, "day"),
      applicant: "系统管理员",
      remark: `安全库存触发自动补货：当前库存 ${item.currentStock}${item.unit}，安全库存线 ${item.minQuantity}${item.unit}`,
    });
    setQuickTransferModalOpen(true);
  };

  const handleQuickTransfer = async (values: any) => {
    try {
      await api.post<ApiSingleResponse<Transfer>>("/transfers", {
        ...values,
        plannedDate: values.plannedDate.format("YYYY-MM-DD"),
        expectedDate: values.expectedDate.format("YYYY-MM-DD"),
      });
      message.success("调拨申请创建成功");
      setQuickTransferModalOpen(false);
      quickTransferForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));
      if (sku) params.append("sku", sku);
      if (status) params.append("status", status);
      if (category) params.append("category", category);
      const res = await api.get<ApiListResponse<SafetyStock>>(
        `/safety-stock?${params.toString()}`
      );
      const list = res as ApiListResponse<SafetyStock>;
      setData(list.data.data);
      setTotal(list.data.total);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<ApiSingleResponse<{ NORMAL: number; WARNING: number; CRITICAL: number }>>(
        "/safety-stock/stats/summary"
      );
      setStats(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [page, pageSize]);

  const handleCreate = async (values: any) => {
    try {
      await api.post<ApiSingleResponse<SafetyStock>>("/safety-stock", values);
      message.success("安全库存设置成功");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
      fetchStats();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const loadDrilldown = async (item: SafetyStock) => {
    try {
      const res = await api.get<ApiSingleResponse<SafetyStockDrilldown>>(
        `/safety-stock/${item._id}/drilldown`
      );
      setDrilldown(res.data);
      setDrilldownOpen(true);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const columns = [
    { title: "SKU", dataIndex: "sku" },
    { title: "商品名称", dataIndex: "skuName" },
    { title: "分类", dataIndex: "category", render: (v: string) => v || "-" },
    {
      title: "库存状态",
      render: (r: SafetyStock) => {
        const info = safetyStockStatusMap[r.status];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "当前库存 / 最低库存",
      render: (r: SafetyStock) => {
        const ratio = r.minQuantity > 0 ? Math.min((r.currentStock / r.minQuantity) * 100, 200) : 100;
        const color = r.currentStock <= r.minQuantity ? "red" : r.currentStock <= r.reorderPoint ? "orange" : "green";
        return (
          <div style={{ minWidth: 180 }}>
            <Progress
              percent={Math.round(ratio / 2)}
              status={r.currentStock <= r.minQuantity ? "exception" : r.currentStock <= r.reorderPoint ? "active" : "normal"}
              size="small"
            />
            <div style={{ fontSize: 12, color: color }}>
              {r.currentStock} / {r.minQuantity} {r.unit}
            </div>
          </div>
        );
      },
    },
    {
      title: "再订货点 / 补货量",
      render: (r: SafetyStock) => (
        <span>
          {r.reorderPoint} → 补 {r.reorderQuantity} {r.unit}
        </span>
      ),
    },
    { title: "交期(天)", dataIndex: "leadTimeDays" },
    { title: "责任人", dataIndex: "responsiblePerson" },
    {
      title: "下次检查",
      dataIndex: "nextReviewDate",
      render: (v: Date) => dayjs(v).format("YYYY-MM-DD"),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: SafetyStock) => (
        <Space>
          <Button size="small" type="primary" onClick={() => loadDrilldown(record)}>
            下钻明细
          </Button>
          {record.status !== "NORMAL" && (
            <>
              <Button
                size="small"
                type="primary"
                danger
                onClick={() => openQuickTransfer(record)}
              >
                一键补货
              </Button>
              <Link to={`/transfers?relatedSafetyStockId=${record._id}`}>
                <Button size="small">手动创建</Button>
              </Link>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        <Space>
          <SafetyCertificateOutlined />
          安全库存管理
        </Space>
      </Typography.Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {(["NORMAL", "WARNING", "CRITICAL"] as const).map((s) => {
          const info = safetyStockStatusMap[s];
          return (
            <Col span={8} key={s}>
              <Card
                onClick={() => setStatus(s)}
                style={{ cursor: "pointer" }}
                hoverable
              >
                <Statistic
                  title={`${info.label} SKU 数`}
                  value={stats[s]}
                  valueStyle={{ color: info.color === "green" ? "#52c41a" : info.color === "orange" ? "#fa8c16" : "#cf1322" }}
                  suffix="个"
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索 SKU / 商品名称"
            prefix={<SearchOutlined />}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            style={{ width: 240 }}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={Object.entries(safetyStockStatusMap).map(([k, v]) => ({
              label: v.label,
              value: k,
            }))}
          />
          <Input
            placeholder="分类"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: 140 }}
          />
          <Button type="primary" onClick={fetchData}>查询</Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setCreateModalOpen(true)}>
            新建安全库存
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
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="新建安全库存设置"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
                <Input placeholder="商品 SKU" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="商品名称" name="skuName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="分类" name="category">
                <Input placeholder="如：叶菜、肉类" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="单位" name="unit" rules={[{ required: true }]} initialValue="件">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="供应商" name="supplier">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="最小库存量" name="minQuantity" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最大库存量" name="maxQuantity">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="再订货点" name="reorderPoint" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="单次补货量" name="reorderQuantity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="交期(天)" name="leadTimeDays" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="检查周期(天)" name="reviewPeriodDays" rules={[{ required: true }]} initialValue={7}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="责任人" name="responsiblePerson" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="备注" name="remark">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <SafetyCertificateOutlined />
            安全库存下钻明细 - {drilldown?.safetyStock.sku}
          </Space>
        }
        width={860}
        open={drilldownOpen}
        onClose={() => setDrilldownOpen(false)}
      >
        {drilldown && (
          <>
            <Alert
              type={drilldown.safetyStock.status === "CRITICAL" ? "error" : drilldown.safetyStock.status === "WARNING" ? "warning" : "success"}
              showIcon
              message={`当前库存：${drilldown.safetyStock.currentStock} ${drilldown.safetyStock.unit}，安全库存线：${drilldown.safetyStock.minQuantity} ${drilldown.safetyStock.unit}`}
              description={
                drilldown.safetyStock.status !== "NORMAL"
                  ? `再订货点：${drilldown.safetyStock.reorderPoint}，建议补货量：${drilldown.safetyStock.reorderQuantity}`
                  : "库存状态正常"
              }
              style={{ marginBottom: 16 }}
            />

            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="SKU">{drilldown.safetyStock.sku}</Descriptions.Item>
              <Descriptions.Item label="商品名称">{drilldown.safetyStock.skuName}</Descriptions.Item>
              <Descriptions.Item label="分类">{drilldown.safetyStock.category || "-"}</Descriptions.Item>
              <Descriptions.Item label="责任人">
                <Space><UserOutlined />{drilldown.safetyStock.responsiblePerson}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="交期(天)">
                <Space><ClockCircleOutlined />{drilldown.safetyStock.leadTimeDays} 天</Space>
              </Descriptions.Item>
              <Descriptions.Item label="上次补货">
                {drilldown.safetyStock.lastRestockDate
                  ? dayjs(drilldown.safetyStock.lastRestockDate).format("YYYY-MM-DD")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">在库明细</Divider>
            <Table
              size="small"
              rowKey="batchId"
              dataSource={drilldown.inventoryList}
              pagination={false}
              columns={[
                { title: "批次号", dataIndex: "batchNo" },
                { title: "库位", dataIndex: "locationCode" },
                {
                  title: "数量",
                  dataIndex: "quantity",
                  render: (v: number) => `${v} ${drilldown.safetyStock.unit}`,
                },
                {
                  title: "有效期",
                  dataIndex: "expiryDate",
                  render: (v: Date) => {
                    const days = dayjs(v).diff(dayjs(), "day");
                    return (
                      <Tag color={days <= 3 ? "red" : days <= 7 ? "orange" : "green"}>
                        {dayjs(v).format("YYYY-MM-DD")} ({days}天)
                      </Tag>
                    );
                  },
                },
              ]}
              locale={{ emptyText: "暂无在库库存" }}
            />

            <Divider orientation="left">在途调拨</Divider>
            <Table
              size="small"
              rowKey="transferId"
              dataSource={drilldown.pendingTransfers}
              pagination={false}
              columns={[
                { title: "调拨单号", dataIndex: "transferNo", render: (v: string) => <Link to={`/transfers?transferNo=${v}`}>{v}</Link> },
                {
                  title: "数量",
                  dataIndex: "quantity",
                  render: (v: number) => `${v} ${drilldown.safetyStock.unit}`,
                },
                {
                  title: "预计到货",
                  dataIndex: "expectedDate",
                  render: (v: Date) => dayjs(v).format("YYYY-MM-DD"),
                },
                {
                  title: "状态",
                  dataIndex: "status",
                  render: (v: string) => {
                    const info = auditStatusMap[v as keyof typeof auditStatusMap];
                    return <Tag color={info?.color}>{info?.label}</Tag>;
                  },
                },
              ]}
              locale={{ emptyText: "暂无在途调拨" }}
            />

            <Divider orientation="left">
              <Space>
                <ArrowDownOutlined />
                交期延误分析（平均延误 {drilldown.leadTimeStats.averageLeadTime} 天，共 {drilldown.leadTimeStats.delayedCount} 次延误）
              </Space>
            </Divider>
            <List
              size="small"
              bordered
              dataSource={drilldown.leadTimeStats.delays}
              locale={{ emptyText: "暂无延误记录" }}
              renderItem={(d) => (
                <List.Item key={d.transferNo}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Link to={`/transfers?transferNo=${d.transferNo}`}>{d.transferNo}</Link>
                        <Tag color="red">延误 {d.delayDays} 天</Tag>
                        <Tag>{delayReasonCategoryMap[d.reasonCategory] || d.reasonCategory}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span>原因：{d.reason}</span>
                        <span>
                          计划：{dayjs(d.plannedDate).format("YYYY-MM-DD")} →
                          实际：{d.actualDate ? dayjs(d.actualDate).format("YYYY-MM-DD") : "待到货"}
                        </span>
                        <span>
                          处理人：{d.handler}
                          {d.handlingTime ? `，处理耗时：${d.handlingTime} 分钟` : ""}
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />

            {drilldown.stockoutHistory.length > 0 && (
              <>
                <Divider orientation="left">缺货历史</Divider>
                <Table
                  size="small"
                  rowKey={(r, i) => String(i)}
                  dataSource={drilldown.stockoutHistory}
                  pagination={false}
                  columns={[
                    { title: "日期", dataIndex: "date", render: (v: Date) => dayjs(v).format("YYYY-MM-DD HH:mm") },
                    {
                      title: "缺口数量",
                      dataIndex: "gapQuantity",
                      render: (v: number) => (
                        <span style={{ color: "red" }}>-{v} {drilldown.safetyStock.unit}</span>
                      ),
                    },
                    { title: "原因", dataIndex: "reason" },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: "#cf1322" }} />
            安全库存触发紧急补货 - {currentSafetyStock?.sku}
          </Space>
        }
        open={quickTransferModalOpen}
        onCancel={() => setQuickTransferModalOpen(false)}
        footer={null}
        width={760}
        destroyOnClose
      >
        {currentSafetyStock && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <span>
                当前库存：<strong style={{ color: "#cf1322" }}>{currentSafetyStock.currentStock} {currentSafetyStock.unit}</strong>，
                安全库存线：{currentSafetyStock.minQuantity} {currentSafetyStock.unit}，
                缺口：{currentSafetyStock.minQuantity - currentSafetyStock.currentStock} {currentSafetyStock.unit}
              </span>
            }
          />
        )}
        <Form
          form={quickTransferForm}
          layout="vertical"
          onFinish={handleQuickTransfer}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
                <Input readOnly style={{ background: "#f5f5f5" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="商品名称" name="skuName" rules={[{ required: true }]}>
                <Input readOnly style={{ background: "#f5f5f5" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="补货数量" name="quantity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="单位" name="unit" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="调拨类型" name="type" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "紧急补货", value: "EMERGENCY" },
                    { label: "采购入库", value: "PURCHASE" },
                    { label: "库位调拨", value: "ALLOCATION" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="来源" name="fromLocation" rules={[{ required: true }]}>
                <Input placeholder="如：供应商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="目标库位" name="toLocation" rules={[{ required: true }]}>
                <Input placeholder="如：A-01-01-01" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="供应商" name="supplier">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="申请人" name="applicant" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="计划日期" name="plannedDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="预计到货日期" name="expectedDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="relatedSafetyStockId" hidden>
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setQuickTransferModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" danger>
                提交紧急补货申请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
