extends Control
## 展品UI组件 - 运行时动态构建UI节点树
## 独立UI模块，可通过new()直接创建使用

class_name ExhibitUI

signal exhibit_clicked(exhibit_ui: Control)

const EXHIBIT_WIDTH: int = 200
const EXHIBIT_HEIGHT: int = 240
const ANIM_DURATION: float = 0.25

var exhibit_id: String = ""
var exhibit_data: Dictionary = {}
var is_selectable: bool = false
var is_selected: bool = false
var is_targetable: bool = false

var _base_position: Vector2 = Vector2.ZERO
var _shake_tween: Tween = null
var _glow_tween: Tween = null

var _frame_panel: Panel
var _name_label: Label
var _art_rect: ColorRect
var _progress_bar: ProgressBar
var _progress_label: Label
var _condition_bar: ProgressBar
var _condition_label: Label
var _status_label: Label
var _timer_label: Label
var _selection_border: ColorRect
var _targetable_glow: ColorRect
var _complete_overlay: ColorRect
var _fail_overlay: ColorRect
var _tags_container: HBoxContainer

func _init() -> void:
	size = Vector2(EXHIBIT_WIDTH, EXHIBIT_HEIGHT)
	custom_minimum_size = Vector2(EXHIBIT_WIDTH, EXHIBIT_HEIGHT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_build_ui_tree()

func _ready() -> void:
	gui_input.connect(_on_gui_input)

func _build_ui_tree() -> void:
	_frame_panel = Panel.new()
	_frame_panel.name = "FramePanel"
	_frame_panel.offset_left = 4
	_frame_panel.offset_top = 4
	_frame_panel.offset_right = EXHIBIT_WIDTH - 4
	_frame_panel.offset_bottom = EXHIBIT_HEIGHT - 4
	var fp_sb: StyleBoxFlat = StyleBoxFlat.new()
	fp_sb.bg_color = Color(0.13, 0.09, 0.06, 1)
	fp_sb.corner_radius_top_left = 8
	fp_sb.corner_radius_top_right = 8
	fp_sb.corner_radius_bottom_left = 8
	fp_sb.corner_radius_bottom_right = 8
	fp_sb.border_width_left = 1
	fp_sb.border_width_top = 1
	fp_sb.border_width_right = 1
	fp_sb.border_width_bottom = 1
	fp_sb.border_color = Color(0.35, 0.25, 0.15, 0.9)
	_frame_panel.add_theme_stylebox_override("panel", fp_sb)
	add_child(_frame_panel)
	
	_selection_border = ColorRect.new()
	_selection_border.name = "SelectionBorder"
	_selection_border.offset_left = 0
	_selection_border.offset_top = 0
	_selection_border.offset_right = EXHIBIT_WIDTH - 8
	_selection_border.offset_bottom = EXHIBIT_HEIGHT - 8
	_selection_border.color = Color(1, 0.9, 0.2, 0.75)
	_selection_border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_selection_border.visible = false
	var sb_sb: StyleBoxFlat = StyleBoxFlat.new()
	sb_sb.bg_color = Color(1, 0.9, 0.2, 0)
	sb_sb.corner_radius_top_left = 8
	sb_sb.corner_radius_top_right = 8
	sb_sb.corner_radius_bottom_left = 8
	sb_sb.corner_radius_bottom_right = 8
	sb_sb.border_width_left = 3
	sb_sb.border_width_top = 3
	sb_sb.border_width_right = 3
	sb_sb.border_width_bottom = 3
	sb_sb.border_color = Color(1, 0.9, 0.2, 0.9)
	_selection_border.color = Color(0, 0, 0, 0)
	_frame_panel.add_child(_selection_border)
	
	_targetable_glow = ColorRect.new()
	_targetable_glow.name = "TargetableGlow"
	_targetable_glow.offset_left = -8
	_targetable_glow.offset_top = -8
	_targetable_glow.offset_right = EXHIBIT_WIDTH
	_targetable_glow.offset_bottom = EXHIBIT_HEIGHT
	_targetable_glow.color = Color(0.2, 1, 0.3, 0.35)
	_targetable_glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_targetable_glow.visible = false
	var tg_sb: StyleBoxFlat = StyleBoxFlat.new()
	tg_sb.bg_color = Color(0.2, 0.9, 0.4, 0)
	tg_sb.corner_radius_top_left = 12
	tg_sb.corner_radius_top_right = 12
	tg_sb.corner_radius_bottom_left = 12
	tg_sb.corner_radius_bottom_right = 12
	tg_sb.border_width_left = 3
	tg_sb.border_width_top = 3
	tg_sb.border_width_right = 3
	tg_sb.border_width_bottom = 3
	tg_sb.border_color = Color(0.3, 1, 0.5, 0.95)
	_targetable_glow.color = Color(0, 0, 0, 0)
	_frame_panel.add_child(_targetable_glow)
	
	_name_label = Label.new()
	_name_label.name = "NameLabel"
	_name_label.offset_left = 6
	_name_label.offset_top = 6
	_name_label.offset_right = EXHIBIT_WIDTH - 14
	_name_label.offset_bottom = 28
	_name_label.text = "展品名称"
	_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_name_label.add_theme_font_size_override("font_size", 15)
	_name_label.add_theme_color_override("font_color", Color(0.98, 0.9, 0.65))
	_frame_panel.add_child(_name_label)
	
	_tags_container = HBoxContainer.new()
	_tags_container.name = "TagsContainer"
	_tags_container.offset_left = 6
	_tags_container.offset_top = 28
	_tags_container.offset_right = EXHIBIT_WIDTH - 14
	_tags_container.offset_bottom = 44
	_tags_container.alignment = BoxContainer.ALIGNMENT_CENTER
	_tags_container.add_theme_constant_override("separation", 6)
	_frame_panel.add_child(_tags_container)
	
	_art_rect = ColorRect.new()
	_art_rect.name = "ArtRect"
	_art_rect.offset_left = 10
	_art_rect.offset_top = 48
	_art_rect.offset_right = EXHIBIT_WIDTH - 18
	_art_rect.offset_bottom = 122
	_art_rect.color = Color(0.5, 0.4, 0.25, 1)
	var ar_sb: StyleBoxFlat = StyleBoxFlat.new()
	ar_sb.bg_color = _art_rect.color
	ar_sb.corner_radius_top_left = 4
	ar_sb.corner_radius_top_right = 4
	ar_sb.corner_radius_bottom_left = 4
	ar_sb.corner_radius_bottom_right = 4
	_frame_panel.add_child(_art_rect)
	
	var progress_section = VBoxContainer.new()
	progress_section.name = "ProgressSection"
	progress_section.offset_left = 10
	progress_section.offset_top = 126
	progress_section.offset_right = EXHIBIT_WIDTH - 18
	progress_section.offset_bottom = 156
	progress_section.add_theme_constant_override("separation", 2)
	_frame_panel.add_child(progress_section)
	
	_progress_label = Label.new()
	_progress_label.name = "ProgressLabel"
	_progress_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_progress_label.text = "修复: 0 / 100"
	_progress_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_progress_label.add_theme_font_size_override("font_size", 11)
	_progress_label.add_theme_color_override("font_color", Color(0.8, 0.9, 1))
	progress_section.add_child(_progress_label)
	
	_progress_bar = ProgressBar.new()
	_progress_bar.name = "ProgressBar"
	_progress_bar.custom_minimum_size = Vector2(0, 12)
	_progress_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_progress_bar.max_value = 100
	_progress_bar.value = 0
	_progress_bar.show_percentage = false
	var fill_sb1: StyleBoxFlat = StyleBoxFlat.new()
	fill_sb1.bg_color = Color(0.3, 0.6, 0.95, 1)
	fill_sb1.corner_radius_top_left = 4
	fill_sb1.corner_radius_top_right = 4
	fill_sb1.corner_radius_bottom_left = 4
	fill_sb1.corner_radius_bottom_right = 4
	_progress_bar.add_theme_stylebox_override("fill", fill_sb1)
	var bg_sb1: StyleBoxFlat = StyleBoxFlat.new()
	bg_sb1.bg_color = Color(0.15, 0.15, 0.18, 1)
	bg_sb1.corner_radius_top_left = 4
	bg_sb1.corner_radius_top_right = 4
	bg_sb1.corner_radius_bottom_left = 4
	bg_sb1.corner_radius_bottom_right = 4
	_progress_bar.add_theme_stylebox_override("background", bg_sb1)
	progress_section.add_child(_progress_bar)
	
	var condition_section = VBoxContainer.new()
	condition_section.name = "ConditionSection"
	condition_section.offset_left = 10
	condition_section.offset_top = 160
	condition_section.offset_right = EXHIBIT_WIDTH - 18
	condition_section.offset_bottom = 190
	condition_section.add_theme_constant_override("separation", 2)
	_frame_panel.add_child(condition_section)
	
	_condition_label = Label.new()
	_condition_label.name = "ConditionLabel"
	_condition_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_condition_label.text = "完好度: 100"
	_condition_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_condition_label.add_theme_font_size_override("font_size", 11)
	condition_section.add_child(_condition_label)
	
	_condition_bar = ProgressBar.new()
	_condition_bar.name = "ConditionBar"
	_condition_bar.custom_minimum_size = Vector2(0, 12)
	_condition_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_condition_bar.max_value = 100
	_condition_bar.value = 100
	_condition_bar.show_percentage = false
	var fill_sb2: StyleBoxFlat = StyleBoxFlat.new()
	fill_sb2.bg_color = Color(0.3, 0.85, 0.4, 1)
	fill_sb2.corner_radius_top_left = 4
	fill_sb2.corner_radius_top_right = 4
	fill_sb2.corner_radius_bottom_left = 4
	fill_sb2.corner_radius_bottom_right = 4
	_condition_bar.add_theme_stylebox_override("fill", fill_sb2)
	var bg_sb2: StyleBoxFlat = StyleBoxFlat.new()
	bg_sb2.bg_color = Color(0.15, 0.15, 0.18, 1)
	bg_sb2.corner_radius_top_left = 4
	bg_sb2.corner_radius_top_right = 4
	bg_sb2.corner_radius_bottom_left = 4
	bg_sb2.corner_radius_bottom_right = 4
	_condition_bar.add_theme_stylebox_override("background", bg_sb2)
	condition_section.add_child(_condition_bar)
	
	_status_label = Label.new()
	_status_label.name = "StatusLabel"
	_status_label.offset_left = 10
	_status_label.offset_top = 192
	_status_label.offset_right = EXHIBIT_WIDTH - 18
	_status_label.offset_bottom = 210
	_status_label.text = "状态稳定"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 11)
	_frame_panel.add_child(_status_label)
	
	_timer_label = Label.new()
	_timer_label.name = "TimerLabel"
	_timer_label.offset_left = 10
	_timer_label.offset_top = 210
	_timer_label.offset_right = EXHIBIT_WIDTH - 18
	_timer_label.offset_bottom = 228
	_timer_label.text = "⏱ 限时"
	_timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_timer_label.visible = false
	_timer_label.add_theme_font_size_override("font_size", 12)
	_frame_panel.add_child(_timer_label)
	
	_complete_overlay = ColorRect.new()
	_complete_overlay.name = "CompleteOverlay"
	_complete_overlay.offset_left = 0
	_complete_overlay.offset_top = 0
	_complete_overlay.offset_right = EXHIBIT_WIDTH - 8
	_complete_overlay.offset_bottom = EXHIBIT_HEIGHT - 8
	_complete_overlay.color = Color(0.2, 0.7, 0.35, 0.88)
	_complete_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_complete_overlay.visible = false
	var complete_lbl: Label = Label.new()
	complete_lbl.text = "✦ 修复完成 ✦"
	complete_lbl.offset_left = 0
	complete_lbl.offset_top = EXHIBIT_HEIGHT * 0.42
	complete_lbl.offset_right = EXHIBIT_WIDTH - 8
	complete_lbl.offset_bottom = EXHIBIT_HEIGHT * 0.58
	complete_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	complete_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	complete_lbl.add_theme_font_size_override("font_size", 20)
	complete_lbl.add_theme_color_override("font_color", Color(1, 1, 0.9))
	_complete_overlay.add_child(complete_lbl)
	_frame_panel.add_child(_complete_overlay)
	
	_fail_overlay = ColorRect.new()
	_fail_overlay.name = "FailOverlay"
	_fail_overlay.offset_left = 0
	_fail_overlay.offset_top = 0
	_fail_overlay.offset_right = EXHIBIT_WIDTH - 8
	_fail_overlay.offset_bottom = EXHIBIT_HEIGHT - 8
	_fail_overlay.color = Color(0.7, 0.2, 0.2, 0.88)
	_fail_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fail_overlay.visible = false
	var fail_lbl: Label = Label.new()
	fail_lbl.text = "✗ 修复失败 ✗"
	fail_lbl.offset_left = 0
	fail_lbl.offset_top = EXHIBIT_HEIGHT * 0.42
	fail_lbl.offset_right = EXHIBIT_WIDTH - 8
	fail_lbl.offset_bottom = EXHIBIT_HEIGHT * 0.58
	fail_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	fail_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	fail_lbl.add_theme_font_size_override("font_size", 20)
	fail_lbl.add_theme_color_override("font_color", Color(1, 0.9, 0.9))
	_fail_overlay.add_child(fail_lbl)
	_frame_panel.add_child(_fail_overlay)

