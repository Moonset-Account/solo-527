extends Control

signal tag_toggled(tag_id: String, enabled: bool)
signal tags_closed()

@export var max_rows: int = 3
@export var tags_per_row: int = 5

var background_panel: Panel
var tags_container: GridContainer
var title_label: Label
var close_btn: Button
var tag_buttons: Dictionary = {}
var available_tags: Array = []
var selected_tags: Array = []
var target_card_id: String = ""
var anim_tween: Tween

func _ready() -> void:
	_setup_panel()
	hide()

func _setup_panel() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	custom_minimum_size = Vector2(380, 200)
	size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mouse_filter = Control.MOUSE_FILTER_STOP
	background_panel = Panel.new()
	background_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	background_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var bg_sb = StyleBoxFlat.new()
	bg_sb.bg_color = Color(0.12, 0.12, 0.16, 0.98)
	bg_sb.border_color = Color(0.3, 0.5, 0.8, 0.6)
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
	bg_sb.content_margin_left = 16
	bg_sb.content_margin_right = 16
	bg_sb.content_margin_top = 12
	bg_sb.content_margin_bottom = 12
	background_panel.add_theme_stylebox_override("panel", bg_sb)
	add_child(background_panel)
	var top_bar = HBoxContainer.new()
	top_bar.custom_minimum_size.y = 36
	background_panel.add_child(top_bar)
	title_label = Label.new()
	title_label.text = "添加标签"
	title_label.add_theme_font_size_override("font_size", 16)
	title_label.add_theme_color_override("font_color", Color(0.9, 0.9, 0.95, 1))
	title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(title_label)
	close_btn = Button.new()
	close_btn.text = "✕ 关闭"
	close_btn.add_theme_font_size_override("font_size", 13)
	close_btn.custom_minimum_size = Vector2(70, 30)
	close_btn.pressed.connect(_on_close_pressed)
	top_bar.add_child(close_btn)
	var sep = HSeparator.new()
	sep.custom_minimum_size.y = 8
	background_panel.add_child(sep)
	tags_container = GridContainer.new()
	tags_container.columns = tags_per_row
	tags_container.add_theme_constant_override("h_separation", 8)
	tags_container.add_theme_constant_override("v_separation", 8)
	tags_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tags_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	background_panel.add_child(tags_container)
	var hint = Label.new()
	hint.text = "点击标签启用/禁用。正确的标签将帮助你获得更高分数。"
	hint.add_theme_font_size_override("font_size", 11)
	hint.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
	hint.custom_minimum_size.y = 28
	background_panel.add_child(hint)

func show_for_card(card_id: String, tags: Array, current_tags: Array) -> void:
	target_card_id = card_id
	available_tags = tags.duplicate()
	selected_tags = current_tags.duplicate()
	title_label.text = "标签 - 卡片 #%s" % card_id.substr(card_id.length() - 3, 3)
	_rebuild_tag_buttons()
	show()
	_animate_in()
	AudioManager.play_ui_sound("ui_click")

func _rebuild_tag_buttons() -> void:
	for btn in tag_buttons.values():
		btn.queue_free()
	tag_buttons.clear()
	for tag in available_tags:
		var btn = Button.new()
		btn.text = tag
		btn.toggle_mode = true
		btn.button_pressed = selected_tags.has(tag)
		btn.custom_minimum_size = Vector2(0, 36)
		btn.add_theme_font_size_override("font_size", 13)
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_apply_tag_style(btn, btn.button_pressed)
		btn.toggled.connect(_on_tag_toggled.bind(tag, btn))
		tags_container.add_child(btn)
		tag_buttons[tag] = btn

func _apply_tag_style(btn: Button, pressed: bool) -> void:
	var sb_normal = StyleBoxFlat.new()
	sb_normal.bg_color = Color(0.2, 0.22, 0.28, 1) if not pressed else Color(0.2, 0.55, 0.9, 1)
	sb_normal.border_color = Color(0.35, 0.38, 0.48, 1) if not pressed else Color(0.4, 0.75, 1.0, 1)
	sb_normal.border_width_left = 2
	sb_normal.border_width_right = 2
	sb_normal.border_width_top = 2
	sb_normal.border_width_bottom = 2
	sb_normal.corner_radius_top_left = 8
	sb_normal.corner_radius_top_right = 8
	sb_normal.corner_radius_bottom_left = 8
	sb_normal.corner_radius_bottom_right = 8
	btn.add_theme_color_override("font_color", Color(0.85, 0.85, 0.95, 1))
	btn.add_theme_stylebox_override("normal", sb_normal)
	var sb_hover = sb_normal.duplicate()
	sb_hover.bg_color = Color(0.28, 0.3, 0.38, 1) if not pressed else Color(0.3, 0.65, 1.0, 1)
	btn.add_theme_stylebox_override("hover", sb_hover)
	var sb_pressed = sb_normal.duplicate()
	sb_pressed.bg_color = Color(0.15, 0.17, 0.22, 1) if not pressed else Color(0.15, 0.5, 0.85, 1)
	btn.add_theme_stylebox_override("pressed", sb_pressed)

func _on_tag_toggled(pressed: bool, tag_id: String, btn: Button) -> void:
	_apply_tag_style(btn, pressed)
	if pressed:
		if not selected_tags.has(tag_id):
			selected_tags.append(tag_id)
		EventBus.emit_signal("tag_applied", target_card_id, tag_id)
		GameManager.apply_tag(target_card_id, tag_id)
	else:
		if selected_tags.has(tag_id):
			selected_tags.erase(tag_id)
		EventBus.emit_signal("tag_removed", target_card_id, tag_id)
		GameManager.remove_tag(target_card_id, tag_id)
	emit_signal("tag_toggled", tag_id, pressed)
	AudioManager.play_ui_sound("tag_add" if pressed else "tag_remove")

func _on_close_pressed() -> void:
	_animate_out()
	AudioManager.play_ui_sound("ui_click")
	emit_signal("tags_closed")

func _animate_in() -> void:
	if anim_tween:
		anim_tween.kill()
	modulate.a = 0.0
	scale = Vector2(0.85, 0.85)
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
