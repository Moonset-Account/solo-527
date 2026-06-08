extends Node
## 游戏管理器 - 协调所有子系统，驱动主循环
## 管理游戏状态流转：菜单 -> 关卡 -> 战斗 -> 结算 -> 奖励

enum GameState {
	MENU,
	LEVEL_SELECT,
	COMBAT_SETUP,
	COMBAT_ACTIVE,
	TARGET_SELECTION,
	ANIMATION_PLAYBACK,
	EVENT_RESOLUTION,
	LEVEL_RESULT,
	REWARD_SELECTION,
	PAUSED
}

var current_state: GameState = GameState.MENU
var previous_state: GameState = GameState.MENU

var current_level_data: Dictionary = {}
var current_chapter_id: String = ""
var current_level_id: String = ""

var player_deck: Array = []
var hand: Array = []
var draw_pile: Array = []
var discard_pile: Array = []

var exhibits: Dictionary = {}
var active_events: Array = []

var session_stats: Dictionary = {
	"cards_played": 0,
	"exhibits_completed": 0,
	"turns_taken": 0,
	"damage_taken": 0,
	"resources_spent": 0
}

var pending_target_card: Dictionary = {}
var pending_animation_count: int = 0
var level_failure_reasons: Array = []

const CARDS_PER_TURN: int = 5

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_connect_event_listeners()

func _connect_event_listeners() -> void:
	EventBus.card_played.connect(_on_card_played)
	EventBus.card_play_failed.connect(_on_card_play_failed)
	EventBus.exhibit_completed.connect(_on_exhibit_completed)
	EventBus.exhibit_failed.connect(_on_exhibit_failed)
	EventBus.turn_ended.connect(_on_turn_ended)
	EventBus.ui_animation_completed.connect(_on_animation_completed)

func start_new_run() -> void:
	player_deck = CardRegistry.get_starter_deck_ids()
	session_stats = {"cards_played": 0, "exhibits_completed": 0, "turns_taken": 0, "damage_taken": 0, "resources_spent": 0}
	_save_progress()
	change_state(GameState.LEVEL_SELECT)

func load_run(slot_id: int) -> bool:
	var data: Dictionary = SaveSystem.load_game(slot_id)
	if data.is_empty():
		return false
	player_deck = data.get("player_deck", player_deck.duplicate())
	current_chapter_id = data.get("current_chapter", "")
	current_level_id = data.get("current_level", "")
	session_stats = data.get("session_stats", session_stats.duplicate())
	change_state(GameState.LEVEL_SELECT)
	return true

func enter_level(level_id: String) -> void:
	var level: Dictionary = LevelRegistry.get_level(level_id)
	if level.is_empty():
		push_error("GameManager: Level '%s' not found" % level_id)
		return
	
	current_level_data = level
	current_level_id = level_id
	current_chapter_id = level.get("chapter_id", "")
	level_failure_reasons.clear()
	
	change_state(GameState.COMBAT_SETUP)
	_setup_combat(level)

func _setup_combat(level: Dictionary) -> void:
	ResourceManager.reset_for_new_level(level)
	
	draw_pile = player_deck.duplicate()
	hand.clear()
	discard_pile.clear()
	_shuffle(draw_pile)
	
	exhibits.clear()
	for exhibit_def in level.get("exhibits", []):
		var exhibit_id: String = exhibit_def.id
		exhibits[exhibit_id] = {
			"id": exhibit_id,
			"name": exhibit_def.get("name", "未知展品"),
			"description": exhibit_def.get("description", ""),
			"category": exhibit_def.get("category", "general"),
			"repair_target": exhibit_def.get("repair_target", 100),
			"current_progress": 0,
			"max_condition": exhibit_def.get("max_condition", 100),
			"current_condition": exhibit_def.get("start_condition", 80),
			"damage_per_turn": exhibit_def.get("damage_per_turn", 5),
			"turns_until_irreparable": exhibit_def.get("turns_until_irreparable", 0),
			"tags": exhibit_def.get("tags", []),
			"completed": false,
			"failed": false,
			"reward": exhibit_def.get("reward", {})
		}
	
	active_events = level.get("events", []).duplicate()
	change_state(GameState.COMBAT_ACTIVE)
	EventBus.publish("level_started", [level])
	ResourceManager.start_turn()
	_draw_cards(CARDS_PER_TURN)

