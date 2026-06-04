"use client";

import { useState, useEffect } from "react";
import {
  MACHINERY_TYPE_LABELS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
  ReservationStatus,
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
  weatherCondition?: string;
  rescheduleReason?: string;
  createdAt: string;
}

export default function ExternalReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [savedFilters, setSavedFilters] = useState<
    { id: number; filterName: string; filterData: unknown }[]
  >([]);

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
    const result = await get<typeof savedFilters>("/api/filters?pageName=external-reservations");
    if (result.success && result.data) {
      setSavedFilters(result.data);
    }
  };

  const handleWithdraw = async (id: number, reason: string) => {
    const result = await post(`/api/reservations/${id}?action=withdraw`, {
      reason,
    });
    if (result.success) {
      showToast("预约已撤回", "success");
      loadReservations();
    } else {
      showToast(result.error || "撤回失败", "error");
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      type: "reservations",
      ...filters,
    });
    download(
      `/api/export?${params.toString()}`,
      `我的预约_${formatDate(new Date())}.xlsx`
    );
  };

  const handleSaveFilter = async () => {
    const filterName = prompt("请输入筛选条件名称：");
    if (!filterName) return;

    const result = await post("/api/filters", {
      pageName: "external-reservations",
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
      width: "120px",
      render: (item: Reservation) => (
        <div>
          <div>{formatDate(item.scheduledDate)}</div>
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
      key: "weatherCondition",
      title: "天气",
      width: "80px",
      render: (item: Reservation) => (
        <span className={item.weatherCondition === "雨天" ? "text-blue-600" : ""}>
          {item.weatherCondition || "-"}
        </span>
      ),
    },
    {
      key: "contactName",
      title: "联系人",
      width: "80px",
    },
    {
      key: "actions",
      title: "操作",
      width: "120px",
      render: (item: Reservation) => {
        const canWithdraw =
          item.status === ReservationStatus.PENDING ||
          item.status === ReservationStatus.APPROVED;
        return (
          <div className="flex space-x-2">
            {canWithdraw && (
              <button
                className="text-sm text-red-600 hover:text-red-800"
                onClick={(e) => {
                  e.stopPropagation();
                  const reason = prompt("请输入撤回原因：");
                  if (reason) handleWithdraw(item.id, reason);
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
          <h1 className="text-2xl font-bold text-gray-900">我的预约</h1>
          <p className="text-gray-500 mt-1">查看所有预约记录和状态</p>
        </div>
      </div>

      <FilterBar
        onExport={handleExport}
        onSaveFilter={handleSaveFilter}
        savedFilters={savedFilters}
        onApplyFilter={handleApplyFilter}
      >
        <div className="grid md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              搜索
            </label>
            <input
              type="text"
              className="input"
              placeholder="预约编号/联系人"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="btn-secondary mr-2"
            onClick={() => {
              setFilters({ status: "", startDate: "", endDate: "", search: "" });
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
