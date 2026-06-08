extends Node

signal gold_changed(amount: int)
signal inventory_changed()
signal day_advanced(day: int)
signal phase_changed(phase: StringName)
signal level_changed(level_id: int)
signal weather_changed(weather: StringName)
signal market_event_triggered(event: Dictionary)
signal game_over(reason: StringName)
signal level_completed(level_id: int, profit: int)
signal tip_triggered(tip_id: String, message: String)
signal tutorial_message_requested(message: String)
signal tutorial_step_completed(step_id: String)

enum Phase { DAY, NIGHT, SETTLEMENT }
enum GameMode { MENU, TUTORIAL, PLAYING, PAUSED, GAME_OVER }

enum TutorialStep {
	NONE,
	WELCOME,
	DAY_BUY_HINT,
	DAY_BOUGHT,
	NIGHT_PRICE_HINT,
	NIGHT_DISPLAY_HINT,
	NIGHT_READY,
	SETTLEMENT_HINT,
	DONE
}

var items_data: Dictionary = {}
var levels_data: Dictionary = {}
var customers_data: Dictionary = {}
var upgrades_data: Dictionary = {}
var tutorial_data: Dictionary = {}

var gold: int = 100
var current_level_id: int = 1
var current_day: int = 1
var current_phase: Phase = Phase.DAY
var game_mode: GameMode = GameMode.MENU
var inventory: Dictionary = {}
var displayed_items: Array[Dictionary] = []
var stall_stats: Dictionary = {}
var purchased_upgrades: Array[String] = []
var weather: StringName = &"sunny"
var active_market_event: Dictionary = {}
var daily_revenue: int = 0
var daily_expenses: int = 0
var total_profit: int = 0
var customers_served_today: int = 0
var tips_enabled: bool = true
var tip_show_counts: Dictionary = {}
var is_paused: bool = false

var tutorial_step: int = TutorialStep.NONE
var tutorial_active: bool = false

var _tutorial_messages: Dictionary = {
	TutorialStep.WELCOME: "欢迎来到小镇集市！白天采购商品，晚上定价陈列，赚取利润！",
	TutorialStep.DAY_BUY_HINT: "点击「购买」来采购商品吧！注意不要花光金币。",
	TutorialStep.DAY_BOUGHT: "很好！你已经学会了采购。点击「进入夜晚」来设置售价。",
	TutorialStep.NIGHT_PRICE_HINT: "调整商品售价，然后将商品「陈列」到摊位上。",
	TutorialStep.NIGHT_DISPLAY_HINT: "还需要把更多商品陈列出来！顾客只买陈列的商品。",
	TutorialStep.NIGHT_READY: "一切就绪！点击「开始经营！」迎接顾客吧。",
	TutorialStep.SETTLEMENT_HINT: "这是今天的经营成果！赚到足够利润即可过关。点击「下一天」继续经营。",
}

func _ready() -> void:
	_load_all_data()
	stall_stats = upgrades_data.get("base_stats", {}).duplicate()
	_reset_inventory()

func _load_all_data() -> void:
	items_data = _load_json("res://data/items.json")
	levels_data = _load_json("res://data/levels.json")
	customers_data = _load_json("res://data/customers.json")
	upgrades_data = _load_json("res://data/upgrades.json")
	tutorial_data = _load_json("res://data/tutorial.json")

func _load_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("GameManager: File not found: " + path)
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var json := JSON.new()
	if json.parse(file.get_as_text()) != OK:
		push_error("GameManager: Failed to parse: " + path)
		return {}
	file.close()
	return json.data

func start_new_game() -> void:
	var level_data := get_current_level_data()
	gold = level_data.get("starting_gold", 100)
	current_level_id = 1
	current_day = 1
	total_profit = 0
	purchased_upgrades.clear()
	stall_stats = upgrades_data.get("base_stats", {}).duplicate()
	_reset_inventory()
	displayed_items.clear()
	weather = &"sunny"
	active_market_event.clear()
	tip_show_counts.clear()
	var settings := SaveSystem.load_settings()
	tips_enabled = settings.get("tips_enabled", true)
	var should_tutorial: bool = not settings.get("tutorial_completed", false)
	if should_tutorial:
		tutorial_active = true
		tutorial_step = TutorialStep.DAY_BUY_HINT
		game_mode = GameMode.TUTORIAL
	else:
		tutorial_active = false
		tutorial_step = TutorialStep.NONE
		game_mode = GameMode.PLAYING
	current_phase = Phase.DAY
	_save_auto()

