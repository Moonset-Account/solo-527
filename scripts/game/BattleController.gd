extends Node
## 战斗控制器 - 管理一局战斗的完整状态机
## 负责：卡组/弃牌/手牌/费用/回合流程、展品状态、事件触发、胜负判定

class_name BattleController

signal state_changed(new_state: String)
signal exhibit_list_changed
signal hand_changed
signal deck_count_changed(count: int)
signal discard_count_changed(count: int)
signal battle_ended(victory: bool, stats: Dictionary)

enum BattleState { INIT, PLAYING_TURN, TURN_ENDING, BATTLE_END }

var state: int = BattleState.INIT
var level_id: String = ""
var level_data: Dictionary = {}
var current_turn: int = 0
var max_turns: int = 0
var budget: int = 0
var budget_per_turn: int = 0
var budget_next_turn_extra: int = 0
var permanent_budget_bonus: int = 0
var start_draw: int = 0
var draw_per_turn: int = 0

var deck: Array[String] = []
var hand: Array[String] = []
var discard: Array[String] = []

var exhibits: Array[Dictionary] = []
var player_statuses: Dictionary = {}
var battle_stats: Dictionary = {
	"cards_played": 0,
	"cards_drawn": 0,
	"cards_discarded": 0,
	"cards_used_list": [],
	"exhibits_restored": 0,
	"turns_used": 0,
	"max_budget_spent": 0,
}

var selected_card_index: int = -1
var selected_target_exhibit_id: String = ""
var awaiting_target: bool = false

func setup_battle(p_level_id: String, deck_cards: Array[String]) -> void:
	level_id = p_level_id
	level_data = LevelDatabase.get_level(p_level_id)
	if level_data.is_empty():
		push_error("Level not found: " + p_level_id)
		return
	max_turns = int(level_data.get("turn_limit", 10))
	budget_per_turn = int(level_data.get("budget_per_turn", 3))
	start_draw = int(level_data.get("start_draw", 5))
	draw_per_turn = int(level_data.get("draw_per_turn", 3))
	_init_exhibits()
	_init_deck(deck_cards)
	budget = int(level_data.get("start_budget", 3))
	budget_next_turn_extra = 0
	permanent_budget_bonus = 0
	current_turn = 0
	state = BattleState.INIT
	state_changed.emit(_state_name(state))

func start_battle() -> void:
	state = BattleState.PLAYING_TURN
	current_turn = 1
	budget = budget_per_turn + permanent_budget_bonus
	GameEvents.emit_budget_changed(budget, budget)
	_draw_cards(start_draw)
	GameEvents.emit_turn_started(current_turn)
	GameEvents.battle_started.emit(level_id)
	state_changed.emit(_state_name(state))
	exhibit_list_changed.emit()
	hand_changed.emit()

func _init_exhibits() -> void:
	exhibits.clear()
	var exh_defs: Array = level_data.get("exhibits", [])
	for d in exh_defs:
		var e: Dictionary = {
			"id": d.get("id", ""),
			"name": d.get("name", ""),
			"max_integrity": int(d.get("max_integrity", 0)),
			"integrity": int(d.get("start_integrity", 0)),
			"statuses": [],
			"reward_budget": int(d.get("reward_budget", 0)),
			"restored": false,
			"anim_state": "idle",
		}
		for st in d.get("statuses", []):
			e["statuses"].append(st.duplicate(true))
		exhibits.append(e)

func _init_deck(deck_cards: Array[String]) -> void:
	deck = deck_cards.duplicate()
	deck.shuffle()
	hand.clear()
	discard.clear()
	deck_count_changed.emit(deck.size())
	discard_count_changed.emit(0)

func _state_name(s: int) -> String:
	match s:
		BattleState.INIT: return "INIT"
		BattleState.PLAYING_TURN: return "PLAYING"
		BattleState.TURN_ENDING: return "TURN_ENDING"
		BattleState.BATTLE_END: return "BATTLE_END"
	return "UNKNOWN"

# ============== 卡牌操作 ==============
func get_card_cost(card_id: String) -> int:
	var c: Dictionary = CardDatabase.get_card(card_id)
	if c.is_empty():
		return 0
	var cost: int = int(c.get("cost", 0))
	var global_disc: int = int(player_statuses.get("global_discount", 0))
	var tool_disc: int = int(player_statuses.get("tool_discount", 0))
	cost = max(0, cost - global_disc)
	if int(c.get("type", 0)) == CardDatabase.CardType.TOOL and tool_disc > 0:
		cost = max(0, cost - 1)
	return cost

