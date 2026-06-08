extends Control

var _title_label: Label
var _subtitle_label: Label
var _play_button: Button
var _continue_button: Button
var _settings_button: Button
var _stats_button: Button
var _quit_button: Button
var _input_hint: Label
var _version_label: Label
var _bg_rect: ColorRect
var _animation_time: float = 0.0

func _ready() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	_build_ui()
	AudioManager.play_music("menu")
	InputManager.input_method_changed.connect(_on_input_method_changed)

func _build_ui() -> void:
	_bg_rect = ColorRect.new()
	_bg_rect.anchors_preset = Control.PRESET_FULL_RECT
	_bg_rect.color = Color(0.1, 0.08, 0.15)
	add_child(_bg_rect)
	var container = VBoxContainer.new()
	container.anchors_preset = Control.PRESET_CENTER
	container.offset_left = -150
	container.offset_top = -200
	container.offset_right = 150
	container.offset_bottom = 200
	container.add_theme_constant_override("separation", 15)
	add_child(container)
	_title_label = Label.new()
	_title_label.text = "PACK MASTER"
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_label.add_theme_font_size_override("font_size", 42)
	_title_label.add_theme_color_override("font_color", Color.GOLD)
	container.add_child(_title_label)
	_subtitle_label = Label.new()
	_subtitle_label.text = "Moving Day Puzzle"
	_subtitle_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_subtitle_label.add_theme_font_size_override("font_size", 18)
	_subtitle_label.add_theme_color_override("font_color", Color(Color.WHITE, 0.7))
	container.add_child(_subtitle_label)
	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	container.add_child(spacer)
	_play_button = _create_button("▶ New Game", _on_play)
	container.add_child(_play_button)
	_continue_button = _create_button("📂 Continue", _on_continue)
	container.add_child(_continue_button)
	_settings_button = _create_button("⚙ Settings", _on_settings)
	container.add_child(_settings_button)
	_stats_button = _create_button("📊 Stats", _on_stats)
	container.add_child(_stats_button)
	_quit_button = _create_button("✕ Quit", _on_quit)
	container.add_child(_quit_button)
	_check_continue()
	_input_hint = Label.new()
	_input_hint.anchors_preset = Control.PRESET_BOTTOM_LEFT
	_input_hint.offset_left = 10
	_input_hint.offset_bottom = -10
	_input_hint.offset_top = -30
	_input_hint.add_theme_font_size_override("font_size", 12)
	_input_hint.add_theme_color_override("font_color", Color(Color.WHITE, 0.5))
	_input_hint.text = _get_input_hint()
	add_child(_input_hint)
	_version_label = Label.new()
	_version_label.anchors_preset = Control.PRESET_BOTTOM_RIGHT
	_version_label.offset_right = -10
	_version_label.offset_bottom = -10
	_version_label.offset_top = -30
	_version_label.add_theme_font_size_override("font_size", 12)
	_version_label.add_theme_color_override("font_color", Color(Color.WHITE, 0.3))
	_version_label.text = "v1.0.0"
	add_child(_version_label)

func _create_button(text: String, callback: Callable) -> Button:
	var btn = Button.new()
	btn.text = text
	btn.add_theme_font_size_override("font_size", 20)
	btn.custom_minimum_size = Vector2(280, 50)
	var style_normal = StyleBoxFlat.new()
	style_normal.bg_color = Color(0.2, 0.15, 0.25)
	style_normal.border_color = Color(0.4, 0.3, 0.5)
	style_normal.set_border_width_all(2)
	style_normal.set_corner_radius_all(8)
	btn.add_theme_stylebox_override("normal", style_normal)
	var style_hover = StyleBoxFlat.new()
	style_hover.bg_color = Color(0.3, 0.25, 0.4)
	style_hover.border_color = Color(0.6, 0.5, 0.7)
	style_hover.set_border_width_all(2)
	style_hover.set_corner_radius_all(8)
	btn.add_theme_stylebox_override("hover", style_hover)
	btn.pressed.connect(callback)
	return btn

func _check_continue() -> void:
	var has_save = false
	for slot in range(3):
		if SaveManager.has_save_slot(slot):
			has_save = true
			break
	_continue_button.visible = has_save
	_continue_button.disabled = not has_save

func _on_play() -> void:
	AudioManager.play_sfx("button")
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_continue() -> void:
	AudioManager.play_sfx("button")
	GameManager.set_meta("load_save_slot", 0)
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_settings() -> void:
	AudioManager.play_sfx("button")
	get_tree().change_scene_to_file("res://scenes/settings.tscn")

func _on_stats() -> void:
	AudioManager.play_sfx("button")
	var stats = SaveManager.get_stats()
	var text = "Total Stars: %d\nTotal Score: %d\nLevels Attempted: %d\nItems Broken: %d\nPlay Time: %.1f min" % [
		stats.total_stars, stats.total_score, stats.levels_attempted,
		stats.items_broken_total, stats.play_time / 60.0
	]
	_show_popup("Statistics", text)

func _on_quit() -> void:
	get_tree().quit()

func _show_popup(title: String, body: String) -> void:
	var popup = Panel.new()
	popup.anchors_preset = Control.PRESET_CENTER
	popup.offset_left = -160
	popup.offset_top = -120
	popup.offset_right = 160
	popup.offset_bottom = 120
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.12, 0.2)
	style.set_border_width_all(2)
	style.border_color = Color.GOLD
	style.set_corner_radius_all(10)
	popup.add_theme_stylebox_override("panel", style)
	add_child(popup)
	var title_l = Label.new()
	title_l.text = title
	title_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_l.add_theme_font_size_override("font_size", 22)
	title_l.add_theme_color_override("font_color", Color.GOLD)
	title_l.anchors_preset = Control.PRESET_CENTER
	title_l.offset_top = -100
	title_l.offset_bottom = -70
	popup.add_child(title_l)
	var body_l = Label.new()
	body_l.text = body
	body_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body_l.add_theme_font_size_override("font_size", 16)
	body_l.anchors_preset = Control.PRESET_CENTER
	body_l.offset_top = -50
	body_l.offset_bottom = 50
	popup.add_child(body_l)
	var close_btn = Button.new()
	close_btn.text = "Close"
	close_btn.anchors_preset = Control.PRESET_CENTER
	close_btn.offset_top = 70
	close_btn.offset_bottom = 100
	close_btn.pressed.connect(popup.queue_free)
	popup.add_child(close_btn)

func _on_input_method_changed(method: String) -> void:
	_input_hint.text = _get_input_hint()

func _get_input_hint() -> String:
	var method = InputManager.get_effective_input_method()
	match method:
		"keyboard_mouse":
			return "Click to select | Keyboard navigation"
		"touch":
			return "Tap to select | Swipe to navigate"
		"gamepad":
			return "D-Pad to navigate | A to select"
		_:
			return ""

func _process(delta: float) -> void:
	_animation_time += delta
	_title_label.modulate.a = 0.8 + 0.2 * sin(_animation_time * 2.0)
