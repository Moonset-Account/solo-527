extends Node
## 关卡/章节数据库
## 章节：叙事主题；关卡：具体战斗 + 可选事件

var chapters: Dictionary = {
	"chapter_1": {
		"id": "chapter_1",
		"name": "第一章：青铜初醒",
		"subtitle": "修复新馆的第一批青铜藏品",
		"theme_color": Color(0.55, 0.4, 0.25),
		"unlock_condition": "start",
		"levels": [
			"level_1_1", "level_1_2", "level_1_3", "level_1_boss"
		],
		"completion_reward": {
			"unlock_cards": ["tool_laser_cleaner", "budget_endowment_fund"],
			"unlock_chapter": "chapter_2",
			"stars": 0,
		},
	},
	"chapter_2": {
		"id": "chapter_2",
		"name": "第二章：绢画寻踪",
		"subtitle": "处理绢本重彩古画的复杂病害",
		"theme_color": Color(0.7, 0.55, 0.35),
		"unlock_condition": "chapter_1_clear",
		"levels": [
			"level_2_1", "level_2_2", "level_2_3", "level_2_boss"
		],
		"completion_reward": {
			"unlock_cards": ["tool_vr_reconstruction", "budget_legacy_donation"],
			"unlock_chapter": "chapter_3",
		},
	},
	"chapter_3": {
		"id": "chapter_3",
		"name": "第三章：陶瓷传奇",
		"subtitle": "镇馆之宝——宋代青瓷的终极修复",
		"theme_color": Color(0.3, 0.6, 0.55),
		"unlock_condition": "chapter_2_clear",
		"levels": [
			"level_3_1", "level_3_2", "level_3_boss"
		],
		"completion_reward": {
			"unlock_cards": ["expert_chief_curator"],
		},
	},
}

