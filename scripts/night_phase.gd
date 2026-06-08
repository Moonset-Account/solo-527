extends Control

var _display_slots: Array[Dictionary] = []
var _customer_results: Array[Dictionary] = []
var _simulation_done: bool = false
var _price_spins: Dictionary = {}

@onready var _gold_label: Label = $TopBar/GoldLabel
@onready var _day_label: Label = $TopBar/DayLabel
@onready var _inventory_list: VBoxContainer = $LeftPanel/ScrollContainer/InventoryList
@onready var _display_grid: GridContainer = $CenterPanel/DisplayGrid
@onready var _customer_preview: RichTextLabel = $RightPanel/CustomerPreview
@onready var _run_button: Button = $BottomBar/RunButton
@onready var _settlement_button: Button = $BottomBar/SettlementButton
@onready var _pause_button: Button = $BottomBar/PauseButton
@onready var _tip_label: Label = $TipPanel/TipLabel
@onready var _tip_close_button: Button = $TipPanel/CloseButton
@onready var _tutorial_panel: PanelContainer = $TutorialPanel
@onready var _tutorial_label: Label = $TutorialPanel/VBoxContainer/TutorialLabel
@onready var _tutorial_skip_button: Button = $TutorialPanel/VBoxContainer/SkipButton

func _ready() -> void:
	_run_button.pressed.connect(_on_run_simulation)
	_settlement_button.pressed.connect(_on_settlement)
	_settlement_button.visible = false
	_pause_button.pressed.connect(_on_pause)
	_tip_close_button.pressed.connect(_on_tip_close)
	_tutorial_skip_button.pressed.connect(_on_tutorial_skip)
	GameManager.tip_triggered.connect(_on_tip_triggered)
	GameManager.tutorial_message_requested.connect(_on_tutorial_message)
	_refresh_ui()
	_refresh_inventory()
	_refresh_display_slots()
	_show_customer_preview()
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
	_day_label.text = "第 %d 天 - 夜晚经营" % GameManager.current_day

func _refresh_inventory() -> void:
	for child in _inventory_list.get_children():
		child.queue_free()
	var header := Label.new()
	header.text = "库存商品:"
	header.add_theme_font_size_override("font_size", 16)
	header.add_theme_color_override("font_color", Color(1, 0.85, 0.3, 1))
	_inventory_list.add_child(header)
	_price_spins.clear()
	for item_id in GameManager.inventory:
		var qty: int = GameManager.inventory[item_id].quantity
		if qty <= 0:
			continue
		var item_data := GameManager.get_item_data(item_id)
		var hbox := HBoxContainer.new()
		var label := Label.new()
		label.text = "%s x%d" % [item_data.get("name", item_id), qty]
		label.add_theme_font_size_override("font_size", 14)
		hbox.add_child(label)
		var add_btn := Button.new()
		add_btn.text = "陈列"
		add_btn.custom_minimum_size = Vector2(60, 28)
		add_btn.pressed.connect(_on_add_to_display.bind(item_id))
		hbox.add_child(add_btn)
		var price_spin := SpinBox.new()
		price_spin.min_value = 1
		price_spin.max_value = 200
		price_spin.value = item_data.get("base_price", 10)
		price_spin.custom_minimum_size = Vector2(80, 28)
		price_spin.prefix = "价:"
		hbox.add_child(price_spin)
		_price_spins[item_id] = price_spin
		_inventory_list.add_child(hbox)

func _refresh_display_slots() -> void:
	for child in _display_grid.get_children():
		child.queue_free()
	var max_slots: int = GameManager.get_display_slots_count()
	_display_grid.columns = max(1, max_slots / 2)
	for i in max_slots:
		var panel := PanelContainer.new()
		var vbox := VBoxContainer.new()
		vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		if i < _display_slots.size():
			var item_data := GameManager.get_item_data(_display_slots[i].item_id)
			var name_label := Label.new()
			name_label.text = item_data.get("name", "???")
			name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			name_label.add_theme_font_size_override("font_size", 14)
			var price_label := Label.new()
			price_label.text = "售价: %d" % _display_slots[i].price
			price_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			price_label.add_theme_color_override("font_color", Color(0.5, 1, 0.5, 1))
			var remove_btn := Button.new()
			remove_btn.text = "移除"
			remove_btn.pressed.connect(_on_remove_from_display.bind(i))
			vbox.add_child(name_label)
			vbox.add_child(price_label)
			vbox.add_child(remove_btn)
		else:
			var empty_label := Label.new()
			empty_label.text = "空位"
			empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			empty_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
			vbox.add_child(empty_label)
		panel.add_child(vbox)
		_display_grid.add_child(panel)