func change_state(new_state: GameState) -> void:
	previous_state = current_state
	current_state = new_state

func end_player_turn() -> void:
	if current_state != GameState.COMBAT_ACTIVE:
		return
	
	change_state(GameState.ANIMATION_PLAYBACK)
	ResourceManager.end_turn()

func _on_turn_ended(_turn: int) -> void:
	session_stats.turns_taken += 1
	var damage_phase: bool = _process_exhibit_deterioration()
	
	await get_tree().process_frame
	await get_tree().create_timer(0.4).timeout
	
	if _check_level_end():
		return
	
	_discard_hand()
	change_state(GameState.COMBAT_ACTIVE)
	ResourceManager.start_turn()
	_draw_cards(CARDS_PER_TURN)
	
	if damage_phase:
		AudioManager.play_warning()

func _process_exhibit_deterioration() -> bool:
	var any_damaged: bool = false
	for id in exhibits:
		var exhibit: Dictionary = exhibits[id]
		if exhibit.completed or exhibit.failed:
			continue
		
		var damage: int = exhibit.damage_per_turn
		if exhibit.turns_until_irreparable > 0:
			exhibit.turns_until_irreparable -= 1
			if exhibit.turns_until_irreparable == 0 and exhibit.current_progress < exhibit.repair_target:
				exhibit.failed = true
				EventBus.publish("exhibit_failed", [id, "未能在限时内完成修复"])
				level_failure_reasons.append("%s: 修复超时" % exhibit.name)
				continue
		
		if damage > 0 and exhibit.current_condition > 0:
			exhibit.current_condition = max(0, exhibit.current_condition - damage)
			exhibit["current_condition"] = exhibit.current_condition
			EventBus.publish("exhibit_damaged", [id, damage, exhibit.current_condition])
			any_damaged = true
			session_stats.damage_taken += damage
			
			if exhibit.current_condition <= 0:
				exhibit.failed = true
				EventBus.publish("exhibit_failed", [id, "展品已完全损坏"])
				level_failure_reasons.append("%s: 展品完全损坏" % exhibit.name)
	
	return any_damaged

func try_play_card(hand_index: int, target_exhibit_id: String = "") -> void:
	if current_state != GameState.COMBAT_ACTIVE:
		return
	if hand_index < 0 or hand_index >= hand.size():
		return
	
	var card_id: String = hand[hand_index]
	var card_data: Dictionary = CardRegistry.get_card(card_id)
	if card_data.is_empty():
		return
	
	if card_data.get("requires_target", false):
		if target_exhibit_id.is_empty():
			_request_target_selection(card_data, hand_index)
			return
		if not _is_valid_target(card_data, target_exhibit_id):
			EventBus.publish("card_play_failed", [card_data, "目标无效"])
			AudioManager.play_card_play(false)
			return
	else:
		target_exhibit_id = ""
	
	var cost: Dictionary = card_data.get("cost", {"budget": 0})
	if not ResourceManager.can_afford(cost):
		var reason: String = ResourceManager.get_unaffordable_reason(cost)
		EventBus.publish("card_play_failed", [card_data, reason])
		AudioManager.play_card_play(false)
		return
	
	ResourceManager.spend(cost)
	session_stats.resources_spent += cost.get("budget", 0) + cost.get("tools", 0) + cost.get("experts", 0)
	
	_remove_card_from_hand(hand_index)
	discard_pile.append(card_id)
	
	EventBus.publish("card_played", [card_data, target_exhibit_id])
	AudioManager.play_card_play(true)
	session_stats.cards_played += 1
	SaveSystem.record_stat("total_cards_played", 1)
	
	change_state(GameState.ANIMATION_PLAYBACK)
	pending_animation_count = 1
	_execute_card_effects(card_data, target_exhibit_id)