func setup(exhibit: Dictionary) -> void:
	exhibit_data = exhibit
	exhibit_id = exhibit.get("id", "")
	_refresh_all()

func update_data(exhibit: Dictionary) -> void:
	var old_progress: int = exhibit_data.get("current_progress", 0)
	var old_condition: int = exhibit_data.get("current_condition", 100)
	exhibit_data = exhibit
	
	if exhibit.current_progress != old_progress:
		_animate_progress(old_progress, exhibit.current_progress)
	if exhibit.current_condition != old_condition:
		var diff: int = old_condition - exhibit.current_condition
		if diff > 0:
			_shake_animation()
	_refresh_condition()
	_refresh_status()

func set_selectable(selectable: bool) -> void:
	is_selectable = selectable
	mouse_filter = Control.MOUSE_FILTER_STOP if selectable else Control.MOUSE_FILTER_IGNORE

func set_targetable(targetable: bool) -> void:
	is_targetable = targetable
	if _glow_tween:
		_glow_tween.kill()
		_glow_tween = null
	if _targetable_glow:
		if targetable:
			_targetable_glow.visible = true
			_targetable_glow.modulate.a = 0.2
			_glow_tween = create_tween().set_loops().set_trans(Tween.TRANS_SINE)
			_glow_tween.tween_property(_targetable_glow, "modulate:a", 0.7, 0.6)
			_glow_tween.tween_property(_targetable_glow, "modulate:a", 0.25, 0.6)
		else:
			_targetable_glow.visible = false

