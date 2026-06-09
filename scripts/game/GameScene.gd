extends Control

const FEEDBACK_MANAGER_SCRIPT: Script = preload("res://scripts/game/FeedbackManager.gd")
const TIMELINE_SCRIPT: Script = preload("res://scripts/game/TimelineComponent.gd")
const UNPLACED_AREA_SCRIPT: Script = preload("res://scripts/game/UnplacedCardArea.gd")
const TAG_PANEL_SCRIPT: Script = preload("res://scripts/game/TagPanel.gd")
const HINT_PANEL_SCRIPT: Script = preload("res://scripts/game/HintPanel.gd")
const LINK_PANEL_SCRIPT: Script = preload("res://scripts/game/EvidenceLinkPanel.gd")
const PAUSE_MENU_SCRIPT: Script = preload("res://scripts/ui/PauseMenu.gd")
const SETTINGS_PANEL_SCRIPT: Script = preload("res://scripts/ui/SettingsPanel.gd")
const PERF_HUD_SCRIPT: Script = preload("res://scripts/ui/PerformanceHUD.gd")

var RESULT_PANEL_SCRIPT: Script = null

var main_panel: Panel
var top_bar: HBoxContainer
var left_panel: PanelContainer
var right_panel: PanelContainer
var timeline_area: Control
var sidebar_container: VBoxContainer
var sidebar_buttons: HBoxContainer
var tag_btn: Button
var link_btn: Button
var hint_btn: Button
var submit_btn: Button
var level_title: Label
var timer_label: Label
var attempt_label: Label
var back_to_menu_btn: Button
var pause_btn: Button

var timeline_component: Control
var unplaced_area: Control
var tag_panel: Control
var hint_panel: Control
var link_panel: Control
var result_panel: Control
var pause_menu: Control
var settings_panel: Control
var feedback: CanvasLayer
var perf_hud: Control

var selected_card_id: String = ""
var level_config: Dictionary = {}

func _ready() -> void:
	_setup_scene()
	_connect_game_signals()
	_setup_from_config()

func _setup_scene() -> void:
	RESULT_PANEL_SCRIPT = load("res://scripts/game/ResultPanel.gd")
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_PASS
	var bg = ColorRect.new()
	bg.color = Color(0.09, 0.09, 0.13, 1)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	feedback = FEEDBACK_MANAGER_SCRIPT.new()
	add_child(feedback)
	perf_hud = PERF_HUD_SCRIPT.new()
	add_child(perf_hud)
	_build_top_bar()
	_build_main_layout()
	_build_modals()
	_perf_toggle_if_enabled()

