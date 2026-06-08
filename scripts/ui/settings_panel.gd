extends Control

signal closed
signal input_remapped(action: String, new_key: String)

var volume_slider: HSlider
var sfx_slider: HSlider
var fullscreen_toggle: CheckBox
var vsync_toggle: CheckBox
var fps_display_toggle: CheckBox
var input_list_container: VBoxContainer
var reset_inputs_button: Button
var close_button: Button
var fps_label: Label

var is_waiting_for_input: bool = false
var remapping_action: String = ""

func _ready() -> void:
	_build_ui()
	visible = false

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.anchors_preset = Control.PRESET_FULL_RECT
	bg.color = Color(0, 0, 0, 0.8)
	add_child(bg)

	var panel := PanelContainer.new()
	panel.anchors_preset = Control.PRESET_CENTER
	panel.offset_left = -300
	panel.offset_right = 300
	panel.offset_top = -300
	panel.offset_bottom = 300
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.17, 0.09, 0.06)
	style.set_corner_radius_all(8)
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "Settings"
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	vbox.add_child(title)

	var audio_label := Label.new()
	audio_label.text = "Audio"
	audio_label.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	vbox.add_child(audio_label)

	volume_slider = HSlider.new()
	volume_slider.min_value = -40.0
	volume_slider.max_value = 0.0
	volume_slider.value = AudioServer.get_bus_volume_db(AudioServer.get_bus_index("Master"))
	volume_slider.value_changed.connect(_on_volume_changed)
	vbox.add_child(volume_slider)

	var display_label := Label.new()
	display_label.text = "Display"
	display_label.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	vbox.add_child(display_label)

	fullscreen_toggle = CheckBox.new()
	fullscreen_toggle.text = "Fullscreen"
	fullscreen_toggle.button_pressed = DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN
	fullscreen_toggle.toggled.connect(func(_p: bool) -> void: _on_fullscreen_toggled())
	vbox.add_child(fullscreen_toggle)

	vsync_toggle = CheckBox.new()
	vsync_toggle.text = "VSync"
	vsync_toggle.button_pressed = DisplayServer.window_get_vsync_mode() != DisplayServer.VSYNC_DISABLED
	vsync_toggle.toggled.connect(func(_p: bool) -> void: _on_vsync_toggled())
	vbox.add_child(vsync_toggle)

	fps_display_toggle = CheckBox.new()
	fps_display_toggle.text = "Show FPS"
	fps_display_toggle.button_pressed = false
	fps_display_toggle.toggled.connect(func(_p: bool) -> void: _on_fps_toggled())
	vbox.add_child(fps_display_toggle)

	var input_label := Label.new()
	input_label.text = "Input Remapping"
	input_label.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	vbox.add_child(input_label)

	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(500, 150)
	vbox.add_child(scroll)

	input_list_container = VBoxContainer.new()
	scroll.add_child(input_list_container)

	reset_inputs_button = Button.new()
	reset_inputs_button.text = "Reset to Defaults"
	reset_inputs_button.pressed.connect(_on_reset_inputs)
	vbox.add_child(reset_inputs_button)

	close_button = Button.new()
	close_button.text = "Close"
	close_button.custom_minimum_size = Vector2(100, 35)
	close_button.pressed.connect(_on_close)
	vbox.add_child(close_button)

	fps_label = Label.new()
	fps_label.anchors_preset = Control.PRESET_TOP_RIGHT
	fps_label.offset_left = -100
	fps_label.add_theme_color_override("font_color", Color.GREEN)
	fps_label.visible = false
	add_child(fps_label)

	refresh_input_list()

func _input(event: InputEvent) -> void:
	if not is_waiting_for_input:
		return
	if event is InputEventKey and event.pressed:
		var key_text: String = OS.get_keycode_string(event.keycode)
		_on_remapped(remapping_action, key_text)
		is_waiting_for_input = false
		remapping_action = ""
		get_viewport().set_input_as_handled()

func _on_input_entry_clicked(action: String) -> void:
	is_waiting_for_input = true
	remapping_action = action
	for child in input_list_container.get_children():
		var action_label: Label = child.get_child(0) as Label
		if action_label and action_label.text == action:
			var key_label: Label = child.get_child(1) as Label
			if key_label:
				key_label.text = "..."

func _on_remapped(action: String, new_key: String) -> void:
	for old_event in InputMap.action_get_events(action):
		InputMap.action_erase_event(action, old_event)
	var new_event := InputEventKey.new()
	new_event.keycode = OS.find_keycode_from_string(new_key)
	InputMap.action_add_event(action, new_event)
	input_remapped.emit(action, new_key)
	refresh_input_list()

func _on_volume_changed(value: float) -> void:
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), value)

func _on_fullscreen_toggled() -> void:
	if fullscreen_toggle.button_pressed:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)

func _on_vsync_toggled() -> void:
	if vsync_toggle.button_pressed:
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED)
	else:
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)

func _on_fps_toggled() -> void:
	fps_label.visible = fps_display_toggle.button_pressed

func _on_reset_inputs() -> void:
	InputMap.load_from_project_settings()
	refresh_input_list()

func _on_close() -> void:
	visible = false
	closed.emit()

func update_fps(fps: float) -> void:
	if fps_label and fps_label.visible:
		fps_label.text = "FPS: %d" % int(fps)

func refresh_input_list() -> void:
	if input_list_container == null:
		return
	for child in input_list_container.get_children():
		child.queue_free()
	var actions: PackedStringArray = InputMap.get_actions()
	for action in actions:
		if action.begins_with("ui_"):
			continue
		var row := HBoxContainer.new()
		var action_label := Label.new()
		action_label.text = action
		action_label.custom_minimum_size.x = 120
		var key_label := Label.new()
		var events: Array[InputEvent] = InputMap.action_get_events(action)
		if events.size() > 0:
			var ev: InputEvent = events[0]
			if ev is InputEventKey:
				key_label.text = OS.get_keycode_string(ev.keycode)
			else:
				key_label.text = "..."
		else:
			key_label.text = "None"
		key_label.custom_minimum_size.x = 80
		var remap_button := Button.new()
		remap_button.text = "Remap"
		remap_button.custom_minimum_size = Vector2(60, 25)
		remap_button.pressed.connect(_on_input_entry_clicked.bind(action))
		row.add_child(action_label)
		row.add_child(key_label)
		row.add_child(remap_button)
		input_list_container.add_child(row)
