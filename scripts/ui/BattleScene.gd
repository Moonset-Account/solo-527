extends Control
## 战斗场景控制器 - 核心游戏循环的UI层
## 负责协调手牌区、展品区、资源UI、回合控制等所有UI子组件

const CardUIPrefab: PackedScene = preload("res://scenes/components/CardUI.tscn")
const ExhibitUIPrefab: PackedScene = preload("res://scenes/components/ExhibitUI.tscn")

var event_system: EventSystem
var exhibit_uis: Dictionary = {}
var card_uis: Array = []

var selected_card_index: int = -1
var is_target_mode: bool = false

@onready var background: ColorRect = $Background
@onready var top_bar: Control = $TopBar
@onready var turn_label: Label = $TopBar/TurnLabel
@onready var budget_label: Label = $TopBar/ResourceBar/BudgetLabel
@onready var tools_label: Label = $TopBar/ResourceBar/ToolsLabel
@onready var experts_label: Label = $TopBar/ResourceBar/ExpertsLabel
@onready var deck_info_label: Label = $TopBar/DeckInfoLabel
@onready var level_name_label: Label = $TopBar/LevelNameLabel

@onready var exhibits_container: HBoxContainer = $CenterContainer/ExhibitsContainer
@onready var hand_container: Control = $HandContainer
@onready var end_turn_button: Button = $BottomBar/EndTurnButton
@onready var menu_button: Button = $BottomBar/MenuButton
@onready var deck_pile: Control = $BottomBar/DeckPile
@onready var discard_pile: Control = $BottomBar/DiscardPile
@onready var pile_label_draw: Label = $BottomBar/DeckPile/PileLabel
@onready var pile_label_discard: Label = $BottomBar/DiscardPile/PileLabel

@onready var event_banner_container: Control = $EventBannerContainer

@onready var result_panel: Control = $ResultPanel
@onready var result_title: Label = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/ResultTitle
@onready var result_message: Label = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/ResultMessage
@onready var result_reasons: VBoxContainer = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/ReasonsContainer
@onready var result_stats: VBoxContainer = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/StatsContainer
@onready var retry_button: Button = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/ButtonRow/RetryButton
@onready var next_button: Button = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/ButtonRow/NextButton
@onready var reward_panel: Control = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/RewardPanel
@onready var reward_cards_container: HBoxContainer = $ResultPanel/ResultCenter/ResultBox/VBoxContainer/ResultMargin/InnerVBox/RewardPanel/RewardCardsContainer

var _reward_card_ids: Array = []
var _reward_selected_id: String = ""

func _ready() -> void:
	anchor_right = 1.0
	anchor_bottom = 1.0
	event_system = EventSystem.new()
	add_child(event_system)
	_setup_theme()
	_connect_event_listeners()
	_connect_ui_buttons()
	var pending: String = GameManager.get("pending_level") if "pending_level" in GameManager else ""
	if pending != "":
		GameManager.set("pending_level", "")
		call_deferred("_start_pending_level", pending)

func _start_pending_level(level_id: String) -> void:
	initialize_battle(level_id)
	
func _setup_theme() -> void:
	if background:
		background.color = Color(0.08, 0.06, 0.05, 1.0)

func _connect_event_listeners() -> void:
	EventBus.turn_started.connect(_on_turn_started)
	EventBus.turn_ended.connect(_on_turn_ended)
	EventBus.resources_changed.connect(_on_resources_changed)
	EventBus.hand_changed.connect(_on_hand_changed)
	EventBus.card_drawn.connect(_on_card_drawn)
	EventBus.card_played.connect(_on_card_played)
	EventBus.card_play_failed.connect(_on_card_play_failed)
	EventBus.exhibit_repaired.connect(_on_exhibit_repaired)
	EventBus.exhibit_damaged.connect(_on_exhibit_damaged)
	EventBus.exhibit_completed.connect(_on_exhibit_completed)
	EventBus.exhibit_failed.connect(_on_exhibit_failed)
	EventBus.exhibit_target_mode.connect(_on_target_mode)
	EventBus.level_started.connect(_on_level_started)
	EventBus.level_completed.connect(_on_level_completed)
	EventBus.level_failed.connect(_on_level_failed)
	EventBus.event_triggered.connect(_on_event_triggered)

