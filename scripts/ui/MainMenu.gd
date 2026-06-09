extends Control
## MainMenu - 主菜单界面

@onready var btn_new_game: Button = $CenterContainer/VBox/ButtonNew
@onready var btn_continue: Button = $CenterContainer/VBox/ButtonContinue
@onready var btn_levels: Button = $CenterContainer/VBox/ButtonLevels
@onready var btn_achievements: Button = $CenterContainer/VBox/ButtonAchieve
@onready var btn_settings: Button = $CenterContainer/VBox/ButtonSettings
@onready var btn_quit: Button = $CenterContainer/VBox/ButtonQuit
@onready var lbl_title: Label = $CenterContainer/VBox/Title
@onready var lbl_subtitle: Label = $CenterContainer/VBox/Subtitle
@onready var lbl_version: Label = $Bottom/VersionLabel
@onready var preview_machines: Node2D = $PreviewMachines

var _title_anim_t: float = 0.0

func _ready() -> void:
	AudioManager.play_music_loop()
	_connect_buttons()
	_apply_retro_style()
	_check_has_save()
	_setup_preview_animation()

func _connect_buttons() -> void:
	btn_new_game.pressed.connect(_on_new_game)
	btn_continue.pressed.connect(_on_continue)
	btn_levels.pressed.connect(_on_levels)
	btn_achievements.pressed.connect(_on_achievements)
	btn_settings.pressed.connect(_on_settings)
	btn_quit.pressed.connect(_on_quit)
	for btn in [btn_new_game, btn_continue, btn_levels, btn_achievements, btn_settings, btn_quit]:
		btn.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _apply_retro_style() -> void:
	lbl_title.modulate = Color(1.0, 0.82, 0.33)
	lbl_subtitle.modulate = Color(0.7, 0.65, 0.9)
	var buttons := [btn_new_game, btn_continue, btn_levels, btn_achievements, btn_settings, btn_quit]
	for b in buttons:
		b.add_theme_font_size_override("font_size", 20)
		b.custom_minimum_size = Vector2(320, 56)

func _check_has_save() -> void:
	btn_continue.disabled = not SaveSystem.has_save()

func _setup_preview_animation() -> void:
	if preview_machines == null:
		return
	for i in 5:
		var r := ColorRect.new()
		var sz: float = 48
		r.size = Vector2(sz, sz)
		r.position = Vector2(i * 120 + 80, 60 + (i % 2) * 30)
		var colors := [
			Color(0.82, 0.48, 0.27), Color(0.42, 0.56, 0.89),
			Color(0.82, 0.25, 0.25), Color(0.48, 0.78, 0.45),
			Color(0.75, 0.65, 0.35)
		]
		r.color = colors[i % colors.size()]
		r.z_index = 1
		preview_machines.add_child(r)
		var lbl := Label.new()
		lbl.text = ["切割", "组装", "锻造", "精加工", "仓储"][i]
		lbl.position = Vector2(i * 120 + 80, 60 + (i % 2) * 30 + 52)
		lbl.modulate = Color(0.9, 0.85, 1.0)
		lbl.add_theme_font_size_override("font_size", 14)
		preview_machines.add_child(lbl)

func _on_new_game() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("new_game", "MainMenu")
	SaveSystem.delete_save()
	GameState.money = 500
	GameState.level = 1
	GameState.experience = 0
	GameState.current_level_id = "level_1"
	GameState.reset_for_new_level()
	SceneManager.change_scene("GameScene", true, {"level_id": "level_1"})

func _on_continue() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("continue", "MainMenu")
	if SaveSystem.load_game():
		GameState.reset_for_new_level()
		SceneManager.change_scene("LevelSelect")
	else:
		_on_new_game()

func _on_levels() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("levels", "MainMenu")
	SceneManager.change_scene("LevelSelect")

func _on_achievements() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("achievements", "MainMenu")
	SceneManager.change_scene("Achievements")

func _on_settings() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("settings", "MainMenu")
	SceneManager.change_scene("Settings")

func _on_quit() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("quit", "MainMenu")
	SaveSystem.save_game()
	PlaytestRecorder.export_and_save()
	get_tree().quit()

func _process(delta: float) -> void:
	_title_anim_t += delta
	if lbl_title:
		var pulse: float = 1.0 + sin(_title_anim_t * 2.0) * 0.03
		lbl_title.scale = Vector2(pulse, pulse)
	if preview_machines:
		for i in range(preview_machines.get_child_count()):
			var c = preview_machines.get_child(i)
			if c is ColorRect:
				var bob: float = sin(_title_anim_t * 1.5 + float(i)) * 4.0
				c.position.y = 60 + (i % 2) * 30 + bob
