extends Node2D

signal card_played(card: CardData, target: ExhibitData)
signal turn_phase_changed(phase: String)

enum BattlePhase { PLAYER_TURN, ENEMY_TURN, EVENT_PHASE, RESOLVING }

var current_phase: BattlePhase = BattlePhase.PLAYER_TURN
var _repair_boost_next: int = 0
var _skip_next_event: bool = false

@onready var exhibit_display: HBoxContainer = $ExhibitArea/HBoxContainer
@onready var card_hand: HBoxContainer = $CardHandArea/ScrollContainer/HBoxContainer
@onready var budget_label: Label = $TopBar/BudgetLabel
@onready var turn_label: Label = $TopBar/TurnLabel
@onready var pause_button: Button = $TopBar/PauseButton
@onready var end_turn_button: Button = $TopBar/EndTurnButton
@onready var hint_panel: Control = $HintPanel
@onready var event_log: RichTextLabel = $EventLog

func _ready() -> void:
	end_turn_button.pressed.connect(_on_end_turn)
	pause_button.pressed.connect(_on_pause_pressed)
	GameManager.budget_changed.connect(_on_budget_changed)
	GameManager.turn_started.connect(_on_turn_started)
	GameManager.turn_ended.connect(_on_turn_ended)
	GameManager.game_over.connect(_on_game_over)
	_setup_battle()
	_draw_initial_hand()

func _setup_battle() -> void:
	GameManager.player_deck.reset_for_battle()
	_update_budget_display()
	_update_turn_display()
	_display_exhibits()
	_log_message("战斗开始！修复所有展品即可获胜。")

func _draw_initial_hand() -> void:
	GameManager.player_deck.draw_cards(5)
	_refresh_hand_display()

func _on_end_turn() -> void:
	if current_phase != BattlePhase.PLAYER_TURN:
		return
	current_phase = BattlePhase.EVENT_PHASE
	turn_phase_changed.emit("event")
	_process_events()
	current_phase = BattlePhase.ENEMY_TURN
	turn_phase_changed.emit("enemy")
	_process_decay()
	GameManager.end_turn()
	current_phase = BattlePhase.PLAYER_TURN
	turn_phase_changed.emit("player")
	GameManager.player_deck.draw_cards(1)
	_refresh_hand_display()

func _process_events() -> void:
	var chapter_data = GameResources.get_chapter_data(GameManager.current_chapter)
	if not chapter_data:
		return
	var events = chapter_data.get_events_for_level(GameManager.current_level)
	for event_name in events:
		if event_name == "decay":
			continue
		if _skip_next_event:
			_skip_next_event = false
			_log_message("[color=yellow]策展人跳过了事件：%s[/color]" % event_name)
			continue
		var event_data = EventData.create_event(event_name)
		_apply_event(event_data)

func _apply_event(event: EventData) -> void:
	_log_message("[color=red]事件：%s[/color]" % event.description)
	match event.event_type:
		EventData.EventType.DECAY:
			for exhibit in GameManager.exhibit_list:
				if exhibit.state != ExhibitData.ExhibitState.DESTROYED:
					exhibit.apply_decay()
		EventData.EventType.SURPRISE_DAMAGE:
			var targets = _get_random_exhibits(event.target_count)
			for target in targets:
				target.take_damage(event.damage_amount)
				GameManager.record_failure("surprise_damage")
		EventData.EventType.HIDDEN_REVEAL:
			for exhibit in GameManager.exhibit_list:
				if exhibit.hidden_damage > 0 and not exhibit.is_hidden_damage_revealed:
					exhibit.apply_hidden_damage()
					_log_message("[color=orange]%s 的隐藏损伤显现！[/color]" % exhibit.exhibit_name)
		EventData.EventType.EARTHQUAKE:
			for exhibit in GameManager.exhibit_list:
				if exhibit.state != ExhibitData.ExhibitState.DESTROYED:
					exhibit.take_damage(event.damage_amount)
		EventData.EventType.FLOOD:
			for exhibit in GameManager.exhibit_list:
				if exhibit.exhibit_type in ["paper", "textile"]:
					exhibit.take_damage(event.damage_amount)
		EventData.EventType.THEFT_ATTEMPT:
			var targets = _get_random_exhibits(1)
			for target in targets:
				target.take_damage(event.damage_amount)
	_update_exhibit_display()

func _process_decay() -> void:
	for exhibit in GameManager.exhibit_list:
		if exhibit.state != ExhibitData.ExhibitState.DESTROYED and exhibit.state != ExhibitData.ExhibitState.REPAIRED:
			exhibit.apply_decay()
	_update_exhibit_display()

func _check_battle_end() -> void:
	var all_repaired = true
	var any_destroyed = false
	for exhibit in GameManager.exhibit_list:
		if exhibit.state == ExhibitData.ExhibitState.DESTROYED:
			any_destroyed = true
			all_repaired = false
		elif exhibit.state != ExhibitData.ExhibitState.REPAIRED:
			all_repaired = false
	if all_repaired and GameManager.exhibit_list.size() > 0:
		GameManager.is_in_battle = false
		GameManager.last_battle_victory = true
		GameManager.record_victory()
		GameManager.game_over.emit(true)
	elif any_destroyed:
		GameManager.is_in_battle = false
		GameManager.last_battle_victory = false
		GameManager.game_over.emit(false)

