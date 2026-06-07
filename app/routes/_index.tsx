import { useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { Filters, DashboardData } from "~/types";
import { FilterBar } from "~/components/FilterBar";
import { AnomalySummary } from "~/components/AnomalySummary";
import { CompletionFunnel } from "~/components/CompletionFunnel";
import { QuizDistribution } from "~/components/QuizDistribution";
import { DepartmentComparison } from "~/components/DepartmentComparison";
import { CertificateTrend } from "~/components/CertificateTrend";
import { ExportButton } from "~/components/ExportButton";
import { mockDashboardData } from "~/data/mockData";

const USE_MOCK_DATA = true;

async function loadRealData(filters: Filters): Promise<DashboardData> {
  try {
    const {
      getFunnelMetrics,
      getQuizScoreDistribution,
      getDepartmentComparison,
      getCertificateTrend,
      getAnomalies,
      getDimensionOptions,
    } = await import("../../scripts/aggregate-metrics");
    const { cacheGet, cacheSet, CACHE_TTL, getCacheKey } = await import("~/config/redis.server");

    const cacheKey = getCacheKey("dashboard:page", filters);
    let data = await cacheGet<DashboardData>(cacheKey);

    if (!data) {
      const [funnel, quizDistribution, departmentComparison, certificateTrend, anomalies, dimensions] =
        await Promise.all([
          getFunnelMetrics(filters),
          getQuizScoreDistribution(filters),
          getDepartmentComparison(filters),
          getCertificateTrend(filters),
          getAnomalies(filters),
          getDimensionOptions(),
        ]);

      data = {
        funnel,
        quizDistribution,
        departmentComparison,
        certificateTrend,
        anomalies,
        dimensions,
      };

      await cacheSet(cacheKey, data, CACHE_TTL.MEDIUM);
    }

    return data;
  } catch (err) {
    console.warn("Failed to load real data, using mock data:", err);
    return mockDashboardData;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const filters: Filters = {};

  const departmentId = url.searchParams.get("department_id");
  const courseId = url.searchParams.get("course_id");
  const cohortId = url.searchParams.get("cohort_id");
  const instructorId = url.searchParams.get("instructor_id");
  const position = url.searchParams.get("position");

  if (departmentId) filters.department_id = parseInt(departmentId);
  if (courseId) filters.course_id = parseInt(courseId);
  if (cohortId) filters.cohort_id = parseInt(cohortId);
  if (instructorId) filters.instructor_id = parseInt(instructorId);
  if (position) filters.position = position;

  let data: DashboardData;
  let isMock = USE_MOCK_DATA;

  if (USE_MOCK_DATA) {
    data = mockDashboardData;
  } else {
    data = await loadRealData(filters);
  }

  return json({
    ...data,
    filters,
    timestamp: new Date().toISOString(),
    isMock,
  });
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                企业培训完成率仪表盘
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                追踪报名、签到、完成、测验、证书的全链路数据
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isLoading && (
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="animate-spin">⟳</span>
                  数据加载中...
                </span>
              )}
              <ExportButton filters={data.filters} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <FilterBar dimensions={data.dimensions} filters={data.filters} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
          <AnomalySummary anomalies={data.anomalies} />
          </div>
          <div className="xl:col-span-2">
            <CompletionFunnel data={data.funnel} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuizDistribution data={data.quizDistribution} />
          <DepartmentComparison data={data.departmentComparison} />
        </div>

        <CertificateTrend data={data.certificateTrend} />

        <div className="text-center text-xs text-gray-400 py-4">
          数据更新时间：{data.timestamp}
          {data.isMock && <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">演示数据</span>}
        </div>
      </main>
    </div>
  );
}
