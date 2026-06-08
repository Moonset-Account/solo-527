extends Control

var _available_items: Array[Dictionary] = []

@onready var _gold_label: Label = $TopBar/GoldLabel
@onready var _day_label: Label = $TopBar/DayLabel
@onready var _weather_label: Label = $TopBar/WeatherLabel
@onready var _event_label: Label = $TopBar/EventLabel
@onready var _item_grid: GridContainer = $CenterPanel/ScrollContainer/ItemGrid
@onready var _inventory_list: VBoxContainer = $RightPanel/ScrollContainer/InventoryList
@onready var _continue_button: Button = $BottomBar/ContinueButton
@onready var _pause_button: Button = $BottomBar/PauseButton
@onready var _tip_label: Label = $TipPanel/TipLabel
@onready var _tip_close_button: Button = $TipPanel/CloseButton
@onready var _tutorial_panel: PanelContainer = $TutorialPanel
@onready var _tutorial_label: Label = $TutorialPanel/VBoxContainer/TutorialLabel
@onready var _tutorial_skip_button: Button = $TutorialPanel/VBoxContainer/SkipButton

func _ready() -> void:
	_continue_button.pressed.connect(_on_continue)
	_pause_button.pressed.connect(_on_pause)
	_tip_close_button.pressed.connect(_on_tip_close)
	_tutorial_skip_button.pressed.connect(_on_tutorial_skip)
	GameManager.gold_changed.connect(_on_gold_changed)
	GameManager.inventory_changed.connect(_refresh_inventory)
	GameManager.tip_triggered.connect(_on_tip_triggered)
	GameManager.tutorial_message_requested.connect(_on_tutorial_message)
	_refresh_ui()
	_refresh_shop()
	_refresh_inventory()
	_show_initial_tutorial()

func _show_initial_tutorial() -> void:
	if GameManager.tutorial_active:
		var msg := GameManager.get_tutorial_message()
		if not msg.is_empty():
			_tutorial_label.text = msg
			_tutorial_panel.visible = true
		else:
			_tutorial_panel.visible = false
	else:
		_tutorial_panel.visible = false

func _on_tutorial_message(message: String) -> void:
	if message.is_empty():
		_tutorial_panel.visible = false
		return
	_tutorial_label.text = message
	_tutorial_panel.visible = true

func _on_tutorial_skip() -> void:
	GameManager.skip_tutorial()
	_tutorial_panel.visible = false

func _refresh_ui() -> void:
	_gold_label.text = "金币: %d" % GameManager.gold
	_day_label.text = "第 %d 天 - 采购时间" % GameManager.current_day
	var weather_data := GameManager._get_weather_data()
	_weather_label.text = "天气: %s" % weather_data.get("name", "晴天")
	if not GameManager.active_market_event.is_empty():
		_event_label.text = "事件: %s" % GameManager.active_market_event.get("name", "")
		_event_label.visible = true
	else:
		_event_label.visible = false

func _refresh_shop() -> void:
	for child in _item_grid.get_children():
		child.queue_free()
	_available_items = GameManager.get_available_items()
	var col_count: int = 4
	_item_grid.columns = col_count
	for item in _available_items:
		var panel := PanelContainer.new()
		var vbox := VBoxContainer.new()
		vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		var name_label := Label.new()
		name_label.text = item.get("name", "")
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_label.add_theme_font_size_override("font_size", 16)
		var cost_label := Label.new()
		var adjusted_cost: int = GameManager._get_adjusted_cost(item)
		cost_label.text = "进价: %d" % adjusted_cost
		cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cost_label.add_theme_color_override("font_color", Color(1, 0.7, 0.3, 1))
		var price_label := Label.new()
		price_label.text = "建议售价: %d" % item.get("base_price", 10)
		price_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		price_label.add_theme_color_override("font_color", Color(0.5, 1, 0.5, 1))
		var cat_label := Label.new()
		var cat_name: String = str(GameManager.items_data.get("category_names", {}).get(item.get("category", ""), item.get("category", "")))
		cat_label.text = cat_name
		cat_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cat_label.add_theme_font_size_override("font_size", 12)
		cat_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1))
		var buy_btn := Button.new()
		buy_btn.text = "购买 x1"
		buy_btn.custom_minimum_size = Vector2(100, 35)
		var item_id: String = item.get("id", "")
		buy_btn.pressed.connect(_on_buy_item.bind(item_id, 1))
		var buy5_btn := Button.new()
		buy5_btn.text = "购买 x5"
		buy5_btn.custom_minimum_size = Vector2(100, 35)
		buy5_btn.pressed.connect(_on_buy_item.bind(item_id, 5))
		var btn_box := HBoxContainer.new()
		btn_box.alignment = BoxContainer.ALIGNMENT_CENTER
		btn_box.add_child(buy_btn)
		btn_box.add_child(buy5_btn)
		vbox.add_child(name_label)
		vbox.add_child(cat_label)
		vbox.add_child(cost_label)
		vbox.add_child(price_label)
		if item.get("perishable", false):
			var perish_label := Label.new()
			perish_label.text = "保质期: %d天" % item.get("shelf_life", 2)
			perish_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4, 1))
			perish_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			vbox.add_child(perish_label)
		vbox.add_child(btn_box)
		panel.add_child(vbox)
		_item_grid.add_child(panel)

func _refresh_inventory() -> void:
	for child in _inventory_list.get_children():
		child.queue_free()
	var header := Label.new()
	header.text = "当前库存:"
	header.add_theme_font_size_override("font_size", 18)
	header.add_theme_color_override("font_color", Color(1, 0.85, 0.3, 1))
	_inventory_list.add_child(header)
	for item_id in GameManager.inventory:
		var qty: int = GameManager.inventory[item_id].quantity
		if qty <= 0:
			continue
		var item_data := GameManager.get_item_data(item_id)
		var label := Label.new()
		var days_left: int = GameManager.inventory[item_id].get("days_remaining", -1)
		var expiry_text: String = ""
		if days_left > 0:
			expiry_text = " [剩余%d天]" % days_left
		elif days_left == 0:
			expiry_text = " [即将过期!]"
		label.text = "%s x%d%s" % [item_data.get("name", item_id), qty, expiry_text]
		label.add_theme_font_size_override("font_size", 14)
		if days_left == 0:
			label.add_theme_color_override("font_color", Color(1, 0.3, 0.3, 1))
		elif days_left == 1:
			label.add_theme_color_override("font_color", Color(1, 0.7, 0.3, 1))
		_inventory_list.add_child(label)

func _on_buy_item(item_id: String, quantity: int) -> void:
	if GameManager.buy_item(item_id, quantity):
		_refresh_ui()
		_refresh_inventory()

func _on_continue() -> void:
	GameManager.start_night_phase()
	get_tree().change_scene_to_file("res://scenes/night_phase.tscn")

func _on_pause() -> void:
	get_tree().change_scene_to_file("res://scenes/pause_menu.tscn")

func _on_gold_changed(amount: int) -> void:
	_gold_label.text = "金币: %d" % amount

func _on_tip_triggered(tip_id: String, message: String) -> void:
	_tip_label.text = message
	$TipPanel.visible = true

func _on_tip_close() -> void:
	$TipPanel.visible = false

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("game_pause"):
		_on_pause()
