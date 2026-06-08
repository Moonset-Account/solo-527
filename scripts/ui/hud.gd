extends Control

signal pause_pressed
signal speed_toggled
signal shop_toggled
signal upgrade_toggled

@onready var money_label: Label = $TopBar/MoneyLabel
@onready var reputation_label: Label = $TopBar/ReputationLabel
@onready var timer_label: Label = $TopBar/TimerLabel
@onready var order_panel: Panel = $OrderPanel
@onready var shop_panel: Panel = $ShopPanel
@onready var upgrade_panel: Panel = $UpgradePanel
@onready var bottleneck_indicator: Label = $BottleneckIndicator
@onready var speed_button: Button = $BottomBar/SpeedButton
@onready var pause_button: Button = $BottomBar/PauseButton

var is_shop_open: bool = false
var is_upgrade_open: bool = false
var current_speed: float = 1.0

var _message_label: Label
var _message_tween: Tween
var _fps_label: Label
var _perf_label: Label

func _ready() -> void:
	_message_label = $MessageLabel
	_message_label.visible = false
	bottleneck_indicator.visible = false
	shop_panel.visible = false
	upgrade_panel.visible = false
	speed_button.pressed.connect(_on_speed_pressed)
	pause_button.pressed.connect(_on_pause_pressed)
	if GameManager:
		GameManager.money_changed.connect(update_money)
		GameManager.reputation_changed.connect(update_reputation)
	_setup_perf_display()

func _setup_perf_display() -> void:
	_fps_label = Label.new()
	_fps_label.name = "FPSLabel"
	_fps_label.position = Vector2(10, 50)
	_fps_label.add_theme_font_size_override("font_size", 12)
	_fps_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	add_child(_fps_label)
	_perf_label = Label.new()
	_perf_label.name = "PerfLabel"
	_perf_label.position = Vector2(10, 66)
	_perf_label.add_theme_font_size_override("font_size", 11)
	_perf_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
	add_child(_perf_label)

func _process(_delta: float) -> void:
	if _fps_label and PerformanceMonitor:
		var fps := PerformanceMonitor.get_average_fps()
		_fps_label.text = "FPS: %d" % int(fps)
		if PerformanceMonitor.is_performance_warning():
			_fps_label.add_theme_color_override("font_color", Color.RED)
		else:
			_fps_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
		if _perf_label:
			var frame_time := PerformanceMonitor.get_average_frame_time()
			_perf_label.text = "Frame: %.1fms" % (frame_time * 1000.0)

func update_money(amount) -> void:
	money_label.text = "$%d" % int(amount)

func update_reputation(amount) -> void:
	reputation_label.text = "Rep: %d" % int(amount)

func update_timer(time_remaining: float) -> void:
	var minutes: int = int(time_remaining) / 60
	var seconds: int = int(time_remaining) % 60
	timer_label.text = "%02d:%02d" % [minutes, seconds]

func update_orders(orders_data: Array) -> void:
	var order_list: VBoxContainer = order_panel.get_node("VBoxContainer/OrderList") if order_panel.has_node("VBoxContainer/OrderList") else null
	if order_list == null:
		return
	for child in order_list.get_children():
		child.queue_free()
	for order in orders_data:
		var container := HBoxContainer.new()
		var name_label := Label.new()
		var type_str: String = str(order.get("product_type", "?")).to_upper()
		var qty_str: String = "%d/%d" % [int(order.get("quantity_delivered", 0)), int(order.get("quantity", 1))]
		name_label.text = "%s %s" % [type_str, qty_str]
		name_label.custom_minimum_size.x = 120
		name_label.add_theme_font_size_override("font_size", 12)
		var progress := ProgressBar.new()
		progress.min_value = 0.0
		progress.max_value = float(order.get("quantity", 1))
		progress.value = float(order.get("quantity_delivered", 0))
		progress.custom_minimum_size.x = 80
		progress.custom_minimum_size.y = 14
		var time_left: float = float(order.get("time_remaining", 0.0))
		var time_label := Label.new()
		time_label.text = "%ds" % int(time_left)
		time_label.add_theme_font_size_override("font_size", 11)
		if time_left < 30.0:
			time_label.add_theme_color_override("font_color", Color.RED)
		container.add_child(name_label)
		container.add_child(progress)
		container.add_child(time_label)
		order_list.add_child(container)

