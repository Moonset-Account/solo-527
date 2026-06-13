import { createClient } from "@/lib/supabase/server";
import SafetyReportsClient from "./SafetyReportsClient";
import type { SafetyReport, Court } from "@/lib/types";

export default async function SafetyReportsPage() {
  const supabase = createClient();

  const [{ data: reports }, { data: courts }] = await Promise.all([
    supabase
      .from("safety_reports")
      .select("*")
      .order("submitted_at", { ascending: false }),
    supabase.from("courts").select("*").order("code"),
  ]);

  const reportsData = (reports as SafetyReport[]) ?? [];
  const courtsData = (courts as Court[]) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">设备安全报表</h1>
        <p className="text-sm text-slate-500 mt-1">
          共 {reportsData.length} 份报表，处理冲突后将自动同步生成
        </p>
      </div>

      <SafetyReportsClient reports={reportsData} courts={courtsData} />
    </div>
  );
}
