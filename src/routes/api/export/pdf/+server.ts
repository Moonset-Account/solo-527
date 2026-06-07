import type { RequestHandler } from './$types';
import { getAllRecords } from '$lib/server/db';
import {
	filterRecords,
	calculateOverview,
	calculateSankeyData,
	calculateDepartmentComparison,
	calculateIntradayTrend
} from '$lib/analytics';
import { desensitizeRecords, getCurrentUserRole, checkPermission } from '$lib/server/security';
import { metricDefinitions } from '$lib/dictionary';
import type { FilterParams } from '$types';

export const POST: RequestHandler = async ({ request }) => {
	const role = getCurrentUserRole();

	if (!checkPermission(role, 'export_pdf')) {
		return new Response(JSON.stringify({ error: '无权限导出 PDF' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const body = await request.json();
	const { filters, includeCharts = true, includeDefinitions = true } = body as {
		filters: Partial<FilterParams>;
		includeCharts?: boolean;
		includeDefinitions?: boolean;
	};

	let records = await getAllRecords();
	records = filterRecords(records, filters);
	records = desensitizeRecords(records, role);

	const overview = calculateOverview(records);
	const deptCompare = calculateDepartmentComparison(records);

	const pdfContent = generatePDFContent(overview, deptCompare, includeCharts, includeDefinitions, filters);

	const headers = new Headers();
	headers.set('Content-Type', 'application/pdf');
	headers.set(
		'Content-Disposition',
		`attachment; filename="wait_time_report_${new Date().toISOString().slice(0, 10)}.pdf"`
	);

	return new Response(pdfContent, { headers });
};

function generatePDFContent(
	overview: any,
	deptCompare: any[],
	includeCharts: boolean,
	includeDefinitions: boolean,
	filters: Partial<FilterParams>
): string {
	const isPublic = getCurrentUserRole() === 'public';
	const generateDate = new Date().toLocaleDateString('zh-CN');

	let content = `%PDF-1.4\n`;
	content += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
	content += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

	let pageContent = `BT\n/F1 16 Tf\n280 800 Td\n(医院门诊等待时间分析报告) Tj\nET\n`;
	pageContent += `BT\n/F1 10 Tf\n260 780 Td\n(生成日期: ${generateDate}) Tj\nET\n`;

	if (isPublic) {
		pageContent += `BT\n/F1 9 Tf\n50 760 Td\n(数据级别: 公开版 - 已脱敏) Tj\nET\n`;
	}

	pageContent += `BT\n/F1 12 Tf\n50 730 Td\n(一、总体概览) Tj\nET\n`;

	const metrics = [
		{ label: '总就诊人次', value: overview?.totalVisits || 0 },
		{ label: '平均总等待时间', value: `${overview?.avgTotalWait || 0} 分钟` },
		{ label: '中位等待时间', value: `${overview?.medianTotalWait || 0} 分钟` },
		{ label: 'P95 等待时间', value: `${overview?.p95TotalWait || 0} 分钟` },
		{ label: '异常记录数', value: overview?.anomalyCount || 0 }
	];

	metrics.forEach((m, i) => {
		const y = 700 - i * 25;
		pageContent += `BT\n/F1 10 Tf\n70 ${y} Td\n(${m.label}:) Tj\nET\n`;
		pageContent += `BT\n/F1 10 Tf\n200 ${y} Td\n(${m.value}) Tj\nET\n`;
	});

	let yPos = 540;
	pageContent += `BT\n/F1 12 Tf\n50 ${yPos} Td\n(二、科室等待时间排名) Tj\nET\n`;
	yPos -= 20;

	const topDepts = [...deptCompare].sort((a, b) => b.avgWaitTime - a.avgWaitTime).slice(0, 5);
	topDepts.forEach((dept, i) => {
		const y = yPos - i * 20;
		pageContent += `BT\n/F1 9 Tf\n70 ${y} Td\n(${i + 1}. ${dept.department}: ${dept.avgWaitTime}分钟 (${dept.visitCount}人次)) Tj\nET\n`;
	});

	if (includeDefinitions) {
		yPos = 400;
		pageContent += `BT\n/F1 12 Tf\n50 ${yPos} Td\n(三、指标口径说明) Tj\nET\n`;
		yPos -= 20;

		const definitions = [
			'总等待时间: 从挂号到取药的全部时间',
			'分诊-叫号: 从分诊完成到医生叫号的时间',
			'P95 等待时间: 95%的患者等待时间不超过此值',
			'异常数据: 等待时间超过3小时或时间顺序错误'
		];

		definitions.forEach((def, i) => {
			const y = yPos - i * 18;
			pageContent += `BT\n/F1 8 Tf\n70 ${y} Td\n(${def}) Tj\nET\n`;
		});
	}

	pageContent += `BT\n/F1 8 Tf\n50 80 Td\n(免责声明: 本报告仅用于运营流程分析，不涉及任何诊断建议。) Tj\nET\n`;

	content += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 840] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
	content += `4 0 obj\n<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream\nendobj\n`;
	content += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
	content += `xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000109 00000 n \n0000000216 00000 n \n0000000${216 + pageContent.length + 30} 00000 n \n`;
	content += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${216 + pageContent.length + 100}\n%%EOF`;

	return content;
}
