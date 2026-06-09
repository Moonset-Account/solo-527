extends Control

signal hint_requested_again()
signal panel_closed()

@export var max_hints: int = 3

var bg_panel: Panel
var title_label: Label
var close_btn: Button
var hint_level_indicator: HBoxContainer
var hint_text_label: RichTextLabel
var request_hint_btn: Button
var hints_revealed: int = 0
var config_hints: Array = []
var anim_tween: Tween

func _ready() -> void:
	_setup_panel()
	hide()

func _setup_panel() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	custom_minimum_size = Vector2(500, 280)
	size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mouse_filter = Control.MOUSE_FILTER_STOP
	bg_panel = Panel.new()
	bg_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bg_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var bg_sb = StyleBoxFlat.new()
	bg_sb.bg_color = Color(0.1, 0.12, 0.16, 0.98)
	bg_sb.border_color = Color(1.0, 0.8, 0.3, 0.5)
	bg_sb.border_width_left = 2
	bg_sb.border_width_right = 2
	bg_sb.border_width_top = 2
	bg_sb.border_width_bottom = 2
	bg_sb.corner_radius_top_left = 12
	bg_sb.corner_radius_top_right = 12
	bg_sb.corner_radius_bottom_left = 12
	bg_sb.corner_radius_bottom_right = 12
	bg_sb.shadow_color = Color(0, 0, 0, 0.5)
	bg_sb.shadow_size = 10
	bg_sb.content_margin_left = 20
	bg_sb.content_margin_right = 20
	bg_sb.content_margin_top = 16
	bg_sb.content_margin_bottom = 16
	bg_panel.add_theme_stylebox_override("panel", bg_sb)
	add_child(bg_panel)
	var top_bar = HBoxContainer.new()
	top_bar.custom_minimum_size.y = 40
	bg_panel.add_child(top_bar)
	title_label = Label.new()
	title_label.text = "💡 推理提示"
	title_label.add_theme_font_size_override("font_size", 18)
	title_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3, 1))
	title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(title_label)
	close_btn = Button.new()
	close_btn.text = "✕"
	close_btn.custom_minimum_size = Vector2(36, 30)
	close_btn.add_theme_font_size_override("font_size", 14)
	close_btn.pressed.connect(_on_close_pressed)
	top_bar.add_child(close_btn)
	hint_level_indicator = HBoxContainer.new()
	hint_level_indicator.custom_minimum_size.y = 28
	hint_level_indicator.add_theme_constant_override("separation", 6)
	for i in range(max_hints):
		var dot = ColorRect.new()
		dot.custom_minimum_size = Vector2(24, 8)
		dot.color = Color(0.3, 0.3, 0.4, 1)
		dot.name = "dot_%d" % i
		hint_level_indicator.add_child(dot)
	bg_panel.add_child(hint_level_indicator)
	var sep = HSeparator.new()
	sep.custom_minimum_size.y = 8
	bg_panel.add_child(sep)
	hint_text_label = RichTextLabel.new()
	hint_text_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hint_text_label.bbcode_enabled = true
	hint_text_label.scroll_active = true
	hint_text_label.fit_content = false
	hint_text_label.add_theme_font_size_override("normal_font_size", 14)
	hint_text_label.add_theme_color_override("default_color", Color(0.9, 0.9, 0.95, 1))
	hint_text_label.text = "点击下方按钮请求提示。\n\n每次使用提示都会降低最终得分，但可以帮助你理清思路。\n\n提示分为多个级别，循序渐进地给出线索。"
	bg_panel.add_child(hint_text_label)
	var bottom_bar = HBoxContainer.new()
	bottom_bar.custom_minimum_size.y = 44
	bottom_bar.alignment = BoxContainer.ALIGNMENT_END
	bottom_bar.add_theme_constant_override("separation", 10)
	bg_panel.add_child(bottom_bar)
	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom_bar.add_child(spacer)
	request_hint_btn = Button.new()
	request_hint_btn.text = "获取下一级提示 (H)"
	request_hint_btn.custom_minimum_size = Vector2(180, 40)
	request_hint_btn.add_theme_font_size_override("font_size", 14)
	var btn_sb = StyleBoxFlat.new()
	btn_sb.bg_color = Color(0.85, 0.65, 0.2, 1)
	btn_sb.corner_radius_top_left = 8
	btn_sb.corner_radius_top_right = 8
	btn_sb.corner_radius_bottom_left = 8
	btn_sb.corner_radius_bottom_right = 8
	request_hint_btn.add_theme_stylebox_override("normal", btn_sb)
	var sb_hover = btn_sb.duplicate()
	sb_hover.bg_color = Color(0.95, 0.75, 0.3, 1)
	request_hint_btn.add_theme_stylebox_override("hover", sb_hover)
	request_hint_btn.add_theme_color_override("font_color", Color(0.1, 0.1, 0.1, 1))
	request_hint_btn.pressed.connect(_on_request_hint)
	bottom_bar.add_child(request_hint_btn)

