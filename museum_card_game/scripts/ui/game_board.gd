extends Control

var selected_hand_index: int = -1
var _budget_label: Label
var _turn_label: Label
var _level_label: Label
var _end_turn_btn: Button
var _exhibit_container: HBoxContainer
var _hand_container: HBoxContainer
var _exhibit_uis: Array = []
var _card_uis: Array = []
var _event_panel: PanelContainer
var _event_name_label: Label
var _event_desc_label: Label
var _event_continue_btn: Button
var _tutorial_panel: PanelContainer
var _tutorial_label: Label
var _tutorial_next_btn: Button
var _tutorial_step: int = 0
var _message_label: Label
var _message_timer: float = 0.0
var _debug_panel: PanelContainer
var _debug_visible: bool = false
var _feedback_label: Label
var _feedback_timer: float = 0.0

const TUTORIAL_STEPS: Array = [
	"欢迎来到博物馆修复部！你的目标是将所有展品恢复到满状态。",
	"上方是展品区域，每件展品有状态条和每回合恶化速率。",
	"下方是你的手牌。每张卡牌左上角是费用，需要消耗预算才能打出。",
	"点击一张手牌选中它，然后点击展品来打出这张牌。",
	"右上角是「结束回合」按钮。每回合结束后展品会自动恶化。",
	"预算卡和部分特殊卡不需要选择展品目标，点击即可直接打出。",
	"如果展品状态降到0，或者超过最大回合数，你就失败了。祝你好运！"
]

func _ready() -> void:
	_build_ui()
	_connect_signals()
	_refresh_all()
	if GameManager.current_state == GameManager.GameState.TUTORIAL:
		_show_tutorial()
	print("[GAME_BOARD] _ready done, state=", GameManager.current_state, " hand=", GameManager.hand.size(), " exhibits=", GameManager.exhibits.size())

func _process(delta: float) -> void:
	if _message_timer > 0:
		_message_timer -= delta
		if _message_timer <= 0:
			_message_label.visible = false
	if _feedback_timer > 0:
		_feedback_timer -= delta
		if _feedback_timer <= 0:
			_feedback_label.visible = false

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("debug_toggle"):
		_debug_visible = not _debug_visible
		_debug_panel.visible = _debug_visible
		if _debug_visible:
			_refresh_debug()
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if selected_hand_index >= 0:
			_deselect_card()

func _build_ui() -> void:
	var bg = ColorRect.new()
	bg.color = Color("#1a1a2e")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var root_vbox = VBoxContainer.new()
	root_vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	root_vbox.add_theme_constant_override("separation", 0)
	add_child(root_vbox)

	print("[GAME_BOARD] _build_ui starting...")
	_build_top_bar(root_vbox)
	_build_exhibit_area(root_vbox)
	_build_message_area(root_vbox)
	_build_hand_area(root_vbox)
	_build_feedback_label()
	_build_event_popup()
	_build_tutorial_panel()
	_build_debug_panel()
	print("[GAME_BOARD] _build_ui done")

func _build_top_bar(parent: VBoxContainer) -> void:
	var bar = HBoxContainer.new()
	bar.custom_minimum_size = Vector2(0, 60)
	bar.add_theme_constant_override("separation", 16)

	var bar_bg = ColorRect.new()
	bar_bg.color = Color("#0f1a2e")
	bar_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bar_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_child(bar_bg)

	var left_spacer = Control.new()
	left_spacer.custom_minimum_size = Vector2(20, 0)
	bar.add_child(left_spacer)

	_budget_label = Label.new()
	_budget_label.add_theme_font_size_override("font_size", 20)
	_budget_label.add_theme_color_override("font_color", Color("#ffd700"))
	_budget_label.custom_minimum_size = Vector2(150, 0)
	bar.add_child(_budget_label)

	_turn_label = Label.new()
	_turn_label.add_theme_font_size_override("font_size", 18)
	_turn_label.add_theme_color_override("font_color", Color.WHITE)
	_turn_label.custom_minimum_size = Vector2(150, 0)
	bar.add_child(_turn_label)

	_level_label = Label.new()
	_level_label.add_theme_font_size_override("font_size", 16)
	_level_label.add_theme_color_override("font_color", Color("#aaaaaa"))
	_level_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_level_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bar.add_child(_level_label)

	_end_turn_btn = Button.new()
	_end_turn_btn.text = "结束回合"
	_end_turn_btn.custom_minimum_size = Vector2(120, 40)
	_end_turn_btn.add_theme_font_size_override("font_size", 16)
	bar.add_child(_end_turn_btn)

	var menu_btn = Button.new()
	menu_btn.text = "菜单"
	menu_btn.custom_minimum_size = Vector2(60, 40)
	menu_btn.add_theme_font_size_override("font_size", 14)
	menu_btn.pressed.connect(func(): GameManager.change_state(GameManager.GameState.MENU))
	bar.add_child(menu_btn)

	var right_spacer = Control.new()
	right_spacer.custom_minimum_size = Vector2(20, 0)
	bar.add_child(right_spacer)

	parent.add_child(bar)