func play_card_on_exhibit(card: CardData, exhibit: ExhibitData) -> bool:
	if current_phase != BattlePhase.PLAYER_TURN:
		return false
	if not GameManager.spend_budget(card.cost):
		_log_message("[color=red]预算不足！[/color]")
		return false
	_apply_card_effect(card, exhibit)
	GameManager.player_deck.play_card(card)
	_refresh_hand_display()
	card_played.emit(card, exhibit)
	_update_exhibit_display()
	_check_battle_end()
	return true

func _apply_card_effect(card: CardData, exhibit: ExhibitData) -> void:
	match card.type:
		CardData.CardType.REPAIR:
			var repair = card.repair_value + _repair_boost_next
			_repair_boost_next = 0
			exhibit.heal(repair)
			if card.self_damage > 0:
				exhibit.take_damage(card.self_damage)
			_log_message("[color=cyan]使用 %s 修复 %s，恢复%d点[/color]" % [card.card_name, exhibit.exhibit_name, repair])
			if card.effect == "clean":
				_log_message("[color=cyan]清除了 %s 的污损[/color]" % exhibit.exhibit_name)
			elif card.effect == "reveal":
				if exhibit.hidden_damage > 0 and not exhibit.is_hidden_damage_revealed:
					exhibit.reveal_hidden_damage()
					_log_message("[color=yellow]揭示了 %s 的隐藏损伤！[/color]" % exhibit.exhibit_name)
			elif card.effect == "prevent_decay":
				exhibit.stabilize()
				_log_message("[color=green]%s 本回合不会退化[/color]" % exhibit.exhibit_name)
		CardData.CardType.BUDGET:
			GameManager.player_budget += card.budget_gain
			_update_budget_display()
			_log_message("[color=yellow]使用 %s，获得%d点预算[/color]" % [card.card_name, card.budget_gain])
			if card.draw_count > 0:
				GameManager.player_deck.draw_cards(card.draw_count)
				_refresh_hand_display()
			if card.discard_count > 0:
				_log_message("[color=yellow]需要弃%d张牌[/color]" % card.discard_count)
		CardData.CardType.EXPERT:
			_apply_expert_effect(card, exhibit)

func _apply_expert_effect(card: CardData, exhibit: ExhibitData) -> void:
	match card.effect:
		"exhibit_info":
			if exhibit.hidden_damage > 0:
				_log_message("[color=green]%s 的隐藏损伤：%d点[/color]" % [exhibit.exhibit_name, exhibit.hidden_damage])
			else:
				_log_message("[color=green]%s 没有隐藏损伤[/color]" % exhibit.exhibit_name)
		"repair_boost":
			_repair_boost_next += card.repair_bonus
			_log_message("[color=green]下一次修复+%d[/color]" % card.repair_bonus)
		"stabilize":
			for ex in GameManager.exhibit_list:
				ex.stabilize()
			_log_message("[color=green]所有展品已稳定！[/color]")
		"skip_event":
			_skip_next_event = true
			_log_message("[color=green]将跳过下一个负面事件[/color]")
		"global_stabilize":
			for ex in GameManager.exhibit_list:
				ex.stabilize()
			_log_message("[color=green]本回合所有展品不会退化[/color]")
		_:
			_log_message("使用 %s" % card.card_name)

func _get_random_exhibits(count: int) -> Array[ExhibitData]:
	var alive: Array[ExhibitData] = []
	for exhibit in GameManager.exhibit_list:
		if exhibit.state != ExhibitData.ExhibitState.DESTROYED:
			alive.append(exhibit)
	alive.shuffle()
	var result: Array[ExhibitData] = []
	for i in mini(count, alive.size()):
		result.append(alive[i])
	return result

func _display_exhibits() -> void:
	for child in exhibit_display.get_children():
		child.queue_free()
	for i in GameManager.exhibit_list.size():
		var exhibit = GameManager.exhibit_list[i]
		var panel = _create_exhibit_panel(exhibit, i)
		exhibit_display.add_child(panel)

func _create_exhibit_panel(exhibit: ExhibitData, index: int) -> Control:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(160, 180)
	panel.name = "Exhibit_%d" % index
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	var name_label = Label.new()
	name_label.text = exhibit.exhibit_name
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var type_label = Label.new()
	type_label.text = exhibit.exhibit_type
	type_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var hp_label = Label.new()
	hp_label.name = "HpLabel"
	hp_label.text = "HP: %d/%d" % [exhibit.current_hp, exhibit.max_hp]
	hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var state_label = Label.new()
	state_label.name = "StateLabel"
	state_label.text = exhibit.get_state_text()
	state_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	state_label.add_theme_color_override("font_color", exhibit.get_state_color())
	var progress = ProgressBar.new()
	progress.name = "HpBar"
	progress.min_value = 0
	progress.max_value = exhibit.max_hp
	progress.value = exhibit.current_hp
	progress.custom_minimum_size = Vector2(140, 20)
	var hidden_label = Label.new()
	hidden_label.name = "HiddenLabel"
	if exhibit.hidden_damage > 0:
		if exhibit.is_hidden_damage_revealed:
			hidden_label.text = "隐藏损伤: %d" % exhibit.hidden_damage
		else:
			hidden_label.text = "可能有隐藏损伤"
	hidden_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_label)
	vbox.add_child(type_label)
	vbox.add_child(hp_label)
	vbox.add_child(state_label)
	vbox.add_child(progress)
	vbox.add_child(hidden_label)
	panel.add_child(vbox)
	panel.gui_input.connect(_on_exhibit_input.bind(index))
	return panel