func set_hints_config(hints_array: Array) -> void:
	config_hints = hints_array.duplicate()
	_update_hint_indicators(0)

func show_panel(revealed_hints: Array = []) -> void:
	hints_revealed = revealed_hints.size()
	_update_hint_indicators(hints_revealed)
	var text_parts = []
	for level_idx in range(1, hints_revealed + 1):
		var hint_text = _get_hint_text_for_level(level_idx)
		if not hint_text.is_empty():
			text_parts.append("[b]提示级别 %d:[/b]\n%s\n" % [level_idx, hint_text])
	if text_parts.is_empty():
		hint_text_label.text = "尚未使用任何提示。\n\n如果遇到困难，可以点击下方按钮获取提示。\n[i]提示会按级别逐步给出线索，每次都会扣除一定分数。[/i]"
	else:
		hint_text_label.text = "\n".join(text_parts)
	_update_request_button()
	show()
	_animate_in()
	AudioManager.play_ui_sound("ui_click")

func _get_hint_text_for_level(level: int) -> String:
	for h in config_hints:
		if int(h.get("level", 0)) == level:
			return h.get("text", "")
	return ""

func _update_hint_indicators(revealed: int) -> void:
	for i in range(max_hints):
		var dot = hint_level_indicator.get_node_or_null("dot_%d" % i) as ColorRect
		if dot:
			if i < revealed:
				dot.color = Color(1.0, 0.8, 0.3, 1)
			elif i == revealed:
				dot.color = Color(0.5, 0.5, 0.3, 1)
			else:
				dot.color = Color(0.3, 0.3, 0.4, 1)

func _update_request_button() -> void:
	if hints_revealed >= config_hints.size() or hints_revealed >= max_hints:
		request_hint_btn.disabled = true
		request_hint_btn.text = "没有更多提示"
	else:
		request_hint_btn.disabled = false
		request_hint_btn.text = "获取级别 %d 提示 (H)" % (hints_revealed + 1)

func _on_request_hint() -> void:
	var hint_text = GameManager.request_hint()
	if not hint_text.is_empty():
		hints_revealed += 1
		_update_hint_indicators(hints_revealed)
		var current_text = hint_text_label.text
		if current_text.find("尚未使用") >= 0 or current_text.find("困难") >= 0:
			current_text = ""
		var new_text = "%s\n\n[b]提示级别 %d:[/b]\n%s" % [current_text, hints_revealed, hint_text]
		hint_text_label.text = new_text.strip_edges()
		_update_request_button()
		EventBus.emit_signal("hint_revealed", hint_text, hints_revealed)
		emit_signal("hint_requested_again")
		AudioManager.play_ui_sound("hint_reveal")

func _on_close_pressed() -> void:
	_animate_out()
	AudioManager.play_ui_sound("ui_click")
	emit_signal("panel_closed")

func _animate_in() -> void:
	if anim_tween:
		anim_tween.kill()
	modulate.a = 0.0
	scale = Vector2(0.9, 0.9)
	anim_tween = create_tween()
	anim_tween.set_parallel(true)
	anim_tween.tween_property(self, "modulate:a", 1.0, 0.2 * GameManager.animation_speed)
	anim_tween.tween_property(self, "scale", Vector2.ONE, 0.25 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _animate_out() -> void:
	if anim_tween:
		anim_tween.kill()
	anim_tween = create_tween()
	anim_tween.set_parallel(true)
	anim_tween.tween_property(self, "modulate:a", 0.0, 0.15 * GameManager.animation_speed)
	anim_tween.tween_property(self, "scale", Vector2(0.9, 0.9), 0.15 * GameManager.animation_speed)
	anim_tween.finished.connect(hide)

func _input(event: InputEvent) -> void:
	if visible and event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		_on_close_pressed()
