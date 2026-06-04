"use client";

import { useState, useEffect } from "react";
import {
  SETTLEMENT_STATUS_LABELS,
  MACHINERY_TYPE_LABELS,
  SettlementStatus,
} from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { DataTable, FilterBar, Pagination } from "@/components/DataTable";

interface Settlement {
  id: number;
  settlementNo: string;
  actualArea: number;
  pricePerMu: number;
  totalAmount: number;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  netIncome: number;
  status: SettlementStatus;
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
    machinery?: { plateNo: string; machineryType: string };
    user: { realName: string };
  };
  user: { realName: string };
  contract?: { contractNo: string };
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [savedFilters, setSavedFilters] = useState<
    { id: number; filterName: string; filterData: unknown }[]
  >([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    reservationId: "",
    actualArea: "",
    fuelCost: "0",
    maintenanceCost: "0",
    otherCost: "0",
    remarks: "",
  });
  const [reservations, setReservations] = useState<
    { id: number; reservationNo: string; village: string; operationType: string; scheduledDate: string; area: number; pricePerMu: number; totalAmount: number }[]
  >([]);

  const { get, post, download, loading } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    loadSettlements();
    loadSavedFilters();
  }, [page, filters]);

  const loadSettlements = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...filters,
    });
    const result = await get<Settlement[]>(`/api/settlements?${params.toString()}`);
    if (result.success && result.data) {
      setSettlements(result.data);
      setTotal(result.total || 0);
    }
  };

  const loadSavedFilters = async () => {
    const result = await get<typeof savedFilters>("/api/filters?pageName=internal-settlements");
    if (result.success && result.data) {
      setSavedFilters(result.data);
    }
  };

  const loadOptions = async () => {
    const result = await get<typeof reservations>("/api/reservations?status=DISPATCHED&status=IN_PROGRESS&pageSize=100");
    if (result.success && result.data) {
      setReservations(result.data);
    }
  };

  const selectedReservation = reservations.find(
    (r) => r.id === parseInt(createData.reservationId, 10)
  );

  const actualArea = parseFloat(createData.actualArea) || 0;
  const pricePerMu = selectedReservation?.pricePerMu || 0;
  const totalAmount = actualArea * pricePerMu;
  const fuelCost = parseFloat(createData.fuelCost) || 0;
  const maintenanceCost = parseFloat(createData.maintenanceCost) || 0;
  const otherCost = parseFloat(createData.otherCost) || 0;
  const totalCost = fuelCost + maintenanceCost + otherCost;
  const netIncome = totalAmount - totalCost;

  const handleCreate = async () => {
    if (!createData.reservationId || !createData.actualArea) {
      showToast("请填写必填项", "error");
      return;
    }

    const result = await post(
      `/api/settlements?reservationId=${createData.reservationId}`,
      {
        actualArea: parseFloat(createData.actualArea),
        fuelCost,
        maintenanceCost,
        otherCost,
        remarks: createData.remarks || undefined,
      }
    );
    if (result.success) {
      showToast(result.message || "结算创建成功", "success");
      setShowCreate(false);
      loadSettlements();
    } else {
      showToast(result.error || "创建失败", "error");
    }
  };

  const handlePay = async (id: number) => {
    const result = await post(`/api/settlements/${id}?action=pay`, {});
    if (result.success) {
      showToast("结算已标记为已支付", "success");
      loadSettlements();
    } else {
      showToast(result.error || "操作失败", "error");
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      type: "settlements",
      ...filters,
    });
    download(
      `/api/export?${params.toString()}`,
      `收益结算_${formatDate(new Date())}.xlsx`
    );
  };

  const handleSaveFilter = async () => {
    const filterName = prompt("请输入筛选条件名称：");
    if (!filterName) return;

    const result = await post("/api/filters", {
      pageName: "internal-settlements",
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
      key: "settlementNo",
      title: "结算单号",
      width: "130px",
    },
    {
      key: "reservation",
      title: "预约信息",
      width: "180px",
      render: (item: Settlement) => (
        <div>
          <div className="font-medium">{item.reservation.reservationNo}</div>
          <div className="text-sm text-gray-500">
            {item.reservation.village} · {MACHINERY_TYPE_LABELS[item.reservation.operationType as keyof typeof MACHINERY_TYPE_LABELS]}
          </div>
        </div>
      ),
    },
    {
      key: "farmer",
      title: "农户",
      width: "80px",
      render: (item: Settlement) => item.reservation.user.realName,
    },
    {
      key: "machinery",
      title: "农机",
      width: "100px",
      render: (item: Settlement) =>
        item.reservation.machinery ? (
          <div>
            <div>{item.reservation.machinery.plateNo}</div>
            <div className="text-sm text-gray-500">
              {MACHINERY_TYPE_LABELS[item.reservation.machinery.machineryType as keyof typeof MACHINERY_TYPE_LABELS]}
            </div>
          </div>
        ) : (
          "-"
        ),
    },
    {
      key: "actualArea",
      title: "实际面积",
      width: "90px",
      render: (item: Settlement) => `${item.actualArea.toFixed(2)} 亩`,
    },
    {
      key: "totalAmount",
      title: "总收入",
      width: "100px",
      render: (item: Settlement) => (
        <span className="text-green-600 font-medium">
          {formatCurrency(item.totalAmount)}
        </span>
      ),
    },
    {
      key: "totalCost",
      title: "总成本",
      width: "100px",
      render: (item: Settlement) => (
        <span className="text-red-600">
          {formatCurrency(item.fuelCost + item.maintenanceCost + item.otherCost)}
        </span>
      ),
    },
    {
      key: "netIncome",
      title: "净收益",
      width: "100px",
      render: (item: Settlement) => (
        <span className={`font-medium ${item.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
          {formatCurrency(item.netIncome)}
        </span>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "90px",
      render: (item: Settlement) => (
        <span className={`badge ${
          item.status === SettlementStatus.PAID
            ? "bg-green-100 text-green-800"
            : item.status === SettlementStatus.CANCELLED
            ? "bg-gray-100 text-gray-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {SETTLEMENT_STATUS_LABELS[item.status as keyof typeof SETTLEMENT_STATUS_LABELS]}
        </span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      width: "100px",
      render: (item: Settlement) => {
        const canPay = item.status === SettlementStatus.PENDING;

        return (
          <div className="flex space-x-2">
            {canPay && (
              <button
                className="text-sm text-green-600 hover:text-green-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePay(item.id);
                }}
              >
                标记支付
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
          <h1 className="text-2xl font-bold text-gray-900">收益结算</h1>
          <p className="text-gray-500 mt-1">
            作业完成后进行收益结算，扣除油料、维修等成本
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            className="btn-success"
            onClick={handleExport}
          >
            导出 Excel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setShowCreate(!showCreate);
              if (!showCreate) loadOptions();
            }}
          >
            + 新建结算
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">新建收益结算</h3>
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
                <option value="">请选择待结算的作业预约</option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reservationNo} - {r.village} - {MACHINERY_TYPE_LABELS[r.operationType as keyof typeof MACHINERY_TYPE_LABELS]} - 合同 {formatCurrency(r.totalAmount)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                实际作业面积(亩) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder={selectedReservation ? `合同面积: ${selectedReservation.area} 亩` : "请输入实际作业面积"}
                value={createData.actualArea}
                onChange={(e) =>
                  setCreateData({ ...createData, actualArea: e.target.value })
                }
              />
            </div>
          </div>

          {selectedReservation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    油料成本(元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="油料费用"
                    value={createData.fuelCost}
                    onChange={(e) =>
                      setCreateData({ ...createData, fuelCost: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    维修成本(元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="维修费用"
                    value={createData.maintenanceCost}
                    onChange={(e) =>
                      setCreateData({ ...createData, maintenanceCost: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    其他成本(元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="其他费用"
                    value={createData.otherCost}
                    onChange={(e) =>
                      setCreateData({ ...createData, otherCost: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="border-t border-blue-200 pt-4 mt-2 grid md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">合同单价：</span>
                  <span className="font-medium">{formatCurrency(pricePerMu)}/亩</span>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">结算总收入：</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">总成本：</span>
                  <span className="font-medium text-red-600">{formatCurrency(totalCost)}</span>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">净收益：</span>
                  <span className={`font-medium ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(netIncome)}
                  </span>
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
              placeholder="结算备注信息"
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
              确认结算
            </button>
          </div>
        </div>
      )}

      <FilterBar
        onExport={handleExport}
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
              {Object.entries(SETTLEMENT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
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
              setFilters({ status: "", startDate: "", endDate: "" });
              setPage(1);
            }}
          >
            重置
          </button>
          <button className="btn-primary" onClick={() => { setPage(1); loadSettlements(); }}>
            查询
          </button>
        </div>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          data={settlements}
          loading={loading}
          emptyText="暂无结算记录"
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
