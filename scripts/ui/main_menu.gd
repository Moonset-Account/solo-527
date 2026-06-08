extends Control

signal start_game_pressed
signal continue_game_pressed
signal settings_pressed
signal quit_pressed

@onready var btn_start: Button = $CenterContainer/StartButton
@onready var btn_continue: Button = $CenterContainer/ContinueButton
@onready var btn_settings: Button = $CenterContainer/SettingsButton
@onready var btn_quit: Button = $CenterContainer/QuitButton
@onready var title_label: Label = $CenterContainer/TitleLabel
@onready var version_label: Label = $CenterContainer/VersionLabel

var _settings_panel: Control = null

func _ready() -> void:
	var has_save: bool = SaveManager.has_save() if SaveManager else false
	btn_continue.disabled = not has_save
	btn_continue.visible = has_save
	version_label.text = "v0.1.0"
	btn_start.pressed.connect(_on_start_pressed)
	btn_continue.pressed.connect(_on_continue_pressed)
	btn_settings.pressed.connect(_on_settings_pressed)
	btn_quit.pressed.connect(_on_quit_pressed)
	_check_offline_earnings()

func _on_start_pressed() -> void:
	start_game_pressed.emit()
	_start_level(1)

func _on_continue_pressed() -> void:
	continue_game_pressed.emit()
	var data: SaveData = SaveManager.load_game() if SaveManager else null
	if data:
		_start_level(data.current_level + 1)
	else:
		_start_level(1)

func _on_settings_pressed() -> void:
	settings_pressed.emit()
	if _settings_panel == null:
		_settings_panel = Control.new()
		_settings_panel.set_script(load("res://scripts/ui/settings_panel.gd"))
		_settings_panel.anchors_preset = Control.PRESET_FULL_RECT
		add_child(_settings_panel)
		_settings_panel.closed.connect(func() -> void: _settings_panel.visible = false)
	_settings_panel.visible = true

func _on_quit_pressed() -> void:
	get_tree().quit()

func _start_level(level_id: int) -> void:
	var config := LevelConfig.get_level_by_id(level_id)
	if config == null:
		config = LevelConfig.get_level_by_id(1)
	if config == null:
		return
	GameManager.start_level(str(level_id))
	get_tree().change_scene_to_file("res://scenes/game_level.tscn")

func _check_offline_earnings() -> void:
	if SaveManager == null:
		return
	var data: SaveData = SaveManager.load_game()
	if data == null:
		return
	if data.last_save_timestamp <= 0:
		return
	var offline := OfflineEarnings.new()
	var result: Dictionary = offline.calculate_earnings(data.last_save_timestamp, 100.0)
	var amount: int = int(result.get("amount", 0))
	if amount > 0:
		data.money += amount
		SaveManager.save_game(data)
		_show_offline_popup(amount, result.get("duration_hours", 0.0))

func _show_offline_popup(amount: int, hours: float) -> void:
	var popup := PanelContainer.new()
	popup.anchors_preset = Control.PRESET_CENTER
	popup.offset_left = -150
	popup.offset_right = 150
	popup.offset_top = -60
	popup.offset_bottom = 60
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.17, 0.09, 0.06)
	style.set_corner_radius_all(8)
	popup.add_theme_stylebox_override("panel", style)
	add_child(popup)
	var vbox := VBoxContainer.new()
	popup.add_child(vbox)
	var title := Label.new()
	title.text = "Offline Earnings!"
	title.add_theme_color_override("font_color", Color(0.96, 0.64, 0.38))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)
	var desc := Label.new()
	desc.text = "Earned $%d while away (%.1fh)" % [amount, hours]
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(desc)
	var btn := Button.new()
	btn.text = "Collect"
	btn.pressed.connect(func() -> void: popup.queue_free())
	vbox.add_child(btn)

func show_menu() -> void:
	visible = true
	var has_save: bool = SaveManager.has_save() if SaveManager else false
	btn_continue.disabled = not has_save
	btn_continue.visible = has_save

func hide_menu() -> void:
	visible = false