func _connect_ui_buttons() -> void:
	if end_turn_button:
		end_turn_button.pressed.connect(_on_end_turn_pressed)
	if menu_button:
		menu_button.pressed.connect(_on_menu_pressed)
	if retry_button:
		retry_button.pressed.connect(_on_retry_pressed)
	if next_button:
		next_button.pressed.connect(_on_next_pressed)

func initialize_battle(level_id: String) -> void:
	GameManager.enter_level(level_id)

func _on_level_started(level_data: Dictionary) -> void:
	event_system.load_events(level_data.get("events", []))
	_refresh_level_info(level_data)
	_build_exhibits(GameManager.get_all_exhibits())
	_refresh_deck_piles()
	result_panel.visible = false
	reward_panel.visible = false
	_set_controls_enabled(true)

func _refresh_level_info(level_data: Dictionary) -> void:
	if level_name_label:
		level_name_label.text = level_data.get("name", "")
	_update_turn_label()
	_on_resources_changed(ResourceManager.current_budget, ResourceManager.repair_tools, ResourceManager.expert_count)

func _update_turn_label() -> void:
	if turn_label:
		var remaining: int = ResourceManager.get_turns_remaining()
		turn_label.text = "回合 %d / %d (剩余 %d)" % [ResourceManager.turn_number, ResourceManager.max_turns, remaining]

func _build_exhibits(exhibits_dict: Dictionary) -> void:
	for old in exhibit_uis.values():
		if is_instance_valid(old):
			old.queue_free()
	exhibit_uis.clear()
	if not exhibits_container:
		return
	for child in exhibits_container.get_children():
		child.queue_free()
	
	var count: int = exhibits_dict.size()
	var spacing: float = 20.0
	if count > 4:
		spacing = 10.0
	exhibits_container.add_theme_constant_override("separation", int(spacing))
	var i: int = 0
	var exhibit_list: Array = []
	for id in exhibits_dict.keys():
		exhibit_list.append(exhibits_dict[id])
	exhibit_list.sort_custom(func(a, b): return a.current_progress < b.current_progress)
	
	for ex_data in exhibit_list:
		var ex_id: String = ex_data.id
		var ui: ExhibitUI = ExhibitUI.new()
		ui.setup(ex_data)
		ui.set_selectable(true)
		ui.exhibit_clicked.connect(_on_exhibit_clicked)
		ui.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		exhibits_container.add_child(ui)
		exhibit_uis[ex_id] = ui
		i += 1

func _on_hand_changed(new_hand: Array) -> void:
	_refresh_hand_uis(new_hand)
	_update_card_playability()

func _on_card_drawn(card_data: Dictionary, index: int) -> void:
	pass

func _refresh_hand_uis(hand: Array) -> void:
	for ui in card_uis:
		if is_instance_valid(ui):
			ui.queue_free()
	card_uis.clear()
	if not hand_container:
		return
	for child in hand_container.get_children():
		child.queue_free()
	
	var count: int = hand.size()
	var hand_width: float = hand_container.size.x
	var card_width: float = 140.0
	var overlap: float = 20.0
	var total_w: float = count * (card_width - overlap) + overlap
	var start_x: float = (hand_width - total_w) * 0.5
	var base_y: float = 10.0
	var fan_angle: float = 0.0
	if count > 5:
		fan_angle = 0.02 * (count - 5)
	
	for i in range(count):
		var card_id: String = hand[i]
		var data: Dictionary = CardRegistry.get_card(card_id)
		var ui: CardUI = CardUI.new()
		ui.setup(data, i)
		var x: float = start_x + i * (card_width - overlap)
		var center_offset: float = (i - (count - 1) * 0.5)
		var rot: float = center_offset * fan_angle
		var extra_y: float = abs(center_offset) * 8.0
		var pos: Vector2 = Vector2(x, base_y + extra_y)
		ui.set_base_position(pos, rot)
		ui.z_index = i
		ui.card_clicked.connect(_on_card_clicked)
		ui.card_hovered.connect(_on_card_hovered)
		hand_container.add_child(ui)
		card_uis.append(ui)
	_update_card_playability()