func show_bottleneck_warning(position: Vector2, message: String) -> void:
	bottleneck_indicator.visible = true
	bottleneck_indicator.text = "⚠ " + message
	if bottleneck_indicator.has_theme_color_override("font_color"):
		bottleneck_indicator.add_theme_color_override("font_color", Color.ORANGE)
	var tween := create_tween()
	tween.tween_property(bottleneck_indicator, "modulate:a", 0.3, 0.3)
	tween.tween_property(bottleneck_indicator, "modulate:a", 1.0, 0.3)
	tween.set_loops()

func clear_bottleneck_warning() -> void:
	bottleneck_indicator.visible = false

func toggle_shop() -> void:
	is_shop_open = not is_shop_open
	is_upgrade_open = false
	upgrade_panel.visible = false
	shop_panel.visible = is_shop_open
	shop_toggled.emit()

func toggle_upgrades() -> void:
	is_upgrade_open = not is_upgrade_open
	is_shop_open = false
	shop_panel.visible = false
	upgrade_panel.visible = is_upgrade_open
	upgrade_toggled.emit()

func populate_upgrade_panel(machines: Array, upgrade_system) -> void:
	if not upgrade_panel.has_node("VBoxContainer/UpgradeList"):
		return
	var upgrade_list: VBoxContainer = upgrade_panel.get_node("VBoxContainer/UpgradeList")
	for child in upgrade_list.get_children():
		child.queue_free()
	for machine in machines:
		if not machine is Machine:
			continue
		var m: Machine = machine
		var container := HBoxContainer.new()
		var label := Label.new()
		label.text = "%s Lv%d" % [m.machine_type.capitalize(), m.upgrade_level]
		label.custom_minimum_size.x = 100
		label.add_theme_font_size_override("font_size", 12)
		var cost_btn := Button.new()
		var cost := m.get_upgrade_cost()
		if cost > 0:
			cost_btn.text = "Upgrade $%d" % cost
			cost_btn.pressed.connect(_on_upgrade_machine.bind(m))
		else:
			cost_btn.text = "MAX"
			cost_btn.disabled = true
		container.add_child(label)
		container.add_child(cost_btn)
		upgrade_list.add_child(container)

func _on_upgrade_machine(machine: Machine) -> void:
	if machine.upgrade():
		show_message("%s upgraded to Lv%d!" % [machine.machine_type.capitalize(), machine.upgrade_level])
		if InputManager:
			InputManager.save_mappings()

func select_machine_type(type: String) -> void:
	pass

func set_speed(speed: float) -> void:
	current_speed = speed
	speed_button.text = "%dx" % int(speed)

func show_message(text: String, duration: float = 2.0) -> void:
	_message_label.text = text
	_message_label.visible = true
	_message_label.modulate.a = 1.0
	if _message_tween and _message_tween.is_valid():
		_message_tween.kill()
	_message_tween = create_tween()
	_message_tween.tween_interval(duration)
	_message_tween.tween_property(_message_label, "modulate:a", 0.0, 0.5)
	_message_tween.tween_callback(func() -> void: _message_label.visible = false)

func update_level_info(level_name: String, level_id: int) -> void:
	var level_label: Label = $TopBar/LevelLabel
	if level_label:
		level_label.text = "%s - %d" % [level_name, level_id]

func _on_speed_pressed() -> void:
	speed_toggled.emit()

func _on_pause_pressed() -> void:
	pause_pressed.emit()
