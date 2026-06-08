extends Control

var _back_button: Button
var _bg_rect: ColorRect
var _scroll: ScrollContainer
var _content: VBoxContainer
var _remapping_action: String = ""
var _remap_button: Button = null

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
	title.text = "Settings"
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", Color.GOLD)
	top_bar.add_child(title)
	_scroll = ScrollContainer.new()
	_scroll.anchors_preset = Control.PRESET_BOTTOM_WIDE
	_scroll.offset_top = 55
	_scroll.offset_bottom = -10
	_scroll.offset_left = 20
	_scroll.offset_right = -20
	add_child(_scroll)
	_content = VBoxContainer.new()
	_content.add_theme_constant_override("separation", 8)
	_scroll.add_child(_content)
	_add_section("Audio")
	_add_slider("Master Volume", "master_volume", 0, 1.0, 0.05)
	_add_slider("SFX Volume", "sfx_volume", 0, 1.0, 0.05)
	_add_slider("Music Volume", "music_volume", 0, 1.0, 0.05)
	_add_section("Display")
	_add_check("Fullscreen", "fullscreen")
	_add_check("VSync", "vsync")
	_add_option("Target FPS", "target_fps", [30, 60, 120, 144, 0], ["30", "60", "120", "144", "Unlimited"])
	_add_check("Show FPS", "show_fps")
	_add_check("Show Performance Stats", "show_performance")
	_add_section("Input")
	_add_option("Input Method", "input_method", ["auto", "keyboard_mouse", "touch", "gamepad"], ["Auto", "Keyboard/Mouse", "Touch", "Gamepad"])
	_add_check("Haptic Feedback", "haptic_enabled")
	_add_key_binding_section()
	_add_section("Saves")
	_add_save_slot(0)
	_add_save_slot(1)
	_add_save_slot(2)
	_add_reset_button()

func _add_section(title: String) -> void:
	var label = Label.new()
	label.text = "── " + title + " ──"
	label.add_theme_font_size_override("font_size", 18)
	label.add_theme_color_override("font_color", Color.LIGHT_CYAN)
	_content.add_child(label)

func _add_slider(label_text: String, key: String, min_val: float, max_val: float, step: float) -> void:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var lbl = Label.new()
	lbl.text = label_text
	lbl.custom_minimum_size = Vector2(180, 30)
	lbl.add_theme_font_size_override("font_size", 15)
	row.add_child(lbl)
	var slider = HSlider.new()
	slider.min_value = min_val
	slider.max_value = max_val
	slider.step = step
	slider.value = SaveManager.get_setting(key, 0.8)
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.custom_minimum_size = Vector2(200, 30)
	row.add_child(slider)
	var val_label = Label.new()
	val_label.text = "%.0f%%" % (slider.value * 100)
	val_label.custom_minimum_size = Vector2(50, 30)
	val_label.add_theme_font_size_override("font_size", 14)
	row.add_child(val_label)
	slider.value_changed.connect(func(v):
		val_label.text = "%.0f%%" % (v * 100)
		SaveManager.set_setting(key, v)
		match key:
			"master_volume":
				AudioServer.set_bus_volume_db(0, linear_to_db(v))
			"sfx_volume":
				AudioManager.set_sfx_volume(v)
			"music_volume":
				AudioManager.set_music_volume(v)
	)
	_content.add_child(row)

func _add_check(label_text: String, key: String) -> void:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var lbl = Label.new()
	lbl.text = label_text
	lbl.custom_minimum_size = Vector2(180, 30)
	lbl.add_theme_font_size_override("font_size", 15)
	row.add_child(lbl)
	var chk = CheckBox.new()
	chk.button_pressed = SaveManager.get_setting(key, false)
	chk.pressed.connect(func():
		SaveManager.set_setting(key, chk.button_pressed)
	)
	row.add_child(chk)
	_content.add_child(row)

func _add_option(label_text: String, key: String, values: Array, labels: Array) -> void:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var lbl = Label.new()
	lbl.text = label_text
	lbl.custom_minimum_size = Vector2(180, 30)
	lbl.add_theme_font_size_override("font_size", 15)
	row.add_child(lbl)
	var opt = OptionButton.new()
	for i in values.size():
		opt.add_item(labels[i] if i < labels.size() else str(values[i]), i)
	var current = SaveManager.get_setting(key, values[0])
	var idx = values.find(current)
	if idx >= 0:
		opt.selected = idx
	opt.item_selected.connect(func(i):
		SaveManager.set_setting(key, values[i])
	)
	row.add_child(opt)
	_content.add_child(row)

