extends Control

signal pause_pressed
signal speed_toggled
signal shop_toggled
signal upgrade_selected(machine_type: String)

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
		name_label.text = str(order.get("id", "Order"))
		name_label.custom_minimum_size.x = 80
		var progress := ProgressBar.new()
		progress.min_value = 0.0
		progress.max_value = float(order.get("quantity", 1))
		progress.value = float(order.get("quantity_delivered", 0))
		progress.custom_minimum_size.x = 80
		container.add_child(name_label)
		container.add_child(progress)
		order_list.add_child(container)

func show_bottleneck_warning(position: Vector2, message: String) -> void:
	bottleneck_indicator.visible = true
	bottleneck_indicator.text = "⚠ " + message
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

func select_machine_type(type: String) -> void:
	upgrade_selected.emit(type)

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