func _build_top_bar() -> void:
	top_bar = HBoxContainer.new()
	top_bar.custom_minimum_size.y = 56
	top_bar.offset_left = 0
	top_bar.offset_top = 0
	top_bar.offset_right = 1280
	top_bar.offset_bottom = 56
	top_bar.anchor_right = 1
	top_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_theme_constant_override("separation", 12)
	var top_sb = StyleBoxFlat.new()
	top_sb.bg_color = Color(0.1, 0.1, 0.16, 0.92)
	top_sb.border_color = Color(0.22, 0.22, 0.3, 0.8)
	top_sb.border_width_bottom = 2
	var top_panel = Panel.new()
	top_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_panel.custom_minimum_size.y = 56
	top_panel.add_theme_stylebox_override("panel", top_sb)
	add_child(top_panel)
	top_bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_bar.offset_left = 16
	top_bar.offset_top = 6
	top_bar.offset_right = -16
	top_bar.offset_bottom = -6
	top_panel.add_child(top_bar)
	back_to_menu_btn = Button.new()
	back_to_menu_btn.text = "← 菜单"
	back_to_menu_btn.custom_minimum_size = Vector2(80, 40)
	back_to_menu_btn.add_theme_font_size_override("font_size", 13)
	back_to_menu_btn.pressed.connect(_on_back_to_menu)
	top_bar.add_child(back_to_menu_btn)
	level_title = Label.new()
	level_title.text = "加载中..."
	level_title.add_theme_font_size_override("font_size", 18)
	level_title.add_theme_color_override("font_color", Color(0.9, 0.9, 0.95, 1))
	level_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(level_title)
	timer_label = Label.new()
	timer_label.text = "⏱ 00:00"
	timer_label.custom_minimum_size.x = 100
	timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	timer_label.add_theme_font_size_override("font_size", 14)
	timer_label.add_theme_color_override("font_color", Color(0.7, 0.85, 0.95, 1))
	top_bar.add_child(timer_label)
	attempt_label = Label.new()
	attempt_label.text = "尝试: 1/3"
	attempt_label.custom_minimum_size.x = 90
	attempt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	attempt_label.add_theme_font_size_override("font_size", 13)
	attempt_label.add_theme_color_override("font_color", Color(0.9, 0.75, 0.5, 1))
	top_bar.add_child(attempt_label)
	hint_btn = Button.new()
	hint_btn.text = "💡 提示 (H)"
	hint_btn.custom_minimum_size = Vector2(100, 40)
	hint_btn.add_theme_font_size_override("font_size", 13)
	hint_btn.pressed.connect(_on_hint_pressed)
	top_bar.add_child(hint_btn)
	pause_btn = Button.new()
	pause_btn.text = "⏸ (Esc)"
	pause_btn.custom_minimum_size = Vector2(85, 40)
	pause_btn.add_theme_font_size_override("font_size", 13)
	pause_btn.pressed.connect(_on_pause_pressed)
	top_bar.add_child(pause_btn)

func _build_main_layout() -> void:
	var main_hbox = HBoxContainer.new()
	main_hbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_hbox.offset_left = 12
	main_hbox.offset_top = 64
	main_hbox.offset_right = -12
	main_hbox.offset_bottom = -12
	main_hbox.add_theme_constant_override("separation", 12)
	add_child(main_hbox)
	var left_panel_container = PanelContainer.new()
	left_panel_container.custom_minimum_size.x = 300
	left_panel_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var left_sb = StyleBoxFlat.new()
	left_sb.bg_color = Color(0.11, 0.11, 0.16, 0.6)
	left_sb.border_color = Color(0.22, 0.22, 0.3, 0.5)
	left_sb.border_width_left = 1
	left_sb.border_width_right = 1
	left_sb.border_width_top = 1
	left_sb.border_width_bottom = 1
	left_sb.corner_radius_top_left = 10
	left_sb.corner_radius_top_right = 10
	left_sb.corner_radius_bottom_left = 10
	left_sb.corner_radius_bottom_right = 10
	left_sb.content_margin_left = 10
	left_sb.content_margin_right = 10
	left_sb.content_margin_top = 10
	left_sb.content_margin_bottom = 10
	left_panel_container.add_theme_stylebox_override("panel", left_sb)
	main_hbox.add_child(left_panel_container)
	unplaced_area = UNPLACED_AREA_SCRIPT.new()
	unplaced_area.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	unplaced_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	unplaced_area.set_columns(1)
	unplaced_area.card_pressed.connect(_on_area_card_pressed)
	unplaced_area.card_double_clicked.connect(_on_area_card_double_clicked)
	left_panel_container.add_child(unplaced_area)
	var right_area = VBoxContainer.new()
	right_area.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right_area.add_theme_constant_override("separation", 10)
	main_hbox.add_child(right_area)
	sidebar_buttons = HBoxContainer.new()
	sidebar_buttons.custom_minimum_size.y = 46
	sidebar_buttons.alignment = BoxContainer.ALIGNMENT_END
	sidebar_buttons.add_theme_constant_override("separation", 10)
	right_area.add_child(sidebar_buttons)
	var desc_label = Label.new()
	desc_label.text = "拖拽左侧卡片到时间线中，按时间先后顺序排列（从左到右）。"
	desc_label.add_theme_font_size_override("font_size", 12)
	desc_label.add_theme_color_override("font_color", Color(0.6, 0.65, 0.75, 1))
	desc_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sidebar_buttons.add_child(desc_label)
	tag_btn = _create_sidebar_button("🏷 标签面板", Color(0.35, 0.5, 0.8, 1), Color(0.45, 0.6, 0.9, 1))
	tag_btn.pressed.connect(_on_tag_panel_pressed)
	sidebar_buttons.add_child(tag_btn)
	link_btn = _create_sidebar_button("🔗 关联面板", Color(0.5, 0.4, 0.75, 1), Color(0.6, 0.5, 0.85, 1))
	link_btn.pressed.connect(_on_link_panel_pressed)
	sidebar_buttons.add_child(link_btn)
	submit_btn = _create_sidebar_button("✓ 提交推理", Color(0.2, 0.7, 0.4, 1), Color(0.3, 0.8, 0.5, 1))
	submit_btn.custom_minimum_size.x = 160
	submit_btn.pressed.connect(_on_submit_pressed)
	sidebar_buttons.add_child(submit_btn)
	var timeline_panel_container = PanelContainer.new()
	timeline_panel_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	timeline_panel_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var tl_sb = StyleBoxFlat.new()
	tl_sb.bg_color = Color(0.12, 0.12, 0.18, 0.5)
	tl_sb.border_color = Color(0.25, 0.28, 0.4, 0.5)
	tl_sb.border_width_left = 1
	tl_sb.border_width_right = 1
	tl_sb.border_width_top = 1
	tl_sb.border_width_bottom = 1
	tl_sb.corner_radius_top_left = 10
	tl_sb.corner_radius_top_right = 10
	tl_sb.corner_radius_bottom_left = 10
	tl_sb.corner_radius_bottom_right = 10
	tl_sb.content_margin_left = 14
	tl_sb.content_margin_right = 14
	tl_sb.content_margin_top = 14
	tl_sb.content_margin_bottom = 14
	timeline_panel_container.add_theme_stylebox_override("panel", tl_sb)
	right_area.add_child(timeline_panel_container)
	timeline_component = TIMELINE_SCRIPT.new()
	timeline_component.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	timeline_component.size_flags_vertical = Control.SIZE_EXPAND_FILL
	timeline_component.timeline_changed.connect(_on_timeline_changed)
	timeline_panel_container.add_child(timeline_component)

