import { NextResponse } from "next/server";
import {
  generateMonthlyReport,
  generateBudgetChangeReport,
  exportToExcel,
  formatForExport,
} from "@/lib/reports";
import { z } from "zod";

const monthlyReportSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

const exportSchema = z.object({
  type: z.enum(["budget", "projects", "repairs", "feedbacks"]),
  format: z.enum(["xlsx"]).default("xlsx"),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    projectId: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  try {
    if (type === "monthly" && year && month) {
      const validated = monthlyReportSchema.parse({
        year: parseInt(year, 10),
        month: parseInt(month, 10),
      });

      const report = await generateMonthlyReport(validated.year, validated.month);
      return NextResponse.json(report);
    }

    if (type === "budget") {
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;
      const projectId = searchParams.get("projectId") || undefined;

      const report = await generateBudgetChangeReport({
        startDate,
        endDate,
        projectId,
      });

      return NextResponse.json(report);
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Get report error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = exportSchema.parse(body);

    let data: Array<Record<string, unknown>> = [];
    let filename = "";
    let columns: { key: string; label: string }[] = [];

    if (validated.type === "budget") {
      const report = await generateBudgetChangeReport(validated.filters || {});
      data = report.data.map((bc) => ({
        ...bc,
        projectName: bc.project.name,
        createdByName: bc.createdBy.name,
        createdByRole: bc.createdBy.role,
        oldBudget: bc.oldBudget.toNumber(),
        newBudget: bc.newBudget.toNumber(),
        amount: bc.amount.toNumber(),
      }));
      filename = `预算变更报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      columns = [
        { key: "projectName", label: "项目名称" },
        { key: "changeType", label: "变更类型" },
        { key: "description", label: "描述" },
        { key: "oldBudget", label: "原预算" },
        { key: "newBudget", label: "新预算" },
        { key: "amount", label: "变更金额" },
        { key: "referenceType", label: "关联类型" },
        { key: "note", label: "备注" },
        { key: "createdByName", label: "创建人" },
        { key: "createdByRole", label: "角色" },
        { key: "createdAt", label: "创建时间" },
      ];
    }

    const formattedData = formatForExport(data, columns);
    const buffer = exportToExcel(formattedData, filename, "数据");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
