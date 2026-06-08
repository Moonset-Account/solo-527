extends Control

@onready var resume_button: Button = $VBoxContainer/ResumeButton
@onready var restart_button: Button = $VBoxContainer/RestartButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton
@onready var main_menu_button: Button = $VBoxContainer/MainMenuButton
@onready var score_label: Label = $VBoxContainer/ScoreLabel
@onready var timer_label: Label = $VBoxContainer/TimerLabel

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	resume_button.pressed.connect(_on_resume)
	restart_button.pressed.connect(_on_restart)
	settings_button.pressed.connect(_on_settings)
	main_menu_button.pressed.connect(_on_main_menu)
	_update_display()

func _process(delta: float) -> void:
	_update_display()

func _update_display() -> void:
	if score_label:
		score_label.text = "得分: %d" % ScoreManager.get_current_score()
	if timer_label:
		var time_val = GameManager.last_time
		timer_label.text = "时间: %.1fs" % time_val

func _on_resume() -> void:
	get_tree().paused = false
	queue_free()

func _on_restart() -> void:
	get_tree().paused = false
	ScoreManager.reset_score()
	GameManager.change_state(GameManager.GameState.PLAYING)

func _on_settings() -> void:
	var settings_scene = preload("res://scenes/settings.tscn")
	var settings_instance = settings_scene.instantiate()
	settings_instance.process_mode = Node.PROCESS_MODE_ALWAYS
	get_tree().root.add_child(settings_instance)

func _on_main_menu() -> void:
	get_tree().paused = false
	GameManager.change_state(GameManager.GameState.MENU)
