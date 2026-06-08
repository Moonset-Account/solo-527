extends Control

var _master_slider: HSlider
var _bgm_slider: HSlider
var _sfx_slider: HSlider
var _master_value_label: Label
var _bgm_value_label: Label
var _sfx_value_label: Label
var _test_sfx_button: Button
var _back_button: Button
var _reset_progress_button: Button
var _title_label: Label

func _ready() -> void:
	_build_ui()
	_load_settings()
	_connect_signals()
	DebugLog.log_info("设置界面加载")

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.1, 0.16)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var main_panel := PanelContainer.new()
	main_panel.anchor_left = 0.5
	main_panel.anchor_top = 0.5
	main_panel.anchor_right = 0.5
	main_panel.anchor_bottom = 0.5
	main_panel.offset_left = -360
	main_panel.offset_top = -300
	main_panel.offset_right = 360
	main_panel.offset_bottom = 300
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.14, 0.17, 0.26)
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_right = 2
	style.border_width_bottom = 2
	style.border_color = Color(0.5, 0.65, 0.9)
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12
	main_panel.add_theme_stylebox_override("panel", style)
	add_child(main_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 32)
	margin.add_theme_constant_override("margin_right", 32)
	margin.add_theme_constant_override("margin_top", 24)
	margin.add_theme_constant_override("margin_bottom", 24)
	main_panel.add_child(margin)

	var main_vbox := VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 14)
	margin.add_child(main_vbox)

	_title_label = Label.new()
	_title_label.text = "⚙️  音量与设置"
	_title_label.add_theme_font_size_override("font_size", 26)
	_title_label.add_theme_color_override("font_color", Color(0.9, 0.95, 1.0))
	main_vbox.add_child(_title_label)

	var sep := HSeparator.new()
	sep.add_theme_color_override("separator_color", Color(0.3, 0.4, 0.6))
	main_vbox.add_child(sep)

	_master_slider, _master_value_label = _make_volume_row("🔊  主音量", main_vbox)
	_bgm_slider, _bgm_value_label = _make_volume_row("🎵  背景音乐 (BGM)", main_vbox)
	_sfx_slider, _sfx_value_label = _make_volume_row("🔔  音效 (SFX)", main_vbox)

	var test_row := HBoxContainer.new()
	test_row.custom_minimum_size = Vector2(0, 36)
	test_row.add_theme_constant_override("separation", 12)
	main_vbox.add_child(test_row)

	var ts := Control.new()
	ts.size_flags_horizontal = 3
	test_row.add_child(ts)

	_test_sfx_button = Button.new()
	_test_sfx_button.text = "🔊 试听音效"
	_test_sfx_button.custom_minimum_size = Vector2(160, 40)
	_test_sfx_button.pressed.connect(func(): AudioManager.play_sfx("task_done"))
	test_row.add_child(_test_sfx_button)

	var danger_sep := HSeparator.new()
	danger_sep.add_theme_color_override("separator_color", Color(0.6, 0.3, 0.3))
	danger_sep.custom_minimum_size = Vector2(0, 20)
	main_vbox.add_child(danger_sep)

	var danger_label := Label.new()
	danger_label.text = "⚠️  危险操作区"
	danger_label.add_theme_color_override("font_color", Color(1.0, 0.55, 0.55))
	danger_label.add_theme_font_size_override("font_size", 14)
	main_vbox.add_child(danger_label)

	_reset_progress_button = Button.new()
	_reset_progress_button.text = "🔄  重置游戏进度（重新解锁所有关卡）"
	_reset_progress_button.custom_minimum_size = Vector2(0, 44)
	_reset_progress_button.add_theme_color_override("font_color", Color(1.0, 0.8, 0.8))
	main_vbox.add_child(_reset_progress_button)

	var bottom_spacer := Control.new()
	bottom_spacer.size_flags_vertical = 3
	main_vbox.add_child(bottom_spacer)

	_back_button = Button.new()
	_back_button.text = "← 返回"
	_back_button.custom_minimum_size = Vector2(160, 48)
	_back_button.add_theme_font_size_override("font_size", 16)
	main_vbox.add_child(_back_button)