func _show_customer_preview() -> void:
	var text: String = "[b]顾客预测[/b]\n"
	var level_data := GameManager.get_current_level_data()
	var cust_range: Array = level_data.get("customer_count_range", [3, 5])
	text += "预计顾客: %d-%d人\n" % [cust_range[0], cust_range[1]]
	var weather_data := GameManager._get_weather_data()
	text += "天气效果: %s\n" % weather_data.get("name", "晴天")
	var cat_mods: Dictionary = weather_data.get("category_modifiers", {})
	if not cat_mods.is_empty():
		text += "\n商品类别影响:\n"
		for cat in cat_mods:
			var mod: float = float(cat_mods[cat])
			var cat_name: String = str(GameManager.items_data.get("category_names", {}).get(cat, cat))
			if mod > 1.0:
				text += "  %s: 需求↑\n" % cat_name
			elif mod < 1.0:
				text += "  %s: 需求↓\n" % cat_name
			else:
				text += "  %s: 正常\n" % cat_name
	_customer_preview.text = text

func _on_add_to_display(item_id: String) -> void:
	var max_slots: int = GameManager.get_display_slots_count()
	if _display_slots.size() >= max_slots:
		return
	if not GameManager.inventory.has(item_id) or GameManager.inventory[item_id].quantity <= 0:
		return
	var item_data := GameManager.get_item_data(item_id)
	var price: int = item_data.get("base_price", 10)
	if _price_spins.has(item_id) and _price_spins[item_id] is SpinBox:
		price = int(_price_spins[item_id].value)
	_display_slots.append({"item_id": item_id, "price": price})
	_refresh_display_slots()
	GameManager.set_display_items(_display_slots)
	GameManager.notify_item_displayed()

func _on_remove_from_display(index: int) -> void:
	if index >= 0 and index < _display_slots.size():
		_display_slots.remove_at(index)
		_refresh_display_slots()
		GameManager.set_display_items(_display_slots)

func _on_run_simulation() -> void:
	GameManager.set_display_items(_display_slots)
	if GameManager.tutorial_active and GameManager.tutorial_step in [GameManager.TutorialStep.NIGHT_PRICE_HINT, GameManager.TutorialStep.NIGHT_DISPLAY_HINT]:
		GameManager.tutorial_step = GameManager.TutorialStep.NIGHT_READY
	_customer_results = GameManager.run_customer_simulation()
	_simulation_done = true
	_run_button.visible = false
	_settlement_button.visible = true
	if GameManager.tutorial_active:
		_tutorial_panel.visible = false
	_show_results()

func _show_results() -> void:
	_customer_preview.text = "[b]经营结果[/b]\n\n"
	var total_revenue: int = 0
	for result in _customer_results:
		var customer: Dictionary = result.customer
		if result.purchased:
			var item_data := GameManager.get_item_data(result.item_id)
			_customer_preview.text += "[color=green]%s 购买了 %s (售价%d)[/color]\n" % [customer.get("name", "顾客"), item_data.get("name", "?"), result.price_paid]
			total_revenue += result.price_paid
		else:
			_customer_preview.text += "[color=gray]%s 没有购买 (%s)[/color]\n" % [customer.get("name", "顾客"), result.reason]
	_customer_preview.text += "\n[b]今日收入: %d 金币[/b]" % total_revenue

func _on_settlement() -> void:
	GameManager.complete_settlement()
	get_tree().change_scene_to_file("res://scenes/settlement.tscn")

func _on_pause() -> void:
	get_tree().change_scene_to_file("res://scenes/pause_menu.tscn")

func _on_tip_triggered(tip_id: String, message: String) -> void:
	_tip_label.text = message
	$TipPanel.visible = true

func _on_tip_close() -> void:
	$TipPanel.visible = false

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("game_pause"):
		_on_pause()
