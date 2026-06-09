extends Control

signal link_created(from_card_id: String, to_card_id: String)
signal link_removed(from_card_id: String, to_card_id: String)
signal panel_closed()

var bg_panel: Panel
var title_label: Label
var close_btn: Button
var cards_list_container: VBoxContainer
var created_links_container: VBoxContainer
var link_mode_label: Label
var available_tags: Array = []
var card_options: Dictionary = {}
var from_card_id: String = ""
var from_select: OptionButton
var to_select: OptionButton
var add_link_btn: Button
var target_card_data: Dictionary = {}
var anim_tween: Tween

func _ready() -> void:
	_setup_panel()
	hide()

func _setup_panel() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	custom_minimum_size = Vector2(520, 400)
	size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mouse_filter = Control.MOUSE_FILTER_STOP
	bg_panel = Panel.new()
	bg_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bg_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var bg_sb = StyleBoxFlat.new()
	bg_sb.bg_color = Color(0.11, 0.13, 0.18, 0.98)
	bg_sb.border_color = Color(0.4, 0.7, 0.95, 0.5)
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
	title_label.text = "🔗 证据关联"
	title_label.add_theme_font_size_override("font_size", 18)
	title_label.add_theme_color_override("font_color", Color(0.6, 0.85, 1.0, 1))
	title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(title_label)
	close_btn = Button.new()
	close_btn.text = "✕"
	close_btn.custom_minimum_size = Vector2(36, 30)
	close_btn.add_theme_font_size_override("font_size", 14)
	close_btn.pressed.connect(_on_close_pressed)
	top_bar.add_child(close_btn)
	link_mode_label = Label.new()
	link_mode_label.text = "创建两张卡片之间的因果关联。正确的关联可以获得额外分数。"
	link_mode_label.add_theme_font_size_override("font_size", 12)
	link_mode_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
	link_mode_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	link_mode_label.custom_minimum_size.y = 36
	bg_panel.add_child(link_mode_label)
	var sep = HSeparator.new()
	sep.custom_minimum_size.y = 8
	bg_panel.add_child(sep)
	var create_title = Label.new()
	create_title.text = "【创建新关联】"
	create_title.add_theme_font_size_override("font_size", 14)
	create_title.add_theme_color_override("font_color", Color(0.85, 0.85, 0.95, 1))
	create_title.custom_minimum_size.y = 28
	bg_panel.add_child(create_title)
	var from_row = HBoxContainer.new()
	from_row.custom_minimum_size.y = 36
	bg_panel.add_child(from_row)
	var from_label = Label.new()
	from_label.text = "从:"
	from_label.custom_minimum_size = Vector2(50, 0)
	from_label.add_theme_font_size_override("font_size", 13)
	from_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.9, 1))
	from_row.add_child(from_label)
	from_select = OptionButton.new()
	from_select.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	from_select.custom_minimum_size.y = 34
	from_select.add_theme_font_size_override("font_size", 13)
	from_row.add_child(from_select)
	var to_row = HBoxContainer.new()
	to_row.custom_minimum_size.y = 36
	bg_panel.add_child(to_row)
	var to_label = Label.new()
	to_label.text = "到:"
	to_label.custom_minimum_size = Vector2(50, 0)
	to_label.add_theme_font_size_override("font_size", 13)
	to_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.9, 1))
	to_row.add_child(to_label)
	to_select = OptionButton.new()
	to_select.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	to_select.custom_minimum_size.y = 34
	to_select.add_theme_font_size_override("font_size", 13)
	to_row.add_child(to_select)
	var btn_row = HBoxContainer.new()
	btn_row.custom_minimum_size.y = 44
	btn_row.alignment = BoxContainer.ALIGNMENT_END
	bg_panel.add_child(btn_row)
	add_link_btn = Button.new()
	add_link_btn.text = "+ 添加关联"
	add_link_btn.custom_minimum_size = Vector2(140, 38)
	add_link_btn.add_theme_font_size_override("font_size", 13)
	var add_sb = StyleBoxFlat.new()
	add_sb.bg_color = Color(0.2, 0.55, 0.9, 1)
	add_sb.corner_radius_top_left = 8
	add_sb.corner_radius_top_right = 8
	add_sb.corner_radius_bottom_left = 8
	add_sb.corner_radius_bottom_right = 8
	add_link_btn.add_theme_stylebox_override("normal", add_sb)
	var add_sb_hover = add_sb.duplicate()
	add_sb_hover.bg_color = Color(0.3, 0.65, 1.0, 1)
	add_link_btn.add_theme_stylebox_override("hover", add_sb_hover)
	add_link_btn.add_theme_color_override("font_color", Color.WHITE)
	add_link_btn.pressed.connect(_on_add_link)
	btn_row.add_child(add_link_btn)
	var sep2 = HSeparator.new()
	sep2.custom_minimum_size.y = 8
	bg_panel.add_child(sep2)
	var list_title = Label.new()
	list_title.text = "【已建立的关联】"
	list_title.add_theme_font_size_override("font_size", 14)
	list_title.add_theme_color_override("font_color", Color(0.85, 0.85, 0.95, 1))
	list_title.custom_minimum_size.y = 28
	bg_panel.add_child(list_title)
	var list_scroll = ScrollContainer.new()
	list_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	list_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	list_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bg_panel.add_child(list_scroll)
	created_links_container = VBoxContainer.new()
	created_links_container.add_theme_constant_override("separation", 4)
	created_links_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list_scroll.add_child(created_links_container)