func _update_card_playability() -> void:
	for i in range(card_uis.size()):
		var ui: CardUI = card_uis[i]
		var data: Dictionary = ui.card_data
		var cost: Dictionary = data.get("cost", {})
		var can_play: bool = ResourceManager.can_afford(cost)
		can_play = can_play and GameManager.current_state == GameManager.GameState.COMBAT_ACTIVE
		ui.set_playable(can_play)
		ui.set_selected(selected_card_index == i)

func _on_card_clicked(card_ui: CardUI) -> void:
	if not card_ui.is_playable:
		card_ui.play_shake_animation()
		var cost: Dictionary = card_ui.card_data.get("cost", {})
		var reason: String = ResourceManager.get_unaffordable_reason(cost)
		if reason.is_empty():
			reason = "现在不能出牌"
		EventBus.publish("ui_toast", [reason, "error", 1.8])
		AudioManager.play_card_play(false)
		return
	
	var idx: int = card_ui.hand_index
	var data: Dictionary = card_ui.card_data
	var requires_target: bool = data.get("requires_target", false)
	if requires_target:
		selected_card_index = idx
		GameManager.try_play_card(idx, "")
	else:
		selected_card_index = -1
		_play_card_animation(card_ui)
		GameManager.try_play_card(idx, "")

func _on_card_hovered(card_ui: CardUI, hovered: bool) -> void:
	if not is_target_mode:
		return
	if not hovered:
		return

func _play_card_animation(card_ui: CardUI) -> void:
	var mid_screen: Vector2 = Vector2(size.x * 0.5 - 70, size.y * 0.35)
	card_ui.play_play_animation(mid_screen, func():
		if is_instance_valid(card_ui):
			card_ui.queue_free()
	)

func _on_card_played(card_data: Dictionary, target_id: String) -> void:
	selected_card_index = -1
	if is_target_mode:
		is_target_mode = false
		_cancel_target_highlights()
	_update_card_playability()

func _on_card_play_failed(card_data: Dictionary, reason: String) -> void:
	selected_card_index = -1
	_update_card_playability()

func _on_target_mode(enabled: bool, valid_targets: Array) -> void:
	is_target_mode = enabled
	if enabled:
		_highlight_valid_targets(valid_targets)
		EventBus.publish("ui_toast", ["请点击高亮展品作为目标，按ESC取消", "info", 2.5])
	else:
		_cancel_target_highlights()

func _highlight_valid_targets(valid_ids: Array) -> void:
	for id in exhibit_uis:
		var ui: ExhibitUI = exhibit_uis[id]
		ui.set_targetable(id in valid_ids)

func _cancel_target_highlights() -> void:
	for id in exhibit_uis:
		exhibit_uis[id].set_targetable(false)

func _on_exhibit_clicked(exhibit_ui: ExhibitUI) -> void:
	if is_target_mode:
		GameManager.select_target(exhibit_ui.exhibit_id)
		is_target_mode = false
		_cancel_target_highlights()
		if selected_card_index >= 0 and selected_card_index < card_uis.size():
			_play_card_animation(card_uis[selected_card_index])
		selected_card_index = -1
		return
	EventBus.publish("exhibit_selected", [exhibit_ui.exhibit_id])
	for id in exhibit_uis:
		exhibit_uis[id].set_selected(exhibit_ui.exhibit_id == id)

func _on_exhibit_repaired(exhibit_id: String, amount: int, new_progress: int) -> void:
	if exhibit_uis.has(exhibit_id):
		var ex: Dictionary = GameManager.get_exhibit(exhibit_id)
		exhibit_uis[exhibit_id].update_data(ex)
		exhibit_uis[exhibit_id].play_repair_animation(amount)

func _on_exhibit_damaged(exhibit_id: String, amount: int, new_condition: int) -> void:
	if exhibit_uis.has(exhibit_id):
		var ex: Dictionary = GameManager.get_exhibit(exhibit_id)
		exhibit_uis[exhibit_id].update_data(ex)
		if amount > 0:
			exhibit_uis[exhibit_id].play_damage_animation(amount)

