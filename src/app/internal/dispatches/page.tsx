"use client";

import { useState, useEffect } from "react";
import {
  DISPATCH_STATUS_LABELS,
  MACHINERY_TYPE_LABELS,
  DispatchStatus,
} from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { DataTable, FilterBar, Pagination } from "@/components/DataTable";

interface Dispatch {
  id: number;
  dispatchNo: string;
  status: DispatchStatus;
  route?: string;
  remarks?: string;
  createdAt: string;
  reservation: {
    id: number;
    reservationNo: string;
    village: string;
    operationType: string;
    scheduledDate: string;
    area: number;
    totalAmount: number;
    field: { name: string };
    user: { realName: string };
  };
  machinery: {
    id: number;
    plateNo: string;
    machineryType: string;
  };
  driver: {
    id: number;
    name: string;
    phone: string;
  };
  createdBy: { realName: string };
  fuelRecords: { totalCost: number }[];
}

export default function DispatchesPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    machineryId: "",
    driverId: "",
  });
  const [savedFilters, setSavedFilters] = useState<
    { id: number; filterName: string; filterData: unknown }[]
  >([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    reservationId: "",
    machineryId: "",
    driverId: "",
    route: "",
    remarks: "",
  });
  const [reservations, setReservations] = useState<
    { id: number; reservationNo: string; village: string; operationType: string; scheduledDate: string; area: number }[]
  >([]);
  const [machineryList, setMachineryList] = useState<
    { id: number; plateNo: string; machineryType: string }[]
  >([]);
  const [drivers, setDrivers] = useState<
    { id: number; name: string; phone: string }[]
  >([]);

  const { get, post, loading } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    loadDispatches();
    loadSavedFilters();
  }, [page, filters]);

  const loadDispatches = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...filters,
    });
    const result = await get<Dispatch[]>(`/api/dispatches?${params.toString()}`);
    if (result.success && result.data) {
      setDispatches(result.data);
      setTotal(result.total || 0);
    }
  };

  const loadSavedFilters = async () => {
    const result = await get<typeof savedFilters>("/api/filters?pageName=internal-dispatches");
    if (result.success && result.data) {
      setSavedFilters(result.data);
    }
  };

  const loadOptions = async () => {
    const [resResult, machResult, driverResult] = await Promise.all([
      get<typeof reservations>("/api/reservations?status=APPROVED&pageSize=100"),
      get<typeof machineryList>("/api/machinery?status=IDLE&pageSize=100"),
      get<typeof drivers>("/api/drivers?pageSize=100"),
    ]);
    if (resResult.success && resResult.data) setReservations(resResult.data);
    if (machResult.success && machResult.data) setMachineryList(machResult.data);
    if (driverResult.success && driverResult.data) setDrivers(driverResult.data);
  };

  const handleCreate = async () => {
    if (!createData.reservationId || !createData.machineryId || !createData.driverId) {
      showToast("请填写必填项", "error");
      return;
    }

    const result = await post("/api/dispatches", {
      ...createData,
      reservationId: parseInt(createData.reservationId, 10),
      machineryId: parseInt(createData.machineryId, 10),
      driverId: parseInt(createData.driverId, 10),
    });
    if (result.success) {
      showToast(result.message || "派发成功", "success");
      setShowCreate(false);
      loadDispatches();
    } else {
      showToast(result.error || "派发失败", "error");
    }
  };

  const handleSaveFilter = async () => {
    const filterName = prompt("请输入筛选条件名称：");
    if (!filterName) return;

    const result = await post("/api/filters", {
      pageName: "internal-dispatches",
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
      key: "dispatchNo",
      title: "派发单号",
      width: "130px",
    },
    {
      key: "reservation",
      title: "预约信息",
      width: "180px",
      render: (item: Dispatch) => (
        <div>
          <div className="font-medium">{item.reservation.reservationNo}</div>
          <div className="text-sm text-gray-500">
            {item.reservation.village} · {MACHINERY_TYPE_LABELS[item.reservation.operationType as keyof typeof MACHINERY_TYPE_LABELS]}
          </div>
        </div>
      ),
    },
    {
      key: "machinery",
      title: "农机",
      width: "120px",
      render: (item: Dispatch) => (
        <div>
          <div>{item.machinery.plateNo}</div>
          <div className="text-sm text-gray-500">
            {MACHINERY_TYPE_LABELS[item.machinery.machineryType as keyof typeof MACHINERY_TYPE_LABELS]}
          </div>
        </div>
      ),
    },
    {
      key: "driver",
      title: "司机",
      width: "100px",
      render: (item: Dispatch) => (
        <div>
          <div>{item.driver.name}</div>
          <div className="text-sm text-gray-500">{item.driver.phone}</div>
        </div>
      ),
    },
    {
      key: "scheduledDate",
      title: "作业日期",
      width: "110px",
      render: (item: Dispatch) => formatDate(item.reservation.scheduledDate),
    },
    {
      key: "area",
      title: "面积(亩)",
      width: "80px",
      render: (item: Dispatch) => item.reservation.area.toFixed(2),
    },
    {
      key: "totalAmount",
      title: "合同金额",
      width: "100px",
      render: (item: Dispatch) => formatCurrency(item.reservation.totalAmount),
    },
    {
      key: "fuelCost",
      title: "油料成本",
      width: "90px",
      render: (item: Dispatch) =>
        formatCurrency(
          item.fuelRecords.reduce((sum, f) => sum + f.totalCost, 0)
        ),
    },
    {
      key: "status",
      title: "状态",
      width: "90px",
      render: (item: Dispatch) => (
        <span className={`badge ${
          item.status === DispatchStatus.COMPLETED
            ? "bg-green-100 text-green-800"
            : item.status === DispatchStatus.IN_TRANSIT
            ? "bg-orange-100 text-orange-800"
            : item.status === DispatchStatus.ARRIVED
            ? "bg-blue-100 text-blue-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {DISPATCH_STATUS_LABELS[item.status as keyof typeof DISPATCH_STATUS_LABELS]}
        </span>
      ),
    },
    {
      key: "createdBy",
      title: "派发人",
      width: "80px",
      render: (item: Dispatch) => item.createdBy?.realName || "-",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">路线派发管理</h1>
          <p className="text-gray-500 mt-1">
            为已审批的作业预约派发农机和司机
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setShowCreate(!showCreate);
            if (!showCreate) loadOptions();
          }}
        >
          + 新建派发
        </button>
      </div>

      {showCreate && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">新建路线派发</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作业预约 <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={createData.reservationId}
                onChange={(e) =>
                  setCreateData({ ...createData, reservationId: e.target.value })
                }
              >
                <option value="">请选择待派发的预约</option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reservationNo} - {r.village} - {MACHINERY_TYPE_LABELS[r.operationType as keyof typeof MACHINERY_TYPE_LABELS]} - {r.area}亩
                  </option>
                ))}
              </select>
            </div>
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
                <option value="">请选择可用农机</option>
                {machineryList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.plateNo} ({MACHINERY_TYPE_LABELS[m.machineryType as keyof typeof MACHINERY_TYPE_LABELS]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                司机 <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={createData.driverId}
                onChange={(e) =>
                  setCreateData({ ...createData, driverId: e.target.value })
                }
              >
                <option value="">请选择司机</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                行驶路线
              </label>
              <input
                type="text"
                className="input"
                placeholder="例如：镇政府→东庄村→作业地块"
                value={createData.route}
                onChange={(e) =>
                  setCreateData({ ...createData, route: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="派发备注信息"
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
              确认派发
            </button>
          </div>
        </div>
      )}

      <FilterBar
        onSaveFilter={handleSaveFilter}
        savedFilters={savedFilters}
        onApplyFilter={handleApplyFilter}
      >
        <div className="grid md:grid-cols-3 gap-4">
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
              {Object.entries(DISPATCH_STATUS_LABELS).map(([key, label]) => (
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              司机
            </label>
            <select
              className="input"
              value={filters.driverId}
              onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
            >
              <option value="">全部</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="btn-secondary mr-2"
            onClick={() => {
              setFilters({ status: "", machineryId: "", driverId: "" });
              setPage(1);
            }}
          >
            重置
          </button>
          <button className="btn-primary" onClick={() => { setPage(1); loadDispatches(); }}>
            查询
          </button>
        </div>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          data={dispatches}
          loading={loading}
          emptyText="暂无派发记录"
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
