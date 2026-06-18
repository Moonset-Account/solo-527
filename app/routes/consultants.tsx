import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const keyword = url.searchParams.get("keyword") || "";
  const status = url.searchParams.get("status") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const res = await fetch(`${baseUrl}/api/consultants?${params.toString()}`);
    const data = await res.json();

    return json({
      list: data.data?.list || [],
      total: data.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      status,
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      keyword,
      status,
    });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const _action = formData.get("_action");

  if (_action === "create" || _action === "update") {
    const body = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      level: formData.get("level"),
      status: formData.get("status"),
      baseSalary: parseFloat(formData.get("baseSalary") || "0"),
      commissionRate: parseFloat(formData.get("commissionRate") || "0.05"),
      remark: formData.get("remark"),
    };

    const id = formData.get("id");
    const url = id
      ? `${baseUrl}/api/consultants/${id}`
      : `${baseUrl}/api/consultants`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "delete") {
    const id = formData.get("id");
    const res = await fetch(`${baseUrl}/api/consultants/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return json(data);
  }

  return json({ success: false, message: "无效操作" });
}

export default function Consultants() {
  const { list, total, page, pageSize, keyword, status } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [filterKeyword, setFilterKeyword] = useState(keyword);
  const [filterStatus, setFilterStatus] = useState(status);

  const totalPages = Math.ceil(total / pageSize);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterKeyword) params.set("keyword", filterKeyword);
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    window.location.search = params.toString();
  };

  const handleResetFilter = () => {
    setFilterKeyword("");
    setFilterStatus("");
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    window.location.search = params.toString();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("_action", editingItem ? "update" : "create");
    if (editingItem) {
      formData.set("id", editingItem._id);
    }
    fetcher.submit(formData, { method: "post" });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个顾问吗？")) {
      const formData = new FormData();
      formData.set("_action", "delete");
      formData.set("id", id);
      fetcher.submit(formData, { method: "post" });
    }
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
              placeholder="搜索姓名/手机号"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">状态</label>
            <select
              className="select-field w-32"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="在职">在职</option>
              <option value="休假">休假</option>
              <option value="离职">离职</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">🔍 查询</button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilter}>重置</button>
          </div>
          <div className="flex-1"></div>
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            ➕ 新增顾问
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                顾问信息
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                级别
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                底薪
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                提成比例
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
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-white font-bold">
                        {item.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-info">{item.level}</span>
                  </td>
                  <td className="table-cell">¥{item.baseSalary?.toFixed(0)}</td>
                  <td className="table-cell">{(item.commissionRate * 100).toFixed(0)}%</td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        item.status === "在职"
                          ? "badge-success"
                          : item.status === "休假"
                          ? "badge-warning"
                          : "badge-gray"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link
                        to={`/commissions?staffId=${item._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        提成
                      </Link>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        编辑
                      </button>
                      <Link
                        to={`/change-logs?targetType=Consultant&targetId=${item._id}`}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                      >
                        历史
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  暂无顾问数据
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
            <button disabled={page <= 1} className="btn btn-secondary text-xs disabled:opacity-50">
              上一页
            </button>
            <button disabled={page >= totalPages} className="btn btn-secondary text-xs disabled:opacity-50">
              下一页
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "编辑顾问" : "新增顾问"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">姓名 *</label>
                  <input name="name" className="input-field" defaultValue={editingItem?.name} required />
                </div>
                <div>
                  <label className="label">手机号 *</label>
                  <input name="phone" className="input-field" defaultValue={editingItem?.phone} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">级别</label>
                  <select name="level" className="select-field" defaultValue={editingItem?.level || "初级顾问"}>
                    <option value="初级顾问">初级顾问</option>
                    <option value="中级顾问">中级顾问</option>
                    <option value="高级顾问">高级顾问</option>
                    <option value="顾问主管">顾问主管</option>
                  </select>
                </div>
                <div>
                  <label className="label">状态</label>
                  <select name="status" className="select-field" defaultValue={editingItem?.status || "在职"}>
                    <option value="在职">在职</option>
                    <option value="休假">休假</option>
                    <option value="离职">离职</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">底薪</label>
                  <input
                    name="baseSalary"
                    type="number"
                    className="input-field"
                    defaultValue={editingItem?.baseSalary || 0}
                  />
                </div>
                <div>
                  <label className="label">提成比例</label>
                  <input
                    name="commissionRate"
                    type="number"
                    step="0.01"
                    className="input-field"
                    defaultValue={editingItem?.commissionRate || 0.05}
                  />
                </div>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea name="remark" className="input-field h-16" defaultValue={editingItem?.remark}></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
