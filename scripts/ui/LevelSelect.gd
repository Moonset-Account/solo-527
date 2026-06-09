extends Control
## LevelSelect - 关卡选择界面

const DP := preload("res://scripts/data/DataProvider.gd")

@onready var level_container: GridContainer = $Scroll/LevelList
@onready var btn_back: Button = $Top/BackButton
@onready var lbl_player_info: Label = $Top/PlayerInfo
@onready var daily_panel: VBoxContainer = $RightPanel/DailyPanel/Challenges
@onready var btn_playtest: Button = $RightPanel/Buttons/ExportPlaytest

var _level_buttons: Dictionary = {}

func _ready() -> void:
	_connect_buttons()
	_build_level_list()
	_refresh_player_info()
	_build_daily_challenges()
	AchievementSystem.achievement_unlocked.connect(func(_aid): _refresh_player_info())

func _connect_buttons() -> void:
	btn_back.pressed.connect(_on_back)
	btn_playtest.pressed.connect(_on_export_playtest)
	btn_back.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))
	btn_playtest.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _build_level_list() -> void:
	for c in level_container.get_children():
		c.queue_free()
	_level_buttons.clear()
	var level_ids: Array = DP.get_all_level_ids()
	for lid in level_ids:
		var cfg: Dictionary = DP.get_level_config(lid)
		var unlocked: bool = GameState.level >= cfg.get("unlock_level", 1)
		var card := _create_level_card(lid, cfg, unlocked)
		level_container.add_child(card)
		_level_buttons[lid] = card

func _create_level_card(lid: String, cfg: Dictionary, unlocked: bool) -> Control:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(280, 180)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.18, 0.14, 0.28, 1) if unlocked else Color(0.1, 0.08, 0.16, 1)
	style.border_color = Color(1.0, 0.82, 0.33, 0.8) if unlocked else Color(0.4, 0.35, 0.5, 0.5)
	style.border_width_left = 3
	style.border_width_right = 3
	style.border_width_top = 3
	style.border_width_bottom = 3
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	card.add_theme_stylebox_override("panel", style)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 8)
	card.add_child(vb)
	var title_lbl := Label.new()
	title_lbl.text = cfg.get("name", lid)
	title_lbl.modulate = Color(1.0, 0.88, 0.5) if unlocked else Color(0.5, 0.5, 0.6)
	title_lbl.add_theme_font_size_override("font_size", 18)
	vb.add_child(title_lbl)
	var desc_lbl := Label.new()
	desc_lbl.text = cfg.get("desc", "")
	desc_lbl.modulate = Color(0.75, 0.7, 0.88) if unlocked else Color(0.35, 0.35, 0.45)
	desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_lbl.custom_minimum_size = Vector2(260, 60)
	desc_lbl.add_theme_font_size_override("font_size", 12)
	vb.add_child(desc_lbl)
	var info_lbl := Label.new()
	var tl: int = cfg.get("time_limit_seconds", 0)
	var tl_str: String = "不限时" if tl == 0 else "%d秒" % tl
	info_lbl.text = "目标: %d单 | 启动金: %d | %s" % [cfg.get("target_orders", 0), cfg.get("start_money", 0), tl_str]
	info_lbl.modulate = Color(0.65, 0.85, 0.75) if unlocked else Color(0.3, 0.3, 0.38)
	info_lbl.add_theme_font_size_override("font_size", 11)
	vb.add_child(info_lbl)
	var btn := Button.new()
	btn.text = "开始" if unlocked else "🔒 需要等级%d" % cfg.get("unlock_level", 1)
	btn.disabled = not unlocked
	btn.add_theme_font_size_override("font_size", 16)
	btn.pressed.connect(func(): _on_level_selected(lid))
	btn.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))
	vb.add_child(btn)
	return card

func _refresh_player_info() -> void:
	var progress: float = GameState.get_level_progress()
	lbl_player_info.text = "等级: %d  |  金币: %d  |  经验: %d%%" % [GameState.level, GameState.money, int(progress * 100)]
	lbl_player_info.modulate = Color(0.9, 0.85, 1.0)

func _build_daily_challenges() -> void:
	for c in daily_panel.get_children():
		if c.name != "DailyTitle":
			c.queue_free()
	var challenges: Array = AchievementSystem.get_daily_challenges()
	for ch in challenges:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		daily_panel.add_child(row)
		var progress: int = ch.get("progress", 0)
		var target: int = ch.get("target", 1)
		var pct: float = float(min(progress, target)) / float(target)
		var claimed: bool = ch.get("claimed", false)
		var title_lbl := Label.new()
		title_lbl.text = ch.get("name", "")
		title_lbl.modulate = Color(0.9, 0.85, 1.0) if not claimed else Color(0.5, 0.7, 0.5)
		title_lbl.add_theme_font_size_override("font_size", 12)
		title_lbl.custom_minimum_size = Vector2(130, 0)
		row.add_child(title_lbl)
		var bar_bg := ColorRect.new()
		bar_bg.color = Color(0.2, 0.15, 0.3)
		bar_bg.size = Vector2(100, 10)
		bar_bg.custom_minimum_size = Vector2(100, 10)
		row.add_child(bar_bg)
		var bar_fg := ColorRect.new()
		bar_fg.color = Color(0.3, 0.8, 0.45) if not claimed else Color(0.5, 0.7, 0.4)
		bar_fg.size = Vector2(100 * pct, 10)
		bar_fg.custom_minimum_size = Vector2(100 * pct, 10)
		row.add_child(bar_fg)
		var pct_lbl := Label.new()
		pct_lbl.text = "%d/%d" % [min(progress, target), target]
		pct_lbl.modulate = Color(0.9, 0.9, 0.9)
		pct_lbl.add_theme_font_size_override("font_size", 11)
		row.add_child(pct_lbl)
		var rw_lbl := Label.new()
		rw_lbl.text = "💰%d" % ch.get("reward", 0)
		rw_lbl.modulate = Color(1.0, 0.85, 0.35) if not claimed else Color(0.5, 0.5, 0.4)
		rw_lbl.add_theme_font_size_override("font_size", 11)
		row.add_child(rw_lbl)

func _on_level_selected(lid: String) -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("select_%s" % lid, "LevelSelect")
	PlaytestRecorder.record_key_decision("select_level", {"level_id": lid})
	GameState.current_level_id = lid
	GameState.reset_for_new_level()
	var cfg: Dictionary = DP.get_level_config(lid)
	if GameState.money < cfg.get("start_money", 500):
		GameState.money = cfg.get("start_money", 500)
	SceneManager.change_scene("GameScene", true, {"level_id": lid})

func _on_back() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("back", "LevelSelect")
	SceneManager.change_scene("MainMenu")

func _on_export_playtest() -> void:
	AudioManager.play_sfx("click")
	var summary: Dictionary = PlaytestRecorder.export_and_save()
	print("[PlaytestExport] session_id=%s elapsed=%ds completed=%d failed=%d" % [
		summary.get("session_id"), summary.get("elapsed_seconds"),
		summary.get("orders_completed"), summary.get("orders_failed")
	])
	_refresh_player_info()