func _on_exhibit_completed(exhibit_id: String) -> void:
	if exhibit_uis.has(exhibit_id):
		var ex: Dictionary = GameManager.get_exhibit(exhibit_id)
		exhibit_uis[exhibit_id].update_data(ex)
		exhibit_uis[exhibit_id].play_complete_animation()
	_refresh_deck_piles()

func _on_exhibit_failed(exhibit_id: String, reason: String) -> void:
	if exhibit_uis.has(exhibit_id):
		var ex: Dictionary = GameManager.get_exhibit(exhibit_id)
		exhibit_uis[exhibit_id].update_data(ex)
		exhibit_uis[exhibit_id].play_fail_animation()

func _on_turn_started(turn_num: int) -> void:
	_update_turn_label()
	_refresh_deck_piles()
	event_system.check_and_apply_events(turn_num)
	AudioManager.play_sfx(AudioManager.SFXType.TURN_START)
	_banner_flash(top_bar, Color(0.3, 0.5, 0.8, 0.4))
	_update_card_playability()
	_set_controls_enabled(true)

func _on_turn_ended(turn_num: int) -> void:
	_set_controls_enabled(false)
	AudioManager.play_sfx(AudioManager.SFXType.TURN_END)

func _set_controls_enabled(enabled: bool) -> void:
	if end_turn_button:
		end_turn_button.disabled = not enabled

func _banner_flash(control: Control, color: Color) -> void:
	var original_modulate: Color = control.modulate
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	control.modulate = color
	t.tween_property(control, "modulate", original_modulate, 0.4)

func _on_resources_changed(budget: int, tools: int, experts: int) -> void:
	if budget_label:
		_bounce_text(budget_label, "预算: %d" % budget, Color(1, 0.85, 0.3))
	if tools_label:
		tools_label.text = "🔧 工具: %d" % tools
	if experts_label:
		experts_label.text = "👤 专家: %d" % experts

func _bounce_text(label: Label, new_text: String, _highlight: Color) -> void:
	label.text = new_text
	var t: Tween = create_tween().set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	t.tween_property(label, "scale", Vector2(1.2, 1.2), 0.1)
	t.tween_property(label, "scale", Vector2(1.0, 1.0), 0.2)

func _refresh_deck_piles() -> void:
	var sizes: Dictionary = GameManager.get_deck_sizes()
	if pile_label_draw:
		pile_label_draw.text = "抽牌堆\n%d张" % sizes.draw
	if pile_label_discard:
		pile_label_discard.text = "弃牌堆\n%d张" % sizes.discard

func _on_end_turn_pressed() -> void:
	AudioManager.play_ui_click()
	GameManager.end_player_turn()

func _on_menu_pressed() -> void:
	AudioManager.play_ui_click()
	GameManager.return_to_menu()
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _on_event_triggered(event_data: Dictionary) -> void:
	_show_event_banner(event_data)

func _show_event_banner(event_data: Dictionary) -> void:
	if not event_banner_container:
		return
	for child in event_banner_container.get_children():
		child.queue_free()
	var panel: PanelContainer = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.7, 0.15, 0.15, 0.95)
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	panel.add_theme_stylebox_override("panel", sb)
	var vb: VBoxContainer = VBoxContainer.new()
	var margin: MarginContainer = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 24)
	margin.add_theme_constant_override("margin_right", 24)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_bottom", 12)
	margin.add_child(vb)
	var title: Label = Label.new()
	title.text = "【事件】" + event_data.get("name", "突发事件")
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(1, 1, 0.8))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var desc: Label = Label.new()
	desc.text = event_data.get("description", "")
	desc.add_theme_font_size_override("font_size", 14)
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(title)
	vb.add_child(desc)
	panel.add_child(margin)
	panel.modulate.a = 0.0
	event_banner_container.add_child(panel)
	var t: Tween = create_tween().set_trans(Tween.TRANS_BACK)
	t.tween_property(panel, "modulate:a", 1.0, 0.4)
	t.tween_interval(2.5)
	t.tween_property(panel, "modulate:a", 0.0, 0.5)
	t.tween_callback(panel.queue_free)

func _on_level_completed(level_data: Dictionary, rewards: Array) -> void:
	_show_result_panel(true, level_data, rewards, [])

func _on_level_failed(level_data: Dictionary, reasons: Array) -> void:
	_show_result_panel(false, level_data, [], reasons)