func _add_key_binding_section() -> void:
	var actions = ["move_left", "move_right", "move_up", "move_down", "rotate_cw", "rotate_ccw", "confirm", "undo", "pause"]
	var display_names = ["Move Left", "Move Right", "Move Up", "Move Down", "Rotate CW", "Rotate CCW", "Confirm", "Undo", "Pause"]
	for i in actions.size():
		var row = HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		var lbl = Label.new()
		lbl.text = display_names[i]
		lbl.custom_minimum_size = Vector2(180, 30)
		lbl.add_theme_font_size_override("font_size", 15)
		row.add_child(lbl)
		var btn = Button.new()
		var current_key = SaveManager.get_key_binding(actions[i])
		btn.text = _keycode_to_name(current_key) if current_key != "" else InputManager.get_action_hint(actions[i])
		btn.custom_minimum_size = Vector2(150, 35)
		btn.add_theme_font_size_override("font_size", 14)
		btn.pressed.connect(_start_remap.bind(actions[i], btn))
		row.add_child(btn)
		_content.add_child(row)

func _start_remap(action: String, btn: Button) -> void:
	_remapping_action = action
	_remap_button = btn
	btn.text = "Press a key..."

func _input(event: InputEvent) -> void:
	if _remapping_action != "" and event is InputEventKey and event.pressed:
		var keycode = str(event.keycode)
		SaveManager.set_key_binding(_remapping_action, keycode)
		_remap_button.text = _keycode_to_name(keycode)
		_remap_button = null
		_remapping_action = ""
		get_viewport().set_input_as_handled()

func _keycode_to_name(keycode_str: String) -> String:
	var code = int(keycode_str)
	match code:
		4194319: return "←"
		4194321: return "→"
		4194320: return "↑"
		4194322: return "↓"
		4194309: return "Enter"
		4194305: return "Esc"
		82: return "R"
		69: return "E"
		90: return "Z"
		_: return keycode_str

func _add_save_slot(slot: int) -> void:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var lbl = Label.new()
	lbl.text = "Save Slot %d" % (slot + 1)
	lbl.custom_minimum_size = Vector2(180, 30)
	lbl.add_theme_font_size_override("font_size", 15)
	row.add_child(lbl)
	var save_btn = Button.new()
	save_btn.text = "Save"
	save_btn.add_theme_font_size_override("font_size", 14)
	save_btn.custom_minimum_size = Vector2(80, 30)
	save_btn.pressed.connect(func():
		SaveManager.save_game_slot(slot)
		AudioManager.play_sfx("button")
	)
	row.add_child(save_btn)
	var load_btn = Button.new()
	load_btn.text = "Load"
	load_btn.add_theme_font_size_override("font_size", 14)
	load_btn.custom_minimum_size = Vector2(80, 30)
	load_btn.disabled = not SaveManager.has_save_slot(slot)
	load_btn.pressed.connect(func():
		var data = SaveManager.load_game_slot(slot)
		if not data.is_empty():
			GameManager.current_level_id = data.get("level_id", "level_01")
			GameManager.current_score = data.get("score", 0)
			GameManager.level_time = data.get("time", 0.0)
			get_tree().change_scene_to_file("res://scenes/game.tscn")
	)
	row.add_child(load_btn)
	var del_btn = Button.new()
	del_btn.text = "Delete"
	del_btn.add_theme_font_size_override("font_size", 14)
	del_btn.custom_minimum_size = Vector2(80, 30)
	del_btn.disabled = not SaveManager.has_save_slot(slot)
	del_btn.pressed.connect(func():
		SaveManager.delete_save_slot(slot)
		load_btn.disabled = true
		del_btn.disabled = true
	)
	row.add_child(del_btn)
	_content.add_child(row)

func _add_reset_button() -> void:
	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	_content.add_child(spacer)
	var btn = Button.new()
	btn.text = "Reset All Settings"
	btn.add_theme_font_size_override("font_size", 16)
	btn.custom_minimum_size = Vector2(200, 40)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.4, 0.1, 0.1)
	style.set_border_width_all(2)
	style.border_color = Color(0.8, 0.2, 0.2)
	style.set_corner_radius_all(6)
	btn.add_theme_stylebox_override("normal", style)
	btn.pressed.connect(_on_reset)
	_content.add_child(btn)

func _on_reset() -> void:
	var settings = SaveManager._default_settings()
	for key in settings:
		SaveManager.set_setting(key, settings[key])
	get_tree().reload_current_scene()

func _on_back() -> void:
	AudioManager.play_sfx("button")
	if GameManager.state == GameManager.GameState.PAUSED:
		GameManager.resume_game()
		get_tree().change_scene_to_file("res://scenes/game.tscn")
	else:
		get_tree().change_scene_to_file("res://scenes/main.tscn")
