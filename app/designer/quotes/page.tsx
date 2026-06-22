import { Sidebar } from "@/components/layout/sidebar";
import { QuoteList } from "@/components/quotes/quote-list";

export default function DesignerQuotesPage() {
  return (
    <div className="flex">
      <Sidebar role="DESIGNER" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <QuoteList showConfirmButton={true} />
      </main>
    </div>
  );
}
