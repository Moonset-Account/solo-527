extends Control

const MAX_ENTRIES := 200
const ENTRY_COLORS := {
	"info": Color(0.8, 0.8, 0.8),
	"warn": Color(1.0, 0.85, 0.3),
	"error": Color(1.0, 0.4, 0.4),
	"success": Color(0.4, 1.0, 0.6),
	"event": Color(0.5, 0.8, 1.0),
}

var _entries: Array = []
var _panel: PanelContainer
var _vbox: VBoxContainer
var _label: RichTextLabel
var _is_visible: bool = false
var _toggle_key_listener: bool = true

func _ready() -> void:
	z_index = 999
	anchor_right = 1.0
	anchor_bottom = 1.0
	size_flags_horizontal = 3
	size_flags_vertical = 3
	mouse_filter = 0
	_build_ui()
	add_entry("调试日志系统已启动", "info")
	add_entry("快捷键: Alt+F3 显示/隐藏调试日志", "info")

func _build_ui() -> void:
	_panel = PanelContainer.new()
	_panel.size_flags_horizontal = 3
	_panel.size_flags_vertical = 3
	_panel.custom_minimum_size = Vector2(0, 180)
	_panel.anchor_left = 0.0
	_panel.anchor_top = 1.0
	_panel.anchor_right = 1.0
	_panel.anchor_bottom = 1.0
	_panel.offset_top = -180
	_panel.mouse_filter = 1
	_panel.visible = _is_visible
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.08, 0.12, 0.92)
	style.border_color = Color(0.3, 0.5, 0.8, 0.8)
	style.border_width_left = 2
	style.border_width_top = 2
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	_panel.add_theme_stylebox_override("panel", style)
	add_child(_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 12)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_top", 8)
	margin.add_theme_constant_override("margin_bottom", 8)
	_panel.add_child(margin)

	_vbox = VBoxContainer.new()
	_vbox.size_flags_vertical = 3
	margin.add_child(_vbox)

	var header := HBoxContainer.new()
	_vbox.add_child(header)

	var title := Label.new()
	title.text = "🔧 调试日志 (Alt+F3)"
	title.add_theme_color_override("font_color", Color(0.6, 0.8, 1.0))
	title.add_theme_font_size_override("font_size", 14)
	title.size_flags_horizontal = 3
	header.add_child(title)

	var clear_btn := Button.new()
	clear_btn.text = "清空"
	clear_btn.pressed.connect(func():
		_entries.clear()
		_refresh_label()
	)
	header.add_child(clear_btn)

	_label = RichTextLabel.new()
	_label.size_flags_vertical = 3
	_label.scroll_following = true
	_label.bbcode_enabled = true
	_label.custom_minimum_size = Vector2(0, 140)
	_vbox.add_child(_label)

func _input(event: InputEvent) -> void:
	if not _toggle_key_listener:
		return
	if event.is_action_pressed("toggle_debug"):
		toggle_visible()
		get_viewport().set_input_as_handled()

func toggle_visible() -> void:
	_is_visible = not _is_visible
	_panel.visible = _is_visible
	if _is_visible:
		add_entry("调试面板已显示", "info")

func add_entry(message: String, level: String = "info") -> void:
	var timestamp := Time.get_time_string_from_system()
	var color: Color = ENTRY_COLORS.get(level, ENTRY_COLORS["info"])
	_entries.append({
		"time": timestamp,
		"msg": message,
		"level": level,
		"color": color,
	})
	if _entries.size() > MAX_ENTRIES:
		_entries.remove_at(0)
	_refresh_label()

func _refresh_label() -> void:
	if _label == null:
		return
	var text := ""
	for entry in _entries:
		var c: Color = entry.color
		text += "[color=#%s][%s] %s[/color]\n" % [c.to_html(), entry.time, entry.msg]
	_label.bbcode_text = text
	call_deferred("_scroll_to_bottom")

func _scroll_to_bottom() -> void:
	if _label and is_instance_valid(_label):
		var vsb: VScrollBar = _label.get_v_scroll_bar()
		if vsb:
			vsb.value = vsb.max_value

func log_info(msg: String) -> void: add_entry(msg, "info")
func log_warn(msg: String) -> void: add_entry(msg, "warn")
func log_error(msg: String) -> void: add_entry(msg, "error")
func log_success(msg: String) -> void: add_entry(msg, "success")
func log_event(msg: String) -> void: add_entry(msg, "event")