func _make_volume_row(title: String, parent: VBoxContainer) -> Array:
	var title_lbl := Label.new()
	title_lbl.text = title
	title_lbl.add_theme_color_override("font_color", Color(0.85, 0.9, 1.0))
	title_lbl.add_theme_font_size_override("font_size", 14)
	parent.add_child(title_lbl)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	row.custom_minimum_size = Vector2(0, 36)
	parent.add_child(row)

	var slider := HSlider.new()
	slider.min_value = 0.0
	slider.max_value = 1.0
	slider.step = 0.01
	slider.size_flags_horizontal = 3
	slider.custom_minimum_size = Vector2(0, 30)
	row.add_child(slider)

	var value_label := Label.new()
	value_label.text = "50%"
	value_label.custom_minimum_size = Vector2(60, 0)
	value_label.horizontal_alignment = 2
	value_label.add_theme_color_override("font_color", Color(0.8, 0.85, 0.95))
	row.add_child(value_label)

	return [slider, value_label]

func _load_settings() -> void:
	_master_slider.value = AudioManager.get_master_volume_linear()
	_bgm_slider.value = AudioManager.get_bgm_volume_linear()
	_sfx_slider.value = AudioManager.get_sfx_volume_linear()
	_update_labels()

func _update_labels() -> void:
	_master_value_label.text = "%d%%" % int(_master_slider.value * 100)
	_bgm_value_label.text = "%d%%" % int(_bgm_slider.value * 100)
	_sfx_value_label.text = "%d%%" % int(_sfx_slider.value * 100)

func _connect_signals() -> void:
	_master_slider.value_changed.connect(func(v):
		AudioManager.set_master_volume(v)
		SaveSystem.set_setting("master_volume", v)
		_update_labels()
	)
	_bgm_slider.value_changed.connect(func(v):
		AudioManager.set_bgm_volume(v)
		SaveSystem.set_setting("bgm_volume", v)
		_update_labels()
	)
	_sfx_slider.value_changed.connect(func(v):
		AudioManager.set_sfx_volume(v)
		SaveSystem.set_setting("sfx_volume", v)
		_update_labels()
	)
	_reset_progress_button.pressed.connect(_on_reset_progress)
	_back_button.pressed.connect(_on_back)

func _on_reset_progress() -> void:
	AudioManager.play_sfx("warn")
	var confirm := ConfirmationDialog.new()
	confirm.title = "确认重置进度？"
	confirm.dialog_text = "这将清除所有关卡解锁状态和最佳分数。\n此操作不可恢复，确定继续吗？"
	confirm.ok_button_text = "重置"
	confirm.cancel_button_text = "取消"
	add_child(confirm)
	confirm.confirmed.connect(func():
		SaveSystem.reset_progress()
		DebugLog.log_warn("用户重置了游戏进度")
		var n := Label.new()
		n.text = "  ✓ 进度已重置  "
		n.add_theme_color_override("font_color", Color(0.5, 1.0, 0.7))
		n.z_index = 50
		n.anchor_left = 0.5
		n.anchor_top = 0.5
		n.offset_left = -80
		n.offset_top = 250
		n.offset_right = 80
		n.offset_bottom = 290
		n.horizontal_alignment = 1
		add_child(n)
		await get_tree().create_timer(1.5).timeout
		n.queue_free()
	)
	confirm.popup_centered(Vector2(420, 180))

func _on_back() -> void:
	AudioManager.play_sfx("click")
	var prev: String = GameState.previous_scene_path
	if prev == "":
		prev = "res://scenes/ui/MainMenu.tscn"
	get_tree().change_scene_to_file(prev)