func can_play_card(hand_idx: int) -> bool:
	if hand_idx < 0 or hand_idx >= hand.size():
		return false
	if state != BattleState.PLAYING_TURN:
		return false
	var cid: String = hand[hand_idx]
	var cost: int = get_card_cost(cid)
	return budget >= cost

func select_card(hand_idx: int) -> void:
	if hand_idx < 0 or hand_idx >= hand.size():
		selected_card_index = -1
		awaiting_target = false
		selected_target_exhibit_id = ""
		return
	if not can_play_card(hand_idx):
		return
	selected_card_index = hand_idx
	var cid: String = hand[hand_idx]
	var c: Dictionary = CardDatabase.get_card(cid)
	var eff: Dictionary = c.get("effect", {})
	var target: String = eff.get("target", "")
	if target == "single":
		awaiting_target = true
		selected_target_exhibit_id = ""
	else:
		awaiting_target = false
		selected_target_exhibit_id = ""

func play_selected_card(target_exhibit_id: String = "") -> bool:
	if selected_card_index < 0:
		return false
	if state != BattleState.PLAYING_TURN:
		return false
	var hand_idx: int = selected_card_index
	if awaiting_target and target_exhibit_id == "":
		return false
	var cid: String = hand[hand_idx]
	var cost: int = get_card_cost(cid)
	if budget < cost:
		return false
	var card: Dictionary = CardDatabase.get_card(cid)
	budget -= cost
	GameEvents.emit_budget_changed(-cost, budget)
	hand.remove_at(hand_idx)
	discard.append(cid)
	battle_stats["cards_played"] = int(battle_stats.get("cards_played", 0)) + 1
	var used_list: Array = battle_stats.get("cards_used_list", [])
	used_list.append(cid)
	battle_stats["cards_used_list"] = used_list
	GameEvents.emit_card_played(card, self)
	_resolve_effect(card, target_exhibit_id)
	selected_card_index = -1
	awaiting_target = false
	selected_target_exhibit_id = ""
	hand_changed.emit()
	deck_count_changed.emit(deck.size())
	discard_count_changed.emit(discard.size())
	exhibit_list_changed.emit()
	_check_battle_end()
	return true

func play_card_by_index(hand_idx: int, target_exhibit_id: String = "") -> bool:
	select_card(hand_idx)
	return play_selected_card(target_exhibit_id)

