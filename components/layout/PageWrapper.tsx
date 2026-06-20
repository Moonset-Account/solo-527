import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function PageWrapper({ children, title, description }: PageWrapperProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="hidden md:block w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} description={description} />

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