func start_level(level_id: int) -> void:
	var level_data := get_level_data(level_id)
	if level_data.is_empty():
		return
	current_level_id = level_id
	current_day = 1
	total_profit = 0
	if not tutorial_active:
		game_mode = GameMode.PLAYING
	current_phase = Phase.DAY

func advance_day() -> void:
	current_day += 1
	var level_data := get_current_level_data()
	if current_day > level_data.get("days_to_complete", 5):
		_check_level_completion()
		return
	_apply_weather()
	_apply_market_event()
	_decay_perishables()
	day_advanced.emit(current_day)
	current_phase = Phase.DAY
	phase_changed.emit(&"day")

func start_night_phase() -> void:
	current_phase = Phase.NIGHT
	phase_changed.emit(&"night")
	if tutorial_active:
		if tutorial_step == TutorialStep.DAY_BUY_HINT or tutorial_step == TutorialStep.DAY_BOUGHT:
			tutorial_step = TutorialStep.NIGHT_PRICE_HINT

func run_customer_simulation() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	var level_data := get_current_level_data()
	var cust_range: Array = level_data.get("customer_count_range", [3, 5])
	var base_count: int = randi_range(cust_range[0], cust_range[1])
	var extra: int = int(stall_stats.get("extra_customers", 0))
	base_count += extra
	var weather_data := _get_weather_data()
	var weather_mod: float = weather_data.get("customer_modifier", 1.0)
	base_count = max(1, int(float(base_count) * weather_mod))
	customers_served_today = 0
	daily_revenue = 0
	for i in base_count:
		var customer := _generate_customer()
		var result := _simulate_customer_purchase(customer)
		results.append(result)
		if result.purchased:
			customers_served_today += 1
			daily_revenue += result.price_paid
	return results

func complete_settlement() -> void:
	var level_data := get_current_level_data()
	daily_expenses = _calculate_daily_expenses()
	var daily_profit: int = daily_revenue - daily_expenses
	total_profit += daily_profit
	gold += daily_profit
	Analytics.log_daily_revenue(current_day, daily_revenue, daily_expenses, customers_served_today)
	gold_changed.emit(gold)
	current_phase = Phase.SETTLEMENT
	phase_changed.emit(&"settlement")
	if tutorial_active and tutorial_step >= TutorialStep.NIGHT_PRICE_HINT and tutorial_step <= TutorialStep.NIGHT_READY:
		tutorial_step = TutorialStep.SETTLEMENT_HINT
	_check_tips()
	if gold < 0:
		game_mode = GameMode.GAME_OVER
		Analytics.log_failure("bankrupt", "Gold went below 0 on day %d" % current_day)
		game_over.emit(&"bankrupt")
		_transition_to_game_over()

func buy_item(item_id: String, quantity: int = 1) -> bool:
	var item_data := get_item_data(item_id)
	if item_data.is_empty():
		return false
	var cost_per: int = _get_adjusted_cost(item_data)
	var total_cost: int = cost_per * quantity
	if gold < total_cost:
		Analytics.log_failure("insufficient_gold", "Tried to buy %s x%d, need %d gold, have %d" % [item_id, quantity, total_cost, gold])
		return false
	var max_stock: int = int(float(item_data.get("stack_size", 20)) * stall_stats.get("storage_multiplier", 1.0))
	var current_qty: int = inventory.get(item_id, {}).get("quantity", 0)
	if current_qty + quantity > max_stock:
		return false
	gold -= total_cost
	if not inventory.has(item_id):
		inventory[item_id] = {
			"quantity": 0,
			"days_remaining": item_data.get("shelf_life", 0) if item_data.get("perishable", false) else -1,
			"cost_basis": 0
		}
	inventory[item_id].quantity += quantity
	inventory[item_id].cost_basis = (inventory[item_id].get("cost_basis", 0) * (inventory[item_id].quantity - quantity) + cost_per * quantity) / inventory[item_id].quantity
	gold_changed.emit(gold)
	inventory_changed.emit()
	if tutorial_active and tutorial_step == TutorialStep.DAY_BUY_HINT:
		tutorial_step = TutorialStep.DAY_BOUGHT
		tutorial_message_requested.emit(_tutorial_messages[TutorialStep.DAY_BOUGHT])
		tutorial_step_completed.emit("day_bought")
	_check_tips()
	_save_auto()
	return true

