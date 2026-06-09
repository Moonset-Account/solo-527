extends Control
## 主菜单 - 包含：开始游戏/继续/设置/数据记录

var _root_box: VBoxContainer
var _title_lbl: Label
var _subtitle_lbl: Label
var _input_hint_bar: HBoxContainer

func _ready() -> void:
	_build_ui()
	_connect_signals()
	_refresh_hint_bar()
	randomize()

func _build_ui() -> void:
	for c in get_children(): c.queue_free()
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = Color(0.1098, 0.0941, 0.0824, 1)
	style.content_margin_left = 0
	style.content_margin_right = 0
	style.content_margin_top = 0
	style.content_margin_bottom = 0
	add_theme_stylebox_override("panel", style)

	var bg: ColorRect = ColorRect.new()
	bg.color = Color(0.08, 0.07, 0.06, 1)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var deco: PanelContainer = PanelContainer.new()
	deco.anchor_right = 1.0
	deco.anchor_bottom = 1.0
	var deco_sb: StyleBoxFlat = StyleBoxFlat.new()
	deco_sb.bg_color = Color(0, 0, 0, 0)
	deco_sb.border_width_left = 2
	deco_sb.border_width_right = 2
	deco_sb.border_width_top = 2
	deco_sb.border_width_bottom = 2
	deco_sb.border_color = Color(0.45, 0.32, 0.18, 0.4)
	deco_sb.corner_radius_top_left = 0
	deco_sb.corner_radius_top_right = 0
	deco_sb.corner_radius_bottom_right = 0
	deco_sb.corner_radius_bottom_left = 0
	deco_sb.content_margin_left = 0
	deco_sb.content_margin_right = 0
	deco_sb.content_margin_top = 0
	deco_sb.content_margin_bottom = 0
	deco.add_theme_stylebox_override("panel", deco_sb)
	add_child(deco)

	var center: MarginContainer = MarginContainer.new()
	center.anchor_right = 1.0
	center.anchor_bottom = 1.0
	center.add_theme_constant_override("margin_left", 64)
	center.add_theme_constant_override("margin_right", 64)
	center.add_theme_constant_override("margin_top", 48)
	center.add_theme_constant_override("margin_bottom", 48)
	add_child(center)

	_root_box = VBoxContainer.new()
	_root_box.alignment = BoxContainer.ALIGNMENT_CENTER
	_root_box.add_theme_constant_override("separation", 24)
	center.add_child(_root_box)

	var title_font_size: int = 72
	var _t_spacer_top: Control = Control.new()
	_t_spacer_top.custom_minimum_size = Vector2(0, 40)
	_root_box.add_child(_t_spacer_top)

	var museum_icon: Label = Label.new()
	museum_icon.text = "🏛️"
	museum_icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	museum_icon.add_theme_font_size_override("font_size", 120)
	_root_box.add_child(museum_icon)

	_title_lbl = Label.new()
	_title_lbl.text = "博物馆卡牌修复战"
	_title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_lbl.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	_title_lbl.add_theme_font_size_override("font_size", title_font_size)
	var fb: FontFile = null
	_title_lbl.add_theme_color_override("font_outline_color", Color(0.2, 0.1, 0.05, 1))
	_title_lbl.add_theme_constant_override("outline_size", 4)
	_root_box.add_child(_title_lbl)

	_subtitle_lbl = Label.new()
	_subtitle_lbl.text = "以修复策略为核心的卡牌构筑游戏"
	_subtitle_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_subtitle_lbl.add_theme_color_override("font_color", Color(0.7, 0.6, 0.5, 1))
	_subtitle_lbl.add_theme_font_size_override("font_size", 22)
	_root_box.add_child(_subtitle_lbl)

	var sep_b: HSeparator = HSeparator.new()
	sep_b.custom_minimum_size = Vector2(0, 12)
	_root_box.add_child(sep_b)

	var btn_size: Vector2 = Vector2(320, 56)
	var btns: Array = [
		["🎮  开始新游戏", _on_start_new_pressed, Color(0.3, 0.55, 0.38)],
		["📂  选择存档", _on_select_slot_pressed, Color(0.25, 0.4, 0.6)],
		["📖  关卡选择", _on_level_select_pressed, Color(0.5, 0.35, 0.55)],
		["📊  数据记录", _on_stats_pressed, Color(0.45, 0.4, 0.25)],
		["⚙️  游戏设置", _on_settings_pressed, Color(0.4, 0.35, 0.3)],
		["🚪  退出游戏", _on_quit_pressed, Color(0.5, 0.25, 0.25)],
	]
	for b in btns:
		var btn: Button = _make_menu_button(b[0], btn_size, b[2])
		btn.pressed.connect(b[1])
		_root_box.add_child(btn)

	var bottom_spacer: Control = Control.new()
	bottom_spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_root_box.add_child(bottom_spacer)

	_input_hint_bar = HBoxContainer.new()
	_input_hint_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	_input_hint_bar.add_theme_constant_override("separation", 32)
	_root_box.add_child(_input_hint_bar)

	var version: Label = Label.new()
	version.text = "v0.1.0  |  Godot 4.2  |  构建日期 2026-06-09"
	version.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	version.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 1))
	version.add_theme_font_size_override("font_size", 14)
	_root_box.add_child(version)

