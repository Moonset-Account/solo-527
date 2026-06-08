extends CanvasLayer
## HUD - 游戏内HUD，显示能量、扫描进度、警戒等级、任务目标

@onready var energy_bar: ProgressBar = $HUDLayout/TopBar/EnergyContainer/EnergyBar
@onready var energy_label: Label = $HUDLayout/TopBar/EnergyContainer/EnergyLabel
@onready var scan_bar: ProgressBar = $HUDLayout/TopBar/ScanContainer/ScanBar
@onready var scan_label: Label = $HUDLayout/TopBar/ScanContainer/ScanLabel
@onready var scan_phase_label: Label = $HUDLayout/TopBar/ScanContainer/PhaseLabel
@onready var objective_label: Label = $HUDLayout/TopBar/ObjectiveContainer/ObjectiveLabel
@onready var progress_label: Label = $HUDLayout/TopBar/ObjectiveContainer/ProgressLabel
@onready var alert_container: HBoxContainer = $HUDLayout/TopBar/AlertContainer
@onready var toast_panel: PanelContainer = $HUDLayout/Toast/ToastPanel
@onready var toast_label: Label = $HUDLayout/Toast/ToastPanel/ToastLabel
@onready var scan_reticle: Control = $HUDLayout/ScanReticle
@onready var caught_overlay: ColorRect = $HUDLayout/CaughtOverlay
@onready var caught_label: Label = $HUDLayout/CaughtOverlay/CaughtLabel
@onready var caught_hint: Label = $HUDLayout/CaughtOverlay/CaughtHint

var _toast_tween: Tween = null
var _toast_timer: float = 0.0
var _scan_target_pos: Vector2 = Vector2.ZERO
var _show_scan_reticle: bool = false

func _ready() -> void:
	_connect_events()
	_update_alert_lights(0)
	if toast_panel:
		toast_panel.modulate.a = 0.0
	if caught_overlay:
		caught_overlay.visible = false
	if scan_reticle:
		scan_reticle.visible = false
	if scan_bar:
		scan_bar.visible = false

func _connect_events() -> void:
	EventBus.energy_changed.connect(_on_energy_changed)
	EventBus.scan_progress.connect(_on_scan_progress)
	EventBus.scan_started.connect(_on_scan_started)
	EventBus.scan_completed.connect(_on_scan_completed)
	EventBus.scan_canceled.connect(_on_scan_canceled)
	EventBus.alert_level_changed.connect(_on_alert_level_changed)
	EventBus.ui_toast.connect(_on_ui_toast)
	EventBus.player_caught.connect(_on_player_caught)
	EventBus.level_started.connect(_on_level_started)
	EventBus.shelf_tag_fixed.connect(_on_shelf_fixed)
	EventBus.player_detected.connect(_on_player_detected)

func _process(delta: float) -> void:
	if _toast_timer > 0.0:
		_toast_timer -= delta
		if _toast_timer <= 0.0 and toast_panel:
			_hide_toast()
	_update_objective()
	_update_scan_reticle()

func _update_objective() -> void:
	if not objective_label or not progress_label:
		return
	if GameManager.current_state == GameManager.GameState.TUTORIAL:
		objective_label.text = "任务：完成教程训练"
		progress_label.text = "步骤 %d / 5" % min(5, GameManager.tutorial_step)
	else:
		objective_label.text = "任务：扫描并修复所有错误标签"
		progress_label.text = "修复进度：%d / %d" % [GameManager.fixed_shelves, max(1, GameManager.total_shelves)]

func _on_energy_changed(current: float, max_val: float) -> void:
	if energy_bar:
		var pct := (current / max_val) * 100.0
		energy_bar.value = pct
		if current / max_val <= 0.1:
			energy_bar.modulate = Color(1.0, 0.3, 0.3, 1.0)
		elif current / max_val <= 0.25:
			energy_bar.modulate = Color(1.0, 0.7, 0.3, 1.0)
		else:
			energy_bar.modulate = Color(0.3, 0.9, 0.4, 1.0)
		var tween := create_tween()
		tween.tween_property(energy_bar, "modulate:a", 1.0, 0.1)
	if energy_label:
		energy_label.text = "能量 %d%%" % int((current / max_val) * 100.0)

func _on_scan_started(_target: Node) -> void:
	if scan_bar:
		scan_bar.visible = true
		scan_bar.value = 0.0
	if scan_phase_label:
		scan_phase_label.visible = true
	if scan_label:
		scan_label.visible = true
	_show_scan_reticle = true
	if scan_reticle:
		scan_reticle.visible = true

func _on_scan_progress(progress: float) -> void:
	if not scan_bar:
		return
	var display_pct: float
	var phase_text: String
	if progress < 1.0:
		display_pct = progress * 100.0
		phase_text = "扫描中"
		scan_bar.modulate = Color(0.3, 0.9, 0.6, 1.0)
	elif progress < 1.001:
		display_pct = 60.0 + ((progress - 1.0) / 0.001) * 15.0
		phase_text = "分析中"
		scan_bar.modulate = Color(0.4, 0.8, 1.0, 1.0)
	else:
		display_pct = 75.0 + ((progress - 1.001) / 0.001) * 25.0
		phase_text = "修复中"
		scan_bar.modulate = Color(0.9, 0.9, 0.3, 1.0)
	scan_bar.value = clamp(display_pct, 0.0, 100.0)
	if scan_phase_label:
		scan_phase_label.text = phase_text
	if scan_label:
		scan_label.text = "扫描进度"

