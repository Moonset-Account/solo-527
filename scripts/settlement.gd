extends Control

var _upgrades_shown: bool = false

@onready var _day_label: Label = $VBoxContainer/DayLabel
@onready var _revenue_label: Label = $VBoxContainer/StatsPanel/VBox/RevenueLabel
@onready var _expenses_label: Label = $VBoxContainer/StatsPanel/VBox/ExpensesLabel
@onready var _profit_label: Label = $VBoxContainer/StatsPanel/VBox/ProfitLabel
@onready var _customers_label: Label = $VBoxContainer/StatsPanel/VBox/CustomersLabel
@onready var _gold_label: Label = $VBoxContainer/StatsPanel/VBox/GoldLabel
@onready var _total_profit_label: Label = $VBoxContainer/StatsPanel/VBox/TotalProfitLabel
@onready var _target_label: Label = $VBoxContainer/StatsPanel/VBox/TargetLabel
@onready var _upgrade_container: VBoxContainer = $VBoxContainer/UpgradePanel/ScrollContainer/UpgradeList
@onready var _next_day_button: Button = $VBoxContainer/ButtonBar/NextDayButton
@onready var _upgrade_button: Button = $VBoxContainer/ButtonBar/UpgradeButton
@onready var _menu_button: Button = $VBoxContainer/ButtonBar/MenuButton
@onready var _upgrade_panel: PanelContainer = $VBoxContainer/UpgradePanel
@onready var _tutorial_panel: PanelContainer = $VBoxContainer/TutorialPanel
@onready var _tutorial_label: Label = $VBoxContainer/TutorialPanel/VBoxContainer/TutorialLabel
@onready var _tutorial_skip_button: Button = $VBoxContainer/TutorialPanel/VBoxContainer/SkipButton

func _ready() -> void:
	_next_day_button.pressed.connect(_on_next_day)
	_upgrade_button.pressed.connect(_on_toggle_upgrades)
	_menu_button.pressed.connect(_on_menu)
	_tutorial_skip_button.pressed.connect(_on_tutorial_skip)
	GameManager.tutorial_message_requested.connect(_on_tutorial_message)
	_refresh_settlement()
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

func _refresh_settlement() -> void:
	var level_data := GameManager.get_current_level_data()
	_day_label.text = "第 %d 天结算" % GameManager.current_day
	_revenue_label.text = "今日收入: %d 金币" % GameManager.daily_revenue
	_expenses_label.text = "今日支出: %d 金币" % GameManager.daily_expenses
	var profit: int = GameManager.daily_revenue - GameManager.daily_expenses
	_profit_label.text = "今日利润: %d 金币" % profit
	if profit >= 0:
		_profit_label.add_theme_color_override("font_color", Color(0.3, 1, 0.3, 1))
	else:
		_profit_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3, 1))
	_customers_label.text = "服务顾客: %d 人" % GameManager.customers_served_today
	_gold_label.text = "当前金币: %d" % GameManager.gold
	_total_profit_label.text = "关卡累计利润: %d" % GameManager.total_profit
	var target: int = level_data.get("target_profit", 50)
	_target_label.text = "目标利润: %d / %d" % [GameManager.total_profit, target]
	if GameManager.total_profit >= target:
		_target_label.add_theme_color_override("font_color", Color(0.3, 1, 0.3, 1))
	else:
		_target_label.add_theme_color_override("font_color", Color(1, 0.85, 0.3, 1))
	_upgrade_panel.visible = false
	_upgrades_shown = false

func _on_toggle_upgrades() -> void:
	_upgrades_shown = not _upgrades_shown
	_upgrade_panel.visible = _upgrades_shown
	if _upgrades_shown:
		_refresh_upgrades()

func _refresh_upgrades() -> void:
	for child in _upgrade_container.get_children():
		child.queue_free()
	var upgrades := GameManager.get_available_upgrades()
	if upgrades.is_empty():
		var label := Label.new()
		label.text = "暂无可升级项目"
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		_upgrade_container.add_child(label)
		return
	for upgrade in upgrades:
		var hbox := HBoxContainer.new()
		var info := VBoxContainer.new()
		var name_label := Label.new()
		name_label.text = upgrade.get("name", "")
		name_label.add_theme_font_size_override("font_size", 16)
		name_label.add_theme_color_override("font_color", Color(1, 0.85, 0.3, 1))
		var desc_label := Label.new()
		desc_label.text = upgrade.get("description", "")
		desc_label.add_theme_font_size_override("font_size", 13)
		var cost_label := Label.new()
		cost_label.text = "费用: %d 金币" % upgrade.get("cost", 0)
		cost_label.add_theme_color_override("font_color", Color(1, 0.7, 0.3, 1))
		info.add_child(name_label)
		info.add_child(desc_label)
		info.add_child(cost_label)
		hbox.add_child(info)
		var buy_btn := Button.new()
		buy_btn.text = "升级"
		buy_btn.custom_minimum_size = Vector2(80, 40)
		var upgrade_id: String = upgrade.get("id", "")
		if GameManager.gold < upgrade.get("cost", 0):
			buy_btn.disabled = true
		buy_btn.pressed.connect(_on_buy_upgrade.bind(upgrade_id))
		hbox.add_child(buy_btn)
		_upgrade_container.add_child(hbox)

func _on_buy_upgrade(upgrade_id: String) -> void:
	if GameManager.purchase_upgrade(upgrade_id):
		_refresh_settlement()
		_refresh_upgrades()

func _on_next_day() -> void:
	GameManager.notify_advance_to_next_day()
	var level_data := GameManager.get_current_level_data()
	var target: int = level_data.get("target_profit", 50)
	if GameManager.total_profit >= target and GameManager.current_day >= level_data.get("days_to_complete", 3):
		if GameManager.current_level_id < GameManager.get_max_level():
			GameManager.start_level(GameManager.current_level_id + 1)
			get_tree().change_scene_to_file("res://scenes/day_phase.tscn")
		else:
			get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
		return
	GameManager.advance_day()
	get_tree().change_scene_to_file("res://scenes/day_phase.tscn")

func _on_menu() -> void:
	SaveSystem.save_game(1)
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
