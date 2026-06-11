import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { logout } from "@/server/services/authService";

export async function action({ request, context }: ActionFunctionArgs) {
  const ctx: any = context;
  const sid = ctx.sessionId;
  if (sid) await logout(sid);
  return redirect("/login", {
    headers: { "Set-Cookie": "sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT" },
  });
}

export function loader() {
  return redirect("/login");
}
