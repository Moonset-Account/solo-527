class_name LevelController
extends Node2D

signal level_ready
signal order_completed(order_id, reward)
signal order_failed(order_id, penalty)
signal level_won(stars)
signal level_lost(reason)
signal time_updated(time_remaining)
signal order_progress_updated

var level_config: LevelConfig = null
var factory_grid: FactoryGrid = null
var order_system: OrderSystem = null
var upgrade_system: UpgradeSystem = null
var bottleneck_detector: BottleneckDetector = null
var achievement_system: AchievementSystem = null
var offline_earnings: OfflineEarnings = null

var level_timer: float = 0.0
var is_running: bool = false
var orders_completed: int = 0
var orders_failed: int = 0
var total_rewards: int = 0
var total_penalties: int = 0
var products_delivered: int = 0
var products_failed: int = 0
var spawn_timer: float = 0.0
var spawn_interval: float = 4.0
var game_speed: float = 1.0
var conveyors_placed: int = 0
var bottlenecks_fixed: int = 0

var _spawn_points: Array[Vector2i] = []
var _delivery_points: Array[Vector2i] = []
var _prev_bottleneck_count: int = 0
var _hud_update_timer: float = 0.0

var _spawn_delivery_map: Dictionary = {
	1: {"spawn": [Vector2i(0, 2)], "delivery": [Vector2i(7, 2)]},
	2: {"spawn": [Vector2i(0, 3)], "delivery": [Vector2i(9, 3)]},
	3: {"spawn": [Vector2i(0, 4)], "delivery": [Vector2i(9, 4)]},
	4: {"spawn": [Vector2i(0, 4), Vector2i(0, 5)], "delivery": [Vector2i(11, 4), Vector2i(11, 5)]},
	5: {"spawn": [Vector2i(0, 4), Vector2i(0, 5), Vector2i(0, 6)], "delivery": [Vector2i(13, 4), Vector2i(13, 5), Vector2i(13, 6)]},
}

func _ready() -> void:
	factory_grid = FactoryGrid.new()
	factory_grid.name = "FactoryGrid"
	add_child(factory_grid)
	factory_grid.product_delivered.connect(_on_product_delivered)
	factory_grid.entity_placed.connect(_on_entity_placed)

	order_system = OrderSystem.new()
	order_system.name = "OrderSystem"
	add_child(order_system)
	order_system.order_completed.connect(_on_order_completed)
	order_system.order_failed.connect(_on_order_failed_signal)

	upgrade_system = UpgradeSystem.new()
	upgrade_system.name = "UpgradeSystem"
	add_child(upgrade_system)

	bottleneck_detector = BottleneckDetector.new()
	bottleneck_detector.name = "BottleneckDetector"
	add_child(bottleneck_detector)
	bottleneck_detector.bottleneck_found.connect(_on_bottleneck_found)
	bottleneck_detector.bottleneck_cleared.connect(_on_bottleneck_cleared)

	achievement_system = AchievementSystem.new()
	achievement_system.name = "AchievementSystem"
	add_child(achievement_system)

	offline_earnings = OfflineEarnings.new()
	offline_earnings.name = "OfflineEarnings"
	add_child(offline_earnings)

	_initialize_current_level()

func _initialize_current_level() -> void:
	var level_id := 1
	if GameManager and GameManager.current_level_id != "":
		level_id = int(GameManager.current_level_id)
	var config := LevelConfig.get_level_by_id(level_id)
	if config == null:
		config = LevelConfig.get_level_by_id(1)
	if config:
		setup_level(config)
		if not config.tutorial_enabled:
			start_level()

