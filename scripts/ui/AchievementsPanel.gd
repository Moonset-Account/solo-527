extends Control
## AchievementsPanel - 成就与每日挑战页面

@onready var achievement_grid: GridContainer = $Panel/Scroll/Grid
@onready var btn_back: Button = $Panel/BackButton
@onready var lbl_progress: Label = $Panel/ProgressLabel
@onready var daily_container: VBoxContainer = $Panel/DailySection/List
@onready var lbl_session: Label = $Panel/DailySection/SessionLabel

var _achievement_ids: Array = []

func _ready() -> void:
	_connect_buttons()
	_build_achievements()
	_build_daily_challenges()
	_update_progress()
	AchievementSystem.achievement_unlocked.connect(_on_achievement_unlocked)
	AchievementSystem.daily_challenge_completed.connect(_on_daily_completed)
	_refresh_session_stats()

func _connect_buttons() -> void:
	btn_back.pressed.connect(_on_back)
	btn_back.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _build_achievements() -> void:
	for c in achievement_grid.get_children():
		c.queue_free()
	_achievement_ids.clear()
	var all: Dictionary = AchievementSystem.get_all_achievements()
	for aid in all.keys():
		_achievement_ids.append(aid)
		var card = _create_achievement_card(aid, all[aid], AchievementSystem.is_unlocked(aid))
		achievement_grid.add_child(card)

func _create_achievement_card(aid: String, cfg: Dictionary, unlocked: bool) -> Control:
	var pc := PanelContainer.new()
	pc.custom_minimum_size = Vector2(260, 120)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.11, 0.25, 1) if unlocked else Color(0.08, 0.06, 0.14, 1)
	style.border_color = Color(1.0, 0.82, 0.33, 0.9) if unlocked else Color(0.3, 0.25, 0.45, 0.5)
	style.border_width_left = 3
	style.border_width_right = 3
	style.border_width_top = 3
	style.border_width_bottom = 3
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	pc.add_theme_stylebox_override("panel", style)
	var outer := HBoxContainer.new()
	outer.add_theme_constant_override("separation", 12)
	pc.add_child(outer)
	var icon_lbl := Label.new()
	icon_lbl.text = cfg.get("icon", "🏆")
	icon_lbl.modulate.a = 1.0 if unlocked else 0.4
	icon_lbl.add_theme_font_size_override("font_size", 40)
	icon_lbl.custom_minimum_size = Vector2(70, 100)
	icon_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	outer.add_child(icon_lbl)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 4)
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	outer.add_child(vb)
	var name_lbl := Label.new()
	name_lbl.text = cfg.get("name", aid)
	name_lbl.modulate = Color(1.0, 0.9, 0.55) if unlocked else Color(0.5, 0.5, 0.65)
	name_lbl.add_theme_font_size_override("font_size", 15)
	vb.add_child(name_lbl)
	var desc_lbl := Label.new()
	desc_lbl.text = cfg.get("desc", "")
	desc_lbl.modulate = Color(0.7, 0.75, 0.9) if unlocked else Color(0.35, 0.35, 0.48)
	desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_lbl.custom_minimum_size = Vector2(160, 40)
	desc_lbl.add_theme_font_size_override("font_size", 11)
	vb.add_child(desc_lbl)
	var rw_lbl := Label.new()
	rw_lbl.text = "奖励: %d 💰" % cfg.get("reward", 0)
	rw_lbl.modulate = Color(0.95, 0.75, 0.35) if unlocked else Color(0.4, 0.35, 0.2)
	rw_lbl.add_theme_font_size_override("font_size", 11)
	vb.add_child(rw_lbl)
	if not unlocked:
		_check_progress_hint(aid, vb)
	return pc

func _check_progress_hint(aid: String, parent: VBoxContainer) -> void:
	var progress_map: Dictionary = {
		"ten_orders": [GameState.total_orders_completed, 10],
		"hundred_orders": [GameState.total_orders_completed, 100],
		"five_machines": [GameState.machines.size(), 5],
		"max_upgrade": [1, 5],
		"rich": [GameState.money, 10000],
		"no_fail": [0, 20],
		"level_5": [GameState.level, 5],
		"level_10": [GameState.level, 10]
	}
	if progress_map.has(aid):
		var info: Array = progress_map[aid]
		var cur: int = info[0]
		var tgt: int = info[1]
		var hint := Label.new()
		hint.text = "进度: %d/%d" % [min(cur, tgt), tgt]
		hint.modulate = Color(0.55, 0.7, 0.9)
		hint.add_theme_font_size_override("font_size", 10)
		parent.add_child(hint)

func _build_daily_challenges() -> void:
	for c in daily_container.get_children():
		if c.name != "DailyTitle":
			c.queue_free()
	var challenges: Array = AchievementSystem.get_daily_challenges()
	for ch in challenges:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		daily_container.add_child(row)
		var progress: int = ch.get("progress", 0)
		var target: int = ch.get("target", 1)
		var pct: float = float(min(progress, target)) / float(target)
		var claimed: bool = ch.get("claimed", false)
		var icon_lbl := Label.new()
		icon_lbl.text = "🎯" if not claimed else "✅"
		icon_lbl.add_theme_font_size_override("font_size", 18)
		row.add_child(icon_lbl)
		var vb := VBoxContainer.new()
		vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(vb)
		var name_lbl := Label.new()
		name_lbl.text = ch.get("name", "")
		name_lbl.modulate = Color(0.92, 0.88, 1.0) if not claimed else Color(0.5, 0.75, 0.5)
		name_lbl.add_theme_font_size_override("font_size", 12)
		vb.add_child(name_lbl)
		var bar_bg := ColorRect.new()
		bar_bg.color = Color(0.15, 0.1, 0.22)
		bar_bg.size = Vector2(200, 6)
		bar_bg.custom_minimum_size = Vector2(200, 6)
		vb.add_child(bar_bg)
		var bar_fg := ColorRect.new()
		bar_fg.color = Color(0.5, 0.85, 0.4) if not claimed else Color(0.4, 0.6, 0.35)
		bar_fg.size = Vector2(200 * pct, 6)
		bar_fg.custom_minimum_size = Vector2(200 * pct, 6)
		vb.add_child(bar_fg)
		var rw_lbl := Label.new()
		rw_lbl.text = "%d💰" % ch.get("reward", 0)
		rw_lbl.modulate = Color(1.0, 0.85, 0.35) if not claimed else Color(0.5, 0.55, 0.3)
		rw_lbl.add_theme_font_size_override("font_size", 14)
		row.add_child(rw_lbl)

func _update_progress() -> void:
	var total: int = AchievementSystem.get_all_achievements().size()
	var unlocked: int = AchievementSystem.get_unlocked_achievements().size()
	lbl_progress.text = "成就: %d / %d 已解锁 (%d%%)" % [unlocked, total, int(unlocked * 100 / max(total, 1))]
	lbl_progress.modulate = Color(0.85, 0.95, 1.0)

func _on_achievement_unlocked(aid: String) -> void:
	_build_achievements()
	_update_progress()

func _on_daily_completed(cid: String) -> void:
	_build_daily_challenges()

func _refresh_session_stats() -> void:
	var s: Dictionary = PlaytestRecorder.get_summary()
	lbl_session.text = "本次游戏: %d秒 | 完成订单:%d | 机器:%d台" % [
		s.get("elapsed_seconds", 0), s.get("orders_completed", 0), s.get("machines_placed_count", 0)
	]

func _on_back() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("back", "Achievements")
	SceneManager.change_scene("MainMenu")