func sell_item(item_id: String, quantity: int = 1) -> bool:
	if not inventory.has(item_id):
		return false
	if inventory[item_id].quantity < quantity:
		return false
	inventory[item_id].quantity -= quantity
	if inventory[item_id].quantity <= 0:
		inventory.erase(item_id)
	inventory_changed.emit()
	return true

func set_display_items(items: Array[Dictionary]) -> void:
	var max_slots: int = stall_stats.get("display_slots", 4) as int
	displayed_items = items.slice(0, max_slots)

func notify_item_displayed() -> void:
	if not tutorial_active:
		return
	if tutorial_step == TutorialStep.NIGHT_PRICE_HINT:
		tutorial_step = TutorialStep.NIGHT_DISPLAY_HINT
		if displayed_items.size() < get_display_slots_count() and _has_undisplayed_items():
			tutorial_message_requested.emit(_tutorial_messages[TutorialStep.NIGHT_DISPLAY_HINT])
		else:
			tutorial_step = TutorialStep.NIGHT_READY
			tutorial_message_requested.emit(_tutorial_messages[TutorialStep.NIGHT_READY])
			tutorial_step_completed.emit("night_ready")
	elif tutorial_step == TutorialStep.NIGHT_DISPLAY_HINT:
		if displayed_items.size() >= get_display_slots_count() or not _has_undisplayed_items():
			tutorial_step = TutorialStep.NIGHT_READY
			tutorial_message_requested.emit(_tutorial_messages[TutorialStep.NIGHT_READY])
			tutorial_step_completed.emit("night_ready")

func _has_undisplayed_items() -> bool:
	var displayed_ids: Dictionary = {}
	for di in displayed_items:
		displayed_ids[di.get("item_id", "")] = true
	for item_id in inventory:
		if inventory[item_id].quantity > 0 and not displayed_ids.has(item_id):
			return true
	return false

func notify_advance_to_next_day() -> void:
	if tutorial_active and tutorial_step == TutorialStep.SETTLEMENT_HINT:
		_complete_tutorial()

func skip_tutorial() -> void:
	tutorial_active = false
	tutorial_step = TutorialStep.NONE
	game_mode = GameMode.PLAYING
	Analytics.mark_tutorial_skipped()
	var settings := SaveSystem.load_settings()
	settings["tutorial_completed"] = true
	settings["tutorial_skipped"] = true
	SaveSystem.save_settings(settings)

func _complete_tutorial() -> void:
	tutorial_active = false
	tutorial_step = TutorialStep.DONE
	game_mode = GameMode.PLAYING
	Analytics.mark_tutorial_completed()
	var settings := SaveSystem.load_settings()
	settings["tutorial_completed"] = true
	SaveSystem.save_settings(settings)

func get_tutorial_message() -> String:
	if not tutorial_active or tutorial_step == TutorialStep.NONE or tutorial_step == TutorialStep.DONE:
		return ""
	return _tutorial_messages.get(tutorial_step, "")

func purchase_upgrade(upgrade_id: String) -> bool:
	var upgrade := get_upgrade_data(upgrade_id)
	if upgrade.is_empty():
		return false
	if upgrade_id in purchased_upgrades:
		return false
	if upgrade.get("prerequisite") != null and not str(upgrade.prerequisite) in purchased_upgrades:
		return false
	var cost: int = upgrade.get("cost", 0)
	if gold < cost:
		return false
	gold -= cost
	purchased_upgrades.append(upgrade_id)
	_apply_upgrade_effects(upgrade.get("effect", {}))
	gold_changed.emit(gold)
	_save_auto()
	return true

func get_item_data(item_id: String) -> Dictionary:
	if not items_data.has("items"):
		return {}
	for item in items_data.items:
		if item.id == item_id:
			return item
	return {}

func get_level_data(level_id: int) -> Dictionary:
	if not levels_data.has("levels"):
		return {}
	for level in levels_data.levels:
		if level.id == level_id:
			return level
	return {}

