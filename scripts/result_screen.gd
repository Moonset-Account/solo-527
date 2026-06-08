extends Control

var _result_data: Dictionary = {}
var _title_label: Label
var _stars_container: HBoxContainer
var _score_label: Label
var _details_label: Label
var _retry_button: Button
var _next_button: Button
var _menu_button: Button
var _bg_rect: ColorRect
var _animation_time: float = 0.0
var _stars_shown: int = 0

func _ready() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	_result_data = _get_last_result()
	_build_ui()
	_animate_entrance()

func _get_last_result() -> Dictionary:
	if GameManager.current_level_id != "":
		return SaveManager.get_level_result(GameManager.current_level_id)
	return {}

func _build_ui() -> void:
	_bg_rect = ColorRect.new()
	_bg_rect.anchors_preset = Control.PRESET_FULL_RECT
	_bg_rect.color = Color(0.08, 0.06, 0.12)
	add_child(_bg_rect)
	var container = VBoxContainer.new()
	container.anchors_preset = Control.PRESET_CENTER
	container.offset_left = -180
	container.offset_top = -220
	container.offset_right = 180
	container.offset_bottom = 220
	container.add_theme_constant_override("separation", 12)
	add_child(container)
	_title_label = Label.new()
	_title_label.text = "Level Complete!"
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_label.add_theme_font_size_override("font_size", 32)
	_title_label.add_theme_color_override("font_color", Color.GOLD)
	_title_label.modulate.a = 0
	container.add_child(_title_label)
	_stars_container = HBoxContainer.new()
	_stars_container.alignment = BoxContainer.ALIGNMENT_CENTER
	_stars_container.add_theme_constant_override("separation", 10)
	container.add_child(_stars_container)
	_score_label = Label.new()
	_score_label.text = "Score: 0"
	_score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_score_label.add_theme_font_size_override("font_size", 26)
	_score_label.add_theme_color_override("font_color", Color.WHITE)
	_score_label.modulate.a = 0
	container.add_child(_score_label)
	_details_label = Label.new()
	_details_label.text = ""
	_details_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_details_label.add_theme_font_size_override("font_size", 15)
	_details_label.add_theme_color_override("font_color", Color(Color.WHITE, 0.7))
	_details_label.modulate.a = 0
	container.add_child(_details_label)
	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 15)
	container.add_child(spacer)
	_retry_button = Button.new()
	_retry_button.text = "🔄 Retry"
	_retry_button.add_theme_font_size_override("font_size", 20)
	_retry_button.custom_minimum_size = Vector2(260, 50)
	_retry_button.pressed.connect(_on_retry)
	_retry_button.modulate.a = 0
	container.add_child(_retry_button)
	_next_button = Button.new()
	_next_button.text = "▶ Next Level"
	_next_button.add_theme_font_size_override("font_size", 20)
	_next_button.custom_minimum_size = Vector2(260, 50)
	_next_button.pressed.connect(_on_next)
	_next_button.modulate.a = 0
	container.add_child(_next_button)
	_menu_button = Button.new()
	_menu_button.text = "🏠 Menu"
	_menu_button.add_theme_font_size_override("font_size", 20)
	_menu_button.custom_minimum_size = Vector2(260, 50)
	_menu_button.pressed.connect(_on_menu)
	_menu_button.modulate.a = 0
	container.add_child(_menu_button)
	_populate_result()

func _populate_result() -> void:
	if _result_data.is_empty():
		_title_label.text = "No Result"
		_score_label.text = "Score: 0"
		_next_button.visible = false
		return
	var stars = _result_data.get("stars", 0)
	_score_label.text = "Score: %d" % _result_data.get("total_score", 0)
	var details = "Items Packed: %d\nSpace Bonus: +%d\nTime Bonus: +%d\nFragile Broken: %d (%d penalty)\nTime: %.1fs" % [
		_result_data.get("items_packed", 0),
		_result_data.get("space_bonus", 0),
		_result_data.get("time_bonus", 0),
		_result_data.get("fragile_broken", 0),
		_result_data.get("fragile_penalty", 0),
		_result_data.get("time", 0.0)
	]
	_details_label.text = details
	for s in range(3):
		var star = Label.new()
		star.text = "★" if s < stars else "☆"
		star.add_theme_font_size_override("font_size", 40)
		star.add_theme_color_override("font_color", Color.GOLD if s < stars else Color(Color.WHITE, 0.3))
		star.modulate.a = 0
		_stars_container.add_child(star)
	if stars == 0:
		_title_label.text = "Level Failed!"
		_title_label.add_theme_color_override("font_color", Color.RED)
	var has_next = _has_next_level()
	_next_button.visible = has_next

func _has_next_level() -> bool:
	var ids = LevelConfig.get_all_level_ids()
	var idx = ids.find(GameManager.current_level_id)
	return idx >= 0 and idx < ids.size() - 1

func _animate_entrance() -> void:
	var tw = create_tween()
	tw.tween_property(_title_label, "modulate:a", 1.0, 0.5)
	for i in _stars_container.get_child_count():
		var star = _stars_container.get_child(i)
		tw.tween_callback(star.set_meta.bind("visible", true))
		tw.tween_property(star, "modulate:a", 1.0, 0.3)
		if i < _result_data.get("stars", 0):
			tw.tween_callback(AudioManager.play_sfx.bind("button"))
	tw.tween_property(_score_label, "modulate:a", 1.0, 0.3)
	tw.tween_property(_details_label, "modulate:a", 1.0, 0.3)
	tw.tween_property(_retry_button, "modulate:a", 1.0, 0.2)
	tw.tween_property(_next_button, "modulate:a", 1.0, 0.2)
	tw.tween_property(_menu_button, "modulate:a", 1.0, 0.2)

func _on_retry() -> void:
	AudioManager.play_sfx("button")
	GameManager.start_level(GameManager.current_level_id)
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_next() -> void:
	AudioManager.play_sfx("button")
	var ids = LevelConfig.get_all_level_ids()
	var idx = ids.find(GameManager.current_level_id)
	if idx >= 0 and idx < ids.size() - 1:
		GameManager.start_level(ids[idx + 1])
		get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_menu() -> void:
	AudioManager.play_sfx("button")
	GameManager.state = GameManager.GameState.MENU
	get_tree().change_scene_to_file("res://scenes/main.tscn")
