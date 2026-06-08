extends Control

signal continue_to_reward
signal retry_pressed
signal return_to_menu

@onready var result_label: Label = $VBoxContainer/ResultLabel
@onready var stats_container: VBoxContainer = $VBoxContainer/StatsContainer
@onready var continue_button: Button = $VBoxContainer/ContinueButton
@onready var retry_button: Button = $VBoxContainer/RetryButton
@onready var menu_button: Button = $VBoxContainer/MenuButton

var _victory: bool = false

func _ready() -> void:
	continue_button.pressed.connect(_on_continue)
	retry_button.pressed.connect(_on_retry)
	menu_button.pressed.connect(_on_menu)

func setup(victory: bool) -> void:
	_victory = victory
	if victory:
		result_label.text = "修复成功！"
		result_label.add_theme_color_override("font_color", Color(0.3, 0.8, 0.3))
		continue_button.visible = true
		retry_button.visible = false
		_show_victory_stats()
	else:
		result_label.text = "修复失败..."
		result_label.add_theme_color_override("font_color", Color(0.9, 0.3, 0.2))
		continue_button.visible = false
		retry_button.visible = true
		_show_failure_stats()

func _show_victory_stats() -> void:
	_clear_stats()
	var analytics = GameManager.get_analytics()
	_add_stat_line("章节", "第%d章" % (GameManager.current_chapter + 1))
	_add_stat_line("关卡", "第%d关" % (GameManager.current_level + 1))
	_add_stat_line("回合数", str(GameManager.current_turn))
	var total_wins = analytics.get("total_wins", 0)
	_add_stat_line("累计胜利", str(total_wins))
	var chapter_data = GameResources.get_chapter_data(GameManager.current_chapter)
	if chapter_data and chapter_data.reward_card_ids.size() > 0:
		_add_stat_line("解锁卡牌", str(chapter_data.reward_card_ids.size()) + "张")

func _show_failure_stats() -> void:
	_clear_stats()
	var key = "%d_%d" % [GameManager.current_chapter, GameManager.current_level]
	var analytics = GameManager.get_analytics()
	var retry_count = analytics.get("retry_counts", {}).get(key, 0)
	_add_stat_line("重试次数", str(retry_count))
	var failure_steps = analytics.get("failure_steps", {})
	if failure_steps.size() > 0:
		_add_stat_line("失败步骤", str(failure_steps.size()) + "个")

func _add_stat_line(label_text: String, value_text: String) -> void:
	var hbox = HBoxContainer.new()
	var label = Label.new()
	label.text = label_text + ": "
	label.custom_minimum_size.x = 120
	var value = Label.new()
	value.text = value_text
	hbox.add_child(label)
	hbox.add_child(value)
	stats_container.add_child(hbox)

func _clear_stats() -> void:
	for child in stats_container.get_children():
		child.queue_free()

func _on_continue() -> void:
	continue_to_reward.emit()

func _on_retry() -> void:
	retry_pressed.emit()

func _on_menu() -> void:
	return_to_menu.emit()
