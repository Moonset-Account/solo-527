import { Sidebar } from "@/components/layout/sidebar";
import { ProjectList } from "@/components/projects/project-list";

export default function AdminProjectsPage() {
  return (
    <div className="flex">
      <Sidebar role="ADMIN" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <ProjectList />
      </main>
    </div>
  );
}
