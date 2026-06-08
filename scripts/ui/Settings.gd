extends Control
## 设置页面 - 音量、显示、控制等选项

@onready var master_slider: HSlider = $Panel/VBox/MasterRow/ValueSlider
@onready var sfx_slider: HSlider = $Panel/VBox/SfxRow/ValueSlider
@onready var music_slider: HSlider = $Panel/VBox/MusicRow/ValueSlider
@onready var fullscreen_toggle: CheckBox = $Panel/VBox/FullscreenRow/Toggle
@onready var vsync_toggle: CheckBox = $Panel/VBox/VsyncRow/Toggle
@onready var crouch_toggle: CheckBox = $Panel/VBox/CrouchRow/Toggle
@onready var back_btn: Button = $Panel/VBox/BackButton
@onready var defaults_btn: Button = $Panel/VBox/DefaultsButton
@onready var master_value_label: Label = $Panel/VBox/MasterRow/ValueLabel
@onready var sfx_value_label: Label = $Panel/VBox/SfxRow/ValueLabel
@onready var music_value_label: Label = $Panel/VBox/MusicRow/ValueLabel
@onready var title_label: Label = $Panel/TitleLabel
@onready var panel: PanelContainer = $Panel

var _return_scene_path: String = ""
var _from_pause_menu: bool = false

func _ready() -> void:
	_detect_return_mode()
	_load_settings_to_ui()
	_connect_signals()
	_animate_panel_in()
	if _return_scene_path.is_empty():
		_return_scene_path = "res://scenes/ui/MainMenu.tscn"

func _detect_return_mode() -> void:
	var parent_check := get_parent()
	if parent_check:
		var parent_name_check := parent_check.name
		if "pause" in parent_name_check.to_lower() or "hud" in parent_name_check.to_lower() or "overlay" in parent_name_check.to_lower():
			_from_pause_menu = true
			return
		var root_children := get_tree().current_scene
		if root_children and root_children.name != "Settings":
			if root_children.get_node_or_null("HUD") or root_children.has_method("is_tutorial_level"):
				_from_pause_menu = true
				return

func _load_settings_to_ui() -> void:
	if master_slider:
		master_slider.value = SaveManager.get_setting("master_volume") * 100.0
		_update_value_label(master_value_label, int(master_slider.value))
	if sfx_slider:
		sfx_slider.value = SaveManager.get_setting("sfx_volume") * 100.0
		_update_value_label(sfx_value_label, int(sfx_slider.value))
	if music_slider:
		music_slider.value = SaveManager.get_setting("music_volume") * 100.0
		_update_value_label(music_value_label, int(music_slider.value))
	if fullscreen_toggle:
		fullscreen_toggle.button_pressed = SaveManager.get_setting("fullscreen")
	if vsync_toggle:
		vsync_toggle.button_pressed = SaveManager.get_setting("vsync")
	if crouch_toggle:
		crouch_toggle.button_pressed = SaveManager.get_setting("crouch_toggle")

func _connect_signals() -> void:
	if master_slider:
		master_slider.value_changed.connect(_on_master_volume_changed)
	if sfx_slider:
		sfx_slider.value_changed.connect(_on_sfx_volume_changed)
	if music_slider:
		music_slider.value_changed.connect(_on_music_volume_changed)
	if fullscreen_toggle:
		fullscreen_toggle.toggled.connect(_on_fullscreen_toggled)
	if vsync_toggle:
		vsync_toggle.toggled.connect(_on_vsync_toggled)
	if crouch_toggle:
		crouch_toggle.toggled.connect(_on_crouch_toggled)
	if back_btn:
		back_btn.pressed.connect(_on_back_pressed)
		back_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if defaults_btn:
		defaults_btn.pressed.connect(_on_defaults_pressed)
		defaults_btn.mouse_entered.connect(_on_btn_mouse_entered)

func _animate_panel_in() -> void:
	if panel:
		panel.modulate.a = 0.0
		panel.scale = Vector2(0.9, 0.9)
		var tween := create_tween()
		tween.set_ease(Tween.EASE_OUT)
		tween.tween_property(panel, "modulate:a", 1.0, 0.25)
		tween.parallel().tween_property(panel, "scale", Vector2(1.0, 1.0), 0.25)

func _animate_panel_out(on_complete: Callable) -> void:
	if panel:
		var tween := create_tween()
		tween.set_ease(Tween.EASE_IN)
		tween.tween_property(panel, "modulate:a", 0.0, 0.2)
		tween.parallel().tween_property(panel, "scale", Vector2(0.92, 0.92), 0.2)
		tween.finished.connect(on_complete)
	else:
		on_complete.call()

func _update_value_label(label: Label, value: int) -> void:
	if label:
		label.text = "%d%%" % value

func _on_master_volume_changed(value: float) -> void:
	var linear_val: float = clamp(value / 100.0, 0.0, 1.0)
	SaveManager.set_setting("master_volume", linear_val)
	_update_value_label(master_value_label, int(value))
	SaveManager._save_settings()

func _on_sfx_volume_changed(value: float) -> void:
	var linear_val: float = clamp(value / 100.0, 0.0, 1.0)
	SaveManager.set_setting("sfx_volume", linear_val)
	_update_value_label(sfx_value_label, int(value))
	SaveManager._save_settings()

func _on_music_volume_changed(value: float) -> void:
	var linear_val: float = clamp(value / 100.0, 0.0, 1.0)
	SaveManager.set_setting("music_volume", linear_val)
	_update_value_label(music_value_label, int(value))
	SaveManager._save_settings()

func _on_fullscreen_toggled(pressed: bool) -> void:
	SaveManager.set_setting("fullscreen", pressed)
	SaveManager._save_settings()
	EventBus.emit_ui_toast("全屏模式已%s" % ("开启" if pressed else "关闭"), 1.5)

func _on_vsync_toggled(pressed: bool) -> void:
	SaveManager.set_setting("vsync", pressed)
	SaveManager._save_settings()

func _on_crouch_toggled(pressed: bool) -> void:
	SaveManager.set_setting("crouch_toggle", pressed)
	SaveManager._save_settings()
	EventBus.emit_ui_toast("蹲伏模式：%s" % ("切换键" if pressed else "按住键"), 1.5)

func _on_defaults_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	SaveManager.reset_settings_to_defaults()
	_load_settings_to_ui()
	EventBus.emit_ui_toast("已恢复默认设置", 2.0)

func _on_back_pressed() -> void:
	EventBus.emit_sfx_play("menu_cancel")
	SaveManager._save_settings()
	_animate_panel_out(Callable(self, "_do_back"))

func _do_back() -> void:
	if _from_pause_menu:
		queue_free()
	else:
		get_tree().change_scene_to_file(_return_scene_path)

func set_return_scene(path: String) -> void:
	_return_scene_path = path

func set_from_pause(value: bool) -> void:
	_from_pause_menu = value

func _on_btn_mouse_entered() -> void:
	EventBus.emit_sfx_play("menu_move")

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			_on_back_pressed()
