import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  const type = url.searchParams.get("type") || "";
  const level = url.searchParams.get("level") || "";
  const status = url.searchParams.get("status") || "";
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";

  try {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (level) params.set("level", level);
    if (status) params.set("status", status);
    params.set("page", page);
    params.set("pageSize", pageSize);

    const [remindersRes, unreadRes, rulesRes] = await Promise.all([
      fetch(`${baseUrl}/api/reminders?${params.toString()}`),
      fetch(`${baseUrl}/api/reminders/unread/count`),
      fetch(`${baseUrl}/api/reminders/rules/list`),
    ]);

    const remindersData = await remindersRes.json();
    const unreadData = await unreadRes.json();
    const rulesData = await rulesRes.json();

    return json({
      list: remindersData.data?.list || [],
      total: remindersData.data?.total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      type,
      level,
      status,
      unread: unreadData.data || { total: 0, normal: 0, urgent: 0, escalated: 0 },
      rules: rulesData.data || [],
    });
  } catch (error) {
    return json({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      type,
      level,
      status,
      unread: { total: 0, normal: 0, urgent: 0, escalated: 0 },
      rules: [],
    });
  }
}

const levelColors: Record<string, string> = {
  普通: "badge-info",
  紧急: "badge-warning",
  超时升级: "badge-danger",
};

const levelBgColors: Record<string, string> = {
  普通: "bg-blue-50 border-blue-200",
  紧急: "bg-yellow-50 border-yellow-200",
  超时升级: "bg-red-50 border-red-200",
};