func _build_exhibit_area(parent: VBoxContainer) -> void:
	var section = VBoxContainer.new()
	section.size_flags_vertical = Control.SIZE_EXPAND_FILL
	section.add_theme_constant_override("separation", 8)
	parent.add_child(section)

	var header = Label.new()
	header.text = "── 展品区域 ──"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	header.add_theme_font_size_override("font_size", 14)
	header.add_theme_color_override("font_color", Color("#557799"))
	section.add_child(header)

	_exhibit_container = HBoxContainer.new()
	_exhibit_container.alignment = BoxContainer.ALIGNMENT_CENTER
	_exhibit_container.add_theme_constant_override("separation", 20)
	_exhibit_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	section.add_child(_exhibit_container)

func _build_message_area(parent: VBoxContainer) -> void:
	_message_label = Label.new()
	_message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_message_label.add_theme_font_size_override("font_size", 14)
	_message_label.add_theme_color_override("font_color", Color("#e94560"))
	_message_label.custom_minimum_size = Vector2(0, 24)
	_message_label.visible = false
	parent.add_child(_message_label)

func _build_hand_area(parent: VBoxContainer) -> void:
	var section = VBoxContainer.new()
	section.custom_minimum_size = Vector2(0, 220)
	section.add_theme_constant_override("separation", 4)
	parent.add_child(section)

	var header = Label.new()
	header.text = "── 手牌 ──"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	header.add_theme_font_size_override("font_size", 14)
	header.add_theme_color_override("font_color", Color("#557799"))
	section.add_child(header)

	_hand_container = HBoxContainer.new()
	_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	_hand_container.add_theme_constant_override("separation", 8)
	_hand_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	section.add_child(_hand_container)

func _build_feedback_label() -> void:
	_feedback_label = Label.new()
	_feedback_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_feedback_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_feedback_label.add_theme_font_size_override("font_size", 22)
	_feedback_label.add_theme_color_override("font_color", Color("#2ecc71"))
	_feedback_label.set_anchors_preset(Control.PRESET_CENTER)
	_feedback_label.position = Vector2(640, 300)
	_feedback_label.visible = false
	add_child(_feedback_label)

func _build_event_popup() -> void:
	_event_panel = PanelContainer.new()
	_event_panel.set_anchors_preset(Control.PRESET_CENTER)
	_event_panel.custom_minimum_size = Vector2(400, 200)
	_event_panel.position = Vector2(440, 260)
	_event_panel.visible = false
	add_child(_event_panel)

	var style = StyleBoxFlat.new()
	style.bg_color = Color("#1a1a3e")
	style.border_color = Color("#e94560")
	style.border_width_bottom = 3
	style.border_width_top = 3
	style.border_width_left = 3
	style.border_width_right = 3
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12
	_event_panel.add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	_event_panel.add_child(vbox)

	var header = Label.new()
	header.text = "⚠ 突发事件"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	header.add_theme_font_size_override("font_size", 20)
	header.add_theme_color_override("font_color", Color("#e94560"))
	vbox.add_child(header)

	_event_name_label = Label.new()
	_event_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_event_name_label.add_theme_font_size_override("font_size", 18)
	_event_name_label.add_theme_color_override("font_color", Color("#ffd700"))
	vbox.add_child(_event_name_label)

	_event_desc_label = Label.new()
	_event_desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_event_desc_label.add_theme_font_size_override("font_size", 14)
	_event_desc_label.add_theme_color_override("font_color", Color("#cccccc"))
	_event_desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_event_desc_label.custom_minimum_size = Vector2(360, 0)
	vbox.add_child(_event_desc_label)

	_event_continue_btn = Button.new()
	_event_continue_btn.text = "继续"
	_event_continue_btn.custom_minimum_size = Vector2(120, 36)
	_event_continue_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	vbox.add_child(_event_continue_btn)

