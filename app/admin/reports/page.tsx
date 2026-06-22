import { Sidebar } from "@/components/layout/sidebar";
import { ReportsCenter } from "@/components/reports/reports-center";

export default function AdminReportsPage() {
  return (
    <div className="flex">
      <Sidebar role="ADMIN" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <ReportsCenter />
      </main>
    </div>
  );
}