func _request_target_selection(card_data: Dictionary, hand_index: int) -> void:
	pending_target_card = {"card_data": card_data, "hand_index": hand_index}
	change_state(GameState.TARGET_SELECTION)
	var valid_targets: Array = _get_valid_targets(card_data)
	EventBus.publish("exhibit_target_mode", [true, valid_targets])
	EventBus.publish("ui_toast", ["请选择目标展品", "info", 2.0])

func select_target(exhibit_id: String) -> void:
	if current_state != GameState.TARGET_SELECTION:
		return
	if pending_target_card.is_empty():
		return
	
	var card_data: Dictionary = pending_target_card.card_data
	var hand_index: int = pending_target_card.hand_index
	pending_target_card.clear()
	EventBus.publish("exhibit_target_mode", [false, []])
	try_play_card(hand_index, exhibit_id)

func cancel_target_selection() -> void:
	if current_state != GameState.TARGET_SELECTION:
		return
	pending_target_card.clear()
	change_state(GameState.COMBAT_ACTIVE)
	EventBus.publish("exhibit_target_mode", [false, []])

func _get_valid_targets(card_data: Dictionary) -> Array:
	var valid: Array = []
	var target_filter: String = card_data.get("target_filter", "all")
	for id in exhibits:
		var ex: Dictionary = exhibits[id]
		if ex.completed or ex.failed:
			continue
		match target_filter:
			"damaged":
				if ex.current_condition < ex.max_condition:
					valid.append(id)
			"progress_low":
				if ex.current_progress < ex.repair_target * 0.5:
					valid.append(id)
			"tagged":
				var required_tag: String = card_data.get("required_tag", "")
				if required_tag in ex.tags:
					valid.append(id)
			_:
				valid.append(id)
	return valid

func _is_valid_target(card_data: Dictionary, exhibit_id: String) -> bool:
	if not exhibits.has(exhibit_id):
		return false
	var targets: Array = _get_valid_targets(card_data)
	return exhibit_id in targets

func _execute_card_effects(card_data: Dictionary, target_id: String) -> void:
	var effects: Array = card_data.get("effects", [])
	pending_animation_count = effects.size()
	if pending_animation_count <= 0:
		pending_animation_count = 1
	
	for effect in effects:
		_apply_single_effect(effect, target_id, card_data)

func _apply_single_effect(effect: Dictionary, target_id: String, card_data: Dictionary) -> void:
	var effect_type: String = effect.get("type", "")
	var value: int = effect.get("value", 0)
	var scale_with: String = effect.get("scale_with", "")
	var multiplier: float = effect.get("multiplier", 1.0)
	
	if not scale_with.is_empty():
		match scale_with:
			"expert_count":
				value = int(float(value) + float(ResourceManager.expert_count) * multiplier)
			"tools_count":
				value = int(float(value) + float(ResourceManager.repair_tools) * multiplier)
			"budget_remaining":
				value = int(float(value) + float(ResourceManager.current_budget) * multiplier)
	
	var affected_ids: Array = []
	if effect.get("affects_all", false):
		for id in exhibits:
			var ex: Dictionary = exhibits[id]
			if not ex.completed and not ex.failed:
				affected_ids.append(id)
	elif not target_id.is_empty():
		affected_ids.append(target_id)
	
	match effect_type:
		"repair_progress":
			for id in affected_ids:
				_add_repair_progress(id, value)
		"restore_condition":
			for id in affected_ids:
				_restore_condition(id, value)
		"gain_resource":
			ResourceManager.gain(effect.get("resource", "budget"), value)
			_finish_animation_step()
		"draw_cards":
			_draw_cards(value)
			_finish_animation_step()
		"reduce_damage":
			for id in affected_ids:
				var ex: Dictionary = exhibits[id]
				ex.damage_per_turn = max(0, ex.damage_per_turn - value)
				EventBus.publish("ui_toast", ["%s 每回合损坏减少" % ex.name, "buff", 1.5])
			_finish_animation_step()
		"delay_timer":
			for id in affected_ids:
				var ex: Dictionary = exhibits[id]
				ex.turns_until_irreparable += value
				EventBus.publish("ui_toast", ["%s 限时延长" % ex.name, "buff", 1.5])
			_finish_animation_step()
		"extra_budget_next_turn":
			ResourceManager.base_budget_per_turn += value
			EventBus.publish("ui_toast", ["每回合预算 +%d" % value, "buff", 2.0])
			_finish_animation_step()
		_:
			_finish_animation_step()