func _build_tutorial_panel() -> void:
	_tutorial_panel = PanelContainer.new()
	_tutorial_panel.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	_tutorial_panel.custom_minimum_size = Vector2(280, 0)
	_tutorial_panel.visible = false
	add_child(_tutorial_panel)

	var style = StyleBoxFlat.new()
	style.bg_color = Color("#0a2a1a")
	style.border_color = Color("#2ecc71")
	style.border_width_bottom = 2
	style.border_width_top = 2
	style.border_width_left = 2
	style.border_width_right = 2
	_tutorial_panel.add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	_tutorial_panel.add_child(vbox)

	var header = Label.new()
	header.text = "📖 教程"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	header.add_theme_font_size_override("font_size", 18)
	header.add_theme_color_override("font_color", Color("#2ecc71"))
	vbox.add_child(header)

	_tutorial_label = Label.new()
	_tutorial_label.add_theme_font_size_override("font_size", 14)
	_tutorial_label.add_theme_color_override("font_color", Color("#cccccc"))
	_tutorial_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_tutorial_label.custom_minimum_size = Vector2(240, 0)
	vbox.add_child(_tutorial_label)

	_tutorial_next_btn = Button.new()
	_tutorial_next_btn.text = "下一步"
	_tutorial_next_btn.custom_minimum_size = Vector2(100, 32)
	_tutorial_next_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	vbox.add_child(_tutorial_next_btn)

func _build_debug_panel() -> void:
	_debug_panel = PanelContainer.new()
	_debug_panel.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	_debug_panel.custom_minimum_size = Vector2(260, 0)
	_debug_panel.visible = false
	add_child(_debug_panel)

	var dbg_style = StyleBoxFlat.new()
	dbg_style.bg_color = Color(0, 0, 0, 0.85)
	dbg_style.border_color = Color("#2ecc71")
	dbg_style.border_width_right = 2
	_debug_panel.add_theme_stylebox_override("panel", dbg_style)

	var inner = VBoxContainer.new()
	inner.add_theme_constant_override("separation", 4)
	_debug_panel.add_child(inner)

	var title = Label.new()
	title.text = "🔧 调试面板 (F2)"
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", Color("#2ecc71"))
	inner.add_child(title)

	var btn_add_budget = Button.new()
	btn_add_budget.text = "+3 预算"
	btn_add_budget.pressed.connect(func(): GameManager.budget += 3; GameManager.budget_changed.emit(GameManager.budget); _refresh_all())
	inner.add_child(btn_add_budget)

	var btn_full_heal = Button.new()
	btn_full_heal.text = "满修复所有展品"
	btn_full_heal.pressed.connect(func():
		for ex in GameManager.exhibits:
			ex["current_condition"] = ex["max_condition"]
		if GameManager.check_win():
			GameManager.level_completed.emit(GameManager.current_level_id, true)
			GameManager.change_state(GameManager.GameState.SETTLEMENT)
		else:
			_refresh_all()
	)
	inner.add_child(btn_full_heal)

	var btn_draw = Button.new()
	btn_draw.text = "抽一张牌"
	btn_draw.pressed.connect(func(): GameManager.draw_card(); _refresh_all())
	inner.add_child(btn_draw)

	var btn_kill = Button.new()
	btn_kill.text = "杀死第一个展品"
	btn_kill.pressed.connect(func():
		if GameManager.exhibits.size() > 0:
			GameManager.exhibits[0]["current_condition"] = 0
			if GameManager.check_loss():
				GameManager.level_completed.emit(GameManager.current_level_id, false)
				GameManager.change_state(GameManager.GameState.SETTLEMENT)
			else:
				_refresh_all()
	)
	inner.add_child(btn_kill)

	var btn_force_event = Button.new()
	btn_force_event.text = "强制触发事件"
	btn_force_event.pressed.connect(func():
		var ev = LevelDatabase.get_events_for_turn(GameManager.turn_number)
		if ev.size() > 0:
			_show_event(ev[randi() % ev.size()])
	)
	inner.add_child(btn_force_event)

	var btn_back = Button.new()
	btn_back.text = "返回主菜单"
	btn_back.pressed.connect(func(): GameManager.change_state(GameManager.GameState.MENU))
	inner.add_child(btn_back)

