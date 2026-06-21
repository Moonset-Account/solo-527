import { Page, PageHeader } from "@/components/Page";
import { ConsumptionTable } from "@/components/ConsumptionTable";
import { api } from "@/lib/trpc/server";

export default async function ConsumptionsPage() {
  const apiCaller = await api();
  const classesRes = await apiCaller.classes.list({ page: 1, pageSize: 100 });
  const students: { id: string; name: string }[] = [];
  const classes = classesRes.items.map((c: any) => ({ id: c.id, name: c.name }));

  for (const cls of classesRes.items as any[]) {
    const studentsRes = await apiCaller.classes.getStudents({ classId: cls.id, page: 1, pageSize: 100 });
    for (const s of studentsRes.items as any[]) {
      if (!students.find((x) => x.id === s.id)) {
        students.push({ id: s.id, name: s.name });
      }
    }
  }
  students.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Page>
      <PageHeader
        breadcrumb={[{ label: "教务管理" }, { label: "课时消耗" }]}
        title="课时消耗管理"
        subtitle="查看和管理所有学生的课时消耗记录，支持追溯与对账"
      />
      <ConsumptionTable initialClasses={classes} initialStudents={students} />
    </Page>
  );
}
