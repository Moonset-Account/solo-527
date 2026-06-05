import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangeService } from "@/lib/services/changeService";
import Link from "next/link";
import { ChangeStatus } from "@/generated/prisma";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const ownerId = session.user.role === "OWNER" ? session.user.id : undefined;
  const changes = await ChangeService.getPendingChangesForWeek(ownerId);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                本周待确认的变更
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                系统入口：展示本周需要业主确认的所有变更
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {session.user.role !== "OWNER" && (
                <Link
                  href="/changes/new"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  + 新变更
                </Link>
              )}
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {session.user.role}
              </span>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  退出
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {changes.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              本周暂无待确认的变更
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              所有变更都已处理完毕
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {changes.map((change) => (
              <Link
                key={change.id}
                href={`/changes/${change.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {change.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        statusColors[change.status]
                      }`}
                    >
                      {statusLabels[change.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">项目：</span>
                      {change.project.name}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">版本：</span>
                      v{change.version}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">差价：</span>
                      <span
                        className={
                          change.priceDifference.toNumber() >= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {change.priceDifference.toNumber() >= 0 ? "+" : ""}
                        ¥{change.priceDifference.toNumber().toLocaleString()}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">工期影响：</span>
                      {change.scheduleImpact > 0
                        ? `+${change.scheduleImpact} 天`
                        : change.scheduleImpact < 0
                        ? `${change.scheduleImpact} 天`
                        : "无影响"}
                    </p>
                    {change.projectManager && (
                      <p className="text-gray-600">
                        <span className="font-medium">施工负责人：</span>
                        {change.projectManager.name}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      创建时间：
                      {new Date(change.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
