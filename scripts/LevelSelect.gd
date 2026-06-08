extends Control
class_name LevelSelect

@onready var title_label: Label = %TitleLabel
@onready var levels_grid: GridContainer = %LevelsGrid
@onready var total_stars_label: Label = %TotalStarsLabel
@onready var back_button: Button = %BackButton
@onready var stats_label: Label = %StatsLabel
@onready var prev_page_btn: Button = %PrevPageBtn
@onready var next_page_btn: Button = %NextPageBtn

const LEVELS_PER_PAGE: int = 8
var current_page: int = 0
var total_pages: int = 1
var level_data_resource: Resource = null
var all_levels: Dictionary = {}

func _ready() -> void:
	_connect_buttons()
	_load_data()
	_refresh_stats()
	_render_levels()
	AudioManager.play_music("menu")
	GameManager._change_state(GameManager.GameState.LEVEL_SELECT)

func _connect_buttons() -> void:
	back_button.pressed.connect(_on_back)
	prev_page_btn.pressed.connect(_on_prev_page)
	next_page_btn.pressed.connect(_on_next_page)

func _load_data() -> void:
	level_data_resource = load("res://config/levels.tres")
	if level_data_resource:
		all_levels = level_data_resource.get_level_data()
	total_pages = ceil(float(all_levels.size()) / float(LEVELS_PER_PAGE))

func _refresh_stats() -> void:
	var total_stars: int = 0
	var completed: int = 0
	var total: int = all_levels.size()
	for id in all_levels.keys():
		var r: Dictionary = SaveManager.get_level_result(id)
		var s: int = r.get("best_stars", 0)
		total_stars += s
		if s >= 1:
			completed += 1
	total_stars_label.text = "总星星：★ %d" % total_stars
	stats_label.text = "进度：%d / %d 关 | 游戏次数：%d | 总时间：%.0f 分钟" % [
		completed, total,
		SaveManager.stats.get("total_games_played", 0),
		SaveManager.stats.get("total_time_played", 0.0) / 60.0
	]
	prev_page_btn.disabled = current_page <= 0
	next_page_btn.disabled = current_page >= total_pages - 1

func _render_levels() -> void:
	for c in levels_grid.get_children():
		c.queue_free()
	levels_grid.columns = 4
	var sorted_ids: Array = []
	for id in all_levels.keys():
		sorted_ids.append(id)
	sorted_ids.sort()
	var start_idx: int = current_page * LEVELS_PER_PAGE
	var end_idx: int = min(start_idx + LEVELS_PER_PAGE, sorted_ids.size())
	for i in range(start_idx, end_idx):
		var id: int = sorted_ids[i]
		var card := _create_level_card(id)
		levels_grid.add_child(card)

func _create_level_card(level_id: int) -> Control:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.custom_minimum_size = Vector2(180, 160)
	var unlocked: bool = SaveManager.is_level_unlocked(level_id)
	var result: Dictionary = SaveManager.get_level_result(level_id)
	var stars: int = result.get("best_stars", 0)
	var best: int = result.get("best_score", 0)
	var info: Dictionary = all_levels.get(level_id, {})
	var style := StyleBoxFlat.new()
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_right = 12
	style.corner_radius_bottom_left = 12
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	style.shadow_size = 8
	style.shadow_color = Color(0, 0, 0, 0.35)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	if unlocked:
		style.bg_color = Color(0.18, 0.22, 0.32, 0.95)
		style.border_color = Color(0.35, 0.55, 0.9, 0.85)
	else:
		style.bg_color = Color(0.15, 0.15, 0.18, 0.8)
		style.border_color = Color(0.3, 0.3, 0.35, 0.8)
	panel.add_theme_stylebox_override("panel", style)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 6)
	panel.add_child(vb)
	var header := HBoxContainer.new()
	vb.add_child(header)
	var id_lbl := Label.new()
	id_lbl.text = "L%d" % level_id
	id_lbl.add_theme_font_size_override("font_size", 18)
	id_lbl.add_theme_color_override("font_color",
		Color(0.55, 0.85, 1.0) if unlocked else Color(0.5, 0.5, 0.55))
	id_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(id_lbl)
	var diff: int = info.get("difficulty", 1)
	var diff_lbl := Label.new()
	diff_lbl.text = "⭐" * min(5, diff)
	diff_lbl.add_theme_font_size_override("font_size", 12)
	header.add_child(diff_lbl)
	var name_lbl := Label.new()
	name_lbl.text = info.get("name", "关卡 %d" % level_id)
	name_lbl.add_theme_font_size_override("font_size", 15)
	name_lbl.add_theme_color_override("font_color",
		Color.WHITE if unlocked else Color(0.5, 0.5, 0.55))
	vb.add_child(name_lbl)
	var desc_lbl := Label.new()
	desc_lbl.text = info.get("description", "") if unlocked else "🔒 未解锁"
	desc_lbl.add_theme_font_size_override("font_size", 11)
	desc_lbl.add_theme_color_override("font_color", Color(0.75, 0.75, 0.8))
	desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	desc_lbl.custom_minimum_size.y = 28
	vb.add_child(desc_lbl)
	var star_lbl := Label.new()
	if unlocked:
		star_lbl.text = "★ " * stars + "☆ " * (3 - stars)
	else:
		star_lbl.text = "— — —"
	star_lbl.add_theme_font_size_override("font_size", 18)
	star_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	star_lbl.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3))
	vb.add_child(star_lbl)
	var score_lbl := Label.new()
	score_lbl.text = "最佳：%d 分" % best if unlocked and best > 0 else ""
	score_lbl.add_theme_font_size_override("font_size", 11)
	score_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	score_lbl.add_theme_color_override("font_color", Color(0.6, 0.85, 0.7))
	vb.add_child(score_lbl)
	if unlocked:
		var btn := Button.new()
		btn.text = "▶ 开始挑战"
		btn.add_theme_font_size_override("font_size", 13)
		btn.pressed.connect(_on_level_pressed.bind(level_id))
		vb.add_child(btn)
	return panel

func _on_level_pressed(level_id: int) -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	PlaySessionRecorder.record_event("level_select_pick", {"level_id": level_id})
	GameManager.pending_start_level_id = level_id
	get_tree().change_scene_to_file("res://scenes/GameScene.tscn")

func _on_back() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	GameManager.go_to_main_menu()

func _on_prev_page() -> void:
	if current_page > 0:
		current_page -= 1
		AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
		_render_levels()
		_refresh_stats()

func _on_next_page() -> void:
	if current_page < total_pages - 1:
		current_page += 1
		AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
		_render_levels()
		_refresh_stats()
