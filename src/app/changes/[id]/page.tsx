import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangeService } from "@/lib/services/changeService";
import { ChangeStatus, Role, ConfirmationType } from "@/generated/prisma";
import ChangeActions from "./ChangeActions";

export default async function ChangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const change = await ChangeService.getChangeById(id);

  if (!change) {
    redirect("/");
  }

  const statusColors: Record<string, string> = {
    [ChangeStatus.PENDING_CONFIRMATION]: "bg-yellow-100 text-yellow-800",
    [ChangeStatus.CONFIRMED]: "bg-green-100 text-green-800",
    [ChangeStatus.REJECTED]: "bg-red-100 text-red-800",
    [ChangeStatus.DRAFT]: "bg-gray-100 text-gray-800",
    [ChangeStatus.WITHDRAWN]: "bg-orange-100 text-orange-800",
    [ChangeStatus.PURCHASED]: "bg-blue-100 text-blue-800",
  };

  const statusLabels: Record<string, string> = {
    [ChangeStatus.PENDING_CONFIRMATION]: "待确认",
    [ChangeStatus.CONFIRMED]: "已确认",
    [ChangeStatus.REJECTED]: "已拒绝",
    [ChangeStatus.DRAFT]: "草稿",
    [ChangeStatus.WITHDRAWN]: "已撤回",
    [ChangeStatus.PURCHASED]: "已采购",
  };

  const confirmTypeLabels: Record<string, string> = {
    [ConfirmationType.CONFIRM]: "确认",
    [ConfirmationType.REJECT]: "拒绝",
    [ConfirmationType.WITHDRAW]: "撤回",
  };

  const isOwner =
    session.user.role === Role.OWNER ||
    change.project.ownerId === session.user.id;
  const isProjectManager = session.user.role === Role.PROJECT_MANAGER;
  const isDesigner = session.user.role === Role.DESIGNER;
  const isFinance = session.user.role === Role.FINANCE;

  const canConfirm =
    isOwner && change.status === ChangeStatus.PENDING_CONFIRMATION;
  const canWithdraw =
    (isOwner || isProjectManager) &&
    change.status === ChangeStatus.CONFIRMED &&
    !change.purchaseOrder;
  const canCreatePO =
    (isProjectManager || isFinance) &&
    change.status === ChangeStatus.CONFIRMED &&
    !change.purchaseOrder;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← 返回列表
              </a>
              <h1 className="text-2xl font-bold text-gray-900">
                {change.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 text-sm font-medium rounded ${
                  statusColors[change.status]
                }`}
              >
                {statusLabels[change.status]}
              </span>
              <span className="text-sm text-gray-500">版本 v{change.version}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                变更详情
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    原方案
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {change.originalPlan}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600 mb-2">
                    新材料/新方案
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {change.newMaterial}
                  </p>
                </div>
              </div>

              {change.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    变更描述
                  </h3>
                  <p className="text-gray-900">{change.description}</p>
                </div>
              )}
            </div>

            {change.sitePhotoUrl && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  现场照片
                </h2>
                <img
                  src={change.sitePhotoUrl}
                  alt="现场照片"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

            {(change.drawingNote || change.managerNote || change.financeNote) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  各方说明
                </h2>
                <div className="space-y-4">
                  {change.drawingNote && (
                    <div>
                      <h3 className="text-sm font-medium text-purple-600 mb-1">
                        设计师图纸说明
                      </h3>
                      <p className="text-gray-900">{change.drawingNote}</p>
                    </div>
                  )}
                  {change.managerNote && (
                    <div>
                      <h3 className="text-sm font-medium text-green-600 mb-1">
                        项目经理补充说明
                      </h3>
                      <p className="text-gray-900">{change.managerNote}</p>
                    </div>
                  )}
                  {change.financeNote && (
                    <div>
                      <h3 className="text-sm font-medium text-orange-600 mb-1">
                        财务备注
                      </h3>
                      <p className="text-gray-900">{change.financeNote}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {change.confirmations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  确认记录
                </h2>
                <div className="space-y-4">
                  {change.confirmations.map((record) => (
                    <div
                      key={record.id}
                      className="border-l-4 border-gray-200 pl-4 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {record.confirmedBy.name || record.confirmedBy.email}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            record.type === ConfirmationType.CONFIRM
                              ? "bg-green-100 text-green-800"
                              : record.type === ConfirmationType.REJECT
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {confirmTypeLabels[record.type]}
                        </span>
                      </div>
                      {record.comment && (
                        <p className="text-gray-600 text-sm mt-1">
                          {record.comment}
                        </p>
                      )}
                      {record.signatureHash && (
                        <p className="text-xs text-gray-400 mt-1">
                          签名哈希: {record.signatureHash}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(record.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {change.versions.length > 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  版本历史
                </h2>
                <div className="space-y-4">
                  {change.versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          版本 v{version.version}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(version.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">原方案：</span>
                          <span className="text-gray-900">
                            {version.originalPlan.substring(0, 50)}...
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">新材料：</span>
                          <span className="text-gray-900">
                            {version.newMaterial.substring(0, 50)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                变更影响
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">价格差异</span>
                  <span
                    className={`text-xl font-bold ${
                      change.priceDifference.toNumber() >= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {change.priceDifference.toNumber() >= 0 ? "+" : ""}
                    ¥{change.priceDifference.toNumber().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">工期影响</span>
                  <span className="text-xl font-bold text-gray-900">
                    {change.scheduleImpact > 0
                      ? `+${change.scheduleImpact} 天`
                      : change.scheduleImpact < 0
                      ? `${change.scheduleImpact} 天`
                      : "无影响"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">排期状态</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      change.isLocked
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {change.isLocked ? "已锁定" : "未锁定"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                相关人员
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">项目业主</span>
                  <p className="text-gray-900">
                    {change.project.owner.name || change.project.owner.email}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">创建人</span>
                  <p className="text-gray-900">
                    {change.createdBy.name || change.createdBy.email}
                  </p>
                </div>
                {change.projectManager && (
                  <div>
                    <span className="text-xs text-gray-500">施工负责人</span>
                    <p className="text-gray-900">
                      {change.projectManager.name ||
                        change.projectManager.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {change.purchaseOrder && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  采购单
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">采购单号</span>
                    <span className="font-medium">
                      {change.purchaseOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">总金额</span>
                    <span className="font-bold text-lg">
                      ¥{change.purchaseOrder.totalAmount
                        .toNumber()
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">状态</span>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {change.purchaseOrder.status}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      采购明细
                    </h4>
                    <div className="space-y-1">
                      {change.purchaseOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {item.name} × {item.quantity}
                          </span>
                          <span>
                            ¥{item.totalPrice.toNumber().toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ChangeActions
              changeId={change.id}
              status={change.status}
              canConfirm={canConfirm}
              canWithdraw={canWithdraw}
              canCreatePO={canCreatePO}
              isDesigner={isDesigner}
              isProjectManager={isProjectManager}
              isFinance={isFinance}
              isLocked={change.isLocked}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
