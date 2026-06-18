import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const keyword = url.searchParams.get("keyword") || "";
  const type = url.searchParams.get("type") || "";
  const status = url.searchParams.get("status") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const res = await fetch(`${baseUrl}/api/material-usages?${params.toString()}`);
    const data = await res.json();

    return json({
      list: data.data?.list || [],
      total: data.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      type,
      status,
      startDate,
      endDate,
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      keyword,
      type,
      status,
      startDate,
      endDate,
    });
  }
}

export default function MaterialUsages() {
  const { list, total, page, pageSize, keyword, type, status, startDate, endDate } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const totalPages = Math.ceil(total / pageSize);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.location.href = `/api/export/material-usages?${params.toString()}`;
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
              placeholder="搜索单号/技师/客户"
              defaultValue={keyword}
            />
          </div>
          <div>
            <label className="label">类型</label>
            <select className="select-field w-32" defaultValue={type}>
              <option value="">全部类型</option>
              <option value="服务消耗">服务消耗</option>
              <option value="领用">领用</option>
              <option value="损耗">损耗</option>
              <option value="盘点调整">盘点调整</option>
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select className="select-field w-32" defaultValue={status}>
              <option value="">全部状态</option>
              <option value="草稿">草稿</option>
              <option value="已确认">已确认</option>
              <option value="已撤销">已撤销</option>
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <div>
              <label className="label">开始日期</label>
              <input type="date" className="input-field w-36" defaultValue={startDate} />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input type="date" className="input-field w-36" defaultValue={endDate} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary">🔍 查询</button>
            <button className="btn btn-secondary">重置</button>
          </div>
          <div className="flex-1"></div>
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 导出
          </button>
          <button className="btn btn-primary">
            ➕ 新增消耗
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-600">本月消耗笔数</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">-</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">本月消耗成本</p>
          <p className="text-2xl font-bold text-red-600 mt-1">-</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">服务消耗</p>
          <p className="text-2xl font-bold text-green-600 mt-1">-</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">其他消耗</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">-</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                消耗单号
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                类型
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                技师
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                客户
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                关联预约
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                总成本
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
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
                    <span className="font-mono text-xs text-gray-500">{item.usageNo}</span>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        item.type === "服务消耗"
                          ? "badge-info"
                          : item.type === "领用"
                          ? "badge-warning"
                          : item.type === "损耗"
                          ? "badge-danger"
                          : "badge-gray"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="table-cell">{item.technicianName || "-"}</td>
                  <td className="table-cell">{item.customerName || "-"}</td>
                  <td className="table-cell">
                    {item.appointmentNo ? (
                      <Link
                        to={`/appointments/${item.appointmentId}`}
                        className="text-primary-600 hover:text-primary-700 text-xs"
                      >
                        {item.appointmentNo}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="table-cell font-medium text-red-600">
                    ¥{item.totalCost?.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        item.status === "已确认"
                          ? "badge-success"
                          : item.status === "草稿"
                          ? "badge-warning"
                          : "badge-gray"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500 text-xs">
                    {dayjs(item.createdAt).format("MM-DD HH:mm")}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        查看
                      </button>
                      {item.status === "草稿" && (
                        <button className="text-green-600 hover:text-green-700 text-sm">
                          确认
                        </button>
                      )}
                      <Link
                        to={`/change-logs?relatedDocType=MaterialUsage&relatedDocId=${item._id}`}
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
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  暂无耗材消耗记录
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

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">💡 历史记录保留说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-700 mb-1">初始记录留存</p>
            <p>每笔耗材消耗记录创建时的原始数据会永久保存，后续修改前会先备份原始记录。</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700 mb-1">变更历史追踪</p>
            <p>所有修改都会记录变更人、变更时间、变更前后对比，支持追溯。</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="font-medium text-purple-700 mb-1">关联单据查询</p>
            <p>消耗记录可关联到具体预约单，方便后期核对复盘。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