func setup_level(config: LevelConfig) -> void:
	level_config = config
	level_timer = 0.0
	orders_completed = 0
	orders_failed = 0
	total_rewards = 0
	total_penalties = 0
	products_delivered = 0
	products_failed = 0
	spawn_timer = 0.0
	conveyors_placed = 0
	bottlenecks_fixed = 0
	_prev_bottleneck_count = 0
	is_running = false

	_setup_spawn_delivery_points()
	factory_grid.create_grid(level_config.grid_width, level_config.grid_height)
	factory_grid.set_spawn_points(_spawn_points)
	factory_grid.set_delivery_points(_delivery_points)

	GameManager.set_money(level_config.starting_money)
	GameManager.set_reputation(level_config.reputation_start)
	GameManager.is_game_active = true
	GameManager.current_level_id = str(level_config.level_id)

	order_system.reset()
	order_system.load_orders_for_level(level_config.level_id)

	if AnalyticsManager:
		AnalyticsManager.start_level_analytics(str(level_config.level_id))

	_connect_signals()
	_update_hud()
	level_ready.emit()
	if level_config.tutorial_enabled:
		_show_tutorial()

func _process(delta: float) -> void:
	if not is_running:
		return
	update_level(delta)

func start_level() -> void:
	is_running = true
	spawn_timer = spawn_interval * 0.5
	order_system.start_orders()
	if AnalyticsManager:
		AnalyticsManager.record_choice(int(GameManager.current_level_id), "level_start", {"speed": game_speed})

func pause_level() -> void:
	is_running = false

func resume_level() -> void:
	is_running = true

func update_level(delta: float) -> void:
	var scaled_delta := delta * game_speed
	level_timer += scaled_delta
	time_updated.emit(get_time_remaining())

	order_system.update_orders(scaled_delta)

	spawn_timer -= scaled_delta
	if spawn_timer <= 0.0:
		spawn_raw_product()
		spawn_timer = spawn_interval

	if bottleneck_detector:
		bottleneck_detector.scan_for_bottlenecks(factory_grid)

	_hud_update_timer += delta
	if _hud_update_timer >= 0.5:
		_hud_update_timer = 0.0
		_update_hud_orders()
		_check_achievements()

	if offline_earnings:
		offline_earnings.update_earning_rate(float(total_rewards), level_timer)

	var lose_reason := check_lose_condition()
	if lose_reason != "":
		fail_level(lose_reason)
		return

	if check_win_condition():
		complete_level()

func check_win_condition() -> bool:
	return orders_completed >= level_config.required_orders

func check_lose_condition() -> String:
	if level_config and get_time_remaining() <= 0.0:
		return "Time ran out! Completed %d/%d orders." % [orders_completed, level_config.required_orders]
	if GameManager.reputation <= 0:
		return "Reputation dropped to zero! Too many failed orders damaged your reputation."
	return ""

func complete_level() -> void:
	is_running = false
	var completion_rate := float(orders_completed) / float(maxi(level_config.required_orders, 1))
	var stars := level_config.get_star_rating(completion_rate)
	var bonus := int(completion_rate * 500)
	total_rewards += bonus
	GameManager.add_money(bonus)

	if AnalyticsManager:
		AnalyticsManager.record_level_complete(str(level_config.level_id), level_timer, stars)
	if SaveManager:
		var data: SaveData = SaveManager.load_game()
		if data == null:
			data = SaveData.new()
		data.current_level = level_config.level_id
		data.money = GameManager.money
		data.reputation = GameManager.reputation
		data.total_earnings += total_rewards
		data.play_time_seconds += level_timer
		data.total_failures += products_failed
		data.record_key_choice("level_complete", {
			"level_id": level_config.level_id,
			"stars": stars,
			"time": level_timer,
			"orders_completed": orders_completed,
			"orders_failed": orders_failed,
			"products_delivered": products_delivered,
			"products_failed": products_failed,
			"total_rewards": total_rewards,
			"conveyors_placed": conveyors_placed,
			"bottlenecks_fixed": bottlenecks_fixed,
		})
		if not data.completed_levels.has(str(level_config.level_id)):
			data.completed_levels[str(level_config.level_id)] = {"stars": stars, "best_time": level_timer}
		else:
			var existing: Dictionary = data.completed_levels[str(level_config.level_id)]
			if stars > existing.get("stars", 0):
				existing["stars"] = stars
			if level_timer < existing.get("best_time", 9999.0):
				existing["best_time"] = level_timer
		for ach_id in achievement_system.unlocked_achievements:
			if not data.achievements.has(ach_id):
				data.achievements.append(ach_id)
		data.last_save_timestamp = int(Time.get_unix_time_from_system())
		SaveManager.save_game(data)
	GameManager.complete_level(stars)
	level_won.emit(stars)
	_show_results(stars)

