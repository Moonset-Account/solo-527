extends CanvasLayer

signal undo_pressed
signal pause_pressed
signal complete_pressed

var _score_label: Label
var _time_label: Label
var _items_label: Label
var _weight_label: Label
var _level_name_label: Label
var _undo_button: Button
var _pause_button: Button
var _complete_button: Button
var _hint_label: Label
var _star_display: HBoxContainer
var _fragile_warning: ColorRect

func _ready() -> void:
	layer = 20
	_build_hud()

func _build_hud() -> void:
	var top_bar = HBoxContainer.new()
	top_bar.name = "TopBar"
	top_bar.anchors_preset = Control.PRESET_TOP_WIDE
	top_bar.offset_bottom = 50
	top_bar.add_theme_constant_override("separation", 10)
	add_child(top_bar)
	_level_name_label = Label.new()
	_level_name_label.name = "LevelName"
	_level_name_label.add_theme_font_size_override("font_size", 20)
	_level_name_label.add_theme_color_override("font_color", Color.WHITE)
	_level_name_label.custom_minimum_size = Vector2(200, 40)
	_level_name_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(_level_name_label)
	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(spacer)
	_score_label = Label.new()
	_score_label.name = "Score"
	_score_label.add_theme_font_size_override("font_size", 18)
	_score_label.add_theme_color_override("font_color", Color.GOLD)
	_score_label.text = "Score: 0"
	_score_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(_score_label)
	_time_label = Label.new()
	_time_label.name = "Time"
	_time_label.add_theme_font_size_override("font_size", 16)
	_time_label.add_theme_color_override("font_color", Color.WHITE)
	_time_label.text = "Time: 0:00"
	_time_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(_time_label)
	_items_label = Label.new()
	_items_label.name = "Items"
	_items_label.add_theme_font_size_override("font_size", 16)
	_items_label.add_theme_color_override("font_color", Color.LIGHT_GREEN)
	_items_label.text = "Packed: 0/0"
	_items_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(_items_label)
	_weight_label = Label.new()
	_weight_label.name = "Weight"
	_weight_label.add_theme_font_size_override("font_size", 16)
	_weight_label.add_theme_color_override("font_color", Color.LIGHT_BLUE)
	_weight_label.text = "Weight: 0/0"
	_weight_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(_weight_label)
	var bottom_bar = HBoxContainer.new()
	bottom_bar.name = "BottomBar"
	bottom_bar.anchors_preset = Control.PRESET_BOTTOM_WIDE
	bottom_bar.offset_top = -60
	bottom_bar.add_theme_constant_override("separation", 15)
	add_child(bottom_bar)
	var bottom_spacer = Control.new()
	bottom_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom_bar.add_child(bottom_spacer)
	_undo_button = Button.new()
	_undo_button.name = "UndoButton"
	_undo_button.text = "↩ Undo"
	_undo_button.add_theme_font_size_override("font_size", 16)
	_undo_button.custom_minimum_size = Vector2(100, 45)
	_undo_button.pressed.connect(func(): undo_pressed.emit())
	bottom_bar.add_child(_undo_button)
	_complete_button = Button.new()
	_complete_button.name = "CompleteButton"
	_complete_button.text = "✓ Complete"
	_complete_button.add_theme_font_size_override("font_size", 16)
	_complete_button.custom_minimum_size = Vector2(120, 45)
	_complete_button.pressed.connect(func(): complete_pressed.emit())
	bottom_bar.add_child(_complete_button)
	_pause_button = Button.new()
	_pause_button.name = "PauseButton"
	_pause_button.text = "⏸ Pause"
	_pause_button.add_theme_font_size_override("font_size", 16)
	_pause_button.custom_minimum_size = Vector2(100, 45)
	_pause_button.pressed.connect(func(): pause_pressed.emit())
	bottom_bar.add_child(_pause_button)
	_hint_label = Label.new()
	_hint_label.name = "InputHint"
	_hint_label.anchors_preset = Control.PRESET_BOTTOM_LEFT
	_hint_label.offset_top = -90
	_hint_label.offset_bottom = -70
	_hint_label.offset_left = 10
	_hint_label.add_theme_font_size_override("font_size", 13)
	_hint_label.add_theme_color_override("font_color", Color(Color.WHITE, 0.6))
	_hint_label.text = ""
	add_child(_hint_label)
	_fragile_warning = ColorRect.new()
	_fragile_warning.name = "FragileWarning"
	_fragile_warning.anchors_preset = Control.PRESET_FULL_RECT
	_fragile_warning.color = Color(1, 0, 0, 0)
	_fragile_warning.z_index = -1
	add_child(_fragile_warning)
	GameManager.score_changed.connect(_on_score_changed)
	GameManager.fragile_damaged.connect(_on_fragile_damaged)
	InputManager.input_method_changed.connect(_on_input_method_changed)

func update_hud(score: int, time: float, packed: int, total: int, weight: float, max_weight: float) -> void:
	_score_label.text = "Score: %d" % score
	var mins = int(time) / 60
	var secs = int(time) % 60
	_time_label.text = "Time: %d:%02d" % [mins, secs]
	_items_label.text = "Packed: %d/%d" % [packed, total]
	_weight_label.text = "Weight: %.1f/%.0f" % [weight, max_weight]
	var ratio = weight / max_weight
	if ratio > 0.8:
		_weight_label.add_theme_color_override("font_color", Color.RED)
	elif ratio > 0.5:
		_weight_label.add_theme_color_override("font_color", Color.YELLOW)
	else:
		_weight_label.add_theme_color_override("font_color", Color.LIGHT_BLUE)

func set_level_name(name: String) -> void:
	_level_name_label.text = name

func _on_score_changed(score: int) -> void:
	_score_label.text = "Score: %d" % score

func _on_fragile_damaged(_item: Node2D, _damage: float) -> void:
	var tw = create_tween()
	tw.tween_property(_fragile_warning, "color", Color(1, 0, 0, 0.15), 0.1)
	tw.tween_property(_fragile_warning, "color", Color(1, 0, 0, 0.0), 0.4)

func _on_input_method_changed(method: String) -> void:
	_update_hints(method)

func _update_hints(method: String) -> void:
	match method:
		"keyboard_mouse":
			_hint_label.text = "Drag items | R: Rotate | Ctrl+Z: Undo | Esc: Pause"
		"touch":
			_hint_label.text = "Drag items | Double-tap: Rotate | 2-finger: Undo | ⚙: Pause"
		"gamepad":
			_hint_label.text = "D-Pad: Move | B: Rotate | A: Place | Select: Undo | Start: Pause"
		_:
			_hint_label.text = ""

func show_pulsing_hint(text: String) -> void:
	_hint_label.text = text
	var tw = create_tween().set_loops(3)
	tw.tween_property(_hint_label, "modulate:a", 1.0, 0.3)
	tw.tween_property(_hint_label, "modulate:a", 0.3, 0.3)
	tw.tween_property(_hint_label, "modulate:a", 1.0, 0.3)

func set_undo_enabled(enabled: bool) -> void:
	_undo_button.disabled = not enabled
	_undo_button.modulate.a = 1.0 if enabled else 0.5
