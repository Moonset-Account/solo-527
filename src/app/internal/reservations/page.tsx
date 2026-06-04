"use client";

import { useState, useEffect } from "react";
import {
  MACHINERY_TYPE_LABELS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
  ReservationStatus,
  MachineryType,
} from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { DataTable, FilterBar, Pagination } from "@/components/DataTable";

interface Reservation {
  id: number;
  reservationNo: string;
  village: string;
  operationType: string;
  scheduledDate: string;
  area: number;
  pricePerMu: number;
  totalAmount: number;
  status: ReservationStatus;
  contactName: string;
  contactPhone: string;
  originalDate?: string;
  originalOrder?: number;
  weatherCondition?: string;
  rescheduleReason?: string;
  user: { realName: string };
  handledBy?: { realName: string };
}

export default function InternalReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    village: "",
    operationType: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [savedFilters, setSavedFilters] = useState<
    { id: number; filterName: string; filterData: unknown }[]
  >([]);
  const [showBatchReschedule, setShowBatchReschedule] = useState(false);
  const [batchRescheduleData, setBatchRescheduleData] = useState({
    date: "",
    village: "",
    newDate: "",
    reason: "雨天",
  });

  const { get, post, download, loading } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    loadReservations();
    loadSavedFilters();
  }, [page, filters]);

  const loadReservations = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...filters,
    });
    const result = await get<Reservation[]>(`/api/reservations?${params.toString()}`);
    if (result.success && result.data) {
      setReservations(result.data);
      setTotal(result.total || 0);
    }
  };

  const loadSavedFilters = async () => {
    const result = await get<typeof savedFilters>("/api/filters?pageName=internal-reservations");
    if (result.success && result.data) {
      setSavedFilters(result.data);
    }
  };

  const handleApprove = async (id: number) => {
    const remarks = prompt("请输入审批备注（可选）：");
    const result = await post(`/api/reservations/${id}?action=approve`, {
      remarks: remarks || undefined,
    });
    if (result.success) {
      showToast("审批通过", "success");
      loadReservations();
    } else {
      showToast(result.error || "审批失败", "error");
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("请输入拒绝原因：");
    if (!reason) return;

    const result = await post(`/api/reservations/${id}?action=reject`, {
      reason,
    });
    if (result.success) {
      showToast("已拒绝预约", "success");
      loadReservations();
    } else {
      showToast(result.error || "操作失败", "error");
    }
  };

  const handleWithdraw = async (id: number) => {
    const reason = prompt("请输入撤回原因：");
    if (!reason) return;

    const result = await post(`/api/reservations/${id}?action=withdraw`, {
      reason,
    });
    if (result.success) {
      showToast("已撤回预约", "success");
      loadReservations();
    } else {
      showToast(result.error || "操作失败", "error");
    }
  };

  const handleBatchReschedule = async () => {
    if (!batchRescheduleData.date || !batchRescheduleData.newDate) {
      showToast("请填写原日期和新日期", "error");
      return;
    }

    const result = await post(
      "/api/reservations/batch-reschedule",
      batchRescheduleData
    );
    if (result.success) {
      showToast(result.message || "批量改期成功", "success");
      setShowBatchReschedule(false);
      loadReservations();
    } else {
      showToast(result.error || "改期失败", "error");
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      type: "reservations",
      ...filters,
    });
    download(
      `/api/export?${params.toString()}`,
      `作业预约_${formatDate(new Date())}.xlsx`
    );
  };

  const handleSaveFilter = async () => {
    const filterName = prompt("请输入筛选条件名称：");
    if (!filterName) return;

    const result = await post("/api/filters", {
      pageName: "internal-reservations",
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
      key: "reservationNo",
      title: "预约编号",
      width: "140px",
    },
    {
      key: "village",
      title: "村庄",
      width: "100px",
    },
    {
      key: "operationType",
      title: "作业类型",
      width: "80px",
      render: (item: Reservation) =>
        MACHINERY_TYPE_LABELS[item.operationType as keyof typeof MACHINERY_TYPE_LABELS],
    },
    {
      key: "scheduledDate",
      title: "预约日期",
      width: "130px",
      render: (item: Reservation) => (
        <div>
          <div>{formatDate(item.scheduledDate)}</div>
          {item.originalOrder && (
            <div className="text-xs text-gray-500">顺序: #{item.originalOrder}</div>
          )}
          {item.originalDate && (
            <div className="text-xs text-orange-600">
              原: {formatDate(item.originalDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "area",
      title: "面积(亩)",
      width: "80px",
      render: (item: Reservation) => item.area.toFixed(2),
    },
    {
      key: "totalAmount",
      title: "金额",
      width: "100px",
      render: (item: Reservation) => formatCurrency(item.totalAmount),
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (item: Reservation) => (
        <span
          className={`badge ${
            RESERVATION_STATUS_COLORS[
              item.status as keyof typeof RESERVATION_STATUS_COLORS
            ]
          }`}
        >
          {
            RESERVATION_STATUS_LABELS[
              item.status as keyof typeof RESERVATION_STATUS_LABELS
            ]
          }
        </span>
      ),
    },
    {
      key: "applicant",
      title: "申请人",
      width: "80px",
      render: (item: Reservation) => item.user?.realName || "-",
    },
    {
      key: "handler",
      title: "处理人",
      width: "80px",
      render: (item: Reservation) => item.handledBy?.realName || "-",
    },
    {
      key: "weather",
      title: "天气",
      width: "80px",
      render: (item: Reservation) => (
        <span className={item.weatherCondition === "雨天" ? "text-blue-600" : ""}>
          {item.weatherCondition || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      width: "180px",
      render: (item: Reservation) => {
        const canApprove = item.status === ReservationStatus.PENDING;
        const canReject = item.status === ReservationStatus.PENDING;
        const canWithdraw =
          item.status === ReservationStatus.PENDING ||
          item.status === ReservationStatus.APPROVED;

        return (
          <div className="flex space-x-2">
            {canApprove && (
              <button
                className="text-sm text-green-600 hover:text-green-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(item.id);
                }}
              >
                审批
              </button>
            )}
            {canReject && (
              <button
                className="text-sm text-red-600 hover:text-red-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(item.id);
                }}
              >
                拒绝
              </button>
            )}
            {canWithdraw && (
              <button
                className="text-sm text-orange-600 hover:text-orange-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWithdraw(item.id);
                }}
              >
                撤回
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
          <h1 className="text-2xl font-bold text-gray-900">作业预约管理</h1>
          <p className="text-gray-500 mt-1">
            审批、派发、改期作业预约，支持雨天批量改期
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowBatchReschedule(!showBatchReschedule)}
        >
          🌧️ 雨天批量改期
        </button>
      </div>

      {showBatchReschedule && (
        <div className="card p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">雨天批量改期</h3>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                原日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                value={batchRescheduleData.date}
                onChange={(e) =>
                  setBatchRescheduleData({
                    ...batchRescheduleData,
                    date: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                村庄（可选）
              </label>
              <input
                type="text"
                className="input"
                placeholder="不填则全部村庄"
                value={batchRescheduleData.village}
                onChange={(e) =>
                  setBatchRescheduleData({
                    ...batchRescheduleData,
                    village: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                value={batchRescheduleData.newDate}
                onChange={(e) =>
                  setBatchRescheduleData({
                    ...batchRescheduleData,
                    newDate: e.target.value,
                  })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                改期原因
              </label>
              <input
                type="text"
                className="input"
                value={batchRescheduleData.reason}
                onChange={(e) =>
                  setBatchRescheduleData({
                    ...batchRescheduleData,
                    reason: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            改期将保留原预约顺序和合同价格，并记录天气为"雨天"
          </p>
          <div className="flex justify-end space-x-3">
            <button
              className="btn-secondary"
              onClick={() => setShowBatchReschedule(false)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={handleBatchReschedule}>
              确认改期
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
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">全部</option>
              {Object.entries(RESERVATION_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              村庄
            </label>
            <input
              type="text"
              className="input"
              placeholder="村庄名称"
              value={filters.village}
              onChange={(e) =>
                setFilters({ ...filters, village: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作业类型
            </label>
            <select
              className="input"
              value={filters.operationType}
              onChange={(e) =>
                setFilters({ ...filters, operationType: e.target.value })
              }
            >
              <option value="">全部</option>
              {Object.entries(MACHINERY_TYPE_LABELS).map(([key, label]) => (
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
        <div className="flex items-center justify-between mt-4">
          <input
            type="text"
            className="input max-w-xs"
            placeholder="搜索预约编号/联系人/电话"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
          />
          <div className="flex space-x-2">
            <button
              className="btn-secondary"
              onClick={() => {
                setFilters({
                  status: "",
                  village: "",
                  operationType: "",
                  startDate: "",
                  endDate: "",
                  search: "",
                });
                setPage(1);
              }}
            >
              重置
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setPage(1);
                loadReservations();
              }}
            >
              查询
            </button>
          </div>
        </div>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          data={reservations}
          loading={loading}
          emptyText="暂无预约记录"
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
