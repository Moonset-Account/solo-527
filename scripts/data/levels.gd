extends RefCounted

const TILE_FLOOR := 0
const TILE_WALL := 1
const TILE_STAGE := 2
const TILE_ENTRANCE := 3

static func get_all_levels() -> Dictionary:
	return {
		"level_01_tutorial": {
			"id": "level_01_tutorial",
			"name": "第一章：迎新体验展",
			"subtitle": "教学关卡",
			"order": 1,
			"description": "校园迎新日！作为社团联合会的新鲜人，你需要安排3名成员完成基础任务。\n目标：完成所有任务并获得至少60点满意度。",
			"difficulty": "简单",
			"grid_size": Vector2i(8, 6),
			"max_turns": 10,
			"target_satisfaction": 60,
			"starting_satisfaction": 20,
			"turn_satisfaction_penalty": 0,
			"tilemap": [
				[0,0,0,0,0,0,0,0],
				[0,0,2,0,0,0,3,0],
				[0,0,0,0,1,0,0,0],
				[0,3,0,0,1,0,2,0],
				[0,0,0,0,0,0,0,0],
				[0,0,2,0,0,0,0,0],
			],
			"characters": [
				{"id": "char_president", "start": Vector2i(0, 2)},
				{"id": "char_designer", "start": Vector2i(1, 0)},
				{"id": "char_reception", "start": Vector2i(1, 5)},
			],
			"tasks": [
				{"id": "task_ex1", "type": "exhibition", "pos": Vector2i(2, 1), "name": "主展台搭建", "progress": 0, "max": 8, "satisfaction": 15},
				{"id": "task_ex2", "type": "exhibition", "pos": Vector2i(6, 3), "name": "艺术展示区", "progress": 0, "max": 6, "satisfaction": 12},
				{"id": "task_ex3", "type": "exhibition", "pos": Vector2i(2, 5), "name": "手工体验区", "progress": 0, "max": 5, "satisfaction": 10},
				{"id": "task_re1", "type": "reception", "pos": Vector2i(1, 3), "name": "入口迎宾A", "progress": 0, "max": 5, "satisfaction": 10},
				{"id": "task_re2", "type": "reception", "pos": Vector2i(6, 1), "name": "入口迎宾B", "progress": 0, "max": 4, "satisfaction": 8},
			],
			"story_events": ["event_volunteers", "event_mishap"],
			"tutorial_enabled": true,
			"rewards": {
				"next_unlock": true,
				"bonus_story": "完美首秀！你获得了大家的认可。",
			},
		},
		"level_02_fair": {
			"id": "level_02_fair",
			"name": "第二章：社团联合博览会",
			"subtitle": "正式挑战",
			"order": 2,
			"description": "年度社团博览会盛大开幕！需要统筹布展、宣传、接待三大任务。\n注意天气影响，合理分配成员！",
			"difficulty": "普通",
			"grid_size": Vector2i(10, 7),
			"max_turns": 12,
			"target_satisfaction": 120,
			"starting_satisfaction": 30,
			"turn_satisfaction_penalty": 1,
			"tilemap": [
				[0,0,0,0,0,0,0,0,0,0],
				[0,2,0,0,1,1,0,0,3,0],
				[0,0,0,0,0,0,0,0,0,0],
				[3,0,0,2,0,0,2,0,0,3],
				[0,0,0,0,0,0,0,0,0,0],
				[0,3,0,0,1,1,0,0,2,0],
				[0,0,0,0,0,0,0,0,0,0],
			],
			"characters": [
				{"id": "char_president", "start": Vector2i(4, 3)},
				{"id": "char_designer", "start": Vector2i(3, 2)},
				{"id": "char_marketing", "start": Vector2i(5, 4)},
				{"id": "char_reception", "start": Vector2i(2, 4)},
				{"id": "char_scout", "start": Vector2i(6, 2)},
			],
			"tasks": [
				{"id": "task_ex1", "type": "exhibition", "pos": Vector2i(1, 1), "name": "文化主题馆", "progress": 0, "max": 12, "satisfaction": 20},
				{"id": "task_ex2", "type": "exhibition", "pos": Vector2i(3, 3), "name": "中心表演台", "progress": 0, "max": 10, "satisfaction": 18},
				{"id": "task_ex3", "type": "exhibition", "pos": Vector2i(6, 3), "name": "科技互动馆", "progress": 0, "max": 10, "satisfaction": 18},
				{"id": "task_ex4", "type": "exhibition", "pos": Vector2i(8, 5), "name": "美食展示区", "progress": 0, "max": 8, "satisfaction": 14},
				{"id": "task_pu1", "type": "publicity", "pos": Vector2i(0, 3), "name": "北门宣传点", "progress": 0, "max": 7, "satisfaction": 12},
				{"id": "task_pu2", "type": "publicity", "pos": Vector2i(9, 3), "name": "南门宣传点", "progress": 0, "max": 7, "satisfaction": 12},
				{"id": "task_re1", "type": "reception", "pos": Vector2i(8, 1), "name": "VIP接待处", "progress": 0, "max": 8, "satisfaction": 15},
				{"id": "task_re2", "type": "reception", "pos": Vector2i(1, 5), "name": "咨询导览点", "progress": 0, "max": 6, "satisfaction": 12},
			],
			"story_events": ["event_rain", "event_celebrity", "event_media", "event_volunteers"],
			"tutorial_enabled": false,
			"rewards": {
				"next_unlock": true,
				"bonus_story": "博览会大获成功！社团年度预算翻倍！",
			},
		},
		"level_03_final": {
			"id": "level_03_final",
			"name": "第三章：校庆嘉年华",
			"subtitle": "终极考验",
			"order": 3,
			"description": "母校百年校庆！规模空前的嘉年华活动，你需要在有限回合内创造奇迹。\n所有任务类型齐全，事件频发，考验你的统筹能力！",
			"difficulty": "困难",
			"grid_size": Vector2i(12, 8),
			"max_turns": 15,
			"target_satisfaction": 220,
			"starting_satisfaction": 50,
			"turn_satisfaction_penalty": 2,
			"tilemap": [
				[0,0,0,0,0,3,0,0,0,0,0,0],
				[0,2,0,1,0,0,0,1,0,0,3,0],
				[0,0,0,1,0,2,0,1,0,0,0,0],
				[3,0,0,0,0,0,0,0,0,0,0,3],
				[3,0,0,0,0,0,0,0,0,0,0,3],
				[0,0,0,1,0,2,0,1,0,0,0,0],
				[0,2,0,1,0,0,0,1,0,0,3,0],
				[0,0,0,0,0,3,0,0,0,0,0,0],
			],
			"characters": [
				{"id": "char_president", "start": Vector2i(5, 3)},
				{"id": "char_designer", "start": Vector2i(4, 4)},
				{"id": "char_marketing", "start": Vector2i(6, 3)},
				{"id": "char_reception", "start": Vector2i(5, 4)},
				{"id": "char_scout", "start": Vector2i(7, 4)},
			],
			"tasks": [
				{"id": "task_ex1", "type": "exhibition", "pos": Vector2i(1, 1), "name": "校史陈列馆", "progress": 0, "max": 15, "satisfaction": 25},
				{"id": "task_ex2", "type": "exhibition", "pos": Vector2i(5, 2), "name": "中心花车舞台", "progress": 0, "max": 18, "satisfaction": 30},
				{"id": "task_ex3", "type": "exhibition", "pos": Vector2i(5, 5), "name": "灯光音乐秀", "progress": 0, "max": 15, "satisfaction": 25},
				{"id": "task_ex4", "type": "exhibition", "pos": Vector2i(1, 6), "name": "艺术装置展", "progress": 0, "max": 12, "satisfaction": 20},
				{"id": "task_pu1", "type": "publicity", "pos": Vector2i(0, 3), "name": "东门直播站", "progress": 0, "max": 10, "satisfaction": 18},
				{"id": "task_pu2", "type": "publicity", "pos": Vector2i(11, 3), "name": "西门直播站", "progress": 0, "max": 10, "satisfaction": 18},
				{"id": "task_pu3", "type": "publicity", "pos": Vector2i(0, 4), "name": "东门打卡点", "progress": 0, "max": 8, "satisfaction": 14},
				{"id": "task_pu4", "type": "publicity", "pos": Vector2i(11, 4), "name": "西门打卡点", "progress": 0, "max": 8, "satisfaction": 14},
				{"id": "task_re1", "type": "reception", "pos": Vector2i(5, 0), "name": "校友签到处", "progress": 0, "max": 12, "satisfaction": 22},
				{"id": "task_re2", "type": "reception", "pos": Vector2i(5, 7), "name": "贵宾休息室", "progress": 0, "max": 10, "satisfaction": 20},
				{"id": "task_re3", "type": "reception", "pos": Vector2i(10, 1), "name": "媒体接待区", "progress": 0, "max": 8, "satisfaction": 16},
				{"id": "task_re4", "type": "reception", "pos": Vector2i(10, 6), "name": "家属接待区", "progress": 0, "max": 7, "satisfaction": 14},
			],
			"story_events": ["event_rain", "event_celebrity", "event_festival", "event_mishap", "event_volunteers", "event_media"],
			"tutorial_enabled": false,
			"rewards": {
				"next_unlock": false,
				"bonus_story": "🎊 百年校庆圆满落幕！你已成为传奇组织者！",
			},
		},
	}

const TASK_TYPE_INFO := {
	"exhibition": {"name": "布展", "icon": "🎪", "color": Color(0.3, 0.6, 0.9), "ap_cost": 1},
	"publicity": {"name": "宣传", "icon": "📣", "color": Color(0.95, 0.7, 0.2), "ap_cost": 1},
	"reception": {"name": "接待", "icon": "🤝", "color": Color(0.3, 0.8, 0.55), "ap_cost": 1},
}

static func get_task_type_info(task_type: String) -> Dictionary:
	return TASK_TYPE_INFO.get(task_type, {"name": "未知", "icon": "❓", "color": Color.WHITE, "ap_cost": 1})