func _connect_signals() -> void:
	_end_turn_btn.pressed.connect(_on_end_turn)
	_event_continue_btn.pressed.connect(_on_event_continue)
	_tutorial_next_btn.pressed.connect(_on_tutorial_next)
	GameManager.budget_changed.connect(_on_budget_changed)
	GameManager.turn_started.connect(_on_turn_started)
	GameManager.exhibit_changed.connect(_on_exhibit_changed)
	GameManager.card_played.connect(_on_card_played)
	GameManager.event_triggered.connect(_on_event_triggered)
	GameManager.game_state_changed.connect(_on_game_state_changed)

func _refresh_all() -> void:
	_refresh_top_bar()
	_refresh_exhibits()
	_refresh_hand()

func _refresh_top_bar() -> void:
	_budget_label.text = "💰 预算: " + str(GameManager.budget)
	_turn_label.text = "📅 回合: " + str(GameManager.turn_number) + "/" + str(GameManager.max_turns)
	var level_data = LevelDatabase.get_level(GameManager.current_level_id)
	_level_label.text = level_data.get("name", "") if not level_data.is_empty() else ""

func _refresh_exhibits() -> void:
	for ui in _exhibit_uis:
		_exhibit_container.remove_child(ui)
		ui.queue_free()
	_exhibit_uis.clear()

	for i in range(GameManager.exhibits.size()):
		var exhibit_data = GameManager.exhibits[i]
		var needs_target = selected_hand_index >= 0
		var ui_script = load("res://scripts/components/exhibit_ui.gd")
		var ui = PanelContainer.new()
		ui.set_script(ui_script)
		_exhibit_container.add_child(ui)
		ui.setup(i, exhibit_data, needs_target)
		ui.exhibit_clicked.connect(_on_exhibit_clicked)
		_exhibit_uis.append(ui)

func _refresh_hand() -> void:
	for ui in _card_uis:
		_hand_container.remove_child(ui)
		ui.queue_free()
	_card_uis.clear()

	for i in range(GameManager.hand.size()):
		var card_id = GameManager.hand[i]
		var card_data = CardDatabase.get_card(card_id)
		var cost = int(GameManager.display_costs.get(i, card_data.get("cost", 0)))
		var playable = GameManager.budget >= cost

		if card_data.get("card_type", "") == "expert" and GameManager.active_effects.get("block_expert", 0) > 0:
			playable = false
		if card_data.get("card_type", "") == "tool" and GameManager.active_effects.get("block_tools", 0) > 0:
			playable = false

		var ui_script = load("res://scripts/components/card_ui.gd")
		var ui = PanelContainer.new()
		ui.set_script(ui_script)
		_hand_container.add_child(ui)
		ui.setup(i, card_data, cost, playable)
		if i == selected_hand_index:
			ui.set_selected(true)
		ui.card_clicked.connect(_on_card_clicked)
		_card_uis.append(ui)