func _create_sidebar_button(text: String, base: Color, hover: Color) -> Button:
	var btn = Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(120, 40)
	btn.add_theme_font_size_override("font_size", 13)
	btn.add_theme_color_override("font_color", Color.WHITE)
	var sb_normal = StyleBoxFlat.new()
	sb_normal.bg_color = base
	sb_normal.corner_radius_top_left = 8
	sb_normal.corner_radius_top_right = 8
	sb_normal.corner_radius_bottom_left = 8
	sb_normal.corner_radius_bottom_right = 8
	sb_normal.content_margin_left = 12
	sb_normal.content_margin_right = 12
	btn.add_theme_stylebox_override("normal", sb_normal)
	var sb_hover = sb_normal.duplicate()
	sb_hover.bg_color = hover
	btn.add_theme_stylebox_override("hover", sb_hover)
	var sb_pressed = sb_normal.duplicate()
	sb_pressed.bg_color = base.darkened(0.15)
	btn.add_theme_stylebox_override("pressed", sb_pressed)
	return btn

func _build_modals() -> void:
	var modal_layer = CanvasLayer.new()
	modal_layer.layer = 20
	modal_layer.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(modal_layer)
	tag_panel = TAG_PANEL_SCRIPT.new()
	tag_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	tag_panel.offset_left = -200
	tag_panel.offset_top = -120
	tag_panel.offset_right = 200
	tag_panel.offset_bottom = 120
	tag_panel.tags_closed.connect(func(): selected_card_id = "")
	modal_layer.add_child(tag_panel)
	hint_panel = HINT_PANEL_SCRIPT.new()
	hint_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	hint_panel.offset_left = -260
	hint_panel.offset_top = -150
	hint_panel.offset_right = 260
	hint_panel.offset_bottom = 150
	modal_layer.add_child(hint_panel)
	link_panel = LINK_PANEL_SCRIPT.new()
	link_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	link_panel.offset_left = -270
	link_panel.offset_top = -210
	link_panel.offset_right = 270
	link_panel.offset_bottom = 210
	link_panel.link_created.connect(_on_link_created)
	modal_layer.add_child(link_panel)
	result_panel = RESULT_PANEL_SCRIPT.new()
	result_panel.restart_requested.connect(_on_restart)
	result_panel.next_level_requested.connect(_on_next_level)
	result_panel.back_to_menu_requested.connect(_on_back_to_menu)
	modal_layer.add_child(result_panel)
	pause_menu = PAUSE_MENU_SCRIPT.new()
	pause_menu.resume_requested.connect(_on_resume)
	pause_menu.restart_requested.connect(_on_restart)
	pause_menu.settings_requested.connect(_on_show_settings)
	pause_menu.quit_requested.connect(_on_back_to_menu)
	modal_layer.add_child(pause_menu)
	settings_panel = SETTINGS_PANEL_SCRIPT.new()
	settings_panel.settings_applied.connect(func():
		perf_hud.set_show(SaveManager.get_setting("gameplay.show_performance_stats", false))
	)
	modal_layer.add_child(settings_panel)