func set_selected(selected: bool) -> void:
	is_selected = selected
	if _selection_border:
		_selection_border.visible = selected
		if selected:
			_bounce_scale()

func play_repair_animation(amount: int) -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	if _art_rect:
		t.parallel().tween_property(_art_rect, "color", Color(0.35, 0.85, 0.55), 0.15)
		t.parallel().tween_property(_art_rect, "color", _get_category_color(), 0.4).set_delay(0.15)
	_spawn_floating_text("+%d" % amount, Color(0.3, 0.95, 0.5))

func play_damage_animation(amount: int) -> void:
	_shake_animation()
	_spawn_floating_text("-%d" % amount, Color(0.95, 0.3, 0.3))
	var t: Tween = create_tween()
	if _frame_panel:
		t.tween_property(_frame_panel, "modulate", Color(1, 0.45, 0.45), 0.1)
		t.tween_property(_frame_panel, "modulate", Color.WHITE, 0.25)

func play_complete_animation() -> void:
	if _complete_overlay:
		_complete_overlay.visible = true
		_complete_overlay.modulate.a = 0.0
		var t: Tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		t.parallel().tween_property(_complete_overlay, "modulate:a", 0.9, 0.5)
		t.parallel().tween_property(self, "scale", Vector2(1.1, 1.1), 0.4)
		t.tween_property(self, "scale", Vector2(1.0, 1.0), 0.3)
	AudioManager.play_exhibit_complete()

