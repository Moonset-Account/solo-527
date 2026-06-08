extends Control
## Toast通知系统 - 全局顶部/中心消息提示
## 独立UI模块，通过EventBus订阅事件

const TOAST_TYPE_STYLES: Dictionary = {
	"info": {"bg": Color(0.2, 0.3, 0.5, 0.9), "text": Color.WHITE, "icon": "ℹ"},
	"success": {"bg": Color(0.2, 0.5, 0.3, 0.9), "text": Color.WHITE, "icon": "✓"},
	"error": {"bg": Color(0.6, 0.2, 0.2, 0.9), "text": Color.WHITE, "icon": "✗"},
	"warning": {"bg": Color(0.7, 0.5, 0.15, 0.9), "text": Color.WHITE, "icon": "⚠"},
	"buff": {"bg": Color(0.2, 0.5, 0.6, 0.9), "text": Color.WHITE, "icon": "↑"},
	"debuff": {"bg": Color(0.55, 0.25, 0.35, 0.9), "text": Color.WHITE, "icon": "↓"}
}

var _toast_queue: Array = []
var _is_playing: bool = false
var _toast_container: VBoxContainer = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	anchor_right = 1.0
	anchor_bottom = 1.0
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	z_index = 1000
	_create_container()
	_connect_events()

func _create_container() -> void:
	_toast_container = VBoxContainer.new()
	_toast_container.name = "ToastContainer"
	_toast_container.add_theme_constant_override("separation", 8)
	_toast_container.anchor_left = 0.5
	_toast_container.anchor_right = 0.5
	_toast_container.anchor_top = 0.0
	_toast_container.offset_top = 30
	_toast_container.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_toast_container.alignment = BoxContainer.ALIGNMENT_CENTER
	add_child(_toast_container)

func _connect_events() -> void:
	EventBus.ui_toast.connect(_on_toast_requested)

func show_toast(message: String, toast_type: String = "info", duration: float = 2.0) -> void:
	_toast_queue.append({
		"message": message,
		"type": toast_type,
		"duration": duration
	})
	_process_queue()

func _on_toast_requested(message: String, toast_type: String, duration: float) -> void:
	show_toast(message, toast_type, duration)

func _process_queue() -> void:
	if _is_playing:
		return
	if _toast_queue.size() == 0:
		return
	_is_playing = true
	var data: Dictionary = _toast_queue.pop_front()
	_play_toast(data)

func _play_toast(data: Dictionary) -> void:
	var style: Dictionary = TOAST_TYPE_STYLES.get(data.type, TOAST_TYPE_STYLES.info)
	
	var panel: PanelContainer = PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var panel_sb: StyleBoxFlat = StyleBoxFlat.new()
	panel_sb.bg_color = style.bg
	panel_sb.corner_radius_top_left = 10
	panel_sb.corner_radius_top_right = 10
	panel_sb.corner_radius_bottom_left = 10
	panel_sb.corner_radius_bottom_right = 10
	panel_sb.shadow_color = Color(0, 0, 0, 0.3)
	panel_sb.shadow_size = 6
	panel.add_theme_stylebox_override("panel", panel_sb)
	
	var hb: HBoxContainer = HBoxContainer.new()
	hb.add_theme_constant_override("separation", 10)
	var margin: MarginContainer = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_top", 10)
	margin.add_theme_constant_override("margin_bottom", 10)
	margin.add_child(hb)
	
	var icon_lbl: Label = Label.new()
	icon_lbl.text = style.icon
	icon_lbl.add_theme_font_size_override("font_size", 20)
	icon_lbl.add_theme_color_override("font_color", style.text)
	hb.add_child(icon_lbl)
	
	var msg_lbl: Label = Label.new()
	msg_lbl.text = data.message
	msg_lbl.add_theme_font_size_override("font_size", 16)
	msg_lbl.add_theme_color_override("font_color", style.text)
	msg_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	msg_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hb.add_child(msg_lbl)
	panel.add_child(margin)
	
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.8, 0.8)
	_toast_container.add_child(panel)
	
	var in_tween: Tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	in_tween.parallel().tween_property(panel, "modulate:a", 1.0, 0.3)
	in_tween.parallel().tween_property(panel, "scale", Vector2(1, 1), 0.3)
	in_tween.tween_callback(_on_toast_appeared.bind(panel, data.duration))

func _on_toast_appeared(panel: Control, duration: float) -> void:
	var hold_timer: Timer = Timer.new()
	hold_timer.wait_time = duration
	hold_timer.one_shot = true
	hold_timer.timeout.connect(_on_toast_timeout.bind(panel))
	add_child(hold_timer)
	hold_timer.start()

func _on_toast_timeout(panel: Control) -> void:
	var out_tween: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	out_tween.parallel().tween_property(panel, "modulate:a", 0.0, 0.35)
	out_tween.parallel().tween_property(panel, "position:y", -40.0, 0.35).as_relative()
	out_tween.tween_callback(func():
		if is_instance_valid(panel):
			panel.queue_free()
		_is_playing = false
		_process_queue()
	)
