import { useState } from "react";
import { useLoaderData, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const module = url.searchParams.get("module") || "";
  const action = url.searchParams.get("action") || "";
  const operator = url.searchParams.get("operator") || "";
  const targetType = url.searchParams.get("targetType") || "";
  const targetId = url.searchParams.get("targetId") || "";
  const relatedDocType = url.searchParams.get("relatedDocType") || "";
  const relatedDocId = url.searchParams.get("relatedDocId") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (module) params.set("module", module);
    if (action) params.set("action", action);
    if (operator) params.set("operator", operator);
    if (targetType) params.set("targetType", targetType);
    if (targetId) params.set("targetId", targetId);
    if (relatedDocType) params.set("relatedDocType", relatedDocType);
    if (relatedDocId) params.set("relatedDocId", relatedDocId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const res = await fetch(`${baseUrl}/api/change-logs?${params.toString()}`);
    const data = await res.json();

    return json({
      list: data.data?.list || [],
      total: data.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      module,
      action,
      operator,
      targetType,
      targetId,
      relatedDocType,
      relatedDocId,
      startDate,
      endDate,
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      module,
      action,
      operator,
      targetType,
      targetId,
      relatedDocType,
      relatedDocId,
      startDate,
      endDate,
    });
  }
}

const moduleOptions = [
  "技师",
  "疗程",
  "排班",
  "预约",
  "客户",
  "耗材",
  "耗材消耗",
  "提成",
  "提醒规则",
  "顾问",
];

const actionOptions = ["创建", "修改", "删除", "状态变更", "审批", "导出"];

export default function ChangeLogs() {
  const {
    list,
    total,
    page,
    pageSize,
    module,
    action,
    operator,
    relatedDocType,
    relatedDocId,
    startDate,
    endDate,
  } = useLoaderData<typeof loader>();

  const [filterModule, setFilterModule] = useState(module);
  const [filterAction, setFilterAction] = useState(action);
  const [filterOperator, setFilterOperator] = useState(operator);
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);

  const totalPages = Math.ceil(total / pageSize);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterModule) params.set("module", filterModule);
    if (filterAction) params.set("action", filterAction);
    if (filterOperator) params.set("operator", filterOperator);
    if (filterStartDate) params.set("startDate", filterStartDate);
    if (filterEndDate) params.set("endDate", filterEndDate);
    if (relatedDocType) params.set("relatedDocType", relatedDocType);
    if (relatedDocId) params.set("relatedDocId", relatedDocId);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    window.location.search = params.toString();
  };

  const handleResetFilter = () => {
    setFilterModule("");
    setFilterAction("");
    setFilterOperator("");
    setFilterStartDate("");
    setFilterEndDate("");
    const params = new URLSearchParams();
    if (relatedDocType) params.set("relatedDocType", relatedDocType);
    if (relatedDocId) params.set("relatedDocId", relatedDocId);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    window.location.search = params.toString();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterModule) params.set("module", filterModule);
    if (filterAction) params.set("action", filterAction);
    if (filterOperator) params.set("operator", filterOperator);
    if (filterStartDate) params.set("startDate", filterStartDate);
    if (filterEndDate) params.set("endDate", filterEndDate);
    window.location.href = `/api/export/change-logs?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">模块</label>
            <select
              className="select-field w-36"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              <option value="">全部模块</option>
              {moduleOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">操作类型</label>
            <select
              className="select-field w-32"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">全部操作</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">操作人</label>
            <input
              type="text"
              className="input-field w-32"
              placeholder="操作人"
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-end">
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
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">🔍 查询</button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilter}>重置</button>
          </div>
          <div className="flex-1"></div>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            📥 导出
          </button>
        </form>
      </div>

      {relatedDocId && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">
                📎 当前查看关联单据的操作日志：{relatedDocType} - {relatedDocId}
              </p>
            </div>
            <Link to="/change-logs" className="text-blue-600 hover:text-blue-700 text-sm">
              查看全部日志 →
            </Link>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日志编号
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                模块
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                目标
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                关联单据
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作人
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                备注
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作时间
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                详情
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.length > 0 ? (
              list.map((item: any) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <span className="font-mono text-xs text-gray-500">{item.logNo}</span>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-info">{item.module}</span>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        item.action === "创建"
                          ? "badge-success"
                          : item.action === "删除"
                          ? "badge-danger"
                          : item.action === "修改"
                          ? "badge-info"
                          : "badge-warning"
                      }`}
                    >
                      {item.action}
                    </span>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium text-gray-900 text-sm">{item.targetName}</p>
                    {item.targetNo && (
                      <p className="text-xs text-gray-500">{item.targetNo}</p>
                    )}
                  </td>
                  <td className="table-cell">
                    {item.relatedDocNo ? (
                      <div>
                        <p className="text-xs text-gray-500">{item.relatedDocType}</p>
                        <Link
                          to={`/change-logs?relatedDocType=${item.relatedDocType}&relatedDocId=${item.relatedDocId}`}
                          className="text-primary-600 hover:text-primary-700 text-xs"
                        >
                          {item.relatedDocNo}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="text-sm">{item.operator}</p>
                      {item.operatorRole && (
                        <p className="text-xs text-gray-500">{item.operatorRole}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-cell max-w-xs">
                    <p className="text-sm text-gray-600 truncate">{item.remark || "-"}</p>
                  </td>
                  <td className="table-cell text-gray-500 text-xs">
                    {dayjs(item.createdAt).format("MM-DD HH:mm:ss")}
                  </td>
                  <td className="table-cell">
                    <details className="cursor-pointer">
                      <summary className="text-primary-600 hover:text-primary-700 text-sm">
                        查看变更
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs max-w-sm">
                        {item.changes && item.changes.length > 0 ? (
                          <div className="space-y-2">
                            {item.changes.map((change: any, idx: number) => (
                              <div key={idx} className="border-b pb-2 last:border-0 last:pb-0">
                                <p className="font-medium text-gray-700">
                                  {change.fieldLabel || change.field}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                    {JSON.stringify(change.before)}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                    {JSON.stringify(change.after)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">无详细变更记录</p>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  暂无操作日志
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
        <h3 className="text-lg font-semibold mb-4">📝 改动记录关联说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-700 mb-2">🔗 单据关联</p>
            <p>
              所有操作记录都可关联到具体单据（如预约单、提成单等），方便后期核对复盘时快速定位相关的所有变更历史。
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700 mb-2">📊 变更详情</p>
            <p>
              每条修改记录都保存变更前后的对比数据，精确到字段级别，支持查看具体哪些字段发生了变化。
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="font-medium text-purple-700 mb-2">👤 操作人追踪</p>
            <p>
              记录每次操作的操作人和角色，配合操作时间，形成完整的审计追踪链。
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="font-medium text-orange-700 mb-2">📥 导出保留</p>
            <p>
              导出日志时自动保留筛选条件和导出时间，确保数据可追溯、可验证。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
