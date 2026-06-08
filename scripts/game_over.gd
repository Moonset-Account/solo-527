extends Control

@onready var _reason_label: Label = $PanelContainer/VBoxContainer/ReasonLabel
@onready var _retry_button: Button = $PanelContainer/VBoxContainer/RetryButton
@onready var _menu_button: Button = $PanelContainer/VBoxContainer/MenuButton
@onready var _analytics_label: RichTextLabel = $PanelContainer/VBoxContainer/AnalyticsLabel

func _ready() -> void:
	_retry_button.pressed.connect(_on_retry)
	_menu_button.pressed.connect(_on_menu)
	_set_reason_from_state()
	_refresh_display()

func _set_reason_from_state() -> void:
	if GameManager.gold < 0:
		_reason_label.text = "金币耗尽，经营失败！"
	elif GameManager.game_mode == GameManager.GameMode.GAME_OVER:
		_reason_label.text = "未达到关卡利润目标！"
	else:
		_reason_label.text = "经营结束"

func _refresh_display() -> void:
	var summary := Analytics.get_summary()
	var text: String = "[b]经营分析[/b]\n\n"
	text += "游玩时间: %.1f 分钟\n" % (summary.total_play_time / 60.0)
	text += "失败次数: %d\n" % summary.total_failures
	text += "重试次数: %d\n" % summary.total_retries
	if summary.failure_steps.size() > 0:
		text += "\n失败步骤:\n"
		for step in summary.failure_steps:
			text += "  %s (重试%d次)\n" % [step, summary.retry_counts.get(step, 0)]
	text += "\n教程: %s\n" % ("已跳过" if summary.tutorial_skipped else "已完成" if summary.tutorial_completed else "未开始")
	text += "提示跳过次数: %d\n" % summary.tips_skipped_count
	text += "完成关卡数: %d" % summary.levels_completed
	_analytics_label.text = text

func _on_retry() -> void:
	Analytics.log_retry("game_over")
	GameManager.start_new_game()
	get_tree().change_scene_to_file("res://scenes/day_phase.tscn")

func _on_menu() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