# ============== 效果解析 ==============
func _resolve_effect(card: Dictionary, target_id: String) -> void:
	var eff: Dictionary = card.get("effect", {})
	var ctype: int = int(card.get("type", 0))
	var restore_amt: int = int(eff.get("restore", 0))
	var bonus: int = int(player_statuses.get("tool_boost", 0))
	if ctype == CardDatabase.CardType.TOOL and bonus > 0:
		restore_amt += bonus
	if ctype == CardDatabase.CardType.TOOL:
		var bonus_r: int = int(player_statuses.get("tool_discount_bonus_restore", 0))
		restore_amt += bonus_r
	var target: String = eff.get("target", "none")
	var threshold: int = int(eff.get("bonus_if_threshold", 0))
	var threshold_bonus: int = int(eff.get("bonus_restore", 0))
	if target == "single" and target_id != "":
		var exh: Dictionary = _get_exhibit(target_id)
		if exh != null:
			var exh_int: int = int(exh.get("integrity", 0))
			var exh_max: int = int(exh.get("max_integrity", 1))
			if threshold > 0 and exh_int * 100 / max(exh_max, 1) >= threshold:
				restore_amt += threshold_bonus
			var vuln: int = _exhibit_status_value(exh, "vulnerable")
			if vuln > 0:
				restore_amt *= 2
				_remove_exhibit_status(exh, "vulnerable", 1)
			_restore_exhibit(exh, restore_amt)
			if eff.has("remove_status"):
				_remove_exhibit_status(exh, eff.get("remove_status", ""), int(eff.get("remove_count", 1)))
			if eff.get("remove_all_status", false):
				exh["statuses"].clear()
			if eff.has("status_on_target"):
				_apply_exhibit_status(exh, eff.get("status_on_target", ""), int(eff.get("status_value", 1)))
	elif target == "all" and restore_amt > 0:
		for e in exhibits:
			_restore_exhibit(e, restore_amt)
	var restore_all_v: int = int(eff.get("restore_all", 0))
	if restore_all_v > 0:
		for e in exhibits:
			_restore_exhibit(e, restore_all_v)
	if eff.has("remove_status_all"):
		var st: String = eff.get("remove_status_all", "")
		var cnt: int = int(eff.get("remove_count", 1))
		for e in exhibits:
			_remove_exhibit_status(e, st, cnt)
	if eff.has("gain_budget"):
		var g: int = int(eff.get("gain_budget", 0))
		budget += g
		GameEvents.emit_budget_changed(g, budget)
	if eff.has("next_turn_budget"):
		budget_next_turn_extra += int(eff.get("next_turn_budget", 0))
	if eff.has("permanent_budget"):
		permanent_budget_bonus += int(eff.get("permanent_budget", 0))
	if eff.has("budget_per_card_type"):
		var t: int = int(eff.get("budget_per_card_type", 0))
		var extra: int = int(eff.get("extra_budget", 1))
		var src: String = eff.get("count_from", "deck")
		var count: int = 0
		var arr: Array = deck if src == "deck" else (hand if src == "hand" else discard)
		for id in arr:
			var cc: Dictionary = CardDatabase.get_card(id)
			if int(cc.get("type", -1)) == t:
				count += 1
		budget += count * extra
		GameEvents.emit_budget_changed(count * extra, budget)
	if eff.has("draw"):
		_draw_cards(int(eff.get("draw", 0)))
	if eff.has("discard"):
		_discard_random(int(eff.get("discard", 0)))
	if eff.has("status"):
		var key: String = eff.get("status", "")
		var val: int = int(eff.get("status_value", 1))
		var dur: int = int(eff.get("duration", 1))
		player_statuses[key] = int(player_statuses.get(key, 0)) + val
		if not (key + "_dur") in player_statuses:
			player_statuses[key + "_dur"] = dur
		else:
			player_statuses[key + "_dur"] = max(int(player_statuses[key + "_dur"]), dur)
		if eff.has("bonus_restore"):
			player_statuses["tool_discount_bonus_restore"] = int(player_statuses.get("tool_discount_bonus_restore", 0)) + int(eff.get("bonus_restore", 0))
	if ctype == CardDatabase.CardType.TOOL and int(player_statuses.get("tool_discount", 0)) > 0:
		player_statuses["tool_discount"] = int(player_statuses.get("tool_discount", 0)) - 1
		if int(player_statuses.get("tool_discount", 0)) <= 0:
			player_statuses.erase("tool_discount")
			player_statuses.erase("tool_discount_dur")
			if "tool_discount_bonus_restore" in player_statuses:
				player_statuses.erase("tool_discount_bonus_restore")
	if ctype == CardDatabase.CardType.TOOL and int(player_statuses.get("tool_draw", 0)) > 0:
		player_statuses["tool_draw"] = int(player_statuses.get("tool_draw", 0)) - 1
		_draw_cards(1)
		if int(player_statuses.get("tool_draw", 0)) <= 0:
			player_statuses.erase("tool_draw")
			player_statuses.erase("tool_draw_dur")

# ============== 展品操作 ==============
func _get_exhibit(id: String) -> Dictionary:
	for e in exhibits:
		if e.get("id", "") == id:
			return e
	return null

func _restore_exhibit(exh: Dictionary, amount: int) -> void:
	if bool(exh.get("restored", false)):
		return
	var before: int = int(exh.get("integrity", 0))
	var exh_max: int = int(exh.get("max_integrity", 0))
	exh["integrity"] = min(exh_max, before + amount)
	var delta: int = int(exh["integrity"]) - before
	var exh_id: String = exh.get("id", "")
	var exh_int_now: int = int(exh["integrity"])
	GameEvents.emit_exhibit_progress(exh_id, delta, exh_int_now, exh_max)
	GameEvents.vfx_requested.emit("restore_sparks", Vector2.ZERO, {"target_id": exh_id, "amount": delta})
	if exh_int_now >= exh_max and not bool(exh.get("restored", false)):
		exh["restored"] = true
		battle_stats["exhibits_restored"] = int(battle_stats.get("exhibits_restored", 0)) + 1
		var rb: int = int(exh.get("reward_budget", 0))
		if rb > 0:
			budget += rb
			GameEvents.emit_budget_changed(rb, budget)