func _connect_game_signals() -> void:
	EventBus.card_pressed.connect(_on_card_pressed_global)
	EventBus.hint_requested.connect(func(l): _on_hint_pressed())
	EventBus.settings_changed.connect(_on_settings_changed_global)
	InputManager.register_action_callback("game_pause", Callable(self, "_on_pause_pressed"))
	InputManager.register_action_callback("game_hint", Callable(self, "_on_hint_pressed"))
	InputManager.register_action_callback("game_submit", Callable(self, "_on_submit_pressed"))

func _setup_from_config() -> void:
	level_config = GameManager.current_level_config
	if level_config.is_empty():
		return
	level_title.text = level_config.get("title", "未知关卡")
	timeline_component.initialize_from_config(level_config)
	unplaced_area.initialize_from_config(level_config)
	var all_cards: Dictionary = unplaced_area.get_all_cards()
	for card in all_cards.values():
		timeline_component.register_card(card)
	hint_panel.set_hints_config(level_config.get("hints", []))
	await get_tree().process_frame
	unplaced_area.show_cards_appear_animation()
	_reposition_unplaced_cards()
	EventBus.emit_signal("feedback_shown", "关卡已加载：%s" % level_title.text, "info", 2.5)

func _reposition_unplaced_cards() -> void:
	var cards: Dictionary = unplaced_area.get_all_cards()
	var unplaced_ids: Array = GameManager.get_unplaced_card_ids()
	for cid in cards.keys():
		var card: Control = cards[cid]
		if unplaced_ids.has(cid):
			if not card.is_placed:
				pass
		else:
			for i in range(GameManager.get_timeline_size()):
				if GameManager.get_timeline_slot_card_id(i) == cid:
					timeline_component.place_card_in_slot(cid, i)
					break

func _process(_delta: float) -> void:
	if GameManager.current_state == GameManager.GameState.PLAYING:
		var t = GameManager.play_time
		var mm = int(t / 60)
		var ss = int(t) % 60
		timer_label.text = "⏱ %02d:%02d" % [mm, ss]
		var attempts = GameManager.attempts + 1
		var max_a: int = int(ConfigManager.get_game_setting("game.max_attempts", 3))
		attempt_label.text = "尝试: %d/%d" % [attempts, max_a]

func _perf_toggle_if_enabled() -> void:
	if SaveManager.get_setting("gameplay.show_performance_stats", false):
		perf_hud.set_show(true)

func _on_area_card_pressed(card: Control) -> void:
	selected_card_id = card.card_id

func _on_area_card_double_clicked(card: Control) -> void:
	selected_card_id = card.card_id
	_show_tag_panel_for(card.card_id)

