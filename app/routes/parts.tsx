import { useLoaderData, redirect, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppLayout } from "../components/AppLayout";
import { formatDate } from "../utils/api";

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

    const partsRes = await fetch(
      `${new URL(request.url).origin}/api/parts?limit=100`,
      { headers: request.headers, credentials: "include" }
    );
    const partsData = partsRes.ok ? await partsRes.json() : { parts: [] };

    return json({ user, parts: partsData.parts || [] });
  } catch (err) {
    return redirect("/login");
  }
}

export default function Parts() {
  const { user, parts } = useLoaderData<typeof loader>();

  return (
    <AppLayout user={user}>
      <div className="page-header">
        <h1 className="page-title">备件库</h1>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>备件编码</th>
              <th>备件名称</th>
              <th>分类</th>
              <th>规格</th>
              <th>单价</th>
              <th>可用库存</th>
              <th>锁定库存</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part: any) => (
              <tr key={part.id}>
                <td style={{ fontWeight: 500 }}>{part.part_code}</td>
                <td>{part.part_name}</td>
                <td>{part.category || "-"}</td>
                <td>{part.specification || "-"}</td>
                <td>¥{Number(part.price).toFixed(2)}</td>
                <td style={{ color: "#059669", fontWeight: 500 }}>
                  {part.total_available || 0}
                </td>
                <td style={{ color: "#f59e0b" }}>
                  {part.total_locked || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
