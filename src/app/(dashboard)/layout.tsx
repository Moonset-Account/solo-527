import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <TRPCProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="ml-60 transition-all duration-300">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </TRPCProvider>
  );
}
