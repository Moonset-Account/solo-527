import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const keyword = url.searchParams.get("keyword") || "";
  const status = url.searchParams.get("status") || "";
  const customerId = url.searchParams.get("customerId") || "";
  const treatmentId = url.searchParams.get("treatmentId") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    if (customerId) params.set("customerId", customerId);
    if (treatmentId) params.set("treatmentId", treatmentId);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const res = await fetch(`${baseUrl}/api/customer-treatments?${params.toString()}`);
    const data = await res.json();

    return json({
      list: data.data?.list || [],
      total: data.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      status,
      customerId,
      treatmentId,
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      keyword,
      status,
      customerId,
      treatmentId,
    });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const _action = formData.get("_action");

  if (_action === "create") {
    const body = {
      customerId: formData.get("customerId"),
      customerName: formData.get("customerName"),
      treatmentId: formData.get("treatmentId"),
      treatmentName: formData.get("treatmentName"),
      totalTimes: parseInt(formData.get("totalTimes") || "0"),
      totalAmount: parseFloat(formData.get("totalAmount") || "0"),
      purchaseDate: formData.get("purchaseDate"),
      expireDate: formData.get("expireDate") || null,
      source: formData.get("source"),
      remark: formData.get("remark"),
    };

    const res = await fetch(`${baseUrl}/api/customer-treatments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "use") {
    const id = formData.get("id");
    const body = {
      times: parseInt(formData.get("times") || "1"),
      operator: "admin",
      remark: formData.get("remark"),
    };

    const res = await fetch(`${baseUrl}/api/customer-treatments/${id}/use`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "adjust") {
    const id = formData.get("id");
    const body = {
      changeTimes: parseInt(formData.get("changeTimes") || "0"),
      type: formData.get("type"),
      operator: "admin",
      remark: formData.get("remark"),
    };

    const res = await fetch(`${baseUrl}/api/customer-treatments/${id}/adjust`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data);
  }

  return json({ success: false, message: "无效操作" });
}

export default function CustomerTreatments() {
  const { list, total, page, pageSize, keyword, status } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleUse = (item: any) => {
    setSelectedItem(item);
    setShowUseModal(true);
  };

  const handleAdjust = (item: any) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  const handleUseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("_action", "use");
    formData.set("id", selectedItem._id);
    fetcher.submit(formData, { method: "post" });
    setShowUseModal(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("_action", "adjust");
    formData.set("id", selectedItem._id);
    fetcher.submit(formData, { method: "post" });
    setShowAdjustModal(false);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    window.location.href = `/api/export/customer-treatments?${params.toString()}`;
  };

  const getProgressColor = (remaining: number, total: number) => {
    const ratio = remaining / total;
    if (ratio > 0.5) return "bg-green-500";
    if (ratio > 0.2) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">关键词</label>
            <input
              type="text"
              className="input-field w-48"
              placeholder="客户/项目名称"
              defaultValue={keyword}
            />
          </div>
          <div>
            <label className="label">状态</label>
            <select className="select-field w-32" defaultValue={status}>
              <option value="">全部状态</option>
              <option value="有效">有效</option>
              <option value="已用完">已用完</option>
              <option value="已过期">已过期</option>
              <option value="已退款">已退款</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary">🔍 查询</button>
            <button className="btn btn-secondary">重置</button>
          </div>
          <div className="flex-1"></div>
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 导出
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ 新增疗程卡
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-600">有效疗程卡</p>
          <p className="text-2xl font-bold text-green-600 mt-1">-</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">剩余总次数</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">-</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">已用完</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">-</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">即将到期(30天内)</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">-</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                客户
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                疗程项目
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                次数进度
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                有效期
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
                    <p className="font-medium text-gray-900">{item.customerName}</p>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium">{item.treatmentName}</p>
                    <p className="text-xs text-gray-500">{item.source}</p>
                  </td>
                  <td className="table-cell">
                    <div className="w-40">
                      <div className="flex justify-between text-xs mb-1">
                        <span>剩余 {item.remainingTimes} 次</span>
                        <span className="text-gray-500">共 {item.totalTimes} 次</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(
                            item.remainingTimes,
                            item.totalTimes
                          )}`}
                          style={{ width: `${(item.remainingTimes / item.totalTimes) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium text-primary-600">¥{item.totalAmount?.toFixed(2)}</p>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm">{dayjs(item.purchaseDate).format("YYYY-MM-DD")}</p>
                    {item.expireDate && (
                      <p className="text-xs text-gray-500">
                        至 {dayjs(item.expireDate).format("YYYY-MM-DD")}
                      </p>
                    )}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        item.status === "有效"
                          ? "badge-success"
                          : item.status === "已用完"
                          ? "badge-gray"
                          : item.status === "已过期"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUse(item)}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        使用
                      </button>
                      <button
                        onClick={() => handleAdjust(item)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        调整
                      </button>
                      <Link
                        to={`/change-logs?targetType=CustomerTreatment&targetId=${item._id}`}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                      >
                        历史
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  暂无数据
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新增疗程卡</h3>
            <fetcher.Form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="create" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">客户ID</label>
                  <input name="customerId" className="input-field" required />
                </div>
                <div>
                  <label className="label">客户姓名</label>
                  <input name="customerName" className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">项目ID</label>
                  <input name="treatmentId" className="input-field" required />
                </div>
                <div>
                  <label className="label">项目名称</label>
                  <input name="treatmentName" className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">总次数 *</label>
                  <input name="totalTimes" type="number" className="input-field" required />
                </div>
                <div>
                  <label className="label">总金额 *</label>
                  <input name="totalAmount" type="number" step="0.01" className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">购买日期</label>
                  <input name="purchaseDate" type="date" className="input-field" defaultValue={dayjs().format("YYYY-MM-DD")} />
                </div>
                <div>
                  <label className="label">有效期至</label>
                  <input name="expireDate" type="date" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">来源</label>
                <select name="source" className="select-field" defaultValue="购买">
                  <option value="购买">购买</option>
                  <option value="赠送">赠送</option>
                  <option value="活动">活动</option>
                </select>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea name="remark" className="input-field h-16"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {showUseModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">使用疗程</h3>
            <form onSubmit={handleUseSubmit} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">客户：{selectedItem.customerName}</p>
                <p className="text-sm text-gray-600">项目：{selectedItem.treatmentName}</p>
                <p className="text-sm text-gray-600 mt-2">
                  当前剩余：<span className="font-bold text-green-600">{selectedItem.remainingTimes} 次</span>
                </p>
              </div>
              <div>
                <label className="label">使用次数</label>
                <input name="times" type="number" className="input-field" defaultValue={1} min={1} max={selectedItem.remainingTimes} />
              </div>
              <div>
                <label className="label">备注</label>
                <textarea name="remark" className="input-field h-16" placeholder="可选：关联预约单号等"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUseModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-success">
                  确认使用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">调整次数</h3>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">客户：{selectedItem.customerName}</p>
                <p className="text-sm text-gray-600">项目：{selectedItem.treatmentName}</p>
                <p className="text-sm text-gray-600 mt-2">
                  当前剩余：<span className="font-bold text-green-600">{selectedItem.remainingTimes} 次</span>
                </p>
              </div>
              <div>
                <label className="label">调整类型</label>
                <select name="type" className="select-field" defaultValue="调整">
                  <option value="调整">调整</option>
                  <option value="赠送">赠送</option>
                  <option value="退款">退款</option>
                </select>
              </div>
              <div>
                <label className="label">调整次数（正数增加，负数减少）</label>
                <input name="changeTimes" type="number" className="input-field" defaultValue={0} />
              </div>
              <div>
                <label className="label">备注</label>
                <textarea name="remark" className="input-field h-16"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认调整
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