func _on_card_pressed_global(card_id: String) -> void:
	selected_card_id = card_id
	AudioManager.play_ui_sound("ui_click")

func _on_timeline_changed() -> void:
	AudioManager.play_ui_sound("ui_hover")

func _on_tag_panel_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	if selected_card_id.is_empty():
		EventBus.emit_signal("feedback_shown", "请先选择一张卡片（点击卡片）", "warning", 2.0)
		return
	_show_tag_panel_for(selected_card_id)

func _show_tag_panel_for(card_id: String) -> void:
	var available_tags: Array = level_config.get("available_tags", [])
	var current_tags: Array = GameManager.get_card_tags(card_id)
	tag_panel.show_for_card(card_id, available_tags, current_tags)

func _on_link_panel_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	var cards_data: Array = level_config.get("cards", [])
	var current_links: Array = GameManager.get_linked_pairs()
	link_panel.show_panel(cards_data, current_links, selected_card_id)

func _on_link_created(_f: String, _t: String) -> void:
	pass

func _on_hint_pressed() -> void:
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	var revealed: Array = GameManager.game_state_data.get("hints_revealed", [])
	hint_panel.show_panel(revealed)

func _on_submit_pressed() -> void:
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	AudioManager.play_ui_sound("ui_click")
	var confirm: bool = SaveManager.get_setting("gameplay.confirm_on_submit", true)
	if confirm:
		var ok = await _show_submit_confirm_dialog()
		if not ok:
			return
	var result: Dictionary = GameManager.submit_timeline()
	_show_submission_result(result)

func _show_submit_confirm_dialog() -> bool:
	var confirm_overlay = ColorRect.new()
	confirm_overlay.color = Color(0, 0, 0, 0.6)
	confirm_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	confirm_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	confirm_overlay.z_index = 100
	confirm_overlay.process_mode = Node.PROCESS_MODE_WHEN_PAUSED
	add_child(confirm_overlay)
	var center = CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	confirm_overlay.add_child(center)
	var panel = Panel.new()
	panel.custom_minimum_size = Vector2(420, 200)
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.12, 0.12, 0.18, 0.98)
	sb.border_color = Color(0.8, 0.55, 0.2, 0.6)
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = 12
	sb.corner_radius_top_right = 12
	sb.corner_radius_bottom_left = 12
	sb.corner_radius_bottom_right = 12
	sb.content_margin_left = 24
	sb.content_margin_right = 24
	sb.content_margin_top = 20
	sb.content_margin_bottom = 20
	panel.add_theme_stylebox_override("panel", sb)
	center.add_child(panel)
	var vb = VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 24
	vb.offset_top = 20
	vb.offset_right = -24
	vb.offset_bottom = -20
	vb.add_theme_constant_override("separation", 16)
	panel.add_child(vb)
	var title = Label.new()
	title.text = "确认提交？"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color(0.95, 0.8, 0.5, 1))
	vb.add_child(title)
	var desc = Label.new()
	desc.text = "提交后将根据正确率进行评分。\n一旦提交，本次将计为一次尝试。"
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc.add_theme_font_size_override("font_size", 13)
	desc.add_theme_color_override("font_color", Color(0.75, 0.75, 0.85, 1))
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(desc)
	var btns = HBoxContainer.new()
	btns.alignment = BoxContainer.ALIGNMENT_CENTER
	btns.add_theme_constant_override("separation", 16)
	btns.custom_minimum_size.y = 44
	vb.add_child(btns)
	var cancelled = true
	var cancel_btn = Button.new()
	cancel_btn.text = "取消"
	cancel_btn.custom_minimum_size = Vector2(120, 42)
	cancel_btn.add_theme_font_size_override("font_size", 14)
	cancel_btn.pressed.connect(func():
		cancelled = true
		confirm_overlay.queue_free()
		get_tree().paused = false)
	btns.add_child(cancel_btn)
	var ok_btn = Button.new()
	ok_btn.text = "确认提交"
	ok_btn.custom_minimum_size = Vector2(120, 42)
	ok_btn.add_theme_font_size_override("font_size", 14)
	var ok_sb = StyleBoxFlat.new()
	ok_sb.bg_color = Color(0.2, 0.65, 0.4, 1)
	ok_sb.corner_radius_top_left = 8
	ok_sb.corner_radius_top_right = 8
	ok_sb.corner_radius_bottom_left = 8
	ok_sb.corner_radius_bottom_right = 8
	ok_btn.add_theme_stylebox_override("normal", ok_sb)
	ok_btn.add_theme_color_override("font_color", Color.WHITE)
	ok_btn.pressed.connect(func():
		cancelled = false
		confirm_overlay.queue_free()
		get_tree().paused = false)
	btns.add_child(ok_btn)
	get_tree().paused = true
	AudioManager.play_ui_sound("ui_click")
	while confirm_overlay.is_inside_tree():
		await get_tree().process_frame
	return not cancelled

