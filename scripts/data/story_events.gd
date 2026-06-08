extends RefCounted

static func get_all_events() -> Dictionary:
	return {
		"event_rain": {
			"id": "event_rain",
			"name": "突降暴雨",
			"icon": "🌧️",
			"message": "天空突然下起大雨！部分户外活动受到影响，部分布展进度-1。",
			"trigger_turn": 3,
			"probability": 0.7,
			"effects": [
				{"type": "random_task_penalty", "task_type": "exhibition", "value": 1, "count": 2},
				{"type": "satisfaction", "value": -3, "reason": "天气影响活动体验"},
			],
		},
		"event_celebrity": {
			"id": "event_celebrity",
			"name": "特邀嘉宾到访",
			"icon": "🌟",
			"message": "校园知名嘉宾突然造访！接待任务价值提升，把握机会！",
			"trigger_turn": 2,
			"probability": 0.6,
			"effects": [
				{"type": "task_multiplier", "task_type": "reception", "multiplier": 1.5, "duration": 2},
				{"type": "satisfaction", "value": 5, "reason": "嘉宾到访带来热度"},
			],
		},
		"event_festival": {
			"id": "event_festival",
			"name": "校园节日",
			"icon": "🎉",
			"message": "恰逢校园文化节！同学们热情高涨，所有任务效率+25%！",
			"trigger_turn": 1,
			"probability": 0.4,
			"effects": [
				{"type": "global_task_multiplier", "multiplier": 1.25, "duration": 3},
			],
		},
		"event_mishap": {
			"id": "event_mishap",
			"name": "设备故障",
			"icon": "⚠️",
			"message": "音响设备出故障了！宣传任务临时受阻，请尽快协调！",
			"trigger_turn": 4,
			"probability": 0.5,
			"effects": [
				{"type": "random_task_penalty", "task_type": "publicity", "value": 2, "count": 1},
				{"type": "satisfaction", "value": -2, "reason": "设备故障影响体验"},
			],
		},
		"event_volunteers": {
			"id": "event_volunteers",
			"name": "志愿者大军",
			"icon": "💪",
			"message": "一群热心同学主动前来帮忙！各处任务获得进度推进！",
			"trigger_turn": 2,
			"probability": 0.35,
			"effects": [
				{"type": "global_all_tasks_boost", "value": 2},
				{"type": "satisfaction", "value": 4, "reason": "志愿者的热心支持"},
			],
		},
		"event_media": {
			"id": "event_media",
			"name": "媒体采访",
			"icon": "📰",
			"message": "校媒记者前来采访！宣传得当将获得重大加分！",
			"trigger_turn": 3,
			"probability": 0.45,
			"effects": [
				{"type": "satisfaction", "value": 6, "reason": "媒体正面报道"},
				{"type": "task_boost", "task_type": "publicity", "value": 3, "count": 999},
			],
		},
	}