func _show_result_panel(won: bool, level_data: Dictionary, rewards: Array, reasons: Array) -> void:
	result_panel.visible = true
	result_panel.modulate.a = 0.0
	if result_title:
		result_title.text = "✦ 修复成功 ✦" if won else "✗ 修复任务失败 ✗"
		result_title.add_theme_color_override("font_color", Color(0.4, 0.9, 0.5) if won else Color(0.95, 0.3, 0.3))
	if result_message:
		result_message.text = level_data.get("name", "") + "\n" + ("出色地完成了所有展品修复！" if won else "部分展品未能成功修复。")
	for child in result_reasons.get_children():
		child.queue_free()
	if not won:
		for r in reasons:
			var lbl: Label = Label.new()
			lbl.text = "  ⚠ " + r
			lbl.add_theme_font_size_override("font_size", 14)
			lbl.add_theme_color_override("font_color", Color(1.0, 0.7, 0.6))
			result_reasons.add_child(lbl)
	for child in result_stats.get_children():
		child.queue_free()
	var stats_rows: Array = [
		["回合数", str(GameManager.session_stats.turns_taken)],
		["打出卡牌", str(GameManager.session_stats.cards_played)],
		["修复展品", str(GameManager.session_stats.exhibits_completed) + "/" + str(GameManager.exhibits.size())],
		["资源消耗", str(GameManager.session_stats.resources_spent)],
		["累计损伤", str(GameManager.session_stats.damage_taken)]
	]
	for row in stats_rows:
		var hb: HBoxContainer = HBoxContainer.new()
		var k: Label = Label.new()
		k.text = row[0]
		k.custom_minimum_size = Vector2(120, 0)
		k.add_theme_font_size_override("font_size", 14)
		var v: Label = Label.new()
		v.text = row[1]
		v.add_theme_font_size_override("font_size", 14)
		v.add_theme_color_override("font_color", Color(0.9, 0.85, 0.6))
		hb.add_child(k)
		hb.add_child(v)
		result_stats.add_child(hb)
	if retry_button:
		retry_button.visible = true
	if next_button:
		next_button.visible = won
		next_button.text = "领取奖励" if won else "返回"
	if won:
		reward_panel.visible = true
		for child in reward_cards_container.get_children():
			child.queue_free()
		_reward_card_ids = CardRegistry.draw_reward_cards(level_data.get("reward_cards_count", 3), level_data.get("reward_difficulty", "normal"))
		_reward_selected_id = ""
		for i in range(_reward_card_ids.size()):
			var cid: String = _reward_card_ids[i]
			var data: Dictionary = CardRegistry.get_card(cid)
			var ui: CardUI = CardUI.new()
			ui.setup(data, i)
			ui.set_playable(true)
			ui.card_clicked.connect(_on_reward_card_clicked.bind(cid, ui))
			reward_cards_container.add_child(ui)
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	t.tween_property(result_panel, "modulate:a", 1.0, 0.6)

func _on_reward_card_clicked(_card_ui: Control, card_id: String, _ui_ref) -> void:
	AudioManager.play_sfx(AudioManager.SFXType.REWARD)
	_reward_selected_id = card_id
	for child in reward_cards_container.get_children():
		if child is CardUI:
			child.set_selected(child == _card_ui)

func _on_retry_pressed() -> void:
	AudioManager.play_ui_click()
	var level_id: String = GameManager.current_level_id
	GameManager.set("pending_level", level_id)
	GameManager.retry_level()
	get_tree().change_scene_to_file("res://scenes/BattleScene.tscn")

func _on_next_pressed() -> void:
	AudioManager.play_ui_click()
	var selected: Array = []
	if _reward_selected_id != "":
		selected.append(_reward_selected_id)
	GameManager.claim_rewards(selected)
	get_tree().change_scene_to_file("res://scenes/LevelSelect.tscn")

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if is_target_mode:
			GameManager.cancel_target_selection()
			is_target_mode = false
			_cancel_target_highlights()
			selected_card_index = -1
			_update_card_playability()
	elif event.is_action_pressed("end_turn"):
		if end_turn_button and not end_turn_button.disabled:
			_on_end_turn_pressed()
