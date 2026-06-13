import { createClient } from "@/lib/supabase/server";
import ConflictsClient from "./ConflictsClient";
import type { CourtConflict } from "@/lib/types";

export default async function ConflictsPage() {
  const supabase = createClient();

  const { data: conflicts } = await supabase
    .from("court_conflicts")
    .select("*, court:court_id(*)")
    .order("created_at", { ascending: false });

  const conflictsData = (conflicts as CourtConflict[]) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">场地冲突处理</h1>
        <p className="text-sm text-slate-500 mt-1">
          共 {conflictsData.length} 条冲突记录，处理后将自动同步到安全报表
        </p>
      </div>

      <ConflictsClient conflicts={conflictsData} />
    </div>
  );
}
