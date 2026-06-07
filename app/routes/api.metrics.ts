import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  getFunnelMetrics,
  getQuizScoreDistribution,
  getDepartmentComparison,
  getCertificateTrend,
  getAnomalies,
  getDimensionOptions,
} from "../../scripts/aggregate-metrics";
import { cacheGet, cacheSet, CACHE_TTL, getCacheKey } from "~/config/redis.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const params: Record<string, any> = {};

  const departmentId = url.searchParams.get("department_id");
  const courseId = url.searchParams.get("course_id");
  const cohortId = url.searchParams.get("cohort_id");
  const instructorId = url.searchParams.get("instructor_id");
  const position = url.searchParams.get("position");
  const metric = url.searchParams.get("metric") || "all";

  if (departmentId) params.department_id = parseInt(departmentId);
  if (courseId) params.course_id = parseInt(courseId);
  if (cohortId) params.cohort_id = parseInt(cohortId);
  if (instructorId) params.instructor_id = parseInt(instructorId);
  if (position) params.position = position;

  const cacheKey = getCacheKey(`metrics:${metric}`, params);
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return json({ ...cached, fromCache: true });
  }

  try {
    let result: any = {};

    if (metric === "all" || metric === "funnel") {
      result.funnel = await getFunnelMetrics(params);
    }
    if (metric === "all" || metric === "quiz-distribution") {
      result.quizDistribution = await getQuizScoreDistribution(params);
    }
    if (metric === "all" || metric === "department") {
      result.departmentComparison = await getDepartmentComparison(params);
    }
    if (metric === "all" || metric === "certificate-trend") {
      result.certificateTrend = await getCertificateTrend(params);
    }
    if (metric === "all" || metric === "anomalies") {
      result.anomalies = await getAnomalies(params);
    }
    if (metric === "all" || metric === "dimensions") {
      result.dimensions = await getDimensionOptions();
    }

    await cacheSet(cacheKey, result, CACHE_TTL.MEDIUM);

    return json({ ...result, fromCache: false, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Metrics API error:", error);
    return json(
      { error: "Failed to fetch metrics", details: (error as Error).message },
      { status: 500 }
    );
  }
}
