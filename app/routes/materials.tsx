import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const keyword = url.searchParams.get("keyword") || "";
  const category = url.searchParams.get("category") || "";
  const status = url.searchParams.get("status") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const res = await fetch(`${baseUrl}/api/materials?${params.toString()}`);
    const data = await res.json();

    return json({
      list: data.data?.list || [],
      total: data.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      category,
      status,
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      keyword,
      category,
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
      sku: formData.get("sku"),
      category: formData.get("category"),
      unit: formData.get("unit"),
      price: parseFloat(formData.get("price") || "0"),
      cost: parseFloat(formData.get("cost") || "0"),
      stock: parseInt(formData.get("stock") || "0"),
      minStock: parseInt(formData.get("minStock") || "10"),
      supplier: formData.get("supplier"),
      status: formData.get("status"),
      remark: formData.get("remark"),
    };

    const id = formData.get("id");
    const url = id
      ? `${baseUrl}/api/materials/${id}`
      : `${baseUrl}/api/materials`;
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
    const res = await fetch(`${baseUrl}/api/materials/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return json(data);
  }

  return json({ success: false, message: "无效操作" });
}

export default function Materials() {
  const { list, total, page, pageSize, keyword, category, status } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const totalPages = Math.ceil(total / pageSize);

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
    if (confirm("确定要删除这个耗材吗？")) {
      const formData = new FormData();
      formData.set("_action", "delete");
      formData.set("id", id);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const lowStockCount = list.filter((item: any) => item.stock < item.minStock).length;

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">关键词</label>
            <input
              type="text"
              className="input-field w-48"
              placeholder="搜索名称/SKU"
              defaultValue={keyword}
            />
          </div>
          <div>
            <label className="label">分类</label>
            <select className="select-field w-32" defaultValue={category}>
              <option value="">全部分类</option>
              <option value="护肤品">护肤品</option>
              <option value="精油">精油</option>
              <option value="工具">工具</option>
              <option value="耗材">耗材</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select className="select-field w-32" defaultValue={status}>
              <option value="">全部状态</option>
              <option value="启用">启用</option>
              <option value="停用">停用</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary">🔍 查询</button>
            <button className="btn btn-secondary">重置</button>
          </div>
          <div className="flex-1"></div>
          <button className="btn btn-primary" onClick={handleAdd}>
            ➕ 新增耗材
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-600">耗材总数</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{total}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">库存预警</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{lowStockCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">库存总价值</p>
          <p className="text-2xl font-bold text-green-600 mt-1">-</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">本月消耗</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">-</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                耗材名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                库存
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                成本价
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                售价
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
                  <td className="table-cell font-medium">{item.name}</td>
                  <td className="table-cell text-gray-500 font-mono text-xs">{item.sku}</td>
                  <td className="table-cell">
                    <span className="badge badge-info">{item.category}</span>
                  </td>
                  <td className="table-cell">
                    <div>
                      <span
                        className={`font-medium ${
                          item.stock < item.minStock ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {item.stock} {item.unit}
                      </span>
                      {item.stock < item.minStock && (
                        <span className="ml-2 text-xs text-red-500">⚠️ 预警</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">¥{item.cost?.toFixed(2)}</td>
                  <td className="table-cell text-primary-600 font-medium">¥{item.price?.toFixed(2)}</td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        item.status === "启用" ? "badge-success" : "badge-gray"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        编辑
                      </button>
                      <Link
                        to={`/change-logs?targetType=Material&targetId=${item._id}`}
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
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  暂无耗材数据
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
              {editingItem ? "编辑耗材" : "新增耗材"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">名称 *</label>
                  <input name="name" className="input-field" defaultValue={editingItem?.name} required />
                </div>
                <div>
                  <label className="label">SKU编码</label>
                  <input name="sku" className="input-field" defaultValue={editingItem?.sku} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">分类</label>
                  <select name="category" className="select-field" defaultValue={editingItem?.category || "其他"}>
                    <option value="护肤品">护肤品</option>
                    <option value="精油">精油</option>
                    <option value="工具">工具</option>
                    <option value="耗材">耗材</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="label">单位 *</label>
                  <input name="unit" className="input-field" defaultValue={editingItem?.unit || "个"} placeholder="如：瓶/个/盒" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">库存数量</label>
                  <input name="stock" type="number" className="input-field" defaultValue={editingItem?.stock || 0} />
                </div>
                <div>
                  <label className="label">最低库存预警</label>
                  <input name="minStock" type="number" className="input-field" defaultValue={editingItem?.minStock || 10} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">成本价</label>
                  <input name="cost" type="number" step="0.01" className="input-field" defaultValue={editingItem?.cost || 0} />
                </div>
                <div>
                  <label className="label">售价</label>
                  <input name="price" type="number" step="0.01" className="input-field" defaultValue={editingItem?.price || 0} />
                </div>
              </div>
              <div>
                <label className="label">供应商</label>
                <input name="supplier" className="input-field" defaultValue={editingItem?.supplier} />
              </div>
              <div>
                <label className="label">状态</label>
                <select name="status" className="select-field" defaultValue={editingItem?.status || "启用"}>
                  <option value="启用">启用</option>
                  <option value="停用">停用</option>
                </select>
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
