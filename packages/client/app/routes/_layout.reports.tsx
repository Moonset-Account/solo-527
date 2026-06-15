import { useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import {
  Card,
  Button,
  Typography,
  Space,
  DatePicker,
  Row,
  Col,
  Select,
  message,
  Tag,
  Divider,
} from "antd";
import {
  FileExcelOutlined,
  DownloadOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  BarcodeOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { api } from "~/lib/api";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
  return [{ title: "报表中心 | 青禾库存追溯台" }];
};

const { RangePicker } = DatePicker;

export default function ReportsPage() {
  const [txDateRange, setTxDateRange] = useState<any>();
  const [txType, setTxType] = useState<string>();
  const [batchStatus, setBatchStatus] = useState<string>();
  const [batchSupplier, setBatchSupplier] = useState<string>();
  const [ssStatus, setSsStatus] = useState<string>();
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (type: string, params: Record<string, string>) => {
    setDownloading(type);
    try {
      const query = new URLSearchParams(params).toString();
      let filename = `${type}-${dayjs().format("YYYYMMDD-HHmmss")}.xlsx`;
      if (type === "transactions") {
        await api.download(`/reports/transactions?${query}`, filename);
      } else if (type === "batches") {
        await api.download(`/reports/batches?${query}`, filename);
      } else if (type === "safety-stock") {
        await api.download(`/reports/safety-stock?${query}`, filename);
      }
      message.success("报表导出成功");
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        <Space>
          <FileTextOutlined />
          报表中心
        </Space>
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card
            title={
              <Space>
                <DatabaseOutlined />
                出入库流水报表
              </Space>
            }
            extra={
              <Tag color="blue">Excel</Tag>
            }
          >
            <Typography.Paragraph type="secondary">
              导出指定时间范围的全部出入库流水明细，包含操作类型、批次、库位、数量、操作人等。
            </Typography.Paragraph>
            <Space direction="vertical" style={{ width: "100%" }}>
              <RangePicker
                value={txDateRange}
                onChange={setTxDateRange}
                style={{ width: "100%" }}
              />
              <Select
                placeholder="操作类型（可选）"
                allowClear
                style={{ width: "100%" }}
                value={txType}
                onChange={setTxType}
                options={[
                  { label: "入库", value: "INBOUND" },
                  { label: "出库", value: "OUTBOUND" },
                  { label: "调拨", value: "TRANSFER" },
                  { label: "调整", value: "ADJUST" },
                  { label: "盘点", value: "COUNT" },
                  { label: "报废", value: "SCRAP" },
                ]}
              />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={downloading === "transactions"}
                block
                onClick={() => {
                  const params: Record<string, string> = { format: "xlsx" };
                  if (txDateRange && txDateRange[0]) {
                    params.startDate = txDateRange[0].format("YYYY-MM-DD");
                    params.endDate = txDateRange[1].format("YYYY-MM-DD");
                  }
                  if (txType) params.operationType = txType;
                  download("transactions", params);
                }}
              >
                导出流水报表
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={
              <Space>
                <BarcodeOutlined />
                批次追溯报表
              </Space>
            }
            extra={<Tag color="green">Excel</Tag>}
          >
            <Typography.Paragraph type="secondary">
              导出所有批次的完整信息，包含批次号、SKU、供应商、生产日期、效期、状态等。
            </Typography.Paragraph>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                placeholder="批次状态（可选）"
                allowClear
                style={{ width: "100%" }}
                value={batchStatus}
                onChange={setBatchStatus}
                options={[
                  { label: "收货中", value: "RECEIVING" },
                  { label: "质检中", value: "QUALITY_CHECK" },
                  { label: "在库", value: "STORED" },
                  { label: "部分出库", value: "PARTIAL_OUT" },
                  { label: "已过期", value: "EXPIRED" },
                  { label: "已报废", value: "SCRAPPED" },
                  { label: "已清空", value: "EMPTY" },
                ]}
              />
              <Select
                placeholder="供应商（可选）"
                allowClear
                showSearch
                style={{ width: "100%" }}
                value={batchSupplier}
                onChange={setBatchSupplier}
                options={[]}
              />
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                loading={downloading === "batches"}
                block
                onClick={() => {
                  const params: Record<string, string> = { format: "xlsx" };
                  if (batchStatus) params.status = batchStatus;
                  if (batchSupplier) params.supplier = batchSupplier;
                  download("batches", params);
                }}
              >
                导出批次报表
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                安全库存报表
              </Space>
            }
            extra={<Tag color="orange">Excel</Tag>}
          >
            <Typography.Paragraph type="secondary">
              导出所有 SKU 的安全库存配置，含当前库存、预警线、责任人、交期等。
            </Typography.Paragraph>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                placeholder="状态（可选）"
                allowClear
                style={{ width: "100%" }}
                value={ssStatus}
                onChange={setSsStatus}
                options={[
                  { label: "正常", value: "NORMAL" },
                  { label: "预警", value: "WARNING" },
                  { label: "紧急", value: "CRITICAL" },
                ]}
              />
              <div />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={downloading === "safety-stock"}
                block
                onClick={() => {
                  const params: Record<string, string> = { format: "xlsx" };
                  if (ssStatus) params.status = ssStatus;
                  download("safety-stock", params);
                }}
              >
                导出安全库存报表
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="报表说明">
        <Typography.Paragraph>
          <ul>
            <li>
              <strong>出入库流水报表</strong>：记录所有库存变动明细，用于审计与对账。
            </li>
            <li>
              <strong>批次追溯报表</strong>：全量批次数据，支持按状态、供应商筛选，用于供应链追溯。
            </li>
            <li>
              <strong>安全库存报表</strong>：各 SKU 的安全库存配置与当前状态，用于采购与补货决策。
            </li>
            <li>所有报表均为 Excel (.xlsx) 格式，可直接用于汇报与归档。</li>
          </ul>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
