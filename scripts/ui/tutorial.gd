extends Control

const STEPS: PackedStringArray = [
	"1. 拖拽物品放入箱子",
	"2. 双击或按E/Q旋转物品",
	"3. 注意易碎品不能被重物压住",
	"4. 不要超过箱子的重量限制",
	"5. 尽量装完所有物品获得三星"
]

var current_step: int = 0

@onready var step_label: Label = $StepLabel
@onready var prev_button: Button = $HBoxContainer/PrevButton
@onready var next_button: Button = $HBoxContainer/NextButton
@onready var start_button: Button = $StartButton

func _ready() -> void:
	prev_button.pressed.connect(_on_prev)
	next_button.pressed.connect(_on_next)
	start_button.pressed.connect(_on_start_game)
	_update_step()

func _update_step() -> void:
	step_label.text = STEPS[current_step]
	prev_button.disabled = current_step == 0
	next_button.disabled = current_step == STEPS.size() - 1

func _on_next() -> void:
	if current_step < STEPS.size() - 1:
		current_step += 1
		_update_step()

func _on_prev() -> void:
	if current_step > 0:
		current_step -= 1
		_update_step()

func _on_start_game() -> void:
	GameManager.change_state(GameManager.GameState.LEVEL_SELECT)