func fail_level(reason: String) -> void:
	is_running = false
	if AnalyticsManager:
		AnalyticsManager.record_failure(str(level_config.level_id), reason)
	if SaveManager:
		var data: SaveData = SaveManager.load_game()
		if data == null:
			data = SaveData.new()
		data.play_time_seconds += level_timer
		data.total_failures += 1
		data.record_key_choice("level_fail", {
			"level_id": level_config.level_id,
			"reason": reason,
			"time": level_timer,
			"orders_completed": orders_completed,
			"products_delivered": products_delivered,
			"products_failed": products_failed,
		})
		data.last_save_timestamp = int(Time.get_unix_time_from_system())
		SaveManager.save_game(data)
	GameManager.fail_level(reason)
	level_lost.emit(reason)
	_show_failure(reason)

func _on_product_delivered(product: Product) -> void:
	var product_type: String = product.get_product_type_name()
	var quality := product.get_total_quality()

	if product.is_failed():
		products_failed += 1
		GameManager.lose_reputation(level_config.reputation_penalty)
		return

	products_delivered += 1
	var matched := order_system.deliver_product(product_type, quality)
	if matched:
		var reward := _calculate_reward(product_type, quality)
		total_rewards += reward
		GameManager.add_money(reward)
	else:
		var base_reward := int(20 * level_config.reward_multiplier * quality)
		total_rewards += base_reward
		GameManager.add_money(base_reward)
	order_progress_updated.emit()

func _calculate_reward(product_type: String, quality: float) -> int:
	var base := 50
	match product_type:
		"cut": base = 60
		"assembled": base = 100
		"painted": base = 130
		"packed": base = 150
	return int(base * level_config.reward_multiplier * quality)

func _on_order_completed(order_id: String, reward: int) -> void:
	orders_completed += 1
	total_rewards += reward
	order_completed.emit(order_id, reward)
	if AnalyticsManager:
		AnalyticsManager.record_choice(int(GameManager.current_level_id), "order_complete", {"order_id": order_id, "reward": reward})

func _on_order_failed_signal(order_id: String, penalty: int) -> void:
	orders_failed += 1
	total_penalties += penalty
	GameManager.lose_reputation(level_config.reputation_penalty)
	order_failed.emit(order_id, penalty)

func _on_entity_placed(entity: Node2D, grid_pos: Vector2i) -> void:
	if entity is ConveyorBelt:
		conveyors_placed += 1
	if AnalyticsManager:
		var type_name := "unknown"
		if entity is Machine:
			type_name = entity.machine_type
		elif entity is ConveyorBelt:
			type_name = "conveyor"
		elif entity is QualityCheck:
			type_name = "quality_check"
		AnalyticsManager.record_choice(int(GameManager.current_level_id), "place_entity", {"type": type_name, "pos": "%d,%d" % [grid_pos.x, grid_pos.y]})

func _on_bottleneck_found(pos: Vector2i, severity: float) -> void:
	factory_grid.highlight_bottleneck(pos)
	var worst := bottleneck_detector.get_worst_bottleneck()
	if worst:
		var suggestion := bottleneck_detector.get_suggestion(worst)
		var hud: Control = get_node_or_null("HUDLayer/HUD")
		if hud and hud.has_method("show_bottleneck_warning"):
			hud.show_bottleneck_warning(Vector2(pos), suggestion)

func _on_bottleneck_cleared(pos: Vector2i) -> void:
	factory_grid.clear_highlights()
	if bottleneck_detector.get_bottlenecks().is_empty():
		var hud: Control = get_node_or_null("HUDLayer/HUD")
		if hud and hud.has_method("clear_bottleneck_warning"):
			hud.clear_bottleneck_warning()
		bottlenecks_fixed += 1