func _show_submission_result(result: Dictionary) -> void:
	var wrong_slots: Array = result.get("cards_wrong", [])
	for ws in wrong_slots:
		timeline_component.animate_slot_result(int(ws["slot"]), false)
		await get_tree().create_timer(0.08).timeout
	if result.get("passed", false):
		for i in range(GameManager.get_timeline_size()):
			var card_id: String = GameManager.get_timeline_slot_card_id(i)
			if card_id:
				timeline_component.animate_slot_result(i, true)
		await get_tree().create_timer(0.6).timeout
		var level_ids: Array = ConfigManager.get_level_ids()
		var idx: int = level_ids.find(GameManager.current_level_id)
		var has_next: bool = (idx >= 0 and idx < level_ids.size() - 1)
		result_panel.show_success(result, has_next)
		EventBus.emit_signal("feedback_shown", "推理成功！" + str(result.get("success_message", "")), "success", 3.0)
	else:
		await get_tree().create_timer(0.5).timeout
		var state_after: int = GameManager.current_state
		if state_after == GameManager.GameState.LEVEL_FAILED:
			result_panel.show_failure(result)
			EventBus.emit_signal("feedback_shown", "推理失败，请查看失败原因分析。", "error", 3.0)
		else:
			EventBus.emit_signal("feedback_shown", "推理不正确，剩余尝试次数：%d" % [int(ConfigManager.get_game_setting("game.max_attempts", 3)) - int(GameManager.attempts)], "warning", 3.0)

func _on_pause_pressed() -> void:
	if settings_panel.visible:
		return
	if tag_panel.visible or hint_panel.visible or link_panel.visible:
		return
	if GameManager.current_state == GameManager.GameState.PLAYING:
		GameManager.toggle_pause()
		pause_menu.show_menu()
	elif GameManager.current_state == GameManager.GameState.PAUSED:
		GameManager.toggle_pause()
		pause_menu.hide_menu()

func _on_resume() -> void:
	GameManager.toggle_pause()
	pause_menu.hide_menu()

func _on_restart() -> void:
	result_panel.hide()
	pause_menu.hide_menu()
	GameManager.restart_level()
	level_config = GameManager.current_level_config
	_setup_from_config()

func _on_next_level() -> void:
	result_panel.hide()
	var level_ids: Array = ConfigManager.get_level_ids()
	var idx: int = level_ids.find(GameManager.current_level_id)
	if idx >= 0 and idx < level_ids.size() - 1:
		GameManager.start_level(str(level_ids[idx + 1]))
		level_config = GameManager.current_level_config
		_setup_from_config()

func _on_show_settings() -> void:
	settings_panel.show_panel()

func _on_back_to_menu() -> void:
	pause_menu.hide_menu()
	result_panel.hide()
	GameManager.back_to_menu()

func _on_settings_changed_global(category: String) -> void:
	if category == "performance_hud" or category == "all":
		perf_hud.set_show(SaveManager.get_setting("gameplay.show_performance_stats", false))