func _damage_exhibit(exh: Dictionary, amount: int) -> void:
	if bool(exh.get("restored", false)) or amount <= 0:
		return
	var before: int = int(exh.get("integrity", 0))
	exh["integrity"] = max(0, before - amount)
	var delta: int = int(exh["integrity"]) - before
	var exh_id: String = exh.get("id", "")
	GameEvents.exhibit_damaged.emit(exh_id, amount)
	GameEvents.emit_exhibit_progress(exh_id, delta, int(exh["integrity"]), int(exh.get("max_integrity", 0)))

func _apply_exhibit_status(exh: Dictionary, stype: String, value: int) -> void:
	var statuses: Array = exh.get("statuses", [])
	for s in statuses:
		if s.get("type", "") == stype:
			s["value"] = int(s.get("value", 0)) + value
			return
	statuses.append({"type": stype, "value": value, "damage_per_turn": 0})
	exh["statuses"] = statuses

func _remove_exhibit_status(exh: Dictionary, stype: String, count: int) -> void:
	var statuses: Array = exh.get("statuses", [])
	for i in range(statuses.size() - 1, -1, -1):
		var s: Dictionary = statuses[i]
		if s.get("type", "") == stype:
			s["value"] = int(s.get("value", 0)) - count
			if int(s.get("value", 0)) <= 0:
				statuses.remove_at(i)
	exh["statuses"] = statuses

func _exhibit_status_value(exh: Dictionary, stype: String) -> int:
	for s in exh.get("statuses", []):
		if s.get("type", "") == stype:
			return int(s.get("value", 0))
	return 0

# ============== 卡组操作 ==============
func _draw_cards(n: int) -> void:
	for i in n:
		if deck.size() == 0:
			if discard.size() == 0:
				break
			deck = discard.duplicate()
			deck.shuffle()
			discard.clear()
			GameEvents.sfx_requested.emit("shuffle", -6.0)
		if deck.size() > 0:
			var cid: String = deck.pop_back()
			hand.append(cid)
			battle_stats["cards_drawn"] = int(battle_stats.get("cards_drawn", 0)) + 1
			GameEvents.card_drawn.emit(CardDatabase.get_card(cid))
	deck_count_changed.emit(deck.size())
	discard_count_changed.emit(discard.size())
	hand_changed.emit()

func _discard_random(n: int) -> void:
	for i in n:
		if hand.size() == 0:
			break
		var idx: int = randi() % hand.size()
		var cid: String = hand[idx]
		hand.remove_at(idx)
		discard.append(cid)
		battle_stats["cards_discarded"] = int(battle_stats.get("cards_discarded", 0)) + 1
		GameEvents.card_discarded.emit(CardDatabase.get_card(cid))
	hand_changed.emit()
	deck_count_changed.emit(deck.size())
	discard_count_changed.emit(discard.size())

# ============== 回合/流程 ==============
func end_turn() -> void:
	if state != BattleState.PLAYING_TURN:
		return
	state = BattleState.TURN_ENDING
	battle_stats["turns_used"] = int(battle_stats.get("turns_used", 0)) + 1
	_state_apply_turn_end_statuses()
	_state_process_exhibit_damage()
	_decrement_player_status_durations()
	GameEvents.emit_turn_ended(current_turn)
	if _check_battle_end():
		return
	await get_tree().process_frame
	_new_turn()

func _new_turn() -> void:
	current_turn += 1
	budget = budget_per_turn + permanent_budget_bonus + budget_next_turn_extra
	budget_next_turn_extra = 0
	GameEvents.emit_budget_changed(budget, budget)
	_draw_cards(draw_per_turn)
	_maybe_trigger_random_event()
	state = BattleState.PLAYING_TURN
	GameEvents.emit_turn_started(current_turn)
	state_changed.emit(_state_name(state))
	hand_changed.emit()
	exhibit_list_changed.emit()

func _state_apply_turn_end_statuses() -> void:
	pass

func _state_process_exhibit_damage() -> void:
	for e in exhibits:
		for s in e.get("statuses", []):
			var dmg: int = int(s.get("damage_per_turn", 0))
			if dmg > 0:
				_damage_exhibit(e, dmg * int(s.get("value", 0)))

func _decrement_player_status_durations() -> void:
	var to_erase: Array = []
	for key in player_statuses.keys():
		if key.ends_with("_dur"):
			var base: String = key.trim_suffix("_dur")
			player_statuses[key] = int(player_statuses[key]) - 1
			if int(player_statuses[key]) <= 0:
				to_erase.append(key)
				to_erase.append(base)
	for k in to_erase:
		player_statuses.erase(k)

