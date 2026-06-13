import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { queryConsumptionRecords } from "@/server/services/reportService";
import { formatDate } from "@/shared/utils";
import type { User, ReportQuery } from "@/shared/types";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate") || formatDate(new Date(Date.now() - 13 * 86400000));
  const endDate = url.searchParams.get("endDate") || formatDate(new Date());
  const classId = url.searchParams.get("classId") || undefined;
  const studentId = url.searchParams.get("studentId") || undefined;
  const query: ReportQuery = { startDate, endDate, classId, studentId };

  const records = await queryConsumptionRecords(query).catch(() => []);

  const BOM = "\uFEFF";
  const header = "时间,学员,班级,消耗课时,题库版本,操作人,课时状态,缺课时数,备注";
  const rows = records.map((r: any) => {
    const time = (r.createdAt || "").replace(/,/g, " ");
    const name = (r.studentName || "").replace(/,/g, " ");
    const cls = (r.className || "").replace(/,/g, " ");
    const hours = r.hours ?? 0;
    const version = (r.questionBankVersionName || "").replace(/,/g, " ");
    const op = (r.operatorName || "").replace(/,/g, " ");
    const status = r.isInsufficient ? "课时不足" : "正常";
    const shortage = r.isInsufficient ? (r.insufficientHours || 0) : 0;
    const remark = (r.remark || "").replace(/,/g, " ").replace(/\n/g, " ");
    return `${time},${name},${cls},${hours},${version},${op},${status},${shortage},${remark}`;
  });

  const csv = BOM + [header, ...rows].join("\n");
  const filename = `消课报表_${startDate}_${endDate}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
