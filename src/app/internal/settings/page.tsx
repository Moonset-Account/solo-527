"use client";

import { useState, useEffect } from "react";
import {
  MACHINERY_TYPE_LABELS,
  MachineryStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { DataTable, FilterBar, Pagination } from "@/components/DataTable";

interface Machinery {
  id: number;
  name: string;
  plateNumber: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  status: MachineryStatus;
  currentFuel: number;
  fuelCapacity: number;
  efficiency: number;
  purchaseDate: string;
  createdAt: string;
}

interface Field {
  id: number;
  village: string;
  location: string;
  area: number;
  cropType: string;
  ownerName: string;
  ownerPhone: string;
  description?: string;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  licenseNo: string;
  village: string;
  machineryId?: number;
  machinery?: { name: string; plateNumber: string };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"machinery" | "fields" | "drivers">("machinery");
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);

  const { get, post, loading } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    if (activeTab === "machinery") loadMachinery();
    else if (activeTab === "fields") loadFields();
    else if (activeTab === "drivers") loadDrivers();
  }, [activeTab, page]);

  const loadMachinery = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const result = await get(`/api/machinery?${params.toString()}`);
    if (result.success) {
      setMachinery(result.data as Machinery[]);
      setTotal(result.total || 0);
    }
  };

  const loadFields = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const result = await get(`/api/fields?${params.toString()}`);
    if (result.success) {
      setFields(result.data as Field[]);
      setTotal(result.total || 0);
    }
  };

  const loadDrivers = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const result = await get(`/api/drivers?${params.toString()}`);
    if (result.success) {
      setDrivers(result.data as Driver[]);
      setTotal(result.total || 0);
    }
  };

  const machineryColumns = [
    {
      key: "name",
      title: "农机名称",
      width: "120px",
    },
    {
      key: "plateNumber",
      title: "车牌号",
      width: "120px",
    },
    {
      key: "type",
      title: "类型",
      width: "80px",
      render: (item: Machinery) =>
        MACHINERY_TYPE_LABELS[item.type as keyof typeof MACHINERY_TYPE_LABELS],
    },
    {
      key: "brand",
      title: "品牌",
      width: "100px",
    },
    {
      key: "model",
      title: "型号",
      width: "120px",
    },
    {
      key: "year",
      title: "年份",
      width: "70px",
    },
    {
      key: "status",
      title: "状态",
      width: "90px",
      render: (item: Machinery) => (
        <span className={`badge ${
          item.status === MachineryStatus.IDLE ? "bg-green-100 text-green-800" :
          item.status === MachineryStatus.DISPATCHED ? "bg-blue-100 text-blue-800" :
          item.status === MachineryStatus.MAINTENANCE ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {item.status === MachineryStatus.IDLE ? "空闲" :
           item.status === MachineryStatus.DISPATCHED ? "作业中" :
           item.status === MachineryStatus.MAINTENANCE ? "维修中" : item.status}
        </span>
      ),
    },
    {
      key: "fuel",
      title: "油量",
      width: "120px",
      render: (item: Machinery) => {
        const percent = (item.currentFuel / item.fuelCapacity) * 100;
        return (
          <div>
            <div className="text-sm">{item.currentFuel.toFixed(0)} / {item.fuelCapacity} L</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full ${percent > 30 ? "bg-green-500" : percent > 10 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "purchaseDate",
      title: "购置日期",
      width: "100px",
      render: (item: Machinery) => formatDate(item.purchaseDate),
    },
  ];

  const fieldColumns = [
    {
      key: "location",
      title: "地块位置",
      width: "150px",
    },
    {
      key: "village",
      title: "所属村庄",
      width: "120px",
    },
    {
      key: "area",
      title: "面积(亩)",
      width: "100px",
      render: (item: Field) => item.area.toFixed(2),
    },
    {
      key: "cropType",
      title: "作物类型",
      width: "100px",
    },
    {
      key: "ownerName",
      title: "联系人",
      width: "100px",
    },
    {
      key: "ownerPhone",
      title: "联系电话",
      width: "120px",
    },
  ];

  const driverColumns = [
    {
      key: "name",
      title: "姓名",
      width: "80px",
    },
    {
      key: "phone",
      title: "电话",
      width: "120px",
    },
    {
      key: "licenseNo",
      title: "驾驶证号",
      width: "150px",
    },
    {
      key: "village",
      title: "所属村庄",
      width: "100px",
    },
    {
      key: "machinery",
      title: "关联农机",
      width: "120px",
      render: (item: Driver) =>
        item.machinery ? `${item.machinery.name} (${item.machinery.plateNumber})` : "-",
    },
  ];

  const tabs = [
    { key: "machinery", label: "农机档案", icon: "🚜" },
    { key: "fields", label: "作业地块", icon: "🌾" },
    { key: "drivers", label: "司机管理", icon: "👨‍🌾" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">基础数据管理</h1>
        <p className="text-gray-500 mt-1">
          维护农机档案、作业地块和司机信息
        </p>
      </div>

      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => {
              setActiveTab(tab.key as typeof activeTab);
              setPage(1);
            }}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === "machinery" && (
          <>
            <DataTable
              columns={machineryColumns}
              data={machinery}
              loading={loading}
              emptyText="暂无农机记录"
            />
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
        {activeTab === "fields" && (
          <>
            <DataTable
              columns={fieldColumns}
              data={fields}
              loading={loading}
              emptyText="暂无地块记录"
            />
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
        {activeTab === "drivers" && (
          <>
            <DataTable
              columns={driverColumns}
              data={drivers}
              loading={loading}
              emptyText="暂无司机记录"
            />
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