func _maybe_trigger_random_event() -> void:
	var freq: float = float(level_data.get("event_frequency", 0.0))
	if freq <= 0.0:
		return
	var pool: Array = level_data.get("random_events", [])
	if pool.is_empty():
		return
	if randf() <= freq:
		var eid: String = pool[randi() % pool.size()]
		var ev: Dictionary = LevelDatabase.get_event(eid)
		if not ev.is_empty():
			_apply_event(ev)

func _apply_event(ev: Dictionary) -> void:
	GameEvents.event_triggered.emit(ev.get("id", ""), ev)
	GameEvents.sfx_requested.emit("event_pop", -3.0)
	var t: String = ev.get("effect_type", "")
	match t:
		"damage_all":
			var v: int = int(ev.get("value", 0))
			for e in exhibits:
				_damage_exhibit(e, v)
		"add_status_all":
			var st: String = ev.get("status_type", "")
			var v: int = int(ev.get("value", 1))
			for e in exhibits:
				_apply_exhibit_status(e, st, v)
		"reduce_progress_unfinished":
			var v: int = int(ev.get("value", 0))
			for e in exhibits:
				if not bool(e.get("restored", false)):
					_damage_exhibit(e, v)
		"gain_budget":
			var v: int = int(ev.get("value", 0))
			budget += v
			GameEvents.emit_budget_changed(v, budget)
		"boost_highest_progress":
			var best: Dictionary = null
			var best_ratio: float = -1.0
			for e in exhibits:
				if bool(e.get("restored", false)):
					continue
				var r: float = float(e.get("integrity", 0)) / float(max(int(e.get("max_integrity", 0)), 1))
				if r > best_ratio:
					best_ratio = r
					best = e
			if best:
				_restore_exhibit(best, int(ev.get("restore", 0)))
			var b: int = int(ev.get("budget", 0))
			budget += b
			GameEvents.emit_budget_changed(b, budget)
		"draw_and_next_budget":
			_draw_cards(int(ev.get("draw", 0)))
			budget_next_turn_extra += int(ev.get("next_budget", 0))
		"discard_and_budget":
			_discard_random(int(ev.get("discard", 0)))
			var b: int = int(ev.get("budget", 0))
			budget += b
			GameEvents.emit_budget_changed(b, budget)
		"royal_packages":
			_draw_cards(int(ev.get("draw", 0)))
			var b: int = int(ev.get("budget", 0))
			budget += b
			GameEvents.emit_budget_changed(b, budget)
			var res: int = int(ev.get("restore", 0))
			for e in exhibits:
				_restore_exhibit(e, res)
	exhibit_list_changed.emit()

# ============== 胜负判定 ==============
func _all_exhibits_restored() -> bool:
	for e in exhibits:
		if not bool(e.get("restored", false)):
			return false
	return true

func _any_exhibit_destroyed() -> bool:
	for e in exhibits:
		if int(e.get("integrity", 0)) < 0:
			return true
	return false

func _check_battle_end() -> bool:
	if state == BattleState.BATTLE_END:
		return true
	var victory: bool = false
	var ended: bool = false
	if _all_exhibits_restored():
		victory = true
		ended = true
	elif _any_exhibit_destroyed():
		victory = false
		ended = true
	elif state == BattleState.TURN_ENDING and current_turn >= max_turns:
		victory = _all_exhibits_restored()
		ended = true
	if ended:
		state = BattleState.BATTLE_END
		state_changed.emit(_state_name(state))
		GameEvents.emit_battle_ended(victory, level_id)
		battle_stats["victory"] = victory
		var stars: int = 0
		if victory:
			stars = 1
			var ratio: float = float(current_turn) / float(max(max_turns, 1))
			if ratio <= 0.6:
				stars = 3
			elif ratio <= 0.8:
				stars = 2
		battle_stats["stars"] = stars
		battle_ended.emit(victory, battle_stats)
		return true
	return false

func calculate_stars_from_stats(stats: Dictionary) -> int:
	return int(stats.get("stars", 0))

func abandon_battle() -> void:
	state = BattleState.BATTLE_END
	state_changed.emit(_state_name(state))
	battle_stats["victory"] = false
	battle_stats["stars"] = 0
	battle_ended.emit(false, battle_stats)
