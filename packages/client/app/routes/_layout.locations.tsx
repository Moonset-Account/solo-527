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
  InputNumber,
  Typography,
  message,
  Drawer,
  Descriptions,
  Row,
  Col,
} from "antd";
import { PlusOutlined, SearchOutlined, HistoryOutlined } from "@ant-design/icons";
import type { Location } from "@qinghe/shared";
import { api, type ApiListResponse, type ApiSingleResponse } from "~/lib/api";
import {
  locationTypeMap,
  locationStatusMap,
  temperatureZoneMap,
} from "~/lib/constants";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "库位管理 | 青禾库存追溯台" }];
};

export default function LocationsPage() {
  const [data, setData] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [keyword, setKeyword] = useState("");
  const [zone, setZone] = useState<string>();
  const [type, setType] = useState<string>();
  const [tempZone, setTempZone] = useState<string>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));
      if (keyword) params.append("keyword", keyword);
      if (zone) params.append("zone", zone);
      if (type) params.append("type", type);
      if (tempZone) params.append("temperatureZone", tempZone);
      const res = await api.get<ApiListResponse<Location>>(
        `/locations?${params.toString()}`
      );
      const list = res as ApiListResponse<Location>;
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
      await api.post<ApiSingleResponse<Location>>("/locations", values);
      message.success("库位创建成功");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const handleChangeStatus = async (values: any) => {
    if (!currentLocation) return;
    try {
      await api.patch<ApiSingleResponse<Location>>(
        `/locations/${currentLocation.code}/status`,
        values
      );
      message.success("状态变更成功");
      setStatusModalOpen(false);
      statusForm.resetFields();
      fetchData();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const loadHistory = async (loc: Location) => {
    try {
      const res = await api.get<ApiSingleResponse<any[]>>(
        `/status-history/LOCATION/${loc._id}`
      );
      setHistoryData(res.data || []);
      setHistoryOpen(true);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const columns = [
    { title: "库位编码", dataIndex: "code", render: (v: string, r: Location) => (
      <a onClick={() => { setCurrentLocation(r); setDetailOpen(true); }}>{v}</a>
    )},
    { title: "库位名称", dataIndex: "name" },
    { title: "库区", dataIndex: "zone" },
    { title: "通道", dataIndex: "aisle" },
    { title: "货架", dataIndex: "shelf" },
    { title: "层级", dataIndex: "layer" },
    { title: "位置", dataIndex: "position" },
    {
      title: "类型",
      dataIndex: "type",
      render: (v: string) => locationTypeMap[v as keyof typeof locationTypeMap],
    },
    {
      title: "温区",
      dataIndex: "temperatureZone",
      render: (v: string) => temperatureZoneMap[v as keyof typeof temperatureZoneMap],
    },
    {
      title: "容量",
      render: (r: Location) => (
        <span>
          {r.currentCapacity}/{r.maxCapacity} {r.capacityUnit}
        </span>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (v: string) => {
        const info = locationStatusMap[v as keyof typeof locationStatusMap];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: Location) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setCurrentLocation(record);
              setStatusModalOpen(true);
            }}
          >
            变更状态
          </Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => loadHistory(record)}>
            历史
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        库位管理
      </Typography.Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索库位编码/名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
          />
          <Select
            placeholder="库区"
            allowClear
            style={{ width: 120 }}
            value={zone}
            onChange={(v) => setZone(v)}
            options={["A", "B", "C", "D", "E"].map((v) => ({ label: v, value: v }))}
          />
          <Select
            placeholder="类型"
            allowClear
            style={{ width: 140 }}
            value={type}
            onChange={(v) => setType(v)}
            options={Object.entries(locationTypeMap).map(([k, v]) => ({
              label: v,
              value: k,
            }))}
          />
          <Select
            placeholder="温区"
            allowClear
            style={{ width: 120 }}
            value={tempZone}
            onChange={(v) => setTempZone(v)}
            options={Object.entries(temperatureZoneMap).map(([k, v]) => ({
              label: v,
              value: k,
            }))}
          />
          <Button type="primary" onClick={fetchData}>
            查询
          </Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setCreateModalOpen(true)}>
            新建库位
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
        title="新建库位"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="库位编码" name="code" rules={[{ required: true }]}>
                <Input placeholder="如：A-01-01-01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="库位名称" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="库区" name="zone" rules={[{ required: true }]}>
                <Input placeholder="如：A" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="通道" name="aisle" rules={[{ required: true }]}>
                <Input placeholder="如：01" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="货架" name="shelf" rules={[{ required: true }]}>
                <Input placeholder="如：01" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="层级" name="layer" rules={[{ required: true }]}>
                <Input placeholder="如：01" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="位置" name="position" rules={[{ required: true }]}>
                <Input placeholder="如：01" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="库位类型" name="type" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(locationTypeMap).map(([k, v]) => ({
                    label: v,
                    value: k,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="温区" name="temperatureZone" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "冷冻", value: "FROZEN" },
                    { label: "冷藏", value: "CHILLED" },
                    { label: "常温", value: "NORMAL" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="容量单位" name="capacityUnit" rules={[{ required: true }]} initialValue="件">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="最大容量" name="maxCapacity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="描述" name="description">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更库位状态"
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
          <Form.Item label="目标状态" name="toStatus" rules={[{ required: true }]}>
            <Select
              options={Object.entries(locationStatusMap).map(([k, v]) => ({
                label: v.label,
                value: k,
              }))}
            />
          </Form.Item>
          <Form.Item label="变更原因" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请详细说明状态变更原因" />
          </Form.Item>
          <Form.Item label="操作人" name="operator" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setStatusModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认变更</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`库位详情 - ${currentLocation?.code || ""}`}
        width={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {currentLocation && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="库位编码">{currentLocation.code}</Descriptions.Item>
              <Descriptions.Item label="库位名称">{currentLocation.name}</Descriptions.Item>
              <Descriptions.Item label="库区">{currentLocation.zone}</Descriptions.Item>
              <Descriptions.Item label="通道-货架-层-位">
                {currentLocation.aisle}-{currentLocation.shelf}-{currentLocation.layer}-{currentLocation.position}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                {locationTypeMap[currentLocation.type]}
              </Descriptions.Item>
              <Descriptions.Item label="温区">
                {temperatureZoneMap[currentLocation.temperatureZone]}
              </Descriptions.Item>
              <Descriptions.Item label="当前容量">
                {currentLocation.currentCapacity} / {currentLocation.maxCapacity} {currentLocation.capacityUnit}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={locationStatusMap[currentLocation.status].color}>
                  {locationStatusMap[currentLocation.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{currentLocation.description || "-"}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(currentLocation.createdAt).format("YYYY-MM-DD HH:mm")}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={() => loadHistory(currentLocation)}
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
            { title: "时间", dataIndex: "operationTime", render: (v: Date) => dayjs(v).format("MM-DD HH:mm") },
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
