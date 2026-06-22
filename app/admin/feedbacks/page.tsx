import { Sidebar } from "@/components/layout/sidebar";
import { FeedbackManagement } from "@/components/feedbacks/feedback-management";

export default function AdminFeedbacksPage() {
  return (
    <div className="flex">
      <Sidebar role="ADMIN" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <FeedbackManagement />
      </main>
    </div>
  );
}
