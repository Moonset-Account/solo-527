import { db } from './db';
import {
	users,
	tags,
	materials,
	materialTags,
	materialReuse,
	topics,
	topicMaterials,
	scripts,
	sourceRecords,
	sourceRecordReferences,
	tasks,
	deliverables,
	schedules,
	anomalies
} from './schema';

async function seed() {
	console.log('🌱 开始填充种子数据...');

	console.log('→ 清理旧数据...');
	await db.delete(anomalies);
	await db.delete(schedules);
	await db.delete(deliverables);
	await db.delete(tasks);
	await db.delete(sourceRecordReferences);
	await db.delete(sourceRecords);
	await db.delete(scripts);
	await db.delete(topicMaterials);
	await db.delete(topics);
	await db.delete(materialReuse);
	await db.delete(materialTags);
	await db.delete(materials);
	await db.delete(tags);
	await db.delete(users);

	const userIds = {
		zhangwei: crypto.randomUUID(),
		lina: crypto.randomUUID(),
		wanglei: crypto.randomUUID(),
		zhaomin: crypto.randomUUID()
	};

	console.log('→ 插入用户...');
	await db.insert(users).values([
		{ id: userIds.zhangwei, name: '张伟', email: 'zhangwei@news.example.com', role: 'supervisor' },
		{ id: userIds.lina, name: '李娜', email: 'lina@news.example.com', role: 'editor' },
		{ id: userIds.wanglei, name: '王磊', email: 'wanglei@news.example.com', role: 'shooter' },
		{ id: userIds.zhaomin, name: '赵敏', email: 'zhaomin@news.example.com', role: 'cutter' }
	]);

	const tagIds = {
		renwu: crypto.randomUUID(),
		shizheng: crypto.randomUUID(),
		jingji: crypto.randomUUID(),
		keji: crypto.randomUUID(),
		caifang: crypto.randomUUID(),
		hangpai: crypto.randomUUID(),
		yanboshi: crypto.randomUUID(),
		jishi: crypto.randomUUID()
	};

	console.log('→ 插入标签...');
	await db.insert(tags).values([
		{ id: tagIds.renwu, name: '人物', category: '主题' },
		{ id: tagIds.shizheng, name: '时政', category: '主题' },
		{ id: tagIds.jingji, name: '经济', category: '主题' },
		{ id: tagIds.keji, name: '科技', category: '主题' },
		{ id: tagIds.caifang, name: '采访', category: '拍摄类型' },
		{ id: tagIds.hangpai, name: '航拍', category: '拍摄类型' },
		{ id: tagIds.yanboshi, name: '演播室', category: '拍摄类型' },
		{ id: tagIds.jishi, name: '纪实', category: '拍摄类型' }
	]);

	const materialIds = {
		interviewVideo: crypto.randomUUID(),
		aerialCity: crypto.randomUUID(),
		scriptDoc: crypto.randomUUID(),
		pressConference: crypto.randomUUID(),
		backgroundMusic: crypto.randomUUID(),
		techLabPhoto: crypto.randomUUID()
	};

	console.log('→ 插入素材...');
	await db.insert(materials).values([
		{
			id: materialIds.interviewVideo,
			title: '市长专访视频',
			type: 'video',
			fileUrl: '/uploads/mayor-interview.mp4',
			fileSize: 524288000,
			uploadedBy: userIds.wanglei
		},
		{
			id: materialIds.aerialCity,
			title: '城市航拍素材',
			type: 'video',
			fileUrl: '/uploads/city-aerial.mp4',
			fileSize: 1073741824,
			uploadedBy: userIds.wanglei
		},
		{
			id: materialIds.scriptDoc,
			title: '新闻稿件模板',
			type: 'document',
			fileUrl: '/uploads/script-template.docx',
			fileSize: 25600,
			uploadedBy: userIds.lina
		},
		{
			id: materialIds.pressConference,
			title: '新闻发布会现场照片',
			type: 'image',
			fileUrl: '/uploads/press-conf.jpg',
			fileSize: 3145728,
			uploadedBy: userIds.wanglei
		},
		{
			id: materialIds.backgroundMusic,
			title: '片头背景音乐',
			type: 'audio',
			fileUrl: '/uploads/bg-music.mp3',
			fileSize: 5242880,
			uploadedBy: userIds.zhaomin
		},
		{
			id: materialIds.techLabPhoto,
			title: '科技实验室照片',
			type: 'image',
			fileUrl: '/uploads/tech-lab.jpg',
			fileSize: 4194304,
			uploadedBy: userIds.wanglei
		}
	]);

	console.log('→ 关联素材标签...');
	await db.insert(materialTags).values([
		{ materialId: materialIds.interviewVideo, tagId: tagIds.renwu },
		{ materialId: materialIds.interviewVideo, tagId: tagIds.caifang },
		{ materialId: materialIds.interviewVideo, tagId: tagIds.shizheng },
		{ materialId: materialIds.aerialCity, tagId: tagIds.hangpai },
		{ materialId: materialIds.aerialCity, tagId: tagIds.jingji },
		{ materialId: materialIds.scriptDoc, tagId: tagIds.yanboshi },
		{ materialId: materialIds.pressConference, tagId: tagIds.shizheng },
		{ materialId: materialIds.pressConference, tagId: tagIds.caifang },
		{ materialId: materialIds.backgroundMusic, tagId: tagIds.yanboshi },
		{ materialId: materialIds.techLabPhoto, tagId: tagIds.keji },
		{ materialId: materialIds.techLabPhoto, tagId: tagIds.jishi }
	]);

	const topicIds = {
		mayorInterview: crypto.randomUUID(),
		urbanDevelopment: crypto.randomUUID(),
		techInnovation: crypto.randomUUID(),
		economicOutlook: crypto.randomUUID()
	};

	console.log('→ 插入选题...');
	await db.insert(topics).values([
		{
			id: topicIds.mayorInterview,
			title: '市长年度专访',
			description: '对市长进行年度工作回顾专访，总结城市建设成果与未来规划。',
			status: 'published',
			createdBy: userIds.lina,
			approvedBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-10T10:00:00Z')
		},
		{
			id: topicIds.urbanDevelopment,
			title: '城市更新项目进展',
			description: '跟踪报道城市更新重点项目，聚焦老旧小区改造与商业区升级。',
			status: 'in_production',
			createdBy: userIds.lina,
			approvedBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-14T09:00:00Z')
		},
		{
			id: topicIds.techInnovation,
			title: '科技创新实验室探访',
			description: '探访本地科技创新实验室，展示前沿技术成果与产学研合作模式。',
			status: 'approved',
			createdBy: userIds.lina,
			approvedBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-15T14:00:00Z')
		},
		{
			id: topicIds.economicOutlook,
			title: '下半年经济形势展望',
			description: '邀请经济学家分析下半年经济走势，解读政策信号与市场趋势。',
			status: 'draft',
			createdBy: userIds.lina,
			approvedBy: null,
			updatedAt: new Date('2026-06-16T11:00:00Z')
		}
	]);

	console.log('→ 关联选题素材...');
	await db.insert(topicMaterials).values([
		{ topicId: topicIds.mayorInterview, materialId: materialIds.interviewVideo },
		{ topicId: topicIds.mayorInterview, materialId: materialIds.pressConference },
		{ topicId: topicIds.mayorInterview, materialId: materialIds.backgroundMusic },
		{ topicId: topicIds.urbanDevelopment, materialId: materialIds.aerialCity },
		{ topicId: topicIds.urbanDevelopment, materialId: materialIds.scriptDoc },
		{ topicId: topicIds.techInnovation, materialId: materialIds.techLabPhoto },
		{ topicId: topicIds.techInnovation, materialId: materialIds.backgroundMusic }
	]);

	console.log('→ 插入脚本...');
	await db.insert(scripts).values([
		{
			id: crypto.randomUUID(),
			topicId: topicIds.mayorInterview,
			content:
				'开场白：各位观众大家好，欢迎收看本期专访。今天我们非常荣幸邀请到市长先生，与我们一起回顾过去一年的城市建设成果。\n\n第一段：城市建设回顾\n\n第二段：民生改善措施\n\n第三段：未来发展规划\n\n结束语：感谢市长先生接受我们的专访，也感谢各位观众的收看。',
			version: 1,
			createdBy: userIds.lina
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.mayorInterview,
			content: '修订版：根据审稿意见，增加了城市交通改善部分，调整了未来规划章节的表述，补充了具体数据支撑。',
			version: 2,
			createdBy: userIds.lina
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.urbanDevelopment,
			content: '以航拍城市全景开场，依次介绍三个重点改造区域：老城区商业街、东湖新区、南部工业园。每个区域配以现场采访和改造前后对比画面。',
			version: 1,
			createdBy: userIds.lina
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.techInnovation,
			content: '走进实验室系列：从实验室门口进入，依次展示AI实验室、生物科技实验室、新能源实验室。每个实验室安排研究人员讲解项目成果。',
			version: 1,
			createdBy: userIds.lina
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.techInnovation,
			content: '修订版：根据反馈增加了技术原理解读环节，减少专业术语，增加动画示意说明。',
			version: 2,
			createdBy: userIds.lina
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.economicOutlook,
			content: '演播室访谈形式，邀请三位经济学专家围绕GDP增长、就业形势、消费趋势三个话题展开讨论。',
			version: 1,
			createdBy: userIds.lina
		}
	]);

	const taskIds = {
		mayorShooting: crypto.randomUUID(),
		mayorEditing: crypto.randomUUID(),
		urbanShooting: crypto.randomUUID(),
		urbanEditing: crypto.randomUUID(),
		techShooting: crypto.randomUUID()
	};

	console.log('→ 插入任务...');
	await db.insert(tasks).values([
		{
			id: taskIds.mayorShooting,
			topicId: topicIds.mayorInterview,
			type: 'shooting',
			title: '市长专访现场拍摄',
			description: '在市政府会议厅进行专访拍摄，需提前架设三机位。',
			status: 'completed',
			assigneeId: userIds.wanglei,
			deadline: '2026-06-05',
			createdBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-05T18:00:00Z')
		},
		{
			id: taskIds.mayorEditing,
			topicId: topicIds.mayorInterview,
			type: 'editing',
			title: '市长专访后期剪辑',
			description: '完成专访节目的后期剪辑，包括画面调色、字幕制作和片头片尾包装。',
			status: 'completed',
			assigneeId: userIds.zhaomin,
			deadline: '2026-06-08',
			createdBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-08T20:00:00Z')
		},
		{
			id: taskIds.urbanShooting,
			topicId: topicIds.urbanDevelopment,
			type: 'shooting',
			title: '城市更新项目航拍',
			description: '对三个重点改造区域进行航拍取景，同时拍摄地面施工现场。',
			status: 'in_progress',
			assigneeId: userIds.wanglei,
			deadline: '2026-06-18',
			createdBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-14T10:00:00Z')
		},
		{
			id: taskIds.urbanEditing,
			topicId: topicIds.urbanDevelopment,
			type: 'editing',
			title: '城市更新报道剪辑',
			description: '剪辑城市更新项目报道，整合航拍素材与现场采访。',
			status: 'assigned',
			assigneeId: userIds.zhaomin,
			deadline: '2026-06-22',
			createdBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-14T10:00:00Z')
		},
		{
			id: taskIds.techShooting,
			topicId: topicIds.techInnovation,
			type: 'shooting',
			title: '科技实验室实地拍摄',
			description: '前往科技创新实验室进行实地拍摄，需要拍摄实验场景和科研人员工作画面。',
			status: 'submitted',
			assigneeId: userIds.wanglei,
			deadline: '2026-06-20',
			createdBy: userIds.zhangwei,
			updatedAt: new Date('2026-06-15T16:00:00Z')
		}
	]);

	console.log('→ 插入交付物...');
	await db.insert(deliverables).values([
		{
			id: crypto.randomUUID(),
			taskId: taskIds.mayorShooting,
			fileUrl: '/deliverables/mayor-interview-raw.mp4',
			fileType: 'video/mp4',
			note: '专访原始素材，三机位共计4小时'
		},
		{
			id: crypto.randomUUID(),
			taskId: taskIds.mayorEditing,
			fileUrl: '/deliverables/mayor-interview-final.mp4',
			fileType: 'video/mp4',
			note: '最终成片，含字幕和包装，时长25分钟'
		}
	]);

	console.log('→ 插入排期...');
	await db.insert(schedules).values([
		{
			id: crypto.randomUUID(),
			topicId: topicIds.mayorInterview,
			platform: '微信公众号',
			accountName: '城市观察',
			publishDate: '2026-06-12',
			publishTime: '08:00',
			status: 'published',
			supplementaryNotes: '配合公众号早间推送节奏',
			createdBy: userIds.zhangwei
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.mayorInterview,
			platform: '抖音',
			accountName: '城市快报',
			publishDate: '2026-06-12',
			publishTime: '12:00',
			status: 'published',
			supplementaryNotes: '剪辑60秒精华版',
			createdBy: userIds.zhangwei
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.urbanDevelopment,
			platform: '夯闻APP',
			accountName: '深度报道',
			publishDate: '2026-06-20',
			publishTime: '09:00',
			status: 'scheduled',
			supplementaryNotes: '配合城市更新政策发布时间',
			createdBy: userIds.zhangwei
		}
	]);

	console.log('→ 插入异常...');
	await db.insert(anomalies).values([
		{
			id: crypto.randomUUID(),
			topicId: topicIds.urbanDevelopment,
			type: 'version_conflict',
			severity: 'medium',
			description: '城市更新报道脚本存在两个未合并版本，v1和v2内容存在冲突，需要主编确认最终版本。',
			status: 'open',
			createdBy: userIds.lina
		},
		{
			id: crypto.randomUUID(),
			topicId: topicIds.techInnovation,
			type: 'version_conflict',
			severity: 'high',
			description: '科技实验室探访视频素材被剪辑师和编辑同时修改，产生版本冲突，需追溯变更历史。',
			status: 'investigating',
			createdBy: userIds.zhangwei
		}
	]);

	console.log('→ 插入素材复用记录...');
	await db.insert(materialReuse).values([
		{
			id: crypto.randomUUID(),
			materialId: materialIds.aerialCity,
			targetType: 'topic',
			targetId: topicIds.urbanDevelopment,
			usedBy: userIds.lina
		},
		{
			id: crypto.randomUUID(),
			materialId: materialIds.backgroundMusic,
			targetType: 'topic',
			targetId: topicIds.mayorInterview,
			usedBy: userIds.zhaomin
		},
		{
			id: crypto.randomUUID(),
			materialId: materialIds.backgroundMusic,
			targetType: 'topic',
			targetId: topicIds.techInnovation,
			usedBy: userIds.zhaomin
		}
	]);

	console.log('→ 插入来源记录...');
	const sourceRecordId1 = crypto.randomUUID();
	const sourceRecordId2 = crypto.randomUUID();
	await db.insert(sourceRecords).values([
		{
			id: sourceRecordId1,
			topicId: topicIds.mayorInterview,
			createdBy: userIds.lina,
			supplementaryNotes: '市长办公室提供官方背景资料，经授权使用'
		},
		{
			id: sourceRecordId2,
			topicId: topicIds.techInnovation,
			createdBy: userIds.lina,
			supplementaryNotes: '实验室公开资料与采访录音'
		}
	]);

	console.log('→ 插入来源引用...');
	await db.insert(sourceRecordReferences).values([
		{
			id: crypto.randomUUID(),
			sourceRecordId: sourceRecordId1,
			refType: 'material',
			refId: materialIds.interviewVideo,
			refLabel: '市长专访视频素材'
		},
		{
			id: crypto.randomUUID(),
			sourceRecordId: sourceRecordId1,
			refType: 'material',
			refId: materialIds.pressConference,
			refLabel: '新闻发布会现场照片'
		},
		{
			id: crypto.randomUUID(),
			sourceRecordId: sourceRecordId2,
			refType: 'material',
			refId: materialIds.techLabPhoto,
			refLabel: '科技实验室照片'
		}
	]);

	console.log('✅ 种子数据填充完成！');
	console.log('  - 4 名用户');
	console.log('  - 8 个标签');
	console.log('  - 6 个素材');
	console.log('  - 4 个选题');
	console.log('  - 6 个脚本');
	console.log('  - 5 个任务');
	console.log('  - 2 个交付物');
	console.log('  - 3 个排期');
	console.log('  - 2 个异常');
	console.log('  - 2 条来源记录');
	console.log('  - 3 条来源引用');
	console.log('  - 3 条素材复用记录');

	process.exit(0);
}

seed().catch((err) => {
	console.error('❌ 种子数据填充失败:', err);
	process.exit(1);
});