func _add_repair_progress(exhibit_id: String, amount: int) -> void:
	if not exhibits.has(exhibit_id):
		_finish_animation_step()
		return
	var ex: Dictionary = exhibits[exhibit_id]
	if ex.completed or ex.failed:
		_finish_animation_step()
		return
	ex.current_progress = min(ex.repair_target, ex.current_progress + amount)
	EventBus.publish("exhibit_repaired", [exhibit_id, amount, ex.current_progress])
	AudioManager.play_repair()
	
	await get_tree().create_timer(0.2).timeout
	
	if ex.current_progress >= ex.repair_target and not ex.completed:
		ex.completed = true
		session_stats.exhibits_completed += 1
		EventBus.publish("exhibit_completed", [exhibit_id])
		AudioManager.play_exhibit_complete()
		var reward: Dictionary = ex.get("reward", {})
		if reward.get("type") == "budget":
			ResourceManager.gain("budget", reward.get("value", 0))
		elif reward.get("type") == "tool":
			ResourceManager.gain("tools", reward.get("value", 0))
	
	_finish_animation_step()

func _restore_condition(exhibit_id: String, amount: int) -> void:
	if not exhibits.has(exhibit_id):
		_finish_animation_step()
		return
	var ex: Dictionary = exhibits[exhibit_id]
	if ex.completed or ex.failed:
		_finish_animation_step()
		return
	var old_condition: int = ex.current_condition
	ex.current_condition = min(ex.max_condition, ex.current_condition + amount)
	var restored: int = ex.current_condition - old_condition
	if restored > 0:
		EventBus.publish("ui_floating_text", [Vector2.ZERO, "+%d 完好度" % restored, Color.GREEN])
		EventBus.publish("exhibit_damaged", [exhibit_id, -restored, ex.current_condition])
	_finish_animation_step()

func _on_card_played(_card: Dictionary, _target: String) -> void:
	pass

func _on_card_play_failed(_card: Dictionary, reason: String) -> void:
	EventBus.publish("ui_toast", [reason, "error", 2.0])

func _on_exhibit_completed(_id: String) -> void:
	_check_level_end()

func _on_exhibit_failed(_id: String, _reason: String) -> void:
	_check_level_end()

func _on_animation_completed(_anim_id: String) -> void:
	_finish_animation_step()

func _finish_animation_step() -> void:
	pending_animation_count -= 1
	if pending_animation_count <= 0:
		pending_animation_count = 0
		if current_state == GameState.ANIMATION_PLAYBACK:
			if not _check_level_end():
				change_state(GameState.COMBAT_ACTIVE)

func _check_level_end() -> bool:
	var all_complete: bool = true
	var any_failed: bool = false
	var total_count: int = 0
	var complete_count: int = 0
	
	for id in exhibits:
		var ex: Dictionary = exhibits[id]
		total_count += 1
		if ex.failed:
			any_failed = true
		elif not ex.completed:
			all_complete = false
		else:
			complete_count += 1
	
	var required_complete: int = current_level_data.get("required_exhibits", total_count)
	var allow_failures: int = current_level_data.get("allowed_failures", 0)
	var failure_count: int = total_count - complete_count - (total_count - complete_count if not all_complete else 0)
	var actual_failures: int = 0
	for id in exhibits:
		if exhibits[id].failed:
			actual_failures += 1
	
	var won: bool = (complete_count >= required_complete) and (actual_failures <= allow_failures)
	var lost: bool = (actual_failures > allow_failures) or ResourceManager.is_turn_limit_reached()
	
	if won:
		_on_level_won()
		return true
	elif lost:
		if ResourceManager.is_turn_limit_reached() and complete_count < required_complete:
			level_failure_reasons.append("回合数用尽，仅修复了 %d/%d 件展品" % [complete_count, required_complete])
		_on_level_lost()
		return true
	return false

