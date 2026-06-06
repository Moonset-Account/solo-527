import { VisitProcess, FilterState } from "@/types";
import { MOCK_VISITS, MOCK_DEPARTMENTS, MOCK_DOCTORS, MOCK_PATIENT_TYPES, filterVisits } from "@/mock/data";

const API_BASE_URL = "/api";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  summary?: { total: number; success: number; failed: number };
  importId?: string;
}

export interface FetchVisitsParams {
  page?: number;
  pageSize?: number;
  deptId?: string;
  doctorId?: string;
  patientTypeId?: string;
  startDate?: string;
  endDate?: string;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("hospital-auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function fetchVisits(
  params: FetchVisitsParams = {}
): Promise<ApiResponse<VisitProcess[]>> {
  if (USE_MOCK_DATA) {
    const filters: Partial<FilterState> = {};
    if (params.deptId) filters.departments = [params.deptId];
    if (params.doctorId) filters.doctors = [params.doctorId];
    if (params.patientTypeId) filters.patientTypes = [params.patientTypeId];
    if (params.startDate && params.endDate) {
      filters.dateRange = [params.startDate, params.endDate];
    }

    const filtered = filterVisits(MOCK_VISITS, filters);
    const page = params.page || 1;
    const pageSize = params.pageSize || 100;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
      success: true,
      data: paginated,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  }

  try {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.deptId) searchParams.set("deptId", params.deptId);
    if (params.doctorId) searchParams.set("doctorId", params.doctorId);
    if (params.patientTypeId) searchParams.set("patientTypeId", params.patientTypeId);
    if (params.startDate) searchParams.set("startDate", params.startDate);
    if (params.endDate) searchParams.set("endDate", params.endDate);

    const response = await fetchWithAuth(
      `${API_BASE_URL}/visits?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "获取数据失败",
      };
    }

    return await response.json();
  } catch (error) {
    console.error("API Error - fetchVisits:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
    };
  }
}

export async function createVisit(
  data: Partial<VisitProcess>
): Promise<ApiResponse<VisitProcess>> {
  if (USE_MOCK_DATA) {
    const newVisit: VisitProcess = {
      ...MOCK_VISITS[0],
      ...data,
      id: `visit-${Date.now()}`,
    };
    MOCK_VISITS.unshift(newVisit);
    return { success: true, data: newVisit };
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/visits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "创建数据失败",
        message: error.errors,
      };
    }

    return await response.json();
  } catch (error) {
    console.error("API Error - createVisit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
    };
  }
}

export async function importCSV(
  file: File,
  options: {
    departmentMap?: Record<string, string>;
    doctorMap?: Record<string, string>;
    patientTypeMap?: Record<string, string>;
  } = {}
): Promise<ApiResponse<any>> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        importId: `import-${Date.now()}`,
        summary: {
          total: 100,
          success: 95,
          failed: 5,
        },
      },
    };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("departmentMap", JSON.stringify(options.departmentMap || {}));
    formData.append("doctorMap", JSON.stringify(options.doctorMap || {}));
    formData.append("patientTypeMap", JSON.stringify(options.patientTypeMap || {}));

    const response = await fetchWithAuth(`${API_BASE_URL}/import/csv`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "导入失败",
        message: error.message,
      };
    }

    return await response.json();
  } catch (error) {
    console.error("API Error - importCSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
    };
  }
}

export async function previewCSV(
  file: File
): Promise<ApiResponse<any>> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      fileName: file.name,
      fileSize: file.size,
      totalRows: 100,
      headers: ["就诊号", "科室编码", "医生编码", "挂号时间", "叫号时间"],
      preview: Array(5).fill(null).map((_, i) => ({
        visitNumber: `VISIT2026060${i + 1}`,
        deptId: "dept-001",
        doctorId: "doc-001",
        registerTime: "2026-06-01 08:00:00",
        callTime: "2026-06-01 08:45:00",
      })),
      errorCount: 0,
      warningCount: 0,
    };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithAuth(`${API_BASE_URL}/import/preview`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "预览失败",
        message: error.message,
      };
    }

    return await response.json();
  } catch (error) {
    console.error("API Error - previewCSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
    };
  }
}

export async function getImportLogs(): Promise<ApiResponse<any[]>> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: [
        {
          id: "import-001",
          fileName: "门诊数据_20260601.csv",
          totalRecords: 1500,
          successRecords: 1480,
          failedRecords: 20,
          status: "completed",
          createdAt: "2026-06-01 18:30:00",
        },
      ],
    };
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/import/csv`, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "获取导入记录失败",
      };
    }

    return await response.json();
  } catch (error) {
    console.error("API Error - getImportLogs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
    };
  }
}

export function getDataSources() {
  return {
    USE_MOCK_DATA,
    API_BASE_URL,
    departments: MOCK_DEPARTMENTS,
    doctors: MOCK_DOCTORS,
    patientTypes: MOCK_PATIENT_TYPES,
  };
}

export async function login(
  username: string,
  password: string
): Promise<ApiResponse<{ token: string; user: any }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "登录失败",
      };
    }

    return {
      success: true,
      data: {
        token: data.token,
        user: data.user,
      },
    };
  } catch (error) {
    console.error("API Error - login:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
    };
  }
}
