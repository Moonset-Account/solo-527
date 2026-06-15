import { useEffect, useState } from "react";
import type { MetaFunction } from "@remix-run/node";
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
  DatePicker,
  InputNumber,
  Typography,
  Drawer,
  Descriptions,
  Popconfirm,
  message,
  Row,
  Col,
} from "antd";
import { PlusOutlined, SearchOutlined, HistoryOutlined } from "@ant-design/icons";
import type { Batch } from "@qinghe/shared";
import { api, type ApiListResponse, type ApiSingleResponse } from "../lib/api";
import { batchStatusMap, temperatureZoneMap } from "../lib/constants";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "批次追溯 | 青禾库存追溯台" }];
};

export default function BatchesPage() {
  const [data, setData] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));
      if (keyword) params.append("keyword", keyword);
      if (status) params.append("status", status);
      const res = await api.get<ApiListResponse<Batch>>(
        `/batches?${params.toString()}`
      );
      const list = res as ApiListResponse<Batch>;
      setData(list.data.data);
      setTotal(list.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleCreate = async (values: any) => {
    try {
      await api.post<ApiSingleResponse<Batch>>("/batches", {
        ...values,
        productionDate: values.productionDate.format("YYYY-MM-DD"),
        expiryDate: values.expiryDate.format("YYYY-MM-DD"),
      });
      message.success("批次创建成功");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const handleChangeStatus = async (values: any) => {
    if (!currentBatch) return;
    try {
      await api.patch<ApiSingleResponse<Batch>>(
        `/batches/${currentBatch.batchNo}/status`,
        values
      );
      message.success("状态变更成功");
      setStatusModalOpen(false);
      statusForm.resetFields();
      fetchData();
      if (detailOpen) {
        const res = await api.get<ApiSingleResponse<Batch>>(
          `/batches/${currentBatch.batchNo}`
        );
        setCurrentBatch((res as ApiSingleResponse<Batch>).data);
      }
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const loadHistory = async (batch: Batch) => {
    try {
      const res = await api.get<ApiSingleResponse<any[]>>(
        `/status-history/BATCH/${batch._id}`
      );
      setHistoryData(res.data || []);
      setHistoryOpen(true);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const columns = [
    {
      title: "批次号",
      dataIndex: "batchNo",
      render: (v: string, record: Batch) => (
        <a
          onClick={() => {
            setCurrentBatch(record);
            setDetailOpen(true);
          }}
        >
          {v}
        </a>
      ),
    },
    { title: "SKU", dataIndex: "sku" },
    { title: "商品名称", dataIndex: "skuName" },
    { title: "供应商", dataIndex: "supplier" },
    {
      title: "生产日期",
      dataIndex: "productionDate",
      render: (v: Date) => dayjs(v).format("YYYY-MM-DD"),
    },
    {
      title: "有效期",
      dataIndex: "expiryDate",
      render: (v: Date) => {
        const days = dayjs(v).diff(dayjs(), "day");
        const color = days <= 1 ? "magenta" : days <= 3 ? "red" : days <= 7 ? "orange" : "green";
        return <Tag color={color}>{dayjs(v).format("YYYY-MM-DD")} ({days}天)</Tag>;
      },
    },
    {
      title: "数量",
      render: (r: Batch) => (
        <span>
          {r.receivedQuantity}/{r.quantity} {r.unit}
        </span>
      ),
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
        const info = batchStatusMap[v as keyof typeof batchStatusMap];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: Batch) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setCurrentBatch(record);
              setStatusModalOpen(true);
            }}
          >
            变更状态
          </Button>
          <Button size="small" onClick={() => loadHistory(record)} icon={<HistoryOutlined />}>
            历史
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        批次追溯
      </Typography.Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索批次号/SKU/商品名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
            onPressEnter={fetchData}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 160 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={Object.entries(batchStatusMap).map(([k, v]) => ({
              label: v.label,
              value: k,
            }))}
          />
          <Button type="primary" onClick={fetchData}>
            查询
          </Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setCreateModalOpen(true)}>
            新建批次
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
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="新建批次"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ operator: "系统管理员" }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="批次号"
                name="batchNo"
                rules={[{ required: true }]}
              >
                <Input placeholder="例如：B20240115-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="供应商批次号"
                name="supplierBatchNo"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="SKU"
                name="sku"
                rules={[{ required: true }]}
              >
                <Input placeholder="商品 SKU" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="商品名称"
                name="skuName"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="供应商"
                name="supplier"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="入库单号"
                name="inboundOrderNo"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="生产日期"
                name="productionDate"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="有效期"
                name="expiryDate"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="应收数量"
                name="quantity"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="单位"
                name="unit"
                rules={[{ required: true }]}
                initialValue="件"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="温区"
                name="temperatureZone"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: "冷冻", value: "FROZEN" },
                    { label: "冷藏", value: "CHILLED" },
                    { label: "常温", value: "NORMAL" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="质检报告/存储条件" name="storageConditions">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="操作人"
                name="operator"
                rules={[{ required: true }]}
              >
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
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更批次状态"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleChangeStatus}
          initialValues={{ operator: "系统管理员" }}
        >
          <Form.Item
            label="目标状态"
            name="toStatus"
            rules={[{ required: true, message: "请选择目标状态" }]}
          >
            <Select
              options={Object.entries(batchStatusMap).map(([k, v]) => ({
                label: v.label,
                value: k,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="变更原因"
            name="reason"
            rules={[{ required: true, message: "请填写变更原因" }]}
          >
            <Input.TextArea rows={3} placeholder="请详细说明状态变更原因" />
          </Form.Item>
          <Form.Item
            label="操作人"
            name="operator"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setStatusModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认变更
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`批次详情 - ${currentBatch?.batchNo || ""}`}
        width={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {currentBatch && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="批次号">{currentBatch.batchNo}</Descriptions.Item>
              <Descriptions.Item label="供应商批次号">{currentBatch.supplierBatchNo || "-"}</Descriptions.Item>
              <Descriptions.Item label="SKU">{currentBatch.sku}</Descriptions.Item>
              <Descriptions.Item label="商品名称">{currentBatch.skuName}</Descriptions.Item>
              <Descriptions.Item label="供应商">{currentBatch.supplier}</Descriptions.Item>
              <Descriptions.Item label="入库单号">{currentBatch.inboundOrderNo || "-"}</Descriptions.Item>
              <Descriptions.Item label="生产日期">
                {dayjs(currentBatch.productionDate).format("YYYY-MM-DD")}
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {dayjs(currentBatch.expiryDate).format("YYYY-MM-DD")}
              </Descriptions.Item>
              <Descriptions.Item label="应收数量">{currentBatch.quantity} {currentBatch.unit}</Descriptions.Item>
              <Descriptions.Item label="实收数量">{currentBatch.receivedQuantity} {currentBatch.unit}</Descriptions.Item>
              <Descriptions.Item label="温区">
                {temperatureZoneMap[currentBatch.temperatureZone]}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={batchStatusMap[currentBatch.status].color}>
                  {batchStatusMap[currentBatch.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作人">{currentBatch.operator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentBatch.createdAt).format("YYYY-MM-DD HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {currentBatch.remark || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="存储条件/质检报告" span={2}>
                {currentBatch.storageConditions || "-"}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={() => loadHistory(currentBatch)}
              >
                查看状态历史
              </Button>
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        title="状态变更历史"
        width={520}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      >
        <Table
          rowKey="_id"
          size="small"
          dataSource={historyData}
          pagination={false}
          columns={[
            {
              title: "时间",
              dataIndex: "operationTime",
              render: (v: Date) => dayjs(v).format("MM-DD HH:mm"),
            },
            { title: "原状态", dataIndex: "fromStatus", render: (v: string) => v || "-" },
            { title: "新状态", dataIndex: "toStatus" },
            { title: "变更原因", dataIndex: "reason" },
            { title: "操作人", dataIndex: "operator" },
          ]}
        />
      </Drawer>
    </div>
  );
}