func spawn_raw_product() -> void:
	if _spawn_points.is_empty():
		return
	var spawn_point: Vector2i = _spawn_points.pick_random()
	var product := Product.new()
	product.product_type = "standard"
	product.current_cell = spawn_point
	product.position = factory_grid.get_cell_center(spawn_point)
	var delivery: Vector2i = _delivery_points.pick_random() if _delivery_points.size() > 0 else Vector2i(-1, -1)
	if delivery.x >= 0:
		product.path = factory_grid.find_path(spawn_point, delivery)
		product.path_index = 1 if product.path.size() > 1 else 0
	else:
		product.path = [spawn_point]
		product.path_index = 0
	factory_grid.products.append(product)
	factory_grid.add_child(product)

func set_game_speed(speed: float) -> void:
	game_speed = speed

func get_time_remaining() -> float:
	if level_config == null:
		return 0.0
	return maxf(level_config.time_limit - level_timer, 0.0)

func get_orders_progress() -> Dictionary:
	return {
		"completed": orders_completed,
		"failed": orders_failed,
		"active": order_system.active_orders.size() if order_system else 0,
		"required": level_config.required_orders if level_config else 0,
	}

func get_level_stats() -> Dictionary:
	var stars := 0
	if level_config:
		var completion_rate := float(orders_completed) / float(maxi(level_config.required_orders, 1))
		stars = level_config.get_star_rating(completion_rate)
	return {
		"time_elapsed": level_timer,
		"orders_completed": orders_completed,
		"orders_failed": orders_failed,
		"products_delivered": products_delivered,
		"products_failed": products_failed,
		"total_rewards": total_rewards,
		"total_penalties": total_penalties,
		"stars": stars,
		"conveyors_placed": conveyors_placed,
		"bottlenecks_fixed": bottlenecks_fixed,
	}

func cleanup() -> void:
	is_running = false
	if factory_grid:
		factory_grid.clear_grid()
	if order_system:
		order_system.reset()
	if bottleneck_detector:
		bottleneck_detector.reset()
	_spawn_points.clear()
	_delivery_points.clear()

func _setup_spawn_delivery_points() -> void:
	_spawn_points.clear()
	_delivery_points.clear()
	if level_config == null:
		return
	var level_id := level_config.level_id
	if _spawn_delivery_map.has(level_id):
		var entry: Dictionary = _spawn_delivery_map[level_id]
		var sp = entry.get("spawn", [])
		var dp = entry.get("delivery", [])
		for p in sp:
			_spawn_points.append(p)
		for p in dp:
			_delivery_points.append(p)

func _update_hud() -> void:
	if GameManager:
		GameManager.money_changed.emit(GameManager.money)
		GameManager.reputation_changed.emit(GameManager.reputation)
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("update_level_info") and level_config:
		hud.update_level_info(level_config.level_name, level_config.level_id)
	_update_hud_orders()

func _update_hud_orders() -> void:
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("update_orders") and order_system:
		var orders_data := order_system.get_all_orders_data()
		hud.update_orders(orders_data)

func _check_achievements() -> void:
	if achievement_system:
		achievement_system.check_achievements({
			"orders_completed": orders_completed,
			"total_earnings": total_rewards,
			"last_completed_level": level_config.level_id if level_config else 0,
			"no_failed_orders": orders_failed == 0,
			"gold_stars": level_config.get_star_rating(float(orders_completed) / float(maxi(level_config.required_orders, 1))) if level_config else 0,
			"conveyors_placed": conveyors_placed,
			"bottlenecks_fixed": bottlenecks_fixed,
			"offline_earnings_collected": 0,
			"max_upgraded_machines": 0,
			"half_time_orders": 0,
			"perfect_quality": products_failed == 0 and products_delivered > 0,
		})
		if achievement_system.unlocked_achievements.size() > 0:
			var hud: Control = get_node_or_null("HUDLayer/HUD")
			if hud and hud.has_method("show_message"):
				for ach_id in achievement_system.unlocked_achievements:
					var ach_data := achievement_system._get_achievement_data(ach_id)
					hud.show_message("Achievement: %s!" % ach_data.get("name", "Unknown"), 3.0)