func play_fail_animation() -> void:
	if _fail_overlay:
		_fail_overlay.visible = true
		_fail_overlay.modulate.a = 0.0
		var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
		t.parallel().tween_property(_fail_overlay, "modulate:a", 0.9, 0.5)
	AudioManager.play_warning()

func set_base_position(pos: Vector2) -> void:
	_base_position = pos
	position = pos

func _refresh_all() -> void:
	if _name_label:
		_name_label.text = exhibit_data.get("name", "未知展品")
	if _art_rect:
		_art_rect.color = _get_category_color()
	_refresh_progress()
	_refresh_condition()
	_refresh_status()
	_refresh_tags()
	_refresh_overlays()

func _refresh_progress() -> void:
	if _progress_bar:
		var target: int = exhibit_data.get("repair_target", 100)
		var current: int = exhibit_data.get("current_progress", 0)
		_progress_bar.max_value = max(1, target)
		_progress_bar.value = float(current)
	if _progress_label:
		var target: int = exhibit_data.get("repair_target", 100)
		var current: int = exhibit_data.get("current_progress", 0)
		_progress_label.text = "修复: %d / %d" % [current, target]

func _animate_progress(from_val: int, to_val: int) -> void:
	if not _progress_bar:
		_refresh_progress()
		return
	_progress_bar.max_value = max(1, exhibit_data.get("repair_target", 100))
	_progress_bar.value = float(from_val)
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	t.tween_property(_progress_bar, "value", float(to_val), 0.45)
	t.tween_callback(_refresh_progress)