func get_current_level_data() -> Dictionary:
	return get_level_data(current_level_id)

func get_upgrade_data(upgrade_id: String) -> Dictionary:
	if not upgrades_data.has("upgrades"):
		return {}
	for upgrade in upgrades_data.upgrades:
		if upgrade.id == upgrade_id:
			return upgrade
	return {}

func get_available_upgrades() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var current_level: int = current_level_id
	if not upgrades_data.has("upgrades"):
		return result
	for upgrade in upgrades_data.upgrades:
		if upgrade.id in purchased_upgrades:
			continue
		if upgrade.get("level_available", 1) > current_level:
			continue
		result.append(upgrade)
	return result

func get_available_items() -> Array[Dictionary]:
	var level_data := get_current_level_data()
	var available_ids: Array = level_data.get("available_items", [])
	var result: Array[Dictionary] = []
	for item_id in available_ids:
		var item := get_item_data(item_id)
		if not item.is_empty():
			result.append(item)
	return result

func get_save_data() -> Dictionary:
	return {
		"gold": gold,
		"current_level_id": current_level_id,
		"current_day": current_day,
		"total_profit": total_profit,
		"inventory": inventory,
		"displayed_items": displayed_items,
		"purchased_upgrades": purchased_upgrades,
		"stall_stats": stall_stats,
		"weather": weather,
		"tutorial_step": tutorial_step,
		"tutorial_active": tutorial_active,
		"tips_enabled": tips_enabled,
		"tip_show_counts": tip_show_counts,
		"game_mode": game_mode,
		"current_phase": current_phase
	}

func apply_save_data(data: Dictionary) -> void:
	if data.has("gold"):
		gold = data.gold
	if data.has("current_level_id"):
		current_level_id = data.current_level_id
	if data.has("current_day"):
		current_day = data.current_day
	if data.has("total_profit"):
		total_profit = data.total_profit
	if data.has("inventory"):
		inventory = data.inventory
	if data.has("displayed_items"):
		displayed_items.clear()
		for item in data.displayed_items:
			displayed_items.append(item)
	if data.has("purchased_upgrades"):
		purchased_upgrades = data.purchased_upgrades
	if data.has("stall_stats"):
		stall_stats = data.stall_stats
	if data.has("weather"):
		weather = data.weather
	if data.has("tutorial_step"):
		tutorial_step = data.tutorial_step
	if data.has("tutorial_active"):
		tutorial_active = data.tutorial_active
	if data.has("tips_enabled"):
		tips_enabled = data.tips_enabled
	if data.has("tip_show_counts"):
		tip_show_counts = data.tip_show_counts
	if data.has("game_mode"):
		game_mode = data.game_mode
	if data.has("current_phase"):
		current_phase = data.current_phase

func _reset_inventory() -> void:
	inventory.clear()
	var level_data := get_current_level_data()
	var available_ids: Array = level_data.get("available_items", [])
	for item_id in available_ids:
		inventory[item_id] = {"quantity": 0, "days_remaining": -1, "cost_basis": 0}

func _apply_weather() -> void:
	var weathers: Array = customers_data.get("weather_effects", [])
	if weathers.is_empty():
		weather = &"sunny"
		return
	var total_weight: int = 0
	for w in weathers:
		total_weight += int(w.get("weight", 1))
	var roll: int = randi_range(0, total_weight - 1)
	var cumulative: int = 0
	for w in weathers:
		cumulative += int(w.get("weight", 1))
		if roll < cumulative:
			weather = w.id
			weather_changed.emit(StringName(weather))
			return
	weather = &"sunny"

func _apply_market_event() -> void:
	var level_data := get_current_level_data()
	var rules: Array = level_data.get("rules", [])
	if not "market_events" in rules:
		active_market_event.clear()
		return
	var events: Array = customers_data.get("market_events", [])
	if events.is_empty():
		return
	var total_weight: int = 0
	for e in events:
		total_weight += int(e.get("weight", 1))
	var roll: int = randi_range(0, total_weight - 1)
	var cumulative: int = 0
	for e in events:
		cumulative += int(e.get("weight", 1))
		if roll < cumulative:
			active_market_event = e
			market_event_triggered.emit(e)
			return
	active_market_event.clear()

