import { Sidebar } from "@/components/layout/sidebar";
import { BudgetTracking } from "@/components/budget/budget-tracking";

export default function AdminBudgetPage() {
  return (
    <div className="flex">
      <Sidebar role="ADMIN" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <BudgetTracking showExport={true} />
      </main>
    </div>
  );
}
