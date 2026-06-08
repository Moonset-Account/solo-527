extends Control

var level_id: String = ""
var stars: int = 0
var score: int = 0
var time_taken: float = 0.0
var items_packed: int = 0

@onready var title_label: Label = $Panel/VBoxContainer/TitleLabel
@onready var star_label: Label = $Panel/VBoxContainer/StarLabel
@onready var score_value_label: Label = $Panel/VBoxContainer/StatsContainer/ScoreValue
@onready var time_value_label: Label = $Panel/VBoxContainer/StatsContainer/TimeValue
@onready var packed_value_label: Label = $Panel/VBoxContainer/StatsContainer/PackedValue
@onready var next_button: Button = $Panel/VBoxContainer/ButtonContainer/NextButton
@onready var replay_button: Button = $Panel/VBoxContainer/ButtonContainer/ReplayButton
@onready var level_select_button: Button = $Panel/VBoxContainer/ButtonContainer/LevelSelectButton

func _ready() -> void:
	level_id = GameManager.current_level_id
	stars = GameManager.last_stars
	score = GameManager.last_score
	time_taken = GameManager.last_time
	items_packed = GameManager.last_packed
	next_button.pressed.connect(_on_next_level)
	replay_button.pressed.connect(_on_replay)
	level_select_button.pressed.connect(_on_level_select)
	_display_results()
	_animate_stars()

func _display_results() -> void:
	title_label.text = "关卡完成"
	score_value_label.text = str(score) + "分"
	time_value_label.text = str(snappedf(time_taken, 0.1)) + "秒"
	packed_value_label.text = str(items_packed) + "件"

func _animate_stars() -> void:
	star_label.text = "☆☆☆"
	star_label.add_theme_font_size_override("font_size", 48)
	var tween := create_tween()
	for i in range(stars):
		tween.tween_callback(_set_star_count.bind(i + 1))
		tween.tween_interval(0.5)

func _set_star_count(count: int) -> void:
	var s := ""
	for i in range(3):
		if i < count:
			s += "★"
		else:
			s += "☆"
	star_label.text = s

func _on_next_level() -> void:
	var next_id = str(level_id.to_int() + 1)
	GameManager.current_level_id = next_id
	GameManager.change_state(GameManager.GameState.PLAYING)

func _on_replay() -> void:
	GameManager.current_level_id = level_id
	GameManager.change_state(GameManager.GameState.PLAYING)

func _on_level_select() -> void:
	GameManager.change_state(GameManager.GameState.LEVEL_SELECT)
