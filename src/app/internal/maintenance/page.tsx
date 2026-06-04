"use client";

import { useState, useEffect } from "react";
import {
  MAINTENANCE_STATUS_LABELS,
  MACHINERY_TYPE_LABELS,
  MaintenanceStatus,
} from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { DataTable, FilterBar, Pagination } from "@/components/DataTable";

interface MaintenanceRecord {
  id: number;
  title: string;
  description: string;
  status: MaintenanceStatus;
  reportedDate: string;
  cost: number;
  parts?: string;
  remarks?: string;
  machinery: {
    id: number;
    plateNo: string;
    machineryType: string;
    status: string;
  };
  user: { realName: string };
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    machineryId: "",
  });
  const [savedFilters, setSavedFilters] = useState<
    { id: number; filterName: string; filterData: unknown }[]
  >([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    machineryId: "",
    title: "",
    description: "",
    reportedDate: new Date().toISOString().split("T")[0],
    cost: "",
    parts: "",
    remarks: "",
  });
  const [machineryList, setMachineryList] = useState<
    { id: number; plateNo: string; machineryType: string; status: string }[]
  >([]);

  const { get, post, loading } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    loadRecords();
    loadSavedFilters();
    loadOptions();
  }, [page, filters]);

  const loadRecords = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...filters,
    });
    const result = await get<MaintenanceRecord[]>(`/api/maintenance?${params.toString()}`);
    if (result.success && result.data) {
      setRecords(result.data);
      setTotal(result.total || 0);
    }
  };

  const loadSavedFilters = async () => {
    const result = await get<typeof savedFilters>("/api/filters?pageName=internal-maintenance");
    if (result.success && result.data) {
      setSavedFilters(result.data);
    }
  };

  const loadOptions = async () => {
    const result = await get<typeof machineryList>("/api/machinery?pageSize=100");
    if (result.success && result.data) setMachineryList(result.data);
  };

  const handleCreate = async () => {
    if (!createData.machineryId || !createData.title || !createData.description || !createData.reportedDate) {
      showToast("请填写必填项", "error");
      return;
    }

    const result = await post("/api/maintenance", {
      ...createData,
      machineryId: parseInt(createData.machineryId, 10),
      cost: createData.cost ? parseFloat(createData.cost) : 0,
    });
    if (result.success) {
      showToast(result.message || "维修记录上报成功，农机已暂停作业", "success");
      setShowCreate(false);
      loadRecords();
      loadOptions();
    } else {
      showToast(result.error || "操作失败", "error");
    }
  };

  const handleComplete = async (id: number) => {
    const result = await post(`/api/maintenance/${id}?action=complete`, {});
    if (result.success) {
      showToast("维修已完成，农机恢复可用", "success");
      loadRecords();
      loadOptions();
    } else {
      showToast(result.error || "操作失败", "error");
    }
  };

  const handleSaveFilter = async () => {
    const filterName = prompt("请输入筛选条件名称：");
    if (!filterName) return;

    const result = await post("/api/filters", {
      pageName: "internal-maintenance",
      filterName,
      filterData: filters,
    });

    if (result.success) {
      showToast("筛选条件已保存", "success");
      loadSavedFilters();
    } else {
      showToast(result.error || "保存失败", "error");
    }
  };

  const handleApplyFilter = (filterData: unknown) => {
    setFilters(filterData as typeof filters);
    setPage(1);
  };

  const columns = [
    {
      key: "reportedDate",
      title: "上报日期",
      width: "110px",
      render: (item: MaintenanceRecord) => formatDate(item.reportedDate),
    },
    {
      key: "machinery",
      title: "农机",
      width: "130px",
      render: (item: MaintenanceRecord) => (
        <div>
          <div>{item.machinery.plateNo}</div>
          <div className="text-sm text-gray-500">
            {MACHINERY_TYPE_LABELS[item.machinery.machineryType as keyof typeof MACHINERY_TYPE_LABELS]}
          </div>
        </div>
      ),
    },
    {
      key: "title",
      title: "故障标题",
      width: "150px",
    },
    {
      key: "description",
      title: "故障描述",
      width: "200px",
      render: (item: MaintenanceRecord) => (
        <div className="text-sm truncate" title={item.description}>
          {item.description}
        </div>
      ),
    },
    {
      key: "cost",
      title: "维修费用",
      width: "100px",
      render: (item: MaintenanceRecord) =>
        item.cost > 0 ? formatCurrency(item.cost) : "-",
    },
    {
      key: "parts",
      title: "更换部件",
      width: "120px",
      render: (item: MaintenanceRecord) => item.parts || "-",
    },
    {
      key: "status",
      title: "状态",
      width: "90px",
      render: (item: MaintenanceRecord) => (
        <span className={`badge ${
          item.status === MaintenanceStatus.COMPLETED
            ? "bg-green-100 text-green-800"
            : item.status === MaintenanceStatus.IN_PROGRESS
            ? "bg-orange-100 text-orange-800"
            : item.status === MaintenanceStatus.CANCELLED
            ? "bg-gray-100 text-gray-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {MAINTENANCE_STATUS_LABELS[item.status as keyof typeof MAINTENANCE_STATUS_LABELS]}
        </span>
      ),
    },
    {
      key: "machineryStatus",
      title: "农机状态",
      width: "90px",
      render: (item: MaintenanceRecord) => (
        <span className={`text-sm ${
          item.machinery.status === "MAINTENANCE" ? "text-red-600" :
          item.machinery.status === "IDLE" ? "text-green-600" : "text-blue-600"
        }`}>
          {item.machinery.status === "MAINTENANCE" ? "维修暂停" :
           item.machinery.status === "IDLE" ? "空闲" :
           item.machinery.status === "DISPATCHED" ? "作业中" : item.machinery.status}
        </span>
      ),
    },
    {
      key: "user",
      title: "上报人",
      width: "80px",
      render: (item: MaintenanceRecord) => item.user?.realName || "-",
    },
    {
      key: "actions",
      title: "操作",
      width: "100px",
      render: (item: MaintenanceRecord) => {
        const canComplete =
          item.status === MaintenanceStatus.REPORTED ||
          item.status === MaintenanceStatus.IN_PROGRESS;

        return (
          <div className="flex space-x-2">
            {canComplete && (
              <button
                className="text-sm text-green-600 hover:text-green-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(item.id);
                }}
              >
                完成维修
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">维修管理</h1>
          <p className="text-gray-500 mt-1">
            上报农机故障，维修期间农机自动暂停作业
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setShowCreate(!showCreate);
            if (!showCreate) loadOptions();
          }}
        >
          + 上报故障
        </button>
      </div>

      {showCreate && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">上报维修故障</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                农机 <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={createData.machineryId}
                onChange={(e) =>
                  setCreateData({ ...createData, machineryId: e.target.value })
                }
              >
                <option value="">请选择故障农机</option>
                {machineryList
                  .filter((m) => m.status !== "MAINTENANCE")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.plateNo} ({MACHINERY_TYPE_LABELS[m.machineryType as keyof typeof MACHINERY_TYPE_LABELS]})
                    </option>
                  ))}
              </select>
              {machineryList.filter((m) => m.status === "MAINTENANCE").length > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  * 已在维修中的农机不会显示在此列表中
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上报日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                value={createData.reportedDate}
                onChange={(e) =>
                  setCreateData({ ...createData, reportedDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                故障标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="例如：发动机异响、刹车失灵"
                value={createData.title}
                onChange={(e) =>
                  setCreateData({ ...createData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预计费用(元)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="可选，预计维修费用"
                value={createData.cost}
                onChange={(e) =>
                  setCreateData({ ...createData, cost: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                故障描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="详细描述故障现象、发生时间等信息"
                value={createData.description}
                onChange={(e) =>
                  setCreateData({ ...createData, description: e.target.value })
                }
              />
            </div>
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  更换部件
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="例如：机油滤芯、刹车片"
                  value={createData.parts}
                  onChange={(e) =>
                    setCreateData({ ...createData, parts: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="其他备注信息"
                  value={createData.remarks}
                  onChange={(e) =>
                    setCreateData({ ...createData, remarks: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-700">
              ⚠️ 上报后，该农机将自动标记为"维修暂停"状态，无法参与作业派发
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              className="btn-secondary"
              onClick={() => setShowCreate(false)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleCreate}>
              确认上报
            </button>
          </div>
        </div>
      )}

      <FilterBar
        onSaveFilter={handleSaveFilter}
        savedFilters={savedFilters}
        onApplyFilter={handleApplyFilter}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部</option>
              {Object.entries(MAINTENANCE_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              农机
            </label>
            <select
              className="input"
              value={filters.machineryId}
              onChange={(e) =>
                setFilters({ ...filters, machineryId: e.target.value })
              }
            >
              <option value="">全部</option>
              {machineryList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.plateNo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="btn-secondary mr-2"
            onClick={() => {
              setFilters({ status: "", machineryId: "" });
              setPage(1);
            }}
          >
            重置
          </button>
          <button className="btn-primary" onClick={() => { setPage(1); loadRecords(); }}>
            查询
          </button>
        </div>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          emptyText="暂无维修记录"
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
