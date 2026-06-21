"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/DataTable";

interface ClassesPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function ClassesPagination({ page, pageSize, total }: ClassesPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    const qs = params.toString();
    router.push(`/classes${qs ? `?${qs}` : ""}`);
  };

  return (
    <Pagination
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={handlePageChange}
    />
  );
}