func _make_menu_button(text: String, min_size: Vector2, accent: Color) -> Button:
	var btn: Button = Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	btn.add_theme_font_size_override("font_size", 22)
	var sb_normal: StyleBoxFlat = StyleBoxFlat.new()
	sb_normal.bg_color = accent.darkened(0.35)
	sb_normal.corner_radius_top_left = 10
	sb_normal.corner_radius_top_right = 10
	sb_normal.corner_radius_bottom_right = 10
	sb_normal.corner_radius_bottom_left = 10
	sb_normal.border_width_left = 2
	sb_normal.border_width_right = 2
	sb_normal.border_width_top = 2
	sb_normal.border_width_bottom = 2
	sb_normal.border_color = accent.lightened(0.2)
	sb_normal.content_margin_left = 20
	sb_normal.content_margin_right = 20
	btn.add_theme_stylebox_override("normal", sb_normal)
	var sb_hover: StyleBoxFlat = sb_normal.duplicate()
	sb_hover.bg_color = accent
	sb_hover.border_color = Color.WHITE
	btn.add_theme_stylebox_override("hover", sb_hover)
	var sb_press: StyleBoxFlat = sb_normal.duplicate()
	sb_press.bg_color = accent.darkened(0.5)
	sb_press.border_color = accent
	btn.add_theme_stylebox_override("pressed", sb_press)
	var sb_dis: StyleBoxFlat = sb_normal.duplicate()
	sb_dis.bg_color = Color(0.2, 0.2, 0.2, 1)
	sb_dis.border_color = Color(0.3, 0.3, 0.3, 1)
	btn.add_theme_stylebox_override("disabled", sb_dis)
	btn.add_theme_color_override("font_color", Color(0.95, 0.9, 0.8, 1))
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_color_override("font_pressed_color", Color(0.8, 0.8, 0.8, 1))
	return btn

func _connect_signals() -> void:
	InputManager.method_changed.connect(_on_input_method_changed)

func _refresh_hint_bar() -> void:
	for c in _input_hint_bar.get_children(): c.queue_free()
	var hints: Array = [
		["ui_accept", "确认"],
		["ui_cancel", "返回"],
		["ui_up", "上"],
		["ui_down", "下"],
	]
	for h in hints:
		var box: HBoxContainer = HBoxContainer.new()
		box.add_theme_constant_override("separation", 6)
		var k: Label = Label.new()
		var key_str: String = InputManager.get_hint(h[0])
		k.text = "[%s]" % key_str
		k.add_theme_color_override("font_color", Color(0.95, 0.8, 0.4, 1))
		k.add_theme_font_size_override("font_size", 14)
		box.add_child(k)
		var d: Label = Label.new()
		d.text = h[1]
		d.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1))
		d.add_theme_font_size_override("font_size", 14)
		box.add_child(d)
		_input_hint_bar.add_child(box)
	var mode_lbl: Label = Label.new()
	mode_lbl.text = ("  当前输入：%s" % InputManager.method_name())
	mode_lbl.add_theme_color_override("font_color", Color(0.55, 0.8, 0.9, 1))
	mode_lbl.add_theme_font_size_override("font_size", 14)
	_input_hint_bar.add_child(mode_lbl)

func _on_input_method_changed(_m: int) -> void:
	_refresh_hint_bar()

func _push_scene(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)

func _on_start_new_pressed() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	SaveManager.create_slot(_first_empty_slot())
	SaveManager.load_slot(_first_empty_slot() if _first_empty_slot() >= 0 else 0)
	_push_scene("res://scenes/LevelSelect.tscn")

func _first_empty_slot() -> int:
	for i in SaveManager.SLOT_COUNT:
		if not SaveManager.has_slot(i):
			return i
	return 0

func _on_select_slot_pressed() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	_push_scene("res://scenes/SlotSelect.tscn")

func _on_level_select_pressed() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	if SaveManager.current_slot < 0:
		if SaveManager.SLOT_COUNT > 0 and SaveManager.has_slot(0):
			SaveManager.load_slot(0)
		else:
			SaveManager.create_slot(0)
			SaveManager.load_slot(0)
	_push_scene("res://scenes/LevelSelect.tscn")

func _on_stats_pressed() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	_push_scene("res://scenes/StatsView.tscn")

func _on_settings_pressed() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	_push_scene("res://scenes/SettingsPage.tscn")

func _on_quit_pressed() -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	get_tree().quit()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_quit_pressed()
