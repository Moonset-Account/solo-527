import { Sidebar } from "@/components/layout/sidebar";
import { RepairManagement } from "@/components/repairs/repair-management";

export default function AdminRepairsPage() {
  return (
    <div className="flex">
      <Sidebar role="ADMIN" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <RepairManagement showOverdueAlert={true} />
      </main>
    </div>
  );
}