func _on_scan_completed(_target: Node) -> void:
	if scan_bar:
		var tween := create_tween()
		tween.tween_property(scan_bar, "modulate", Color(0.3, 1.0, 0.5, 1.0), 0.2)
		tween.tween_interval(0.5)
		tween.tween_property(scan_bar, "modulate:a", 0.0, 0.3)
		tween.tween_callback(scan_bar.set_visible.bind(false))
	if scan_phase_label:
		scan_phase_label.text = "完成"
		var tween2 := create_tween()
		tween2.tween_interval(0.8)
		tween2.tween_property(scan_phase_label, "modulate:a", 0.0, 0.3)
	_show_scan_reticle = false
	if scan_reticle:
		scan_reticle.visible = false

func _on_scan_canceled() -> void:
	if scan_bar:
		var tween := create_tween()
		tween.tween_property(scan_bar, "modulate:a", 0.0, 0.3)
		tween.tween_callback(scan_bar.set_visible.bind(false))
	if scan_phase_label:
		scan_phase_label.text = "已取消"
		var tween2 := create_tween()
		tween2.tween_interval(0.5)
		tween2.tween_property(scan_phase_label, "modulate:a", 0.0, 0.3)
	_show_scan_reticle = false
	if scan_reticle:
		scan_reticle.visible = false

func _on_alert_level_changed(level: int) -> void:
	_update_alert_lights(level)
	var tween := create_tween()
	for i in alert_container.get_child_count():
		var light := alert_container.get_child(i)
		if light:
			tween.parallel().tween_property(light, "scale", Vector2(1.5, 1.5), 0.1)
	tween.tween_interval(0.1)
	for i in alert_container.get_child_count():
		var light := alert_container.get_child(i)
		if light:
			tween.parallel().tween_property(light, "scale", Vector2(1.0, 1.0), 0.1)

func _update_alert_lights(level: int) -> void:
	for i in alert_container.get_child_count():
		var light := alert_container.get_child(i)
		if light is ColorRect:
			if i < level:
				light.color = Color(1.0, 0.3, 0.3, 1.0)
			else:
				light.color = Color(0.3, 0.3, 0.35, 0.8)

func _on_ui_toast(message: String, duration: float) -> void:
	if not toast_label or not toast_panel:
		return
	toast_label.text = message
	_toast_timer = duration
	if _toast_tween:
		_toast_tween.kill()
	toast_panel.modulate.a = 0.0
	toast_panel.visible = true
	_toast_tween = create_tween()
	_toast_tween.tween_property(toast_panel, "modulate:a", 1.0, 0.25)

func _hide_toast() -> void:
	if _toast_tween:
		_toast_tween.kill()
	if toast_panel:
		_toast_tween = create_tween()
		_toast_tween.tween_property(toast_panel, "modulate:a", 0.0, 0.4)
		_toast_tween.tween_callback(toast_panel.set_visible.bind(false))

func _on_player_caught() -> void:
	if caught_overlay:
		caught_overlay.visible = true
		caught_overlay.modulate.a = 0.0
		var tween := create_tween()
		tween.tween_property(caught_overlay, "modulate:a", 0.8, 0.3)
		tween.tween_interval(1.0)
		tween.tween_property(caught_overlay, "modulate:a", 0.0, 0.3)
		tween.tween_callback(caught_overlay.set_visible.bind(false))
	if caught_label:
		caught_label.modulate.a = 0.0
		var tween2 := create_tween()
		tween2.tween_property(caught_label, "modulate:a", 1.0, 0.2)
		tween2.tween_interval(1.0)
		tween2.tween_property(caught_label, "modulate:a", 0.0, 0.4)
	if caught_hint:
		caught_hint.modulate.a = 0.0
		var tween3 := create_tween()
		tween3.tween_property(caught_hint, "modulate:a", 1.0, 0.3)
		tween3.tween_interval(0.9)
		tween3.tween_property(caught_hint, "modulate:a", 0.0, 0.4)

func _on_player_detected() -> void:
	if alert_container:
		alert_container.modulate = Color(1.0, 1.0, 1.0, 1.0)
		var tween := create_tween()
		tween.tween_property(alert_container, "modulate", Color.WHITE, 0.15)

func _on_level_started(_lvl_id: String) -> void:
	if scan_bar:
		scan_bar.visible = false
		scan_bar.value = 0.0
	_update_alert_lights(0)
	GameManager.alert_level = 0

func _on_shelf_fixed(_shelf: Node) -> void:
	if progress_label:
		var orig_scale := progress_label.scale
		var tween := create_tween()
		tween.tween_property(progress_label, "scale", orig_scale * 1.2, 0.15)
		tween.tween_property(progress_label, "scale", orig_scale, 0.15)

func _update_scan_reticle() -> void:
	pass
