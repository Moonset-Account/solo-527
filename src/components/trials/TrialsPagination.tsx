"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/DataTable";

interface TrialsPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function TrialsPagination({ page, pageSize, total }: TrialsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    const qs = params.toString();
    router.push(`/trials${qs ? `?${qs}` : ""}`);
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
