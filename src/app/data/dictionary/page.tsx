"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/ui/ChartCard";
import {
  BookOpen,
  Database,
  Table,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/utils";

interface DataDictionaryItem {
  fieldName: string;
  fieldType: string;
  description: string;
  isRequired: boolean;
  example: string;
  dataSource: string;
}

interface DataDictionaryGroup {
  tableName: string;
  tableDescription: string;
  fields: DataDictionaryItem[];
}

const dataDictionary: DataDictionaryGroup[] = [
  {
    tableName: "visit_processes",
    tableDescription: "就诊流程主表，记录患者从挂号到取药的全流程时间戳",
    fields: [
      {
        fieldName: "id",
        fieldType: "UUID",
        description: "主键，唯一标识",
        isRequired: true,
        example: "a1b2c3d4-...",
        dataSource: "系统自动生成",
      },
      {
        fieldName: "visit_number_masked",
        fieldType: "VARCHAR(64)",
        description: "脱敏后的就诊号",
        isRequired: true,
        example: "门诊***1234",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "patient_type_id",
        fieldType: "UUID",
        description: "患者类型ID，关联patient_types表",
        isRequired: false,
        example: "pt-001",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "dept_id",
        fieldType: "UUID",
        description: "科室ID，关联departments表",
        isRequired: true,
        example: "dept-001",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "doctor_id",
        fieldType: "UUID",
        description: "医生ID，关联doctors表",
        isRequired: false,
        example: "doc-001",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "register_time",
        fieldType: "TIMESTAMP",
        description: "挂号时间",
        isRequired: false,
        example: "2024-01-15 08:30:00",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "checkin_time",
        fieldType: "TIMESTAMP",
        description: "签到时间",
        isRequired: false,
        example: "2024-01-15 08:35:00",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "triage_time",
        fieldType: "TIMESTAMP",
        description: "分诊时间",
        isRequired: false,
        example: "2024-01-15 08:40:00",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "call_time",
        fieldType: "TIMESTAMP",
        description: "叫号就诊时间",
        isRequired: false,
        example: "2024-01-15 09:15:00",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "payment_time",
        fieldType: "TIMESTAMP",
        description: "缴费时间",
        isRequired: false,
        example: "2024-01-15 09:45:00",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "medicine_time",
        fieldType: "TIMESTAMP",
        description: "取药时间",
        isRequired: false,
        example: "2024-01-15 10:00:00",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "wait_total_minutes",
        fieldType: "INT",
        description: "总等待时长（分钟），从挂号到取药",
        isRequired: false,
        example: "90",
        dataSource: "系统计算",
      },
      {
        fieldName: "wait_doctor_minutes",
        fieldType: "INT",
        description: "就诊等待时长（分钟），从分诊到叫号",
        isRequired: false,
        example: "35",
        dataSource: "系统计算",
      },
    ],
  },
  {
    tableName: "departments",
    tableDescription: "科室信息表",
    fields: [
      {
        fieldName: "id",
        fieldType: "UUID",
        description: "主键",
        isRequired: true,
        example: "dept-001",
        dataSource: "系统自动生成",
      },
      {
        fieldName: "dept_code",
        fieldType: "VARCHAR(32)",
        description: "科室编码",
        isRequired: true,
        example: "INTERNAL",
        dataSource: "人工维护",
      },
      {
        fieldName: "dept_name",
        fieldType: "VARCHAR(64)",
        description: "科室名称",
        isRequired: true,
        example: "内科",
        dataSource: "人工维护",
      },
      {
        fieldName: "location",
        fieldType: "GEOGRAPHY(Point)",
        description: "科室地理位置坐标",
        isRequired: false,
        example: "116.4074, 39.9042",
        dataSource: "人工维护",
      },
      {
        fieldName: "floor_number",
        fieldType: "INT",
        description: "所在楼层",
        isRequired: false,
        example: "2",
        dataSource: "人工维护",
      },
    ],
  },
  {
    tableName: "doctors",
    tableDescription: "医生信息表（已脱敏）",
    fields: [
      {
        fieldName: "id",
        fieldType: "UUID",
        description: "主键",
        isRequired: true,
        example: "doc-001",
        dataSource: "系统自动生成",
      },
      {
        fieldName: "doctor_code",
        fieldType: "VARCHAR(32)",
        description: "医生编码",
        isRequired: true,
        example: "DOC001",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "doctor_name_masked",
        fieldType: "VARCHAR(64)",
        description: "脱敏后的医生姓名",
        isRequired: true,
        example: "张***",
        dataSource: "系统脱敏",
      },
      {
        fieldName: "dept_id",
        fieldType: "UUID",
        description: "所属科室ID",
        isRequired: true,
        example: "dept-001",
        dataSource: "HIS系统导入",
      },
      {
        fieldName: "title",
        fieldType: "VARCHAR(32)",
        description: "职称",
        isRequired: false,
        example: "主任医师",
        dataSource: "HIS系统导入",
      },
    ],
  },
  {
    tableName: "patient_types",
    tableDescription: "患者类型字典表",
    fields: [
      {
        fieldName: "id",
        fieldType: "UUID",
        description: "主键",
        isRequired: true,
        example: "pt-001",
        dataSource: "系统自动生成",
      },
      {
        fieldName: "type_code",
        fieldType: "VARCHAR(32)",
        description: "类型编码",
        isRequired: true,
        example: "normal",
        dataSource: "人工维护",
      },
      {
        fieldName: "type_name",
        fieldType: "VARCHAR(64)",
        description: "类型名称",
        isRequired: true,
        example: "普通门诊",
        dataSource: "人工维护",
      },
    ],
  },
  {
    tableName: "annotations",
    tableDescription: "异常点标注表",
    fields: [
      {
        fieldName: "id",
        fieldType: "UUID",
        description: "主键",
        isRequired: true,
        example: "ann-001",
        dataSource: "系统自动生成",
      },
      {
        fieldName: "user_id",
        fieldType: "UUID",
        description: "标注人ID",
        isRequired: true,
        example: "user-001",
        dataSource: "系统记录",
      },
      {
        fieldName: "visit_id",
        fieldType: "UUID",
        description: "关联就诊记录ID",
        isRequired: false,
        example: "visit-001",
        dataSource: "用户选择",
      },
      {
        fieldName: "annotation_type",
        fieldType: "VARCHAR(32)",
        description: "标注类型",
        isRequired: true,
        example: "system_abnormal",
        dataSource: "用户选择",
      },
      {
        fieldName: "description",
        fieldType: "TEXT",
        description: "标注描述",
        isRequired: true,
        example: "系统故障导致等待时间过长",
        dataSource: "用户输入",
      },
    ],
  },
];

const metricDefinitions = [
  {
    name: "平均总等待时间",
    formula: "AVG(wait_total_minutes)",
    description: "所有患者从挂号到取药的平均等待时长",
    dimension: "时间",
    unit: "分钟",
  },
  {
    name: "平均就诊等待时间",
    formula: "AVG(wait_doctor_minutes)",
    description: "患者从分诊完成到医生叫号的平均等待时长",
    dimension: "时间",
    unit: "分钟",
  },
  {
    name: "就诊患者总量",
    formula: "COUNT(DISTINCT visit_number_masked)",
    description: "统计周期内的就诊总人次",
    dimension: "数量",
    unit: "人次",
  },
  {
    name: "瓶颈节点",
    formula: "MAX(各环节平均等待时间)",
    description: "平均等待时间最长的流程环节",
    dimension: "分类",
    unit: "-",
  },
  {
    name: "P95等待时间",
    formula: "PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wait_total_minutes)",
    description: "95%分位的等待时间，用于评估极端情况",
    dimension: "时间",
    unit: "分钟",
  },
];

export default function DataDictionaryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTables, setExpandedTables] = useState<string[]>([
    "visit_processes",
  ]);
  const [activeTab, setActiveTab] = useState<"tables" | "metrics">("tables");

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) =>
      prev.includes(tableName)
        ? prev.filter((t) => t !== tableName)
        : [...prev, tableName]
    );
  };

  const filteredDictionary = dataDictionary.filter(
    (group) =>
      group.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tableDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.fields.some(
        (f) =>
          f.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              数据字典
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              系统数据结构、字段说明和指标口径定义
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-neutral-100 rounded-md p-0.5">
            <button
              onClick={() => setActiveTab("tables")}
              className={cn(
                "px-3 py-1.5 text-sm rounded transition-colors",
                activeTab === "tables"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Table className="w-4 h-4" />
                表结构
              </span>
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={cn(
                "px-3 py-1.5 text-sm rounded transition-colors",
                activeTab === "metrics"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                指标口径
              </span>
            </button>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索表名、字段名或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {activeTab === "tables" ? (
          <div className="space-y-3">
            {filteredDictionary.map((group) => (
              <ChartCard
                key={group.tableName}
                title={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTable(group.tableName)}
                      className="p-1 hover:bg-neutral-100 rounded transition-colors"
                    >
                      {expandedTables.includes(group.tableName) ? (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>
                    <Table className="w-4 h-4 text-primary-500" />
                    <span className="font-mono text-sm">{group.tableName}</span>
                    <span className="text-xs text-neutral-500 font-normal">
                      {group.tableDescription}
                    </span>
                    <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">
                      {group.fields.length} 个字段
                    </span>
                  </div>
                }
              >
                {expandedTables.includes(group.tableName) && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-2 px-3 font-medium text-neutral-600">
                            字段名
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-neutral-600">
                            类型
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-neutral-600">
                            描述
                          </th>
                          <th className="text-center py-2 px-3 font-medium text-neutral-600">
                            必填
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-neutral-600">
                            示例
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-neutral-600">
                            数据来源
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.fields.map((field, idx) => (
                          <tr
                            key={field.fieldName}
                            className={cn(
                              "border-b border-neutral-100 hover:bg-neutral-50",
                              idx === group.fields.length - 1 &&
                                "border-b-0"
                            )}
                          >
                            <td className="py-2 px-3 font-mono text-primary-600">
                              {field.fieldName}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-neutral-500">
                              {field.fieldType}
                            </td>
                            <td className="py-2 px-3 text-neutral-700">
                              {field.description}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {field.isRequired ? (
                                <span className="text-xs bg-danger-50 text-danger-600 px-1.5 py-0.5 rounded">
                                  是
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">
                                  否
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-neutral-500">
                              {field.example}
                            </td>
                            <td className="py-2 px-3 text-neutral-500">
                              {field.dataSource}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>
            ))}
          </div>
        ) : (
          <ChartCard title="指标口径定义" subtitle="核心分析指标的计算公式和业务含义">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-3 font-medium text-neutral-600">
                      指标名称
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-600">
                      计算公式
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-600">
                      业务说明
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-600">
                      维度
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-neutral-600">
                      单位
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metricDefinitions.map((metric, idx) => (
                    <tr
                      key={metric.name}
                      className={cn(
                        "border-b border-neutral-100 hover:bg-neutral-50",
                        idx === metricDefinitions.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="py-3 px-3 font-medium text-neutral-800">
                        {metric.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-primary-600 bg-primary-50/50 rounded">
                        {metric.formula}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {metric.description}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                          {metric.dimension}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-500">
                        {metric.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}

        <ChartCard title="数据质量规则" subtitle="系统自动校验的数据质量标准">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "时间戳完整性",
                description: "每条记录至少包含挂号和叫号时间戳",
                severity: "高",
                rule: "register_time IS NOT NULL OR call_time IS NOT NULL",
              },
              {
                name: "时间顺序校验",
                description: "各环节时间戳必须符合先后逻辑",
                severity: "高",
                rule: "register_time <= checkin_time <= triage_time <= call_time",
              },
              {
                name: "等待时长合理性",
                description: "单次等待时长不超过24小时",
                severity: "中",
                rule: "wait_total_minutes < 1440",
              },
              {
                name: "科室关联完整性",
                description: "每条记录必须关联有效科室",
                severity: "高",
                rule: "dept_id IS NOT NULL AND EXISTS departments",
              },
              {
                name: "数据脱敏校验",
                description: "患者和医生信息已脱敏处理",
                severity: "高",
                rule: "visit_number_masked LIKE '%***%'",
              },
              {
                name: "日期范围校验",
                description: "就诊日期在合理范围内",
                severity: "中",
                rule: "visit_date BETWEEN '2020-01-01' AND NOW()",
              },
            ].map((rule, idx) => (
              <div
                key={idx}
                className="p-3 border border-neutral-200 rounded-lg hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-800 text-sm">
                    {rule.name}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      rule.severity === "高"
                        ? "bg-danger-50 text-danger-600"
                        : "bg-warning-50 text-warning-600"
                    )}
                  >
                    {rule.severity}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mb-2">
                  {rule.description}
                </p>
                <code className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded block">
                  {rule.rule}
                </code>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}
