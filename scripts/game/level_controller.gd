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
var spawn_timer: float = 0.0
var spawn_interval: float = 5.0
var game_speed: float = 1.0

var _spawn_points: Array[Vector2i] = []
var _delivery_points: Array[Vector2i] = []

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
	factory_grid.product_reached_end.connect(_on_product_reached_end)

	order_system = OrderSystem.new()
	order_system.name = "OrderSystem"
	add_child(order_system)

	upgrade_system = UpgradeSystem.new()
	upgrade_system.name = "UpgradeSystem"
	add_child(upgrade_system)

	bottleneck_detector = BottleneckDetector.new()
	bottleneck_detector.name = "BottleneckDetector"
	add_child(bottleneck_detector)

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
	spawn_timer = 0.0
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

	_update_hud()
	_connect_signals()
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
	_check_order_failures()

	spawn_timer -= scaled_delta
	if spawn_timer <= 0.0:
		spawn_raw_product()
		spawn_timer = spawn_interval

	if bottleneck_detector:
		bottleneck_detector.scan_for_bottlenecks(factory_grid)

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
		return "Time ran out! You needed %d more orders." % (level_config.required_orders - orders_completed)
	if GameManager.reputation <= 0:
		return "Reputation dropped to zero! Too many failed orders."
	return ""

func complete_level() -> void:
	is_running = false
	var completion_rate := float(orders_completed) / float(maxi(level_config.required_orders, 1))
	var stars := level_config.get_star_rating(completion_rate)
	total_rewards += int(completion_rate * 500)

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
		if not data.completed_levels.has(str(level_config.level_id)):
			data.completed_levels[str(level_config.level_id)] = {"stars": stars, "best_time": level_timer}
		else:
			var existing: Dictionary = data.completed_levels[str(level_config.level_id)]
			if stars > existing.get("stars", 0):
				existing["stars"] = stars
			if level_timer < existing.get("best_time", 9999.0):
				existing["best_time"] = level_timer
		data.last_save_timestamp = int(Time.get_unix_time_from_system())
		SaveManager.save_game(data)
	GameManager.complete_level(stars)
	level_won.emit(stars)
	_show_results(stars)

func fail_level(reason: String) -> void:
	is_running = false
	if AnalyticsManager:
		AnalyticsManager.record_failure(str(level_config.level_id), reason)
	GameManager.fail_level(reason)
	level_lost.emit(reason)
	_show_failure(reason)

func _on_product_reached_end(product: Product) -> void:
	if product.is_finished():
		products_delivered += 1
		var matched := order_system.deliver_product("packed", product.get_total_quality())
		if matched:
			orders_completed += 1
			var reward := int(100 * level_config.reward_multiplier * product.get_total_quality())
			total_rewards += reward
			GameManager.add_money(reward)
			order_completed.emit(str(orders_completed), reward)
		else:
			var base_reward := int(30 * level_config.reward_multiplier * product.get_total_quality())
			total_rewards += base_reward
			GameManager.add_money(base_reward)
		order_progress_updated.emit()
	elif product.is_failed():
		GameManager.lose_reputation(5)

func _check_order_failures() -> void:
	for order in order_system.failed_orders:
		if not order.is_active:
			continue
	var failed_count := order_system.failed_orders.size()
	if failed_count > orders_failed:
		var new_failures := failed_count - orders_failed
		orders_failed = failed_count
		for i in range(new_failures):
			GameManager.lose_reputation(level_config.reputation_penalty)

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
		"total_rewards": total_rewards,
		"total_penalties": total_penalties,
		"stars": stars,
	}

func cleanup() -> void:
	is_running = false
	if factory_grid:
		factory_grid.clear_grid()
	if order_system:
		order_system.reset()
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
	if achievement_system:
		achievement_system.check_achievements({
			"orders_completed": orders_completed,
			"total_earnings": total_rewards,
			"last_completed_level": level_config.level_id if level_config else 0,
			"no_failed_orders": orders_failed == 0,
			"gold_stars": level_config.get_star_rating(float(orders_completed) / float(maxi(level_config.required_orders, 1))) if level_config else 0,
		})

func _on_speed_button_pressed() -> void:
	if game_speed == 1.0:
		set_game_speed(2.0)
	else:
		set_game_speed(1.0)
	var hud: Control = get_node_or_null("HUDLayer/HUD")
	if hud and hud.has_method("set_speed"):
		hud.set_speed(game_speed)

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
