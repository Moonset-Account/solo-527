import { useLoaderData, redirect } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { formatDateTime, apiFetch } from "../utils/api";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userRes = await fetch(
      `${new URL(request.url).origin}/api/auth/me`,
      { headers: request.headers, credentials: "include" }
    );

    if (!userRes.ok) {
      return redirect("/login");
    }

    const { user } = await userRes.json();

    const notifRes = await fetch(
      `${new URL(request.url).origin}/api/notifications?limit=50`,
      { headers: request.headers, credentials: "include" }
    );
    const notifData = notifRes.ok ? await notifRes.json() : { notifications: [], unread_count: 0 };

    return json({ user, notifications: notifData.notifications || [], unreadCount: notifData.unread_count || 0 });
  } catch (err) {
    return redirect("/login");
  }
}

export function meta() {
  return [
    { title: "通知 - 备件借用系统" },
  ];
}

export default function Notifications() {
  const { user, notifications, unreadCount } = useLoaderData<typeof loader>();

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <h1 className="page-title">通知中心</h1>
        {unreadCount > 0 && (
          <button className="btn btn-outline" onClick={handleMarkAllRead}>
            全部标为已读
          </button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "60px 0" }}>
            暂无通知
          </p>
        ) : (
          <div style={{ maxHeight: "70vh", overflow: "auto" }}>
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e5e7eb",
                  background: notif.is_read ? "white" : "#eff6ff",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 style={{ fontWeight: 600, fontSize: "14px" }}>
                    {!notif.is_read && (
                      <span style={{ 
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        background: "#2563eb",
                        borderRadius: "50%",
                        marginRight: "8px",
                      }} />
                    )}
                    {notif.title}
                  </h4>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {formatDateTime(notif.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#4b5563" }}>{notif.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