func _on_exhibit_input(event: InputEvent, exhibit_index: int) -> void:
	if event.is_action_pressed("card_play"):
		if current_phase != BattlePhase.PLAYER_TURN:
			return
		var selected_card = _get_selected_card()
		if selected_card:
			var exhibit = GameManager.exhibit_list[exhibit_index]
			play_card_on_exhibit(selected_card, exhibit)

var _selected_card_index: int = -1

func _get_selected_card() -> CardData:
	if _selected_card_index < 0:
		return null
	var hand = GameManager.player_deck.get_hand()
	if _selected_card_index >= hand.size():
		return null
	return hand[_selected_card_index]

func _refresh_hand_display() -> void:
	for child in card_hand.get_children():
		child.queue_free()
	_selected_card_index = -1
	var hand = GameManager.player_deck.get_hand()
	for i in hand.size():
		var card = hand[i]
		var card_display = _create_card_display(card, i)
		card_hand.add_child(card_display)

func _create_card_display(card: CardData, index: int) -> Control:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(120, 160)
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 2)
	var name_label = Label.new()
	name_label.text = card.card_name
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var cost_label = Label.new()
	cost_label.text = "费用: %d" % card.cost
	cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var type_label = Label.new()
	type_label.text = CardData.CardType.keys()[card.type]
	type_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var desc_label = RichTextLabel.new()
	desc_label.bbcode_enabled = true
	desc_label.text = card.description
	desc_label.fit_content = true
	desc_label.custom_minimum_size = Vector2(100, 40)
	vbox.add_child(name_label)
	vbox.add_child(cost_label)
	vbox.add_child(type_label)
	vbox.add_child(desc_label)
	panel.add_child(vbox)
	var button = Button.new()
	button.text = "选牌"
	button.pressed.connect(_on_card_selected.bind(index))
	vbox.add_child(button)
	return panel

func _on_card_selected(index: int) -> void:
	_selected_card_index = index
	_refresh_hand_display()

func _update_exhibit_display() -> void:
	for i in GameManager.exhibit_list.size():
		var exhibit = GameManager.exhibit_list[i]
		var panel = exhibit_display.get_node_or_null("Exhibit_%d" % i)
		if not panel:
			continue
		var hp_label = panel.find_child("HpLabel", true, false)
		if hp_label:
			hp_label.text = "HP: %d/%d" % [exhibit.current_hp, exhibit.max_hp]
		var state_label = panel.find_child("StateLabel", true, false)
		if state_label:
			state_label.text = exhibit.get_state_text()
			state_label.add_theme_color_override("font_color", exhibit.get_state_color())
		var hp_bar = panel.find_child("HpBar", true, false)
		if hp_bar:
			hp_bar.value = exhibit.current_hp
		var hidden_label = panel.find_child("HiddenLabel", true, false)
		if hidden_label:
			if exhibit.hidden_damage > 0:
				if exhibit.is_hidden_damage_revealed:
					hidden_label.text = "隐藏损伤: %d" % exhibit.hidden_damage
				else:
					hidden_label.text = "可能有隐藏损伤"
			else:
				hidden_label.text = ""

func _on_budget_changed(new_value: int) -> void:
	_update_budget_display()

func _update_budget_display() -> void:
	budget_label.text = "预算: %d/%d" % [GameManager.player_budget, GameManager.max_budget_per_turn]

func _update_turn_display() -> void:
	turn_label.text = "回合: %d" % GameManager.current_turn

func _on_turn_started() -> void:
	_update_turn_display()

func _on_turn_ended() -> void:
	pass

func _on_game_over(victory: bool) -> void:
	if not victory:
		GameManager.record_failure("battle_lost")
	SceneManager.go_to_settlement(victory)

func _log_message(msg: String) -> void:
	event_log.append_text(msg + "\n")

func _on_pause_pressed() -> void:
	var pause_scene = load("res://scenes/pause_menu.tscn")
	var pause = pause_scene.instantiate()
	get_tree().root.add_child(pause)
	pause.resume_pressed.connect(func(): get_tree().paused = false)
	pause.quit_to_menu_pressed.connect(func(): get_tree().paused = false; SceneManager.go_to_main_menu())
	get_tree().paused = true

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and GameManager.is_in_battle and not get_tree().paused:
		_on_pause_pressed()
		get_viewport().set_input_as_handled()
