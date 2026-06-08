extends Control

signal closed

var _volume_slider: HSlider
var _fullscreen_check: CheckBox
var _vsync_check: CheckBox
var _fps_check: CheckBox
var _input_list: VBoxContainer
var _remapping_action: String = ""
var _perf_label: Label

func _ready() -> void:
	_build_ui()
	visible = false

func _build_ui() -> void:
	var panel := Panel.new()
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	panel.size = get_viewport_rect().size
	add_child(panel)
	var container := VBoxContainer.new()
	container.position = Vector2(40, 30)
	container.custom_minimum_size = Vector2(400, 500)
	var title := Label.new()
	title.text = "Settings"
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color.GOLD)
	container.add_child(title)
	container.add_child(_make_separator())
	_volume_slider = HSlider.new()
	_volume_slider.min_value = 0.0
	_volume_slider.max_value = 100.0
	_volume_slider.value = 80.0
	_volume_slider.custom_minimum_size.x = 200
	var vol_label := Label.new()
	vol_label.text = "Volume:"
	container.add_child(vol_label)
	container.add_child(_volume_slider)
	_fullscreen_check = CheckBox.new()
	_fullscreen_check.text = "Fullscreen"
	container.add_child(_fullscreen_check)
	_vsync_check = CheckBox.new()
	_vsync_check.text = "VSync"
	_vsync_check.pressed.connect(_on_vsync_toggled)
	container.add_child(_vsync_check)
	_fps_check = CheckBox.new()
	_fps_check.text = "Show FPS Counter"
	_fps_check.button_pressed = true
	container.add_child(_fps_check)
	container.add_child(_make_separator())
	var input_title := Label.new()
	input_title.text = "Input Remapping (click to change):"
	input_title.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	container.add_child(input_title)
	_input_list = VBoxContainer.new()
	_input_list.custom_minimum_size.y = 200
	container.add_child(_input_list)
	refresh_input_list()
	container.add_child(_make_separator())
	_perf_label = Label.new()
	_perf_label.text = "Performance: N/A"
	_perf_label.add_theme_font_size_override("font_size", 11)
	_perf_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	container.add_child(_perf_label)
	container.add_child(_make_separator())
	var btn_row := HBoxContainer.new()
	var reset_btn := Button.new()
	reset_btn.text = "Reset Defaults"
	reset_btn.pressed.connect(_on_reset_defaults)
	var close_btn := Button.new()
	close_btn.text = "Close"
	close_btn.pressed.connect(_on_close)
	btn_row.add_child(reset_btn)
	btn_row.add_child(close_btn)
	container.add_child(btn_row)
	add_child(container)

func _process(_delta: float) -> void:
	if _perf_label and PerformanceMonitor:
		var fps := PerformanceMonitor.get_average_fps()
		var frame_time := PerformanceMonitor.get_average_frame_time()
		var mem := PerformanceMonitor.get_memory_usage()
		_perf_label.text = "FPS: %d | Frame: %.1fms | Mem: %.1fMB" % [int(fps), frame_time * 1000.0, mem]

func _make_separator() -> HSeparator:
	var sep := HSeparator.new()
	sep.custom_minimum_size.y = 10
	return sep

func refresh_input_list() -> void:
	if _input_list == null:
		return
	for child in _input_list.get_children():
		child.queue_free()
	if InputManager == null:
		return
	var actions := InputManager.get_all_actions()
	for action in actions:
		if str(action).begins_with("ui_"):
			continue
		var row := HBoxContainer.new()
		var label := Label.new()
		label.text = str(action)
		label.custom_minimum_size.x = 120
		label.add_theme_font_size_override("font_size", 12)
		var key_label := Label.new()
		var events := InputMap.action_get_events(str(action))
		if events.size() > 0:
			key_label.text = events[0].as_text()
		else:
			key_label.text = "None"
		key_label.custom_minimum_size.x = 100
		key_label.add_theme_font_size_override("font_size", 12)
		var remap_btn := Button.new()
		remap_btn.text = "Change"
		remap_btn.pressed.connect(_start_remap.bind(str(action), key_label))
		row.add_child(label)
		row.add_child(key_label)
		row.add_child(remap_btn)
		_input_list.add_child(row)

func _start_remap(action: String, key_label: Label) -> void:
	_remapping_action = action
	key_label.text = "Press key..."

func _input(event: InputEvent) -> void:
	if _remapping_action != "" and event is InputEventKey and event.pressed:
		if InputManager:
			InputManager.remap_action(_remapping_action, event.keycode)
		_remapping_action = ""
		refresh_input_list()

func _on_vsync_toggled() -> void:
	if _vsync_check.button_pressed:
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED)
	else:
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)

func _on_reset_defaults() -> void:
	if InputManager:
		InputManager.reset_to_defaults()
	refresh_input_list()

func _on_close() -> void:
	visible = false
	closed.emit()