func _on_card_clicked(index: int) -> void:
	if _event_panel.visible:
		return

	var card_id = GameManager.hand[index]
	var card_data = CardDatabase.get_card(card_id)

	if _card_needs_target(card_data):
		if selected_hand_index == index:
			_deselect_card()
			return
		selected_hand_index = index
		_refresh_hand()
		_refresh_exhibits()
		_show_message("选择一个展品作为目标，或再次点击取消")
	else:
		if GameManager.exhibits.size() == 0:
			_show_message("没有可用的展品目标")
			return
		var played = GameManager.play_card(index, 0)
		if played:
			if is_inside_tree():
				selected_hand_index = -1
				_show_feedback(card_data.get("name", "") + "!")
				_refresh_all()
		else:
			_show_message("无法打出这张牌")

func _on_exhibit_clicked(exhibit_index: int) -> void:
	if selected_hand_index < 0:
		return
	if _event_panel.visible:
		return

	var card_id = GameManager.hand[selected_hand_index]
	var card_data = CardDatabase.get_card(card_id)
	var played = GameManager.play_card(selected_hand_index, exhibit_index)
	if played:
		if is_inside_tree():
			_show_feedback(card_data.get("name", "") + " → " + GameManager.exhibits[exhibit_index].get("name", ""))
			selected_hand_index = -1
			_refresh_all()
	else:
		_show_message("无法在此展品上打出这张牌")

func _on_end_turn() -> void:
	if _event_panel.visible:
		return
	selected_hand_index = -1
	var result = GameManager.end_turn()
	if not is_inside_tree():
		return
	if GameManager.current_state == GameManager.GameState.SETTLEMENT:
		return
	_refresh_all()
	if result.get("event", null) != null and not result.get("won", false) and not result.get("lost", false):
		_show_event(result["event"])

func _on_budget_changed(new_budget: int) -> void:
	_budget_label.text = "💰 预算: " + str(new_budget)
	_refresh_hand()

func _on_turn_started(turn: int) -> void:
	_turn_label.text = "📅 回合: " + str(turn) + "/" + str(GameManager.max_turns)

func _on_exhibit_changed(idx: int) -> void:
	if idx >= 0 and idx < _exhibit_uis.size():
		_exhibit_uis[idx].refresh(GameManager.exhibits[idx], selected_hand_index >= 0)

func _on_card_played(card_data: Dictionary) -> void:
	pass

func _on_event_triggered(event_data: Dictionary) -> void:
	pass

func _on_game_state_changed(new_state: GameManager.GameState) -> void:
	pass

func _on_state_refresh() -> void:
	_tutorial_panel.visible = false
	_refresh_all()

func _on_event_continue() -> void:
	_event_panel.visible = false
	if GameManager.current_state == GameManager.GameState.EVENT:
		GameManager.change_state(GameManager.GameState.PLAYING)
	_refresh_all()

func _on_tutorial_next() -> void:
	_tutorial_step += 1
	if _tutorial_step >= TUTORIAL_STEPS.size():
		_tutorial_panel.visible = false
		GameManager.change_state(GameManager.GameState.PLAYING)
	else:
		_tutorial_label.text = TUTORIAL_STEPS[_tutorial_step]

func _show_event(event_data: Dictionary) -> void:
	_event_name_label.text = event_data.get("name", "未知事件")
	_event_desc_label.text = event_data.get("description", "")
	_event_panel.visible = true

func _show_tutorial() -> void:
	_tutorial_step = 0
	_tutorial_label.text = TUTORIAL_STEPS[0]
	_tutorial_panel.visible = true

func _show_message(text: String) -> void:
	_message_label.text = text
	_message_label.visible = true
	_message_timer = 2.5

func _show_feedback(text: String) -> void:
	_feedback_label.text = text
	_feedback_label.visible = true
	_feedback_timer = 1.0

func _deselect_card() -> void:
	selected_hand_index = -1
	_refresh_hand()
	_refresh_exhibits()

func _card_needs_target(card_data: Dictionary) -> bool:
	var card_type = card_data.get("card_type", "")
	if card_type == "budget":
		return false
	for effect in card_data.get("effects", []):
		var t = effect.get("type", "")
		if t in ["restore_all", "reveal_all_hidden", "prevent_all_degradation"]:
			return false
	return true

func _refresh_debug() -> void:
	pass