var levels: Dictionary = {
	"level_1_1": {
		"id": "level_1_1",
		"name": "青铜爵 · 清洁作业",
		"chapter": "chapter_1",
		"difficulty": 1,
		"description": "一件商代青铜爵刚入库，表面有轻微污渍和铜锈。",
		"turn_limit": 12,
		"start_budget": 3,
		"budget_per_turn": 3,
		"start_draw": 5,
		"draw_per_turn": 3,
		"exhibits": [
			{
				"id": "exh_jue_1",
				"name": "商代青铜爵",
				"max_integrity": 25,
				"start_integrity": 0,
				"statuses": [{"type": "dirt", "value": 2, "damage_per_turn": 0}],
				"reward_budget": 2,
			},
		],
		"random_events": ["event_visitor_disturb"],
		"event_frequency": 0.15,
		"reward_cards_pool": ["tool_laser_cleaner", "tool_xray_scan", "budget_crowdfunding"],
		"reward_card_count": 3,
		"reward_budget": 20,
	},
	"level_1_2": {
		"id": "level_1_2",
		"name": "青铜鼎 · 去锈修护",
		"chapter": "chapter_1",
		"difficulty": 2,
		"description": "大型青铜鼎锈蚀严重，需要系统去锈与补配。",
		"turn_limit": 14,
		"start_budget": 3,
		"budget_per_turn": 3,
		"start_draw": 5,
		"draw_per_turn": 3,
		"exhibits": [
			{
				"id": "exh_ding_1",
				"name": "西周青铜鼎",
				"max_integrity": 45,
				"start_integrity": 0,
				"statuses": [
					{"type": "rust", "value": 3, "damage_per_turn": 1},
					{"type": "dirt", "value": 1, "damage_per_turn": 0},
				],
				"reward_budget": 3,
			},
		],
		"random_events": ["event_power_outage", "event_new_donation"],
		"event_frequency": 0.2,
		"reward_cards_pool": ["tool_multi_restorer", "budget_endowment_fund", "expert_restoration_artist"],
		"reward_card_count": 3,
		"reward_budget": 30,
	},
	"level_1_3": {
		"id": "level_1_3",
		"name": "青铜编钟 · 双件并修",
		"chapter": "chapter_1",
		"difficulty": 3,
		"description": "一套两枚青铜编钟，需要同时修复以免音色失配。",
		"turn_limit": 16,
		"start_budget": 4,
		"budget_per_turn": 3,
		"start_draw": 5,
		"draw_per_turn": 3,
		"exhibits": [
			{
				"id": "exh_bell_1",
				"name": "青铜编钟·一号",
				"max_integrity": 30,
				"start_integrity": 0,
				"statuses": [{"type": "rust", "value": 2, "damage_per_turn": 0}],
				"reward_budget": 2,
			},
			{
				"id": "exh_bell_2",
				"name": "青铜编钟·二号",
				"max_integrity": 30,
				"start_integrity": 0,
				"statuses": [{"type": "dirt", "value": 3, "damage_per_turn": 0}],
				"reward_budget": 2,
			},
		],
		"random_events": ["event_museum_night", "event_new_donation"],
		"event_frequency": 0.2,
		"reward_cards_pool": ["tool_laser_cleaner", "tool_multi_restorer", "expert_chemist"],
		"reward_card_count": 3,
		"reward_budget": 35,
	},
	"level_1_boss": {
		"id": "level_1_boss",
		"name": "镇馆之宝 · 四羊方尊（复刻）",
		"chapter": "chapter_1",
		"difficulty": 5,
		"description": "全损级修复挑战：三件青铜珍品同时抢救，时限紧迫。",
		"turn_limit": 18,
		"start_budget": 4,
		"budget_per_turn": 4,
		"start_draw": 5,
		"draw_per_turn": 4,
		"exhibits": [
			{
				"id": "exh_sheep_1",
				"name": "羊首·A",
				"max_integrity": 35,
				"start_integrity": 0,
				"statuses": [{"type": "crack", "value": 3, "damage_per_turn": 1}],
				"reward_budget": 2,
			},
			{
				"id": "exh_sheep_2",
				"name": "羊首·B",
				"max_integrity": 35,
				"start_integrity": 0,
				"statuses": [{"type": "rust", "value": 2, "damage_per_turn": 1}],
				"reward_budget": 2,
			},
			{
				"id": "exh_sheep_3",
				"name": "尊体",
				"max_integrity": 45,
				"start_integrity": 0,
				"statuses": [
					{"type": "dirt", "value": 2, "damage_per_turn": 0},
					{"type": "crack", "value": 2, "damage_per_turn": 0},
				],
				"reward_budget": 4,
			},
		],
		"random_events": ["event_power_outage", "event_visitor_disturb", "event_donor_visit"],
		"event_frequency": 0.25,
		"reward_cards_pool": ["tool_vr_reconstruction", "budget_legacy_donation", "expert_chief_curator"],
		"reward_card_count": 3,
		"reward_budget": 60,
		"is_boss": true,
	},
	"level_2_1": {
		"id": "level_2_1",
		"name": "绢本小品 · 除霉展平",
		"chapter": "chapter_2",
		"difficulty": 3,
		"description": "宋画小品发霉、绢丝脆化，需要谨慎处理。",
		"turn_limit": 14,
		"start_budget": 4,
		"budget_per_turn": 3,
		"start_draw": 5,
		"draw_per_turn": 3,
		"exhibits": [
			{
				"id": "exh_silk_1",
				"name": "《竹雀图》绢本小品",
				"max_integrity": 40,
				"start_integrity": 0,
				"statuses": [
					{"type": "mold", "value": 3, "damage_per_turn": 1},
					{"type": "brittle", "value": 2, "damage_per_turn": 0},
				],
				"reward_budget": 3,
			},
		],
		"random_events": ["event_humidity_spike", "event_new_donation"],
		"event_frequency": 0.22,
		"reward_cards_pool": ["expert_restoration_artist", "expert_chemist", "tool_laser_cleaner"],
		"reward_card_count": 3,
		"reward_budget": 45,
	},
	"level_2_2": {
		"id": "level_2_2",
		"name": "山水长卷 · 分段修复",
		"chapter": "chapter_2",
		"difficulty": 4,
		"description": "明代山水长卷分三段，各有不同病害。",
		"turn_limit": 18,
		"start_budget": 4,
		"budget_per_turn": 4,
		"start_draw": 6,
		"draw_per_turn": 4,
		"exhibits": [
			{
				"id": "exh_scroll_1",
				"name": "起首·远山",
				"max_integrity": 30,
				"start_integrity": 0,
				"statuses": [{"type": "dirt", "value": 2, "damage_per_turn": 0}],
				"reward_budget": 2,
			},
			{
				"id": "exh_scroll_2",
				"name": "中段·行旅",
				"max_integrity": 35,
				"start_integrity": 0,
				"statuses": [
					{"type": "mold", "value": 2, "damage_per_turn": 1},
					{"type": "crack", "value": 1, "damage_per_turn": 0},
				],
				"reward_budget": 2,
			},
			{
				"id": "exh_scroll_3",
				"name": "收尾·归舟",
				"max_integrity": 30,
				"start_integrity": 0,
				"statuses": [{"type": "brittle", "value": 2, "damage_per_turn": 1}],
				"reward_budget": 2,
			},
		],
		"random_events": ["event_humidity_spike", "event_museum_night", "event_donor_visit"],
		"event_frequency": 0.25,
		"reward_cards_pool": ["tool_vr_reconstruction", "tool_multi_restorer", "expert_chemist"],
		"reward_card_count": 3,
		"reward_budget": 55,
	},
	"level_2_3": {
		"id": "level_2_3",
		"name": "重彩佛画 · 颜料加固",
		"chapter": "chapter_2",
		"difficulty": 4,
		"description": "元重彩佛画颜料起翘，需先加固再修复。",
		"turn_limit": 16,
		"start_budget": 4,
		"budget_per_turn": 4,
		"start_draw": 5,
		"draw_per_turn": 4,
		"exhibits": [
			{
				"id": "exh_buddha_1",
				"name": "《观音像》重彩",
				"max_integrity": 55,
				"start_integrity": 0,
				"statuses": [
					{"type": "peeling", "value": 3, "damage_per_turn": 2},
					{"type": "mold", "value": 2, "damage_per_turn": 0},
				],
				"reward_budget": 4,
			},
		],
		"random_events": ["event_humidity_spike", "event_power_outage"],
		"event_frequency": 0.25,
		"reward_cards_pool": ["tool_vr_reconstruction", "budget_legacy_donation", "expert_chief_curator"],
		"reward_card_count": 3,
		"reward_budget": 60,
	},
	"level_2_boss": {
		"id": "level_2_boss",
		"name": "千里江山图（残卷）· 终极抢救",
		"chapter": "chapter_2",
		"difficulty": 6,
		"description": "国家一级文物，多种病害并发，必须在时限内全部完成。",
		"turn_limit": 22,
		"start_budget": 5,
		"budget_per_turn": 4,
		"start_draw": 6,
		"draw_per_turn": 4,
		"exhibits": [
			{
				"id": "exh_qianli_1",
				"name": "青绿·石青层",
				"max_integrity": 45,
				"start_integrity": 0,
				"statuses": [{"type": "peeling", "value": 3, "damage_per_turn": 1}],
				"reward_budget": 3,
			},
			{
				"id": "exh_qianli_2",
				"name": "青绿·石绿层",
				"max_integrity": 45,
				"start_integrity": 0,
				"statuses": [
					{"type": "mold", "value": 3, "damage_per_turn": 1},
					{"type": "crack", "value": 2, "damage_per_turn": 0},
				],
				"reward_budget": 3,
			},
			{
				"id": "exh_qianli_3",
				"name": "绢本·基底层",
				"max_integrity": 55,
				"start_integrity": 0,
				"statuses": [
					{"type": "brittle", "value": 3, "damage_per_turn": 2},
					{"type": "dirt", "value": 2, "damage_per_turn": 0},
				],
				"reward_budget": 4,
			},
		],
		"random_events": ["event_humidity_spike", "event_power_outage", "event_donor_visit", "event_media_interview"],
		"event_frequency": 0.3,
		"reward_cards_pool": ["expert_chief_curator", "budget_legacy_donation", "tool_vr_reconstruction"],
		"reward_card_count": 3,
		"reward_budget": 100,
		"is_boss": true,
	},
	"level_3_1": {
		"id": "level_3_1",
		"name": "汝窑洗 · 碎拼还原",
		"chapter": "chapter_3",
		"difficulty": 5,
		"description": "宋代汝窑洗碎成 5 片，需要碎拼并补色。",
		"turn_limit": 16,
		"start_budget": 5,
		"budget_per_turn": 4,
		"start_draw": 5,
		"draw_per_turn": 4,
		"exhibits": [
			{
				"id": "exh_ru_1",
				"name": "汝窑天青釉洗",
				"max_integrity": 60,
				"start_integrity": 0,
				"statuses": [
					{"type": "crack", "value": 4, "damage_per_turn": 2},
					{"type": "dirt", "value": 2, "damage_per_turn": 0},
				],
				"reward_budget": 5,
			},
		],
		"random_events": ["event_donor_visit", "event_media_interview"],
		"event_frequency": 0.25,
		"reward_cards_pool": ["expert_chief_curator", "tool_vr_reconstruction", "budget_legacy_donation"],
		"reward_card_count": 3,
		"reward_budget": 75,
	},
	"level_3_2": {
		"id": "level_3_2",
		"name": "青花双瓶 · 并行抢救",
		"chapter": "chapter_3",
		"difficulty": 6,
		"description": "一对青花瓶各有损伤，需同时完成才能成对展出。",
		"turn_limit": 20,
		"start_budget": 5,
		"budget_per_turn": 5,
		"start_draw": 6,
		"draw_per_turn": 4,
		"exhibits": [
			{
				"id": "exh_blue_1",
				"name": "青花龙纹瓶·左",
				"max_integrity": 50,
				"start_integrity": 0,
				"statuses": [
					{"type": "crack", "value": 3, "damage_per_turn": 1},
					{"type": "peeling", "value": 2, "damage_per_turn": 1},
				],
				"reward_budget": 4,
			},
			{
				"id": "exh_blue_2",
				"name": "青花龙纹瓶·右",
				"max_integrity": 50,
				"start_integrity": 0,
				"statuses": [
					{"type": "mold", "value": 2, "damage_per_turn": 1},
					{"type": "crack", "value": 3, "damage_per_turn": 1},
				],
				"reward_budget": 4,
			},
		],
		"random_events": ["event_power_outage", "event_media_interview", "event_donor_visit"],
		"event_frequency": 0.3,
		"reward_cards_pool": ["expert_chief_curator", "tool_vr_reconstruction", "budget_legacy_donation"],
		"reward_card_count": 3,
		"reward_budget": 90,
	},
	"level_3_boss": {
		"id": "level_3_boss",
		"name": "冰裂纹青瓷尊 · 镇馆之宝",
		"chapter": "chapter_3",
		"difficulty": 8,
		"description": "终极挑战：冰裂纹青瓷，需要极致的精度与预算管理。",
		"turn_limit": 24,
		"start_budget": 5,
		"budget_per_turn": 5,
		"start_draw": 6,
		"draw_per_turn": 5,
		"exhibits": [
			{
				"id": "exh_guan_1",
				"name": "哥窑冰裂纹·器身",
				"max_integrity": 60,
				"start_integrity": 0,
				"statuses": [
					{"type": "crack", "value": 5, "damage_per_turn": 2},
					{"type": "peeling", "value": 2, "damage_per_turn": 1},
				],
				"reward_budget": 4,
			},
			{
				"id": "exh_guan_2",
				"name": "哥窑冰裂纹·器口",
				"max_integrity": 45,
				"start_integrity": 0,
				"statuses": [
					{"type": "brittle", "value": 3, "damage_per_turn": 2},
					{"type": "crack", "value": 2, "damage_per_turn": 0},
				],
				"reward_budget": 3,
			},
			{
				"id": "exh_guan_3",
				"name": "哥窑冰裂纹·器底",
				"max_integrity": 45,
				"start_integrity": 0,
				"statuses": [
					{"type": "dirt", "value": 3, "damage_per_turn": 0},
					{"type": "rust", "value": 2, "damage_per_turn": 1},
				],
				"reward_budget": 3,
			},
		],
		"random_events": ["event_power_outage", "event_media_interview", "event_donor_visit", "event_royal_visit"],
		"event_frequency": 0.35,
		"reward_cards_pool": ["expert_chief_curator"],
		"reward_card_count": 1,
		"reward_budget": 150,
		"is_boss": true,
	},
}

