import { getCurrentUser } from "@/app/actions";
import { redirect } from "next/navigation";
import ManagerSidebar from "@/components/ManagerSidebar";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "manager"].includes(user.profile?.role ?? "user"))
    redirect("/");

  return (
    <div className="flex">
      <ManagerSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