func _get_weather_data() -> Dictionary:
	var weathers: Array = customers_data.get("weather_effects", [])
	for w in weathers:
		if w.id == weather:
			return w
	return {}

func _generate_customer() -> Dictionary:
	var types: Array = customers_data.get("customer_types", [])
	if types.is_empty():
		return {}
	var total_weight: int = 0
	for t in types:
		total_weight += int(t.get("appearance_weight", 1))
	var roll: int = randi_range(0, total_weight - 1)
	var cumulative: int = 0
	for t in types:
		cumulative += int(t.get("appearance_weight", 1))
		if roll < cumulative:
			return t
	return types[0]

func _simulate_customer_purchase(customer: Dictionary) -> Dictionary:
	var result := {
		"customer": customer,
		"purchased": false,
		"item_id": "",
		"price_paid": 0,
		"reason": ""
	}
	var preferred_cats: Array = customer.get("preferred_categories", [])
	var budget_range: Array = customer.get("budget_range", [10, 30])
	var budget: int = randi_range(budget_range[0], budget_range[1])
	var patience: int = int(customer.get("patience", 3)) + int(stall_stats.get("patience_bonus", 0))
	var purchase_logic: Dictionary = customers_data.get("purchase_logic", {})
	var price_sensitivity: float = float(purchase_logic.get("price_sensitivity_base", 0.7))
	var pref_bonus: float = float(purchase_logic.get("preference_bonus", 0.3))
	var display_bonus: float = float(purchase_logic.get("display_bonus", 0.15)) * float(stall_stats.get("display_bonus_multiplier", 1.0))
	var best_item: Dictionary = {}
	var best_score: float = 0.0
	for display_item in displayed_items:
		var item_id: String = display_item.get("item_id", "")
		var item_data := get_item_data(item_id)
		if item_data.is_empty():
			continue
		if not inventory.has(item_id) or inventory[item_id].quantity <= 0:
			continue
		var sell_price: int = display_item.get("price", item_data.get("base_price", 10))
		if sell_price > budget:
			continue
		var score: float = price_sensitivity * (1.0 - float(sell_price) / float(budget))
		if item_data.get("category", "") in preferred_cats:
			score += pref_bonus
		score += display_bonus
		var weather_data := _get_weather_data()
		var cat_mods: Dictionary = weather_data.get("category_modifiers", {})
		var cat: String = item_data.get("category", "")
		if cat_mods.has(cat):
			score *= float(cat_mods[cat])
		if not active_market_event.is_empty():
			var affected: String = str(active_market_event.get("affected_category", "none"))
			if cat == affected:
				var price_mod: float = float(active_market_event.get("price_modifier", 1.0))
				if price_mod > 1.0:
					score *= 0.8
				elif price_mod < 1.0:
					score *= 1.2
		if score > best_score:
			best_score = score
			best_item = display_item
	if best_item.is_empty():
		result.reason = "no_affordable_items"
		return result
	var buy_chance: float = clampf(best_score, 0.0, 1.0)
	if randf() <= buy_chance:
		result.purchased = true
		result.item_id = best_item.get("item_id", "")
		result.price_paid = best_item.get("price", 10)
		sell_item(result.item_id, 1)
	else:
		result.reason = "low_interest"
	return result

func _get_adjusted_cost(item_data: Dictionary) -> int:
	var base_cost: int = item_data.get("base_cost", 5)
	var cost_discount: float = float(stall_stats.get("cost_discount", 1.0))
	var adjusted: int = int(float(base_cost) * cost_discount)
	if not active_market_event.is_empty():
		var affected: String = str(active_market_event.get("affected_category", "none"))
		if item_data.get("category", "") == affected:
			var cost_mod: float = float(active_market_event.get("cost_modifier", 1.0))
			adjusted = int(float(adjusted) * cost_mod)
	return max(1, adjusted)

func _calculate_daily_expenses() -> int:
	var total: int = 0
	for item_id in inventory:
		var qty: int = inventory[item_id].get("quantity", 0)
		var cost: int = int(inventory[item_id].get("cost_basis", 0))
		total += cost * qty / 10
	return total