func _refresh_condition() -> void:
	var max_c: int = exhibit_data.get("max_condition", 100)
	var cur_c: int = exhibit_data.get("current_condition", max_c)
	if _condition_bar:
		_condition_bar.max_value = max(1, max_c)
		_condition_bar.value = float(cur_c)
		var color: Color = _get_condition_color(cur_c, max_c)
		var fill_sb: StyleBoxFlat = StyleBoxFlat.new()
		fill_sb.bg_color = color
		fill_sb.corner_radius_top_left = 4
		fill_sb.corner_radius_top_right = 4
		fill_sb.corner_radius_bottom_left = 4
		fill_sb.corner_radius_bottom_right = 4
		_condition_bar.add_theme_stylebox_override("fill", fill_sb)
	if _condition_label:
		_condition_label.text = "完好度: %d" % cur_c
		_condition_label.add_theme_color_override("font_color", _get_condition_color(cur_c, max_c))

func _refresh_status() -> void:
	if _status_label:
		var completed: bool = exhibit_data.get("completed", false)
		var failed: bool = exhibit_data.get("failed", false)
		var dmg: int = exhibit_data.get("damage_per_turn", 0)
		var text: String = ""
		if completed:
			text = "✓ 修复完成"
			_status_label.add_theme_color_override("font_color", Color(0.35, 0.95, 0.5))
		elif failed:
			text = "✗ 修复失败"
			_status_label.add_theme_color_override("font_color", Color(0.95, 0.3, 0.3))
		elif dmg > 0:
			text = "每回合损坏: %d" % dmg
			_status_label.add_theme_color_override("font_color", Color(0.95, 0.65, 0.3))
		else:
			text = "状态稳定"
			_status_label.add_theme_color_override("font_color", Color(0.65, 0.9, 0.65))
		_status_label.text = text
	if _timer_label:
		var timer: int = exhibit_data.get("turns_until_irreparable", 0)
		if timer > 0:
			_timer_label.visible = true
			_timer_label.text = "⏱ 限时: %d回合" % timer
			if timer <= 3:
				_timer_label.add_theme_color_override("font_color", Color(1.0, 0.25, 0.25))
			else:
				_timer_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.35))
		else:
			_timer_label.visible = false

