"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import type { DataTableColumn } from "@/components/ui/DataTable";

interface LeadsTableWrapperProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
}

export default function LeadsTableWrapper<T extends { id: string }>({
  columns,
  data,
  rowKey,
}: LeadsTableWrapperProps<T>) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={rowKey}
      onClickRow={(r) => router.push(`/leads/${r.id}`)}
    />
  );
}
