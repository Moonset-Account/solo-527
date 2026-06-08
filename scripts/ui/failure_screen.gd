extends Control

var failure_reason: String = ""

@onready var title_label: Label = $Panel/VBoxContainer/TitleLabel
@onready var reason_label: Label = $Panel/VBoxContainer/ReasonLabel
@onready var tip_label: Label = $Panel/VBoxContainer/TipLabel
@onready var retry_button: Button = $Panel/VBoxContainer/ButtonContainer/RetryButton
@onready var level_select_button: Button = $Panel/VBoxContainer/ButtonContainer/LevelSelectButton

func setup(reason: String) -> void:
	failure_reason = reason

func _ready() -> void:
	retry_button.pressed.connect(_on_retry)
	level_select_button.pressed.connect(_on_level_select)
	failure_reason = GameManager.failure_reason
	_display_failure()

func _display_failure() -> void:
	title_label.text = "装箱失败"
	reason_label.text = failure_reason
	tip_label.text = _get_tip_for_reason(failure_reason)

func _get_tip_for_reason(reason: String) -> String:
	if reason.find("易碎品") >= 0:
		return "尝试把重物放在底部，易碎品放在上面"
	if reason.find("超重") >= 0:
		return "注意箱子底部的重量指示器，不要超过限重"
	if reason.find("时间") >= 0:
		return "先放大件物品会更快完成装箱"
	return "再试一次吧！"

func _on_retry() -> void:
	GameManager.change_state(GameManager.GameState.PLAYING)

func _on_level_select() -> void:
	GameManager.change_state(GameManager.GameState.LEVEL_SELECT)
