extends Control

var _level_buttons: Array[Button] = []
var _chapter_containers: Dictionary = {}
var _back_button: Button
var _scroll_container: ScrollContainer
var _vbox: VBoxContainer
var _stars_label: Label
var _bg_rect: ColorRect

func _ready() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	_build_ui()

func _build_ui() -> void:
	_bg_rect = ColorRect.new()
	_bg_rect.anchors_preset = Control.PRESET_FULL_RECT
	_bg_rect.color = Color(0.08, 0.06, 0.12)
	add_child(_bg_rect)
	var top_bar = HBoxContainer.new()
	top_bar.anchors_preset = Control.PRESET_TOP_WIDE
	top_bar.offset_bottom = 50
	top_bar.add_theme_constant_override("separation", 15)
	add_child(top_bar)
	_back_button = Button.new()
	_back_button.text = "← Back"
	_back_button.add_theme_font_size_override("font_size", 18)
	_back_button.custom_minimum_size = Vector2(100, 40)
	_back_button.pressed.connect(_on_back)
	top_bar.add_child(_back_button)
	var title = Label.new()
	title.text = "Select Level"
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", Color.GOLD)
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(title)
	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(spacer)
	_stars_label = Label.new()
	_stars_label.text = "★ %d" % SaveManager.get_total_stars()
	_stars_label.add_theme_font_size_override("font_size", 20)
	_stars_label.add_theme_color_override("font_color", Color.GOLD)
	_stars_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(_stars_label)
	_scroll_container = ScrollContainer.new()
	_scroll_container.anchors_preset = Control.PRESET_BOTTOM_WIDE
	_scroll_container.offset_top = 55
	_scroll_container.offset_bottom = -10
	_scroll_container.offset_left = 20
	_scroll_container.offset_right = -20
	add_child(_scroll_container)
	_vbox = VBoxContainer.new()
	_vbox.add_theme_constant_override("separation", 10)
	_scroll_container.add_child(_vbox)
	_populate_levels()

func _populate_levels() -> void:
	var level_ids = LevelConfig.get_all_level_ids()
	var chapters: Dictionary = {}
	for lid in level_ids:
		var config = LevelConfig.load_level(lid)
		var chapter = config.get("chapter", "default")
		if not chapters.has(chapter):
			chapters[chapter] = {"name": config.get("chapter_name", chapter), "levels": []}
		chapters[chapter]["levels"].append(config)
	for chapter_key in chapters:
		var chapter_data = chapters[chapter_key]
		var chapter_label = Label.new()
		chapter_label.text = chapter_data["name"]
		chapter_label.add_theme_font_size_override("font_size", 20)
		chapter_label.add_theme_color_override("font_color", Color.LIGHT_CYAN)
		_vbox.add_child(chapter_label)
		var grid = GridContainer.new()
		grid.columns = 4
		grid.add_theme_constant_override("h_separation", 10)
		grid.add_theme_constant_override("v_separation", 10)
		_vbox.add_child(grid)
		for level_data in chapter_data["levels"]:
			var btn = Button.new()
			var lid = level_data.get("id", "")
			var result = SaveManager.get_level_result(lid)
			var stars = result.get("stars", 0)
			var star_text = ""
			for s in range(3):
				star_text += "★" if s < stars else "☆"
			btn.text = "%s\n%s" % [level_data.get("name", lid), star_text]
			btn.add_theme_font_size_override("font_size", 14)
			btn.custom_minimum_size = Vector2(140, 70)
			var style = StyleBoxFlat.new()
			if result.is_empty():
				style.bg_color = Color(0.2, 0.18, 0.25)
			elif stars >= 3:
				style.bg_color = Color(0.15, 0.25, 0.15)
			elif stars >= 2:
				style.bg_color = Color(0.25, 0.2, 0.1)
			else:
				style.bg_color = Color(0.2, 0.12, 0.12)
			style.set_border_width_all(2)
			style.border_color = Color(0.4, 0.35, 0.5)
			style.set_corner_radius_all(6)
			btn.add_theme_stylebox_override("normal", style)
			var hover_style = style.duplicate()
			hover_style.bg_color = Color(0.3, 0.28, 0.38)
			btn.add_theme_stylebox_override("hover", hover_style)
			btn.pressed.connect(_on_level_selected.bind(lid))
			grid.add_child(btn)
			_level_buttons.append(btn)

func _on_level_selected(level_id: String) -> void:
	AudioManager.play_sfx("button")
	GameManager.start_level(level_id)
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_back() -> void:
	AudioManager.play_sfx("button")
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _process(_delta: float) -> void:
	_stars_label.text = "★ %d" % SaveManager.get_total_stars()