export default function Reminders() {
  const { list, total, page, pageSize, type, level, status, unread, rules } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "rules">("list");

  const totalPages = Math.ceil(total / pageSize);

  const handleRead = (id: string) => {
    const formData = new FormData();
    formData.set("_action", "read");
    formData.set("id", id);
    fetcher.submit(formData, { method: "post" });
  };

  const handleHandle = (id: string) => {
    const remark = prompt("请输入处理备注：");
    if (remark !== null) {
      const formData = new FormData();
      formData.set("_action", "handle");
      formData.set("id", id);
      formData.set("handleRemark", remark || "");
      fetcher.submit(formData, { method: "post" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="?status=unread"
          className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">全部未读提醒</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{unread.total}</p>
            </div>
            <span className="text-3xl">🔔</span>
          </div>
        </Link>
        <div className="card p-5 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">普通提醒</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{unread.normal}</p>
            </div>
            <span className="text-3xl">📢</span>
          </div>
        </div>
        <div className="card p-5 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">紧急催办</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{unread.urgent}</p>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </div>
        <div className="card p-5 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">超时升级</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{unread.escalated}</p>
            </div>
            <span className="text-3xl">🚨</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <div className="flex">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === "list"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("list")}
          >
            提醒列表
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === "rules"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("rules")}
          >
            提醒规则
          </button>
        </div>
      </div>

        {activeTab === "list" && (
          <div className="p-4">
            <div className="flex flex-wrap gap-4 items-end mb-4">
              <div>
                <label className="label">类型</label>
                <select className="select-field w-36" defaultValue={type}>
                  <option value="">全部类型</option>
                  <option value="技师请假">技师请假</option>
                  <option value="预约提醒">预约提醒</option>
                  <option value="耗材库存">耗材库存</option>
                  <option value="排班异常">排班异常</option>
                  <option value="提成结算">提成结算</option>
                  <option value="系统通知">系统通知</option>
                </select>
              </div>
              <div>
                <label className="label">级别</label>
                <select className="select-field w-32" defaultValue={level}>
                  <option value="">全部级别</option>
                  <option value="普通">普通</option>
                  <option value="紧急">紧急</option>
                  <option value="超时升级">超时升级</option>
                </select>
              </div>
              <div>
                <label className="label">状态</label>
                <select className="select-field w-32" defaultValue={status}>
                  <option value="">全部状态</option>
                  <option value="待发送">待发送</option>
                  <option value="已发送">已发送</option>
                  <option value="已读">已读</option>
                  <option value="已处理">已处理</option>
                  <option value="已忽略">已忽略</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary">🔍 查询</button>
                <button className="btn btn-secondary">重置</button>
              </div>
            </div>

            <div className="space-y-3">
              {list.length > 0 ? (
                list.map((item: any) => (
                  <div
                    key={item._id}
                    className={`p-4 border-l-4 rounded-r-lg ${levelBgColors[item.level] || "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge ${levelColors[item.level] || "badge-gray"}`}>
                            {item.level}
                          </span>
                          <span className="badge badge-info">{item.type}</span>
                          <span className="text-xs text-gray-500">
                            {dayjs(item.createdAt).format("MM-DD HH:mm")}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                        {item.relatedNo && (
                          <p className="text-xs text-gray-500 mt-2">
                            关联单据：{item.relatedNo}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {item.status !== "已读" && item.status !== "已处理" && (
                          <button
                            onClick={() => handleRead(item._id)}
                            className="text-gray-600 hover:text-gray-700 text-sm"
                          >
                            标已读
                          </button>
                        )}
                        {item.status !== "已处理" && (
                          <button
                            onClick={() => handleHandle(item._id)}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            处理
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  暂无提醒消息
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
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
        )}

        {activeTab === "rules" && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">提醒规则配置</h3>
              <button className="btn btn-primary" onClick={() => setShowRuleModal(true)}>
                ➕ 新增规则
              </button>
            </div>

            <div className="space-y-4">
              {rules.length > 0 ? (
                rules.map((rule: any) => (
                  <div key={rule._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <span className={`badge ${rule.enabled ? "badge-success" : "badge-gray"}`}>
                        {rule.enabled ? "已启用" : "已停用"}
                      </span>
                      <span className="badge badge-info">{rule.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-primary-600 hover:text-primary-700 text-sm">
                        编辑
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 text-sm">
                        {rule.enabled ? "停用" : "启用"}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{rule.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">分层提醒级别：</p>
                    <div className="grid grid-cols-3 gap-3">
                      {rule.levels?.map((lvl: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`badge ${
                                lvl.level === "普通"
                                  ? "badge-info"
                                  : lvl.level === "紧急"
                                  ? "badge-warning"
                                  : "badge-danger"
                              }`}
                            >
                              {lvl.level}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            触发条件：{lvl.triggerCondition}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {lvl.triggerValue} {lvl.triggerUnit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                暂无提醒规则，点击右上角新增
              </div>
            )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">💡 分层提醒说明</h4>
              <div className="text-sm text-blue-600 space-y-1">
                <p><strong>普通提示：</strong>常规提醒，系统消息通知，适合一般事项提醒</p>
                <p><strong>紧急催办：</strong>重要事项提醒，短信+系统消息双通知，需要及时处理</p>
                <p><strong>超时升级：</strong>超时未处理自动升级，通知上级，确保问题闭环</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">新增提醒规则</h3>
            <div className="space-y-4">
              <div>
                <label className="label">规则名称</label>
                <input className="input-field" placeholder="如：技师请假审批提醒" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">规则类型</label>
                  <select className="select-field">
                    <option value="技师请假">技师请假</option>
                    <option value="预约提醒">预约提醒</option>
                    <option value="耗材库存">耗材库存</option>
                    <option value="排班异常">排班异常</option>
                    <option value="提成结算">提成结算</option>
                  </select>
                </div>
                <div>
                  <label className="label">是否启用</label>
                  <select className="select-field">
                    <option value="true">启用</option>
                    <option value="false">停用</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">描述</label>
                <textarea className="input-field h-16" placeholder="规则描述"></textarea>
              </div>
              <div>
                <label className="label">普通提醒</label>
                <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input className="input-field flex-1" placeholder="触发条件" />
                    <input type="number" className="input-field w-24" placeholder="值" />
                    <select className="select-field w-24">
                      <option>小时</option>
                      <option>分钟</option>
                      <option>天</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">通知方式：系统消息</p>
                </div>
              </div>
              <div>
                <label className="label">紧急催办</label>
                <div className="p-3 bg-yellow-50 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input className="input-field flex-1" placeholder="触发条件" />
                    <input type="number" className="input-field w-24" placeholder="值" />
                    <select className="select-field w-24">
                      <option>小时</option>
                      <option>分钟</option>
                      <option>天</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">通知方式：系统消息 + 短信</p>
                </div>
              </div>
              <div>
                <label className="label">超时升级</label>
                <div className="p-3 bg-red-50 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input className="input-field flex-1" placeholder="触发条件" />
                    <input type="number" className="input-field w-24" placeholder="值" />
                    <select className="select-field w-24">
                      <option>小时</option>
                      <option>分钟</option>
                      <option>天</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">通知方式：系统消息 + 短信 + 通知上级</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRuleModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
