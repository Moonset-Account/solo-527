import type { RefundRecord, DiscussionRecord } from './types';

export function maskRefundFeedback(record: RefundRecord): RefundRecord {
	return {
		...record,
		student_id: hashId(record.student_id),
		feedback: sanitizePii(record.feedback)
	};
}

export function maskDiscussionContent(
	record: DiscussionRecord,
	isInternal: boolean
): DiscussionRecord {
	if (isInternal) {
		return record;
	}
	return {
		...record,
		student_id: hashId(record.student_id),
		content: '[内容仅内部可见]',
		topic_summary: record.topic_summary
	};
}

function hashId(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		const char = id.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash |= 0;
	}
	return `U${Math.abs(hash).toString(36).padStart(6, '0')}`;
}

const piiPatterns = [
	/1[3-9]\d{9}/g,
	/[\w.-]+@[\w.-]+\.\w+/g,
	/\d{17}[\dXx]/g,
	/[\u4e00-\u9fa5]{2,4}(?=[，。！？\s]|$)/g
];

function sanitizePii(text: string): string {
	let result = text;
	piiPatterns.forEach((pattern) => {
		result = result.replace(pattern, '[已脱敏]');
	});
	return result;
}

export function getExportDiscussionText(
	record: DiscussionRecord,
	isInternal: boolean
): string {
	return isInternal ? record.topic_summary : record.topic_summary;
}
