extends Control

signal resumed()
signal retry_clicked()
signal back_to_title()
signal settings_clicked()

var overlay: ColorRect
var panel: PanelContainer

func _ready():
	_build_ui()
	AudioManager.play_sfx("dialog")

func _build_ui():
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.55)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	var fade_t: Tween = create_tween()
	overlay.modulate.a = 0
	fade_t.tween_property(overlay, "modulate:a", 1.0, 0.2)
	var center: CenterContainer = CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	panel = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.12, 0.15, 0.25)
	sb.corner_radius_top_left = 16
	sb.corner_radius_top_right = 16
	sb.corner_radius_bottom_left = 16
	sb.corner_radius_bottom_right = 16
	sb.content_margin_left = 40
	sb.content_margin_right = 40
	sb.content_margin_top = 28
	sb.content_margin_bottom = 28
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(0.3, 0.5, 0.85)
	panel.add_theme_stylebox_override("panel", sb)
	center.add_child(panel)
	panel.scale = Vector2(0.85, 0.85)
	var tw: Tween = create_tween()
	tw.tween_property(panel, "scale", Vector2.ONE, 0.25).set_ease(Tween.EASE_OUT)
	var v: VBoxContainer = VBoxContainer.new()
	v.add_theme_constant_override("separation", 18)
	v.custom_minimum_size = Vector2(420, 0)
	panel.add_child(v)
	var title: Label = Label.new()
	title.text = "⏸ 游戏暂停"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 36)
	title.modulate = Color(1, 0.9, 0.55)
	v.add_child(title)
	var info: Label = Label.new()
	info.text = "回合 %d/%d   满意度 %+g/%d\n任务 %d/%d" % [GameManager.turn, GameManager.max_turns, GameManager.satisfaction, GameManager.target_satisfaction, GameManager.completed_tasks, GameManager.required_tasks]
	info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	info.add_theme_font_size_override("font_size", 15)
	info.modulate = Color(0.8, 0.85, 1.0)
	v.add_child(info)
	var spacer: Control = Control.new()
	spacer.custom_minimum_size = Vector2(0, 12)
	v.add_child(spacer)
	var btns: Array = [
		["▶️ 继续游戏", Color(0.2, 0.55, 0.3), Color(0.35, 0.7, 0.45), "_on_resume"],
		["🔄 重试关卡", Color(0.6, 0.45, 0.15), Color(0.8, 0.6, 0.25), "_on_retry"],
		["⚙️ 设置", Color(0.35, 0.3, 0.65), Color(0.5, 0.45, 0.8), "_on_settings"],
		["🏠 返回主菜单", Color(0.55, 0.25, 0.25), Color(0.7, 0.4, 0.4), "_on_back"]
	]
	for b in btns:
		var btn: StyledButton = StyledButton.new(b[0], b[1], b[2])
		btn.custom_minimum_size = Vector2(380, 52)
		var fn: String = b[3]
		btn.pressed.connect(Callable(self, fn))
		v.add_child(btn)

func _on_resume():
	AudioManager.play_sfx("click")
	_close_animation(func (): emit_signal("resumed"))

func _on_retry():
	AudioManager.play_sfx("click")
	_close_animation(func (): emit_signal("retry_clicked"))

func _on_settings():
	AudioManager.play_sfx("click")
	emit_signal("settings_clicked")

func _on_back():
	AudioManager.play_sfx("click")
	_close_animation(func (): emit_signal("back_to_title"))

func _close_animation(cb: Callable):
	var tw: Tween = create_tween()
	tw.tween_property(panel, "scale", Vector2(0.9, 0.9), 0.15)
	tw.parallel().tween_property(overlay, "modulate:a", 0.0, 0.15)
	tw.tween_callback(cb)
	tw.tween_callback(queue_free)
