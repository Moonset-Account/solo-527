extends Control

@onready var start_button: Button = $CenterContainer/StartButton
@onready var continue_button: Button = $CenterContainer/ContinueButton
@onready var settings_button: Button = $CenterContainer/SettingsButton
@onready var quit_button: Button = $CenterContainer/QuitButton

var _offline_popup: Panel
var _settings_panel: Control

func _ready() -> void:
	start_button.pressed.connect(_on_start_pressed)
	continue_button.pressed.connect(_on_continue_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	continue_button.visible = _has_save()
	_check_offline_earnings()

func _has_save() -> bool:
	if SaveManager:
		var data := SaveManager.load_game()
		return data != null
	return false

func _on_start_pressed() -> void:
	GameManager.current_level_id = "1"
	GameManager.start_level("1")
	get_tree().change_scene_to_file("res://scenes/game_level.tscn")

func _on_continue_pressed() -> void:
	if SaveManager:
		var data := SaveManager.load_game()
		if data:
			GameManager.current_level_id = str(data.current_level)
			GameManager.set_money(data.money)
			GameManager.set_reputation(data.reputation)
			GameManager.start_level(str(data.current_level))
			get_tree().change_scene_to_file("res://scenes/game_level.tscn")

func _on_settings_pressed() -> void:
	if _settings_panel == null:
		_settings_panel = get_node_or_null("SettingsLayer/SettingsPanel")
	if _settings_panel:
		_settings_panel.visible = not _settings_panel.visible

func _on_quit_pressed() -> void:
	get_tree().quit()

func _check_offline_earnings() -> void:
	if not SaveManager:
		return
	var data := SaveManager.load_game()
	if data == null:
		return
	if data.last_save_timestamp <= 0:
		return
	var offline_calc := OfflineEarnings.new()
	var result := offline_calc.calculate_earnings(data.last_save_timestamp, float(data.total_earnings) / maxf(data.play_time_seconds / 3600.0, 0.1))
	var amount: int = result.get("amount", 0)
	if amount > 0:
		data.money += amount
		data.total_earnings += amount
		SaveManager.save_game(data)
		_show_offline_popup(amount, result.get("duration_hours", 0.0))

func _show_offline_popup(amount: int, hours: float) -> void:
	_offline_popup = Panel.new()
	_offline_popup.set_anchors_preset(Control.PRESET_CENTER)
	_offline_popup.position = Vector2(get_viewport_rect().size.x * 0.5 - 150, get_viewport_rect().size.y * 0.5 - 80)
	_offline_popup.size = Vector2(300, 160)
	var vbox := VBoxContainer.new()
	vbox.position = Vector2(20, 15)
	vbox.custom_minimum_size = Vector2(260, 130)
	var title := Label.new()
	title.text = "Welcome Back!"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color.GOLD)
	var time_label := Label.new()
	time_label.text = "Away: %.1f hours" % hours
	time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var amount_label := Label.new()
	amount_label.text = "Earnings: $%d" % amount
	amount_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	amount_label.add_theme_font_size_override("font_size", 16)
	amount_label.add_theme_color_override("font_color", Color.GREEN)
	var ok_btn := Button.new()
	ok_btn.text = "Collect!"
	ok_btn.custom_minimum_size = Vector2(100, 30)
	ok_btn.pressed.connect(func() -> void: _offline_popup.queue_free())
	vbox.add_child(title)
	vbox.add_child(time_label)
	vbox.add_child(amount_label)
	vbox.add_child(ok_btn)
	_offline_popup.add_child(vbox)
	add_child(_offline_popup)