func _on_level_won() -> void:
	change_state(GameState.LEVEL_RESULT)
	var rewards: Array = current_level_data.get("rewards", [])
	SaveSystem.record_stat("total_levels_completed", 1)
	AudioManager.play_level_result(true)
	EventBus.publish("level_completed", [current_level_data, rewards])
	
	if current_level_data.get("unlock_chapter", "") != "":
		SaveSystem.unlock_chapter(current_level_data.unlock_chapter)
	
	_save_progress()

func _on_level_lost() -> void:
	change_state(GameState.LEVEL_RESULT)
	SaveSystem.record_stat("total_games_played", 1)
	AudioManager.play_level_result(false)
	EventBus.publish("level_failed", [current_level_data, level_failure_reasons])

func retry_level() -> void:
	level_failure_reasons.clear()
	enter_level(current_level_id)

func claim_rewards(selected_card_ids: Array) -> void:
	for cid in selected_card_ids:
		if cid != "":
			player_deck.append(cid)
			SaveSystem.unlock_card(cid)
	AudioManager.play_reward()
	_save_progress()
	change_state(GameState.LEVEL_SELECT)

func return_to_menu() -> void:
	change_state(GameState.MENU)
	EventBus.publish("scene_changed", ["MainMenu"])

func _draw_cards(count: int) -> void:
	for i in range(count):
		if hand.size() >= ResourceManager.MAX_HAND_SIZE:
			EventBus.publish("ui_toast", ["手牌已满", "warning", 1.0])
			break
		if draw_pile.size() == 0:
			if discard_pile.size() == 0:
				EventBus.publish("deck_empty")
				break
			draw_pile = discard_pile.duplicate()
			discard_pile.clear()
			_shuffle(draw_pile)
			EventBus.publish("ui_toast", ["弃牌堆已洗入抽牌堆", "info", 1.5])
		
		var card_id: String = draw_pile.pop_back()
		hand.append(card_id)
		var card_data: Dictionary = CardRegistry.get_card(card_id)
		EventBus.publish("card_drawn", [card_data, hand.size() - 1])
	EventBus.publish("hand_changed", [hand.duplicate()])
	AudioManager.play_card_draw()

func _discard_hand() -> void:
	for card_id in hand:
		discard_pile.append(card_id)
	hand.clear()
	EventBus.publish("hand_changed", [[]])

func _remove_card_from_hand(index: int) -> void:
	if index < 0 or index >= hand.size():
		return
	var card_data: Dictionary = CardRegistry.get_card(hand[index])
	EventBus.publish("card_discarded", [card_data, "played"])
	hand.remove_at(index)
	EventBus.publish("hand_changed", [hand.duplicate()])

func _shuffle(arr: Array) -> void:
	arr.shuffle()

func _save_progress() -> void:
	var state: Dictionary = {
		"current_level": current_level_id,
		"current_chapter": current_chapter_id,
		"player_deck": player_deck.duplicate(),
		"level_progress": {},
		"session_stats": session_stats.duplicate(true)
	}
	SaveSystem.save_game(0, state)

func get_exhibit(exhibit_id: String) -> Dictionary:
	return exhibits.get(exhibit_id, {})

func get_all_exhibits() -> Dictionary:
	return exhibits

func get_hand() -> Array:
	return hand.duplicate()

func get_deck_sizes() -> Dictionary:
	return {"draw": draw_pile.size(), "discard": discard_pile.size(), "hand": hand.size()}
