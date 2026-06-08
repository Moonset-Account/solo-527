extends CanvasLayer

signal resume_pressed
signal settings_pressed
signal quit_pressed

var _overlay: ColorRect
var _container: VBoxContainer
var _resume_btn: Button
var _settings_btn: Button
var _save_btn: Button
var _quit_btn: Button

func _ready() -> void:
	layer = 30
	visible = false
	_build_ui()
	GameManager.game_paused.connect(_on_paused)
	GameManager.game_resumed.connect(_on_resumed)

func _build_ui() -> void:
	_overlay = ColorRect.new()
	_overlay.anchors_preset = Control.PRESET_FULL_RECT
	_overlay.color = Color(0, 0, 0, 0.6)
	add_child(_overlay)
	_container = VBoxContainer.new()
	_container.anchors_preset = Control.PRESET_CENTER
	_container.offset_left = -120
	_container.offset_top = -150
	_container.offset_right = 120
	_container.offset_bottom = 150
	_container.add_theme_constant_override("separation", 15)
	add_child(_container)
	var title = Label.new()
	title.text = "PAUSED"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 36)
	title.add_theme_color_override("font_color", Color.WHITE)
	_container.add_child(title)
	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 15)
	_container.add_child(spacer)
	_resume_btn = _create_pause_button("▶ Resume", _on_resume)
	_container.add_child(_resume_btn)
	_settings_btn = _create_pause_button("⚙ Settings", _on_settings)
	_container.add_child(_settings_btn)
	_save_btn = _create_pause_button("💾 Save & Quit", _on_save_quit)
	_container.add_child(_save_btn)
	_quit_btn = _create_pause_button("🏠 Quit to Menu", _on_quit)
	_container.add_child(_quit_btn)

func _create_pause_button(text: String, callback: Callable) -> Button:
	var btn = Button.new()
	btn.text = text
	btn.add_theme_font_size_override("font_size", 20)
	btn.custom_minimum_size = Vector2(240, 50)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.2, 0.15, 0.3)
	style.set_border_width_all(2)
	style.border_color = Color(0.5, 0.4, 0.7)
	style.set_corner_radius_all(8)
	btn.add_theme_stylebox_override("normal", style)
	var hover = StyleBoxFlat.new()
	hover.bg_color = Color(0.3, 0.25, 0.4)
	hover.set_border_width_all(2)
	hover.border_color = Color(0.7, 0.6, 0.9)
	hover.set_corner_radius_all(8)
	btn.add_theme_stylebox_override("hover", hover)
	btn.pressed.connect(callback)
	return btn

func _on_paused() -> void:
	visible = true

func _on_resumed() -> void:
	visible = false

func _on_resume() -> void:
	AudioManager.play_sfx("button")
	GameManager.resume_game()

func _on_settings() -> void:
	AudioManager.play_sfx("button")
	get_tree().change_scene_to_file("res://scenes/settings.tscn")

func _on_save_quit() -> void:
	AudioManager.play_sfx("button")
	SaveManager.save_game_slot(0)
	GameManager.is_level_active = false
	GameManager.is_paused = false
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_quit() -> void:
	AudioManager.play_sfx("button")
	GameManager.is_level_active = false
	GameManager.is_paused = false
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("pause"):
		_on_resume()
		get_viewport().set_input_as_handled()
