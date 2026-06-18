import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const keyword = url.searchParams.get("keyword") || "";
  const status = url.searchParams.get("status") || "";
  const category = url.searchParams.get("category") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const res = await fetch(`${baseUrl}/api/treatments?${params.toString()}`);
    const data = await res.json();

    return json({
      list: data.data?.list || [],
      total: data.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      status,
      category,
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      keyword,
      status,
      category,
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
      category: formData.get("category"),
      duration: parseInt(formData.get("duration") || "0"),
      price: parseFloat(formData.get("price") || "0"),
      cost: parseFloat(formData.get("cost") || "0"),
      description: formData.get("description"),
      status: formData.get("status"),
      sortOrder: parseInt(formData.get("sortOrder") || "0"),
    };

    const id = formData.get("id");
    const url = id
      ? `${baseUrl}/api/treatments/${id}`
      : `${baseUrl}/api/treatments`;
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
    const res = await fetch(`${baseUrl}/api/treatments/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return json(data);
  }

  return json({ success: false, message: "无效操作" });
}

export default function Treatments() {
  const { list, total, page, pageSize, keyword, status, category } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filterKeyword, setFilterKeyword] = useState(keyword);
  const [filterStatus, setFilterStatus] = useState(status);
  const [filterCategory, setFilterCategory] = useState(category);

  const totalPages = Math.ceil(total / pageSize);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterKeyword) params.set("keyword", filterKeyword);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    params.set("page", "1");
    window.location.search = params.toString() ? `?${params.toString()}` : "";
  };

  const handleResetFilter = () => {
    setFilterKeyword("");
    setFilterStatus("");
    setFilterCategory("");
    window.location.search = "";
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
    if (confirm("确定要删除这个疗程吗？")) {
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
    if (filterCategory) params.set("category", filterCategory);
    window.location.href = `/api/export/treatments?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">关键词搜索</label>
            <input
              type="text"
              className="input-field w-48"
              placeholder="搜索疗程名称"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">分类</label>
            <select
              className="select-field w-36"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">全部分类</option>
              <option value="面部护理">面部护理</option>
              <option value="身体护理">身体护理</option>
              <option value="美甲美睫">美甲美睫</option>
              <option value="SPA">SPA</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select
              className="select-field w-32"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="上架">上架</option>
              <option value="下架">下架</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">🔍 查询</button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilter}>重置</button>
          </div>
          <div className="flex-1"></div>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            📥 导出
          </button>
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            ➕ 新增疗程
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                疗程名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时长
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                价格
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                成本
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                排序
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
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-info">{item.category}</span>
                  </td>
                  <td className="table-cell">{item.duration}分钟</td>
                  <td className="table-cell font-medium text-primary-600">
                    ¥{item.price?.toFixed(2)}
                  </td>
                  <td className="table-cell text-gray-500">¥{item.cost?.toFixed(2)}</td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        item.status === "上架" ? "badge-success" : "badge-gray"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="table-cell">{item.sortOrder}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link
                        to={`/customer-treatments?treatmentId=${item._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        剩余次数
                      </Link>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        编辑
                      </button>
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
                <td colSpan={8} className="text-center py-12 text-gray-400">
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

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 疗程剩余次数统计
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/customer-treatments?status=有效"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <p className="text-sm text-gray-600">有效疗程卡</p>
            <p className="text-2xl font-bold text-green-600 mt-1">-</p>
            <p className="text-xs text-gray-500 mt-1">点击查看详情 →</p>
          </Link>
          <Link
            to="/customer-treatments?status=已用完"
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <p className="text-sm text-gray-600">已用完</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">-</p>
            <p className="text-xs text-gray-500 mt-1">点击查看详情 →</p>
          </Link>
          <Link
            to="/customer-treatments?status=已过期"
            className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <p className="text-sm text-gray-600">已过期</p>
            <p className="text-2xl font-bold text-red-600 mt-1">-</p>
            <p className="text-xs text-gray-500 mt-1">点击查看详情 →</p>
          </Link>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "编辑疗程" : "新增疗程"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">疗程名称 *</label>
                <input
                  name="name"
                  className="input-field"
                  defaultValue={editingItem?.name}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">分类</label>
                  <select name="category" className="select-field" defaultValue={editingItem?.category || "其他"}>
                    <option value="面部护理">面部护理</option>
                    <option value="身体护理">身体护理</option>
                    <option value="美甲美睫">美甲美睫</option>
                    <option value="SPA">SPA</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="label">时长(分钟) *</label>
                  <input
                    name="duration"
                    type="number"
                    className="input-field"
                    defaultValue={editingItem?.duration || 60}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">价格(元) *</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    className="input-field"
                    defaultValue={editingItem?.price || 0}
                    required
                  />
                </div>
                <div>
                  <label className="label">成本(元)</label>
                  <input
                    name="cost"
                    type="number"
                    step="0.01"
                    className="input-field"
                    defaultValue={editingItem?.cost || 0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">状态</label>
                  <select name="status" className="select-field" defaultValue={editingItem?.status || "上架"}>
                    <option value="上架">上架</option>
                    <option value="下架">下架</option>
                  </select>
                </div>
                <div>
                  <label className="label">排序</label>
                  <input
                    name="sortOrder"
                    type="number"
                    className="input-field"
                    defaultValue={editingItem?.sortOrder || 0}
                  />
                </div>
              </div>
              <div>
                <label className="label">描述</label>
                <textarea
                  name="description"
                  className="input-field h-20"
                  defaultValue={editingItem?.description}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
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
