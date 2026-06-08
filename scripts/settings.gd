extends Control

var _remapping_action: String = ""

@onready var _back_button: Button = $VBoxContainer/BackButton
@onready var _vsync_check: CheckBox = $VBoxContainer/SettingsPanel/ScrollContainer/VBox/VSyncCheck
@onready var _fps_option: OptionButton = $VBoxContainer/SettingsPanel/ScrollContainer/VBox/FpsOption
@onready var _tips_check: CheckBox = $VBoxContainer/SettingsPanel/ScrollContainer/VBox/TipsCheck
@onready var _input_container: VBoxContainer = $VBoxContainer/SettingsPanel/ScrollContainer/VBox/InputContainer
@onready var _reset_input_button: Button = $VBoxContainer/SettingsPanel/ScrollContainer/VBox/ResetInputButton
@onready var _stats_container: VBoxContainer = $VBoxContainer/StatsPanel/VBox
@onready var _fps_label: Label = $VBoxContainer/StatsPanel/VBox/FpsLabel
@onready var _ft_label: Label = $VBoxContainer/StatsPanel/VBox/FrameTimeLabel
@onready var _mem_label: Label = $VBoxContainer/StatsPanel/VBox/MemLabel
@onready var _node_label: Label = $VBoxContainer/StatsPanel/VBox/NodeLabel

func _ready() -> void:
	_back_button.pressed.connect(_on_back)
	_vsync_check.toggled.connect(_on_vsync_toggled)
	_tips_check.toggled.connect(_on_tips_toggled)
	_reset_input_button.pressed.connect(_on_reset_inputs)
	_fps_option.item_selected.connect(_on_fps_selected)
	_fps_option.add_item("30 FPS", 0)
	_fps_option.add_item("60 FPS", 1)
	_fps_option.add_item("120 FPS", 2)
	_fps_option.add_item("无限制", 3)
	_fps_option.select(1)
	_load_current_settings()
	_build_input_mappings()
	PerformanceStats.stats_updated.connect(_on_stats_updated)

func _load_current_settings() -> void:
	var settings := SaveSystem.load_settings()
	_vsync_check.button_pressed = settings.get("vsync", true)
	_tips_check.button_pressed = settings.get("tips_enabled", true)
	var target_fps: int = settings.get("target_fps", 60)
	match target_fps:
		30:
			_fps_option.select(0)
		60:
			_fps_option.select(1)
		120:
			_fps_option.select(2)
		0:
			_fps_option.select(3)

func _build_input_mappings() -> void:
	for child in _input_container.get_children():
		child.queue_free()
	var header := Label.new()
	header.text = "按键映射 (点击按钮后按新键重映射):"
	header.add_theme_font_size_override("font_size", 16)
	header.add_theme_color_override("font_color", Color(1, 0.85, 0.3, 1))
	_input_container.add_child(header)
	var actions := InputManager.get_remappable_actions()
	for action in actions:
		var hbox := HBoxContainer.new()
		var action_label := Label.new()
		action_label.text = InputManager.get_action_label(action)
		action_label.custom_minimum_size = Vector2(100, 30)
		action_label.add_theme_font_size_override("font_size", 15)
		var key_button := Button.new()
		key_button.text = InputManager.get_current_key_name(action)
		key_button.custom_minimum_size = Vector2(120, 35)
		key_button.pressed.connect(_on_remap_key.bind(action, key_button))
		hbox.add_child(action_label)
		hbox.add_child(key_button)
		_input_container.add_child(hbox)

func _on_remap_key(action: String, button: Button) -> void:
	_remapping_action = action
	button.text = "...按任意键..."
	InputManager.start_remap(action)

func _input(event: InputEvent) -> void:
	if _remapping_action != "" and event is InputEventKey and event.pressed:
		_remapping_action = ""
		_build_input_mappings()

func _on_vsync_toggled(enabled: bool) -> void:
	PerformanceStats.set_vsync(enabled)
	var settings := SaveSystem.load_settings()
	settings["vsync"] = enabled
	SaveSystem.save_settings(settings)

func _on_fps_selected(index: int) -> void:
	var fps_map := {0: 30, 1: 60, 2: 120, 3: 0}
	var fps: int = fps_map.get(index, 60)
	PerformanceStats.set_target_fps(fps)

func _on_tips_toggled(enabled: bool) -> void:
	GameManager.set_tips_enabled(enabled)

func _on_reset_inputs() -> void:
	InputManager.reset_to_defaults()
	_build_input_mappings()

func _on_stats_updated(stats: Dictionary) -> void:
	_fps_label.text = "FPS: %.0f (平均: %.0f, 最低: %.0f)" % [stats.current_fps, stats.avg_fps, stats.min_fps]
	_ft_label.text = "帧时间: %.2f ms" % stats.frame_time_ms
	_mem_label.text = "内存: %.1f MB" % stats.memory_mb
	_node_label.text = "节点数: %d" % stats.node_count

func _on_back() -> void:
	if GameManager.is_paused:
		get_tree().change_scene_to_file("res://scenes/pause_menu.tscn")
	else:
		get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
