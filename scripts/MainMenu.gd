extends Control
class_name MainMenu

@onready var title_label: Label = %TitleLabel
@onready var subtitle_label: Label = %SubtitleLabel
@onready var start_button: Button = %StartButton
@onready var levels_button: Button = %LevelsButton
@onready var settings_button: Button = %SettingsButton
@onready var credits_button: Button = %CreditsButton
@onready var quit_button: Button = %QuitButton
@onready var version_label: Label = %VersionLabel
@onready var icon_container: CenterContainer = %IconContainer

func _ready() -> void:
	_connect_buttons()
	_animate_title()
	AudioManager.play_music("menu")
	GameManager._change_state(GameManager.GameState.MAIN_MENU)

func _connect_buttons() -> void:
	start_button.pressed.connect(_on_start_pressed)
	levels_button.pressed.connect(_on_levels_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	credits_button.pressed.connect(_on_credits_pressed)
	quit_button.pressed.connect(_on_quit_pressed)

func _animate_title() -> void:
	title_label.modulate.a = 0
	title_label.position.y -= 20
	subtitle_label.modulate.a = 0
	start_button.modulate.a = 0
	levels_button.modulate.a = 0
	settings_button.modulate.a = 0
	credits_button.modulate.a = 0
	quit_button.modulate.a = 0
	var t := create_tween()
	t.set_parallel(true)
	t.tween_property(title_label, "modulate:a", 1.0, 0.7)
	t.tween_property(title_label, "position:y", title_label.position.y + 20, 0.8).set_trans(Tween.TRANS_BACK)
	t.tween_property(subtitle_label, "modulate:a", 1.0, 0.9)
	t.set_parallel(false)
	t.tween_interval(0.15)
	t.set_parallel(true)
	var btn_delay: float = 0.12
	t.tween_property(start_button, "modulate:a", 1.0, 0.4 + btn_delay * 0)
	t.tween_property(levels_button, "modulate:a", 1.0, 0.4 + btn_delay * 1)
	t.tween_property(settings_button, "modulate:a", 1.0, 0.4 + btn_delay * 2)
	t.tween_property(credits_button, "modulate:a", 1.0, 0.4 + btn_delay * 3)
	t.tween_property(quit_button, "modulate:a", 1.0, 0.4 + btn_delay * 4)

func _process(_delta: float) -> void:
	if icon_container:
		var t: float = Time.get_ticks_msec() / 1000.0
		icon_container.scale = Vector2.ONE * (1.0 + sin(t * 1.5) * 0.03)

func _on_start_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	PlaySessionRecorder.record_event("main_menu_start", {})
	GameManager.pending_start_level_id = 1
	get_tree().change_scene_to_file("res://scenes/GameScene.tscn")

func _on_levels_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	PlaySessionRecorder.record_event("main_menu_levels", {})
	GameManager.go_to_level_select()

func _on_settings_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	_show_settings_dialog()

func _on_credits_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	_show_credits()

func _on_quit_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	UIManager.confirm_dialog("退出游戏", "真的要退出吗？进度已自动保存。", Callable(self, "_do_quit"))

func _do_quit() -> void:
	get_tree().quit()

func _show_settings_dialog() -> void:
	var dlg := AcceptDialog.new()
	dlg.title = "设置"
	dlg.dialog_text = "游戏设置\n\n- 拖拽物品到箱子里\n- Q/E 或滚轮旋转\n- Ctrl+Z 撤销\n- 空格提交过关\n\n详细说明见游戏内教程提示"
	ui_layer.add_child(dlg) if false else get_tree().root.add_child(dlg)
	dlg.popup_centered()

func _show_credits() -> void:
	var dlg := AcceptDialog.new()
	dlg.title = "关于本作"
	dlg.dialog_text = "【搬家大师 - 装箱挑战】\n\n类型：物理益智\n\n核心玩法：\n- 在有限空间里摆放不同形状/重量的物品\n- 易碎品不能受压\n- 高效利用空间获高分\n\nGodot 4.x 版本测试版\n制作：AI Solo Game Studio"
	get_tree().root.add_child(dlg)
	dlg.popup_centered()
