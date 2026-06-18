import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useState } from "react";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const keyword = url.searchParams.get("keyword") || "";
  const status = url.searchParams.get("status") || "";
  const paymentStatus = url.searchParams.get("paymentStatus") || "";
  const technicianId = url.searchParams.get("technicianId") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (technicianId) params.set("technicianId", technicianId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const [apptRes, techRes] = await Promise.all([
      fetch(`${baseUrl}/api/appointments?${params.toString()}`),
      fetch(`${baseUrl}/api/technicians/list/active`),
    ]);

    const apptData = await apptRes.json();
    const techData = await techRes.json();

    return json({
      list: apptData.data?.list || [],
      total: apptData.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      status,
      paymentStatus,
      technicianId,
      startDate,
      endDate,
      technicians: techData.data || [],
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      keyword,
      status,
      paymentStatus,
      technicianId,
      startDate,
      endDate,
      technicians: [],
    });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const _action = formData.get("_action");

  if (_action === "status") {
    const id = formData.get("id");
    const status = formData.get("status");
    const remark = formData.get("remark");

    const res = await fetch(`${baseUrl}/api/appointments/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remark }),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "payment") {
    const id = formData.get("id");
    const paidAmount = parseFloat(formData.get("paidAmount") || "0");
    const paymentMethod = formData.get("paymentMethod");
    const discount = parseFloat(formData.get("discount") || "0");
    const remark = formData.get("remark");

    const res = await fetch(`${baseUrl}/api/appointments/${id}/payment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAmount, paymentMethod, discount, remark }),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "delete") {
    const id = formData.get("id");
    const res = await fetch(`${baseUrl}/api/appointments/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return json(data);
  }

  return json({ success: false, message: "无效操作" });
}

const statusColors: Record<string, string> = {
  待确认: "badge-warning",
  已确认: "badge-info",
  已到店: "badge-info",
  服务中: "badge-warning",
  已完成: "badge-success",
  已取消: "badge-gray",
  已过期: "badge-danger",
};

export default function Appointments() {
  const { list, total, page, pageSize, keyword, status, paymentStatus, technicianId, startDate, endDate, technicians } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentItem, setPaymentItem] = useState<any>(null);
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("现金");
  const [discount, setDiscount] = useState("0");

  const [filterKeyword, setFilterKeyword] = useState(keyword);
  const [filterStatus, setFilterStatus] = useState(status);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState(paymentStatus);
  const [filterTechnicianId, setFilterTechnicianId] = useState(technicianId);
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);

  const totalPages = Math.ceil(total / pageSize);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterKeyword) params.set("keyword", filterKeyword);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPaymentStatus) params.set("paymentStatus", filterPaymentStatus);
    if (filterTechnicianId) params.set("technicianId", filterTechnicianId);
    if (filterStartDate) params.set("startDate", filterStartDate);
    if (filterEndDate) params.set("endDate", filterEndDate);
    params.set("page", "1");
    window.location.search = params.toString() ? `?${params.toString()}` : "";
  };

  const handleResetFilter = () => {
    setFilterKeyword("");
    setFilterStatus("");
    setFilterPaymentStatus("");
    setFilterTechnicianId("");
    setFilterStartDate("");
    setFilterEndDate("");
    window.location.search = "";
  };

  const handlePayment = () => {
    if (!paymentItem) return;
    const formData = new FormData();
    formData.set("_action", "payment");
    formData.set("id", paymentItem._id);
    formData.set("paidAmount", paidAmount);
    formData.set("paymentMethod", paymentMethod);
    formData.set("discount", discount);
    fetcher.submit(formData, { method: "post" });
    setShowPaymentModal(false);
  };

  const openPayment = (item: any) => {
    setPaymentItem(item);
    const remain = (item.price || 0) - (item.paidAmount || 0);
    setPaidAmount(remain > 0 ? remain.toFixed(2) : "0.00");
    setPaymentMethod("现金");
    setDiscount("0");
    setShowPaymentModal(true);
  };

  const handleStatus = (id: string, newStatus: string) => {
    if (confirm(`确定要将状态改为"${newStatus}"吗？`)) {
      const formData = new FormData();
      formData.set("_action", "status");
      formData.set("id", id);
      formData.set("status", newStatus);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个预约吗？")) {
      const formData = new FormData();
      formData.set("_action", "delete");
      formData.set("id", id);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterKeyword) params.set("keyword", filterKeyword);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPaymentStatus) params.set("paymentStatus", filterPaymentStatus);
    if (filterTechnicianId) params.set("technicianId", filterTechnicianId);
    if (filterStartDate) params.set("startDate", filterStartDate);
    if (filterEndDate) params.set("endDate", filterEndDate);
    window.location.href = `/api/export/appointments?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">关键词</label>
            <input
              type="text"
              className="input-field w-48"
              placeholder="客户/手机号/单号"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">预约状态</label>
            <select
              className="select-field w-32"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="待确认">待确认</option>
              <option value="已确认">已确认</option>
              <option value="已到店">已到店</option>
              <option value="服务中">服务中</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
              <option value="已过期">已过期</option>
            </select>
          </div>
          <div>
            <label className="label">支付状态</label>
            <select
              className="select-field w-32"
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
            >
              <option value="">全部</option>
              <option value="未支付">未支付</option>
              <option value="部分支付">部分支付</option>
              <option value="已支付">已支付</option>
              <option value="已退款">已退款</option>
            </select>
          </div>
          <div>
            <label className="label">技师</label>
            <select
              className="select-field w-36"
              value={filterTechnicianId}
              onChange={(e) => setFilterTechnicianId(e.target.value)}
            >
              <option value="">全部技师</option>
              {technicians.map((tech: any) => (
                <option key={tech._id} value={tech._id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">开始日期</label>
            <input
              type="date"
              className="input-field w-36"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">结束日期</label>
            <input
              type="date"
              className="input-field w-36"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">🔍 查询</button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilter}>重置</button>
          </div>
          <div className="flex-1"></div>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            📥 导出
          </button>
          <Link to="/cashier" className="btn btn-primary">
            ➕ 新增预约
          </Link>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                预约单号
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                客户信息
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                项目
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                技师
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                预约时间
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.length > 0 ? (
              list.map((item: any) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <span className="font-mono text-xs text-gray-500">
                      {item.appointmentNo}
                    </span>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{item.customerName}</p>
                    <p className="text-xs text-gray-500">{item.customerPhone}</p>
                  </td>
                  <td className="table-cell">{item.treatmentName}</td>
                  <td className="table-cell">{item.technicianName}</td>
                  <td className="table-cell">
                    <p>{dayjs(item.appointmentDate).format("MM-DD")}</p>
                    <p className="text-xs text-gray-500">
                      {item.startTime} - {item.endTime}
                    </p>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium text-primary-600">¥{item.price?.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      已付: ¥{item.paidAmount?.toFixed(2) || "0.00"}
                    </p>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1">
                      <span className={`badge ${statusColors[item.status] || "badge-gray"}`}>
                        {item.status}
                      </span>
                      <span
                        className={`badge ${
                          item.paymentStatus === "已支付"
                            ? "badge-success"
                            : item.paymentStatus === "未支付"
                            ? "badge-warning"
                            : "badge-info"
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {item.paymentStatus !== "已支付" && item.status !== "已取消" && (
                        <button
                          onClick={() => openPayment(item)}
                          className="text-green-600 hover:text-green-700 text-xs font-medium"
                        >
                          💰 收款
                        </button>
                      )}
                      {item.status === "待确认" && (
                        <button
                          onClick={() => handleStatus(item._id, "已确认")}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          确认
                        </button>
                      )}
                      {item.status === "已确认" && (
                        <button
                          onClick={() => handleStatus(item._id, "已到店")}
                          className="text-green-600 hover:text-green-700 text-xs"
                        >
                          到店
                        </button>
                      )}
                      {item.status === "已到店" && (
                        <button
                          onClick={() => handleStatus(item._id, "服务中")}
                          className="text-yellow-600 hover:text-yellow-700 text-xs"
                        >
                          开始服务
                        </button>
                      )}
                      {(item.status === "服务中" || item.status === "已到店") && (
                        <button
                          onClick={() => handleStatus(item._id, "已完成")}
                          className="text-green-600 hover:text-green-700 text-xs"
                        >
                          完成
                        </button>
                      )}
                      {item.status !== "已取消" && item.status !== "已完成" && (
                        <button
                          onClick={() => handleStatus(item._id, "已取消")}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          取消
                        </button>
                      )}
                      <Link
                        to={`/change-logs?relatedDocType=Appointment&relatedDocId=${item._id}`}
                        className="text-gray-600 hover:text-gray-700 text-xs"
                      >
                        历史
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  暂无预约记录
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {total} 条记录，第 {page}/{totalPages || 1} 页
          </div>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              className="btn btn-secondary text-xs disabled:opacity-50"
            >
              上一页
            </button>
            <button
              disabled={page >= totalPages}
              className="btn btn-secondary text-xs disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && paymentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">💰 收款结算</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">预约单号</span>
                  <span className="font-mono text-sm">{paymentItem.appointmentNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">客户</span>
                  <span className="font-medium">{paymentItem.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">项目</span>
                  <span className="font-medium">{paymentItem.treatmentName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">应收金额</span>
                  <span className="font-bold text-primary-600">
                    ¥{(paymentItem.actualPrice || paymentItem.price)?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">已付金额</span>
                  <span className="font-medium">
                    ¥{(paymentItem.paidAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">待收金额</span>
                  <span className="font-bold text-green-600">
                    ¥{((paymentItem.actualPrice || paymentItem.price) - (paymentItem.paidAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">支付方式</label>
                <select
                  className="select-field"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="现金">现金</option>
                  <option value="微信">微信支付</option>
                  <option value="支付宝">支付宝</option>
                  <option value="银行卡">银行卡</option>
                  <option value="会员卡">会员卡</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">优惠金额</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">实收金额</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  取消
                </button>
                <button className="btn btn-success" onClick={handlePayment}>
                  ✅ 确认收款
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
