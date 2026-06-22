import { Sidebar } from "@/components/layout/sidebar";
import { AddonList } from "@/components/addons/addon-list";

export default function DesignerAddonsPage() {
  return (
    <div className="flex">
      <Sidebar role="DESIGNER" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <AddonList showConfirmButton={true} />
      </main>
    </div>
  );
}
