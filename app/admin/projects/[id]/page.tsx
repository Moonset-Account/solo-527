import { Sidebar } from "@/components/layout/sidebar";
import { ProjectDetail } from "@/components/projects/project-detail";

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex">
      <Sidebar role="ADMIN" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <ProjectDetail projectId={params.id} />
      </main>
    </div>
  );
}