func _refresh_tags() -> void:
	if not _tags_container:
		return
	for child in _tags_container.get_children():
		child.queue_free()
	var tags: Array = exhibit_data.get("tags", [])
	var tag_colors: Dictionary = {
		"urgent": Color(0.95, 0.25, 0.25),
		"rare": Color(0.95, 0.7, 0.1),
		"fragile": Color(0.7, 0.5, 0.95),
		"large": Color(0.3, 0.6, 0.95),
		"small": Color(0.5, 0.85, 0.5),
		"metal": Color(0.7, 0.6, 0.5),
		"paper": Color(0.95, 0.9, 0.75),
		"ceramic": Color(0.82, 0.88, 0.98),
		"silk": Color(0.92, 0.7, 0.82)
	}
	var tag_names: Dictionary = {
		"urgent": "紧急", "rare": "珍贵", "fragile": "易碎",
		"large": "大型", "small": "小型", "metal": "金属",
		"paper": "纸质", "ceramic": "陶瓷", "silk": "丝绸",
		"weapon": "兵器", "instrument": "乐器", "sculpture": "雕塑"
	}
	for tag in tags:
		var lbl: Label = Label.new()
		lbl.text = tag_names.get(tag, tag)
		lbl.add_theme_font_size_override("font_size", 10)
		var c: Color = tag_colors.get(tag, Color(0.65, 0.65, 0.65))
		lbl.add_theme_color_override("font_color", c)
		_tags_container.add_child(lbl)

func _refresh_overlays() -> void:
	if _complete_overlay:
		_complete_overlay.visible = exhibit_data.get("completed", false)
		if _complete_overlay.visible:
			_complete_overlay.modulate.a = 0.9
	if _fail_overlay:
		_fail_overlay.visible = exhibit_data.get("failed", false)
		if _fail_overlay.visible:
			_fail_overlay.modulate.a = 0.9

func _get_category_color() -> Color:
	var cat: String = exhibit_data.get("category", "general")
	match cat:
		"bronze":
			return Color(0.55, 0.45, 0.25)
		"painting":
			return Color(0.7, 0.5, 0.35)
		"porcelain":
			return Color(0.88, 0.9, 0.98)
		_:
			return Color(0.5, 0.5, 0.5)

func _get_condition_color(current: int, max_val: int) -> Color:
	var p: float = float(current) / float(max_val) if max_val > 0 else 0.0
	if p > 0.7:
		return Color(0.3, 0.9, 0.4)
	elif p > 0.4:
		return Color(0.98, 0.7, 0.2)
	else:
		return Color(0.98, 0.3, 0.3)

func _shake_animation() -> void:
	var original: Vector2 = _base_position
	if _shake_tween:
		_shake_tween.kill()
	_shake_tween = create_tween()
	for i in range(5):
		var offset: Vector2 = Vector2(randf_range(-8, 8), randf_range(-5, 5))
		_shake_tween.tween_property(self, "position", original + offset, 0.04)
	_shake_tween.tween_property(self, "position", original, 0.12)

func _bounce_scale() -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	t.tween_property(self, "scale", Vector2(1.08, 1.08), 0.2)
	t.tween_property(self, "scale", Vector2(1.0, 1.0), 0.3)

func _spawn_floating_text(text: String, color: Color) -> void:
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", 24)
	lbl.add_theme_color_override("font_color", color)
	lbl.z_index = 50
	lbl.offset_left = 0
	lbl.offset_top = 55
	lbl.offset_right = EXHIBIT_WIDTH - 8
	lbl.offset_bottom = 90
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	add_child(lbl)
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	t.parallel().tween_property(lbl, "offset_top", -20.0, 0.95)
	t.parallel().tween_property(lbl, "modulate:a", 0.0, 0.95)
	t.tween_callback(lbl.queue_free)

func _on_gui_input(event: InputEvent) -> void:
	if not is_selectable and not is_targetable:
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		emit_signal("exhibit_clicked", self)
		AudioManager.play_ui_click()
		accept_event()