## 随机事件表
var events: Dictionary = {
	"event_power_outage": {
		"id": "event_power_outage",
		"name": "⚡ 停电警报",
		"desc": "电力系统故障！本回合温湿度失控，所有展品受到 2 点额外损伤。",
		"effect_type": "damage_all",
		"value": 2,
		"choices": [],
	},
	"event_humidity_spike": {
		"id": "event_humidity_spike",
		"name": "💧 湿度飙升",
		"desc": "库房湿度异常！所有展品附加 1 层『霉变』状态。",
		"effect_type": "add_status_all",
		"status_type": "mold",
		"value": 1,
	},
	"event_visitor_disturb": {
		"id": "event_visitor_disturb",
		"name": "👥 游客拥挤",
		"desc": "参观人流过大，展柜微震：未完成展品修复进度 -2。",
		"effect_type": "reduce_progress_unfinished",
		"value": 2,
	},
	"event_new_donation": {
		"id": "event_new_donation",
		"name": "🎁 匿名捐赠",
		"desc": "有人向修复基金匿名捐赠！立刻获得 +3 预算。",
		"effect_type": "gain_budget",
		"value": 3,
	},
	"event_donor_visit": {
		"id": "event_donor_visit",
		"name": "💎 捐赠人来访",
		"desc": "捐赠人莅临：展示进度最高的展品再 +5 修复，并获得 +2 预算。",
		"effect_type": "boost_highest_progress",
		"restore": 5,
		"budget": 2,
	},
	"event_museum_night": {
		"id": "event_museum_night",
		"name": "🌙 博物馆之夜",
		"desc": "闭馆后可以专心工作：抽 2 张牌，下回合起始多 +1 预算。",
		"effect_type": "draw_and_next_budget",
		"draw": 2,
		"next_budget": 1,
	},
	"event_media_interview": {
		"id": "event_media_interview",
		"name": "📺 媒体采访",
		"desc": "记者来采访！弃 1 张牌，但 +4 预算（曝光带来赞助）。",
		"effect_type": "discard_and_budget",
		"discard": 1,
		"budget": 4,
	},
	"event_royal_visit": {
		"id": "event_royal_visit",
		"name": "👑 贵宾参观",
		"desc": "特别贵宾来访！抽 3 张牌，获得 +4 预算，所有展品 +2 修复。",
		"effect_type": "royal_packages",
		"draw": 3,
		"budget": 4,
		"restore": 2,
	},
}

func get_chapter(chapter_id: String) -> Dictionary:
	return chapters.get(chapter_id, {}).duplicate(true)

func get_level(level_id: String) -> Dictionary:
	return levels.get(level_id, {}).duplicate(true)

func get_event(event_id: String) -> Dictionary:
	return events.get(event_id, {}).duplicate(true)

func all_chapter_ids() -> Array:
	var arr: Array = []
	for c in chapters.values():
		arr.append(c.id)
	return arr

func levels_in_chapter(chapter_id: String) -> Array:
	var ch: Dictionary = get_chapter(chapter_id)
	return ch.get("levels", [])

func is_level_unlocked(level_id: String) -> bool:
	if not level_id in levels:
		return false
	var lv: Dictionary = levels[level_id]
	var ch_id: String = lv.chapter
	var lv_idx: int = 0
	var ch_lvls: Array = chapters[ch_id].levels
	for i in ch_lvls.size():
		if ch_lvls[i] == level_id:
			lv_idx = i
			break
	if lv_idx == 0:
		return true
	var prev_id: String = ch_lvls[lv_idx - 1]
	return SaveManager.get_level_stars(prev_id) > 0
