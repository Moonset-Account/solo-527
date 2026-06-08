import type {
	ViewingRecord,
	QuizRecord,
	WrongAnswerRecord,
	DiscussionRecord,
	RefundRecord,
	ChapterVersion
} from './types';

const CHAPTERS = [
	'ch01-课程导论',
	'ch02-基础概念',
	'ch03-核心原理',
	'ch04-方法入门',
	'ch05-进阶技巧',
	'ch06-实战演练',
	'ch07-案例分析',
	'ch08-综合应用',
	'ch09-拓展提升',
	'ch10-总结回顾'
];

const VERSIONS = ['1.0', '1.1', '2.0'];

const RELEASE_DATES: Record<string, Record<string, string>> = {
	'ch01-课程导论': { '1.0': '2025-01-10', '1.1': '2025-03-15', '2.0': '2025-05-20' },
	'ch02-基础概念': { '1.0': '2025-01-15', '1.1': '2025-03-20', '2.0': '2025-05-25' },
	'ch03-核心原理': { '1.0': '2025-01-20', '1.1': '2025-03-25', '2.0': '2025-05-30' },
	'ch04-方法入门': { '1.0': '2025-02-01', '1.1': '2025-04-01', '2.0': '2025-06-01' },
	'ch05-进阶技巧': { '1.0': '2025-02-10', '1.1': '2025-04-10', '2.0': '2025-06-05' },
	'ch06-实战演练': { '1.0': '2025-02-20', '1.1': '2025-04-20', '2.0': '2025-06-08' },
	'ch07-案例分析': { '1.0': '2025-03-01', '1.1': '2025-05-01', '2.0': '2025-06-08' },
	'ch08-综合应用': { '1.0': '2025-03-10', '1.1': '2025-05-10', '2.0': '2025-06-08' },
	'ch09-拓展提升': { '1.0': '2025-03-20', '1.1': '2025-05-20', '2.0': '2025-06-08' },
	'ch10-总结回顾': { '1.0': '2025-04-01', '1.1': '2025-06-01', '2.0': '2025-06-08' }
};

const TOPICS = [
	'概念理解困难',
	'作业难度偏高',
	'节奏太快',
	'需要更多示例',
	'内容衔接问题',
	'练习不够',
	'讲解清晰',
	'收获很大',
	'建议增加互动',
	'希望能有回放'
];

const DISCUSSION_CONTENTS = [
	'老师，第三小节的公式推导部分能否再详细讲一下？感觉跳步了。',
	'这个例题的思路很棒，但我觉得中间步骤可以再拆解一下。',
	'课后练习第三题是不是和课上讲的方法不太一样？',
	'能否提供更多实际应用的案例？理论部分已经理解了。',
	'这节课的节奏比之前快了不少，建议适当放慢。',
	'我觉得这个概念和前面第二章的联系很紧密，建议加个回顾链接。',
	'作业提交后能看一下标准答案吗？想对比一下自己的思路。',
	'这部分内容非常好，终于理解了之前一直困惑的问题！',
	'视频播放到12分钟的时候卡顿了一下，可能需要修复。',
	'希望能增加一些小组讨论的环节，线上学习缺少互动。'
];

function rand(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
	return Math.floor(rand(min, max + 1));
}

function pickVersion(chapter: string, date: string): string {
	const releases = RELEASE_DATES[chapter];
	const sorted = Object.entries(releases)
		.filter(([, d]) => d <= date)
		.sort((a, b) => b[1].localeCompare(a[1]));
	if (sorted.length === 0) return '1.0';

	if (sorted.length > 0) {
		const latestDate = sorted[0][1];
		if (date === latestDate && Math.random() < 0.3) {
			return sorted.length > 1 ? sorted[1][0] : sorted[0][0];
		}
	}
	return sorted[0][0];
}

function isTransitionDay(chapter: string, version: string, date: string): boolean {
	const releases = RELEASE_DATES[chapter];
	return releases[version] === date;
}

function generateDate(): string {
	const start = new Date('2025-01-01').getTime();
	const end = new Date('2025-06-30').getTime();
	const d = new Date(start + Math.random() * (end - start));
	return d.toISOString().slice(0, 10);
}

export function generateMockData() {
	const STUDENT_COUNT = 200;
	const students: string[] = [];
	for (let i = 0; i < STUDENT_COUNT; i++) {
		students.push(`STU${String(i + 1).padStart(4, '0')}`);
	}

	const viewings: ViewingRecord[] = [];
	const quizzes: QuizRecord[] = [];
	const wrongAnswers: WrongAnswerRecord[] = [];
	const discussions: DiscussionRecord[] = [];
	const refunds: RefundRecord[] = [];
	const chapterVersions: ChapterVersion[] = [];

	for (const ch of CHAPTERS) {
		for (const [ver, relDate] of Object.entries(RELEASE_DATES[ch])) {
			chapterVersions.push({
				chapter_id: ch,
				version: ver,
				release_date: relDate,
				changes_summary: `${ch} v${ver} 更新`
			});
		}
	}

	for (const student of students) {
		const depth = randInt(3, 10);
		for (let ci = 0; ci < depth; ci++) {
			const ch = CHAPTERS[ci];
			const date = generateDate();
			const version = pickVersion(ch, date);
			const transition = isTransitionDay(ch, version, date);

			const completionRate = Math.max(0.1, Math.min(1, rand(0.3, 1) - ci * 0.05));
			const watchDuration = Math.round(rand(300, 3600));

			viewings.push({
				student_id: student,
				chapter_id: ch,
				chapter_version: version,
				watch_duration: watchDuration,
				completion_rate: Math.round(completionRate * 100) / 100,
				date,
				is_transition: transition
			});

			if (completionRate > 0.5) {
				const total = randInt(5, 10);
				const score = Math.max(
					0,
					Math.round(total * Math.max(0.2, completionRate - 0.2 + rand(-0.2, 0.1)))
				);

				quizzes.push({
					student_id: student,
					chapter_id: ch,
					chapter_version: version,
					quiz_id: `${ch}-Q1`,
					score,
					total,
					date
				});

				const wrongCount = total - score;
				for (let q = 0; q < wrongCount && q < total; q++) {
					wrongAnswers.push({
						student_id: student,
						chapter_id: ch,
						chapter_version: version,
						quiz_id: `${ch}-Q1`,
						question_id: `${ch}-Q1-${q + 1}`,
						selected_option: String.fromCharCode(65 + randInt(0, 3)),
						correct_option: String.fromCharCode(65 + randInt(0, 3)),
						date
					});
				}
			}

			if (Math.random() < 0.15) {
				const topicIdx = randInt(0, TOPICS.length - 1);
				const contentIdx = randInt(0, DISCUSSION_CONTENTS.length - 1);
				discussions.push({
					student_id: student,
					chapter_id: ch,
					topic: TOPICS[topicIdx],
					content: DISCUSSION_CONTENTS[contentIdx],
					topic_summary: TOPICS[topicIdx],
					date
				});
			}
		}

		if (Math.random() < 0.08) {
			const refundChapter = CHAPTERS[randInt(0, depth - 1)];
			refunds.push({
				student_id: student,
				chapter_id: refundChapter,
				reason: '内容不符合预期',
				feedback: `我觉得${refundChapter}的内容不太适合我，联系电话13800001111，邮箱test@example.com`,
				date: generateDate()
			});
		}
	}

	return { viewings, quizzes, wrongAnswers, discussions, refunds, chapterVersions };
}