func _on_speed_button_pressed() -> void:
	if game_speed == 1.0:
		set_game_speed(2.0)
	elif game_speed == 2.0:
		set_game_speed(3.0)
	else:
		set_game_speed(1.0)
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("set_speed"):
		hud.set_speed(game_speed)
	if AnalyticsManager:
		AnalyticsManager.record_choice(int(GameManager.current_level_id), "speed_change", {"speed": game_speed})

func _on_pause_button_pressed() -> void:
	if is_running:
		pause_level()
	else:
		resume_level()
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_node("BottomBar/PauseButton"):
		var btn: Button = hud.get_node("BottomBar/PauseButton")
		btn.text = "Resume" if not is_running else "Pause"

func _on_shop_button_pressed() -> void:
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("toggle_shop"):
		hud.toggle_shop()
		if hud.is_shop_open:
			_populate_shop(hud)

func _on_shop_close_button_pressed() -> void:
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("toggle_shop"):
		hud.toggle_shop()

func _on_upgrade_close_button_pressed() -> void:
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("toggle_upgrades"):
		hud.toggle_upgrades()

func _populate_shop(hud: Control) -> void:
	if not hud or not level_config:
		return
	var shop_items: HBoxContainer = hud.get_node_or_null("ShopPanel/VBoxContainer/ShopItems")
	if shop_items == null:
		return
	for child in shop_items.get_children():
		child.queue_free()
	for machine_type in level_config.available_machines:
		var btn := Button.new()
		var cost := factory_grid.get_entity_cost(machine_type) if factory_grid else 0
		btn.text = "%s ($%d)" % [machine_type.capitalize(), cost]
		btn.custom_minimum_size = Vector2(120, 40)
		btn.pressed.connect(_on_shop_item_selected.bind(machine_type))
		shop_items.add_child(btn)

func _on_shop_item_selected(machine_type: String) -> void:
	if factory_grid:
		factory_grid.selected_entity_type = machine_type
		factory_grid.is_placing = true
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("show_message"):
		hud.show_message("Click on the grid to place %s. Right-click to remove." % machine_type.capitalize())

func _connect_signals() -> void:
	var results: Control = get_node_or_null("ResultsLayer/ResultsScreen")
	if results:
		if results.has_signal("next_level_pressed"):
			results.next_level_pressed.connect(_on_next_level)
		if results.has_signal("retry_pressed"):
			results.retry_pressed.connect(_on_retry)
		if results.has_signal("menu_pressed"):
			results.menu_pressed.connect(_on_menu)

	var tutorial: Control = get_node_or_null("TutorialLayer/TutorialOverlay")
	if tutorial:
		if tutorial.has_signal("tutorial_finished"):
			tutorial.tutorial_finished.connect(_on_tutorial_finished)

func _show_results(stars: int) -> void:
	var results: Control = get_node_or_null("ResultsLayer/ResultsScreen")
	if results and results.has_method("show_victory"):
		results.show_victory(stars, get_level_stats())

func _show_failure(reason: String) -> void:
	var results: Control = get_node_or_null("ResultsLayer/ResultsScreen")
	if results and results.has_method("show_failure"):
		results.show_failure(reason, get_level_stats())

func _on_next_level() -> void:
	if level_config == null:
		return
	var next_id := level_config.level_id + 1
	var next_config := LevelConfig.get_level_by_id(next_id)
	if next_config:
		cleanup()
		setup_level(next_config)
		start_level()
		if next_config.tutorial_enabled:
			_show_tutorial()
	else:
		get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_retry() -> void:
	if level_config == null:
		return
	cleanup()
	setup_level(level_config)
	start_level()

func _on_menu() -> void:
	cleanup()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _show_tutorial() -> void:
	var tutorial: Control = get_node_or_null("TutorialLayer/TutorialOverlay")
	if tutorial and tutorial.has_method("load_tutorial"):
		tutorial.load_tutorial(level_config.level_id)
		tutorial.start_tutorial()

func _on_tutorial_finished() -> void:
	start_level()