func show_panel(cards_data: Array, current_links: Array, from_id: String = "") -> void:
	card_options.clear()
	from_select.clear()
	to_select.clear()
	from_card_id = from_id
	for i in range(cards_data.size()):
		var c = cards_data[i]
		var cid: String = c.get("id", "")
		var ctitle: String = c.get("title", cid)
		card_options[cid] = c
		from_select.add_item(ctitle, i)
		from_select.set_item_metadata(i, cid)
		to_select.add_item(ctitle, i)
		to_select.set_item_metadata(i, cid)
	_update_select_options(from_select, "")
	_update_select_options(to_select, "")
	if not from_card_id.is_empty():
		for i in range(from_select.item_count):
			if str(from_select.get_item_metadata(i)) == from_card_id:
				from_select.select(i)
				break
	_populate_links(current_links)
	show()
	_animate_in()
	AudioManager.play_ui_sound("ui_click")

func _update_select_options(select_btn: OptionButton, exclude_id: String) -> void:
	pass

func _populate_links(current_links: Array) -> void:
	for c in created_links_container.get_children():
		c.queue_free()
	if current_links.is_empty():
		var empty = Label.new()
		empty.text = "（暂无关联）"
		empty.add_theme_font_size_override("font_size", 12)
		empty.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6, 1))
		empty.custom_minimum_size.y = 32
		created_links_container.add_child(empty)
		return
	for link in current_links:
		var row = HBoxContainer.new()
		row.custom_minimum_size.y = 34
		row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		created_links_container.add_child(row)
		var from_id: String = str(link.get("from", ""))
		var to_id: String = str(link.get("to", ""))
		var from_card = card_options.get(from_id, {})
		var to_card = card_options.get(to_id, {})
		var from_title: String = from_card.get("title", from_id) if from_card else from_id
		var to_title: String = to_card.get("title", to_id) if to_card else to_id
		var label_text = Label.new()
		label_text.text = "%s  →  %s" % [from_title.substr(0, min(12, from_title.length())), to_title.substr(0, min(12, to_title.length()))]
		label_text.add_theme_font_size_override("font_size", 12)
		label_text.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0, 1))
		label_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(label_text)
		var remove_btn = Button.new()
		remove_btn.text = "删除"
		remove_btn.custom_minimum_size = Vector2(60, 28)
		remove_btn.add_theme_font_size_override("font_size", 11)
		var rm_sb = StyleBoxFlat.new()
		rm_sb.bg_color = Color(0.7, 0.2, 0.2, 0.8)
		rm_sb.corner_radius_top_left = 4
		rm_sb.corner_radius_top_right = 4
		rm_sb.corner_radius_bottom_left = 4
		rm_sb.corner_radius_bottom_right = 4
		remove_btn.add_theme_stylebox_override("normal", rm_sb)
		remove_btn.add_theme_color_override("font_color", Color.WHITE)
		remove_btn.pressed.connect(_on_remove_link.bind(from_id, to_id, row))
		row.add_child(remove_btn)

func _on_add_link() -> void:
	var from_idx = from_select.selected
	var to_idx = to_select.selected
	if from_idx < 0 or to_idx < 0:
		_show_feedback("请选择两张不同的卡片", "warning")
		return
	var fid: String = str(from_select.get_item_metadata(from_idx))
	var tid: String = str(to_select.get_item_metadata(to_idx))
	if fid == tid:
		_show_feedback("不能将卡片关联到自己", "warning")
		return
	GameManager.add_evidence_link(fid, tid)
	emit_signal("link_created", fid, tid)
	_populate_links(GameManager.get_linked_pairs())
	AudioManager.play_ui_sound("link_add")
	_show_feedback("关联已建立", "success")

func _on_remove_link(from_id: String, to_id: String, row: HBoxContainer) -> void:
	GameManager.remove_evidence_link(from_id, to_id)
	emit_signal("link_removed", from_id, to_id)
	row.queue_free()
	_populate_links(GameManager.get_linked_pairs())
	AudioManager.play_ui_sound("link_remove")
	_show_feedback("关联已删除", "info")

func _show_feedback(msg: String, type: String) -> void:
	EventBus.emit_signal("feedback_shown", msg, type, 1.5)

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
