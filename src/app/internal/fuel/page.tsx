"use client";

import { useState, useEffect } from "react";
import { DataTable, Pagination, FilterBar } from "@/components/DataTable";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { MACHINERY_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";

interface FuelRecord {
  id: number;
  fuelAmount: number;
  fuelPrice: number;
  totalCost: number;
  fillDate: string;
  odometer?: number;
  remarks?: string;
  machinery: {
    id: number;
    plateNo: string;
    machineryType: string;
    currentFuel: number;
    fuelCapacity: number;
  };
  dispatch?: {
    id: number;
    dispatchNo: string;
    driver: { name: string };
  };
  user: { realName: string };
}

export default function FuelPage() {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    machineryId: "",
    dispatchId: "",
    startDate: "",
    endDate: "",
  });
  const [savedFilters, setSavedFilters] = useState<
    { id: number; filterName: string; filterData: unknown }[]
  >([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    machineryId: "",
    dispatchId: "",
    fuelAmount: "",
    fuelPrice: "7.5",
    fillDate: new Date().toISOString().split("T")[0],
    odometer: "",
    remarks: "",
  });
  const [machineryList, setMachineryList] = useState<
    { id: number; plateNo: string; machineryType: string; currentFuel: number; fuelCapacity: number }[]
  >([]);
  const [dispatches, setDispatches] = useState<
    { id: number; dispatchNo: string; machineryId: number; driver: { name: string } }[]
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
    const result = await get<FuelRecord[]>(`/api/fuel?${params.toString()}`);
    if (result.success && result.data) {
      setRecords(result.data);
      setTotal(result.total || 0);
    }
  };

  const loadSavedFilters = async () => {
    const result = await get<typeof savedFilters>("/api/filters?pageName=internal-fuel");
    if (result.success && result.data) {
      setSavedFilters(result.data);
    }
  };

  const loadOptions = async () => {
    const [machResult, dispResult] = await Promise.all([
      get<typeof machineryList>("/api/machinery?pageSize=100"),
      get<typeof dispatches>("/api/dispatches?pageSize=100"),
    ]);
    if (machResult.success && machResult.data) setMachineryList(machResult.data);
    if (dispResult.success && dispResult.data) setDispatches(dispResult.data);
  };

  const handleCreate = async () => {
    if (!createData.machineryId || !createData.fuelAmount || !createData.fuelPrice || !createData.fillDate) {
      showToast("请填写必填项", "error");
      return;
    }

    const result = await post("/api/fuel", {
      ...createData,
      machineryId: parseInt(createData.machineryId, 10),
      dispatchId: createData.dispatchId ? parseInt(createData.dispatchId, 10) : undefined,
      fuelAmount: parseFloat(createData.fuelAmount),
      fuelPrice: parseFloat(createData.fuelPrice),
      odometer: createData.odometer ? parseFloat(createData.odometer) : undefined,
    });
    if (result.success) {
      showToast(result.message || "油料登记成功", "success");
      setShowCreate(false);
      loadRecords();
      loadOptions();
    } else {
      showToast(result.error || "登记失败", "error");
    }
  };

  const handleSaveFilter = async () => {
    const filterName = prompt("请输入筛选条件名称：");
    if (!filterName) return;

    const result = await post("/api/filters", {
      pageName: "internal-fuel",
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

  const selectedMachinery = machineryList.find(
    (m) => m.id === parseInt(createData.machineryId, 10)
  );
  const calculatedTotal = (parseFloat(createData.fuelAmount) || 0) * (parseFloat(createData.fuelPrice) || 0);
  const fuelAfterFill = selectedMachinery
    ? Math.min(selectedMachinery.currentFuel + (parseFloat(createData.fuelAmount) || 0), selectedMachinery.fuelCapacity)
    : 0;

  const columns = [
    {
      key: "fillDate",
      title: "加油日期",
      width: "110px",
      render: (item: FuelRecord) => formatDate(item.fillDate),
    },
    {
      key: "machinery",
      title: "农机",
      width: "130px",
      render: (item: FuelRecord) => (
        <div>
          <div>{item.machinery.plateNo}</div>
          <div className="text-sm text-gray-500">
            {MACHINERY_TYPE_LABELS[item.machinery.machineryType as keyof typeof MACHINERY_TYPE_LABELS]}
          </div>
        </div>
      ),
    },
    {
      key: "fuelAmount",
      title: "加油量(L)",
      width: "90px",
      render: (item: FuelRecord) => item.fuelAmount.toFixed(1),
    },
    {
      key: "fuelPrice",
      title: "单价(元)",
      width: "80px",
      render: (item: FuelRecord) => item.fuelPrice.toFixed(2),
    },
    {
      key: "totalCost",
      title: "总金额",
      width: "100px",
      render: (item: FuelRecord) => formatCurrency(item.totalCost),
    },
    {
      key: "dispatch",
      title: "关联派发",
      width: "130px",
      render: (item: FuelRecord) => (
        <div>
          {item.dispatch ? (
            <>
              <div>{item.dispatch.dispatchNo}</div>
              <div className="text-sm text-gray-500">
                司机：{item.dispatch.driver.name}
              </div>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: "odometer",
      title: "里程表(km)",
      width: "100px",
      render: (item: FuelRecord) => item.odometer?.toFixed(0) || "-",
    },
    {
      key: "fuelLevel",
      title: "当前油量",
      width: "100px",
      render: (item: FuelRecord) => {
        const percent = (item.machinery.currentFuel / item.machinery.fuelCapacity) * 100;
        return (
          <div>
            <div className="text-sm">{item.machinery.currentFuel.toFixed(0)} / {item.machinery.fuelCapacity} L</div>
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
      key: "user",
      title: "登记人",
      width: "80px",
      render: (item: FuelRecord) => item.user?.realName || "-",
    },
    {
      key: "remarks",
      title: "备注",
      width: "120px",
      render: (item: FuelRecord) => item.remarks || "-",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">油料登记管理</h1>
          <p className="text-gray-500 mt-1">
            记录农机加油情况，自动更新油箱油量
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setShowCreate(!showCreate);
            if (!showCreate) loadOptions();
          }}
        >
          + 登记加油
        </button>
      </div>

      {showCreate && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">油料登记</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
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
                <option value="">请选择农机</option>
                {machineryList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.plateNo} ({MACHINERY_TYPE_LABELS[m.machineryType as keyof typeof MACHINERY_TYPE_LABELS]}) - 剩余 {m.currentFuel.toFixed(0)}L
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联派发
              </label>
              <select
                className="input"
                value={createData.dispatchId}
                onChange={(e) =>
                  setCreateData({ ...createData, dispatchId: e.target.value })
                }
              >
                <option value="">不关联</option>
                {dispatches
                  .filter((d) => !createData.machineryId || d.machineryId === parseInt(createData.machineryId, 10))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.dispatchNo} - {d.driver.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                加油日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                value={createData.fillDate}
                onChange={(e) =>
                  setCreateData({ ...createData, fillDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                加油量(L) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="input"
                placeholder="请输入加油量"
                value={createData.fuelAmount}
                onChange={(e) =>
                  setCreateData({ ...createData, fuelAmount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                单价(元/L) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="请输入单价"
                value={createData.fuelPrice}
                onChange={(e) =>
                  setCreateData({ ...createData, fuelPrice: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                当前里程(km)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="input"
                placeholder="可选，里程表读数"
                value={createData.odometer}
                onChange={(e) =>
                  setCreateData({ ...createData, odometer: e.target.value })
                }
              />
            </div>
          </div>

          {selectedMachinery && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">当前油量：</span>
                  <span className="font-medium">{selectedMachinery.currentFuel.toFixed(0)} L</span>
                  <span className="text-gray-500"> / {selectedMachinery.fuelCapacity} L</span>
                </div>
                <div>
                  <span className="text-gray-600">加油后预计：</span>
                  <span className="font-medium text-green-600">{fuelAfterFill.toFixed(0)} L</span>
                </div>
                <div>
                  <span className="text-gray-600">预计总金额：</span>
                  <span className="font-medium text-orange-600">{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="加油备注信息"
              value={createData.remarks}
              onChange={(e) =>
                setCreateData({ ...createData, remarks: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              className="btn-secondary"
              onClick={() => setShowCreate(false)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleCreate}>
              确认登记
            </button>
          </div>
        </div>
      )}

      <FilterBar
        onSaveFilter={handleSaveFilter}
        savedFilters={savedFilters}
        onApplyFilter={handleApplyFilter}
      >
        <div className="grid md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开始日期
            </label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束日期
            </label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="btn-secondary mr-2"
            onClick={() => {
              setFilters({ machineryId: "", dispatchId: "", startDate: "", endDate: "" });
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
          emptyText="暂无油料记录"
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