func _decay_perishables() -> void:
	var to_remove: Array[String] = []
	for item_id in inventory:
		var days_left: int = inventory[item_id].get("days_remaining", -1)
		if days_left > 0:
			inventory[item_id].days_remaining = days_left - 1
			if inventory[item_id].days_remaining <= 0:
				to_remove.append(item_id)
		elif days_left == -1:
			var item_data := get_item_data(item_id)
			if item_data.get("perishable", false):
				var shelf_life: int = item_data.get("shelf_life", 2) + int(stall_stats.get("shelf_life_bonus", 0))
				inventory[item_id].days_remaining = shelf_life
	for item_id in to_remove:
		inventory.erase(item_id)
	if to_remove.size() > 0:
		inventory_changed.emit()

func _apply_upgrade_effects(effect: Dictionary) -> void:
	for key in effect:
		var value = effect[key]
		if key == "display_slots":
			stall_stats[key] = stall_stats.get(key, 4) + int(value)
		elif key == "storage_multiplier":
			stall_stats[key] = float(value)
		elif key == "patience_bonus":
			stall_stats[key] = stall_stats.get(key, 0) + int(value)
		elif key == "display_bonus_multiplier":
			stall_stats[key] = float(value)
		elif key == "shelf_life_bonus":
			stall_stats[key] = stall_stats.get(key, 0) + int(value)
		elif key == "extra_customers":
			stall_stats[key] = stall_stats.get(key, 0) + int(value)
		elif key == "cost_discount":
			stall_stats[key] = float(value)

func _check_level_completion() -> void:
	var level_data := get_current_level_data()
	var target: int = level_data.get("target_profit", 50)
	if total_profit >= target:
		Analytics.log_level_completion(current_level_id, total_profit, current_day)
		level_completed.emit(current_level_id, total_profit)
	else:
		game_mode = GameMode.GAME_OVER
		Analytics.log_failure("level_failed", "Level %d: profit %d < target %d" % [current_level_id, total_profit, target])
		game_over.emit(&"level_failed")
		_transition_to_game_over()

func _transition_to_game_over() -> void:
	get_tree().change_scene_to_file("res://scenes/game_over.tscn")

func _check_tips() -> void:
	if not tips_enabled:
		return
	var tips: Array = tutorial_data.get("tips", [])
	for tip in tips:
		var tip_id: String = tip.id
		var max_shows: int = tip.get("max_show_times", 2)
		var shown: int = tip_show_counts.get(tip_id, 0)
		if shown >= max_shows:
			continue
		var trigger: String = tip.get("trigger", "")
		if _evaluate_tip_trigger(trigger):
			tip_show_counts[tip_id] = shown + 1
			Analytics.log_tip_shown(tip_id, false)
			tip_triggered.emit(tip_id, tip.message)

func _evaluate_tip_trigger(trigger: String) -> bool:
	match trigger:
		"bought_perishable":
			for item_id in inventory:
				var item := get_item_data(item_id)
				if item.get("perishable", false) and inventory[item_id].quantity > 0:
					return true
		"gold_below_20":
			return gold < 20
		"stock_over_80_percent":
			var total: int = 0
			var max_total: int = 0
			for item_id in inventory:
				var item := get_item_data(item_id)
				total += inventory[item_id].quantity
				max_total += int(float(item.get("stack_size", 20)) * stall_stats.get("storage_multiplier", 1.0))
			return max_total > 0 and float(total) / float(max_total) > 0.8
		"night_no_display":
			return current_phase == Phase.NIGHT and displayed_items.is_empty()
		"price_above_2x":
			for di in displayed_items:
				var item := get_item_data(di.get("item_id", ""))
				if not item.is_empty() and di.get("price", 0) > item.get("base_price", 10) * 2:
					return true
		"can_afford_upgrade":
			var upgrades := get_available_upgrades()
			for u in upgrades:
				if gold >= u.get("cost", 0):
					return true
	return false

func _save_auto() -> void:
	SaveSystem.save_game(1)

func get_display_slots_count() -> int:
	return int(stall_stats.get("display_slots", 4))

func get_max_level() -> int:
	if not levels_data.has("levels"):
		return 1
	return levels_data.levels.size()

func set_tips_enabled(enabled: bool) -> void:
	tips_enabled = enabled
	var settings := SaveSystem.load_settings()
	settings["tips_enabled"] = enabled
	SaveSystem.save_settings(settings)
