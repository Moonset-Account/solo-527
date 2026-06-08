extends CanvasLayer
class_name GameHUD

@onready var score_label: Label = $TopBar/ScoreLabel
@onready var timer_label: Label = $TopBar/TimerLabel
@onready var weight_bar: ProgressBar = $TopBar/WeightBar
@onready var weight_label: Label = $TopBar/WeightLabel
@onready var items_counter_label: Label = $TopBar/ItemsCounter
@onready var mistakes_label: Label = $TopBar/MistakesLabel
@onready var fragile_status_label: Label = $TopBar/FragileStatus
@onready var undo_button: Button = $BottomBar/UndoBtn
@onready var redo_button: Button = $BottomBar/RedoBtn
@onready var rotate_left_btn: Button = $BottomBar/RotateLeftBtn
@onready var rotate_right_btn: Button = $BottomBar/RotateRightBtn
@onready var submit_btn: Button = $BottomBar/SubmitBtn
@onready var reset_btn: Button = $BottomBar/ResetBtn
@onready var pause_btn: Button = $TopBar/PauseBtn
@onready var level_info_label: Label = $TopBar/LevelInfoLabel
@onready var controls_hint_label: Label = $BottomBar/ControlsHint
@onready var tutorial_panel: Panel = $TutorialPanel
@onready var tutorial_text: Label = $TutorialPanel/VBox/TutorialText
@onready var tutorial_next_btn: Button = $TutorialPanel/VBox/NextBtn
@onready var tutorial_skip_btn: Button = $TutorialPanel/VBox/SkipBtn
@onready var combo_banner: Label = $ComboBanner
@onready var combo_count_label: Label = $ComboBanner/ComboCount

var tutorial_messages: Array = []
var tutorial_index: int = 0
var level_manager: LevelManager = null
var combo_tween: Tween = null

func _ready() -> void:
	_connect_signals()
	_setup_buttons()
	_reset_ui()

func _process(_delta: float) -> void:
	update_hud_periodic()

func _connect_signals() -> void:
	GameManager.score_updated.connect(_on_score_updated)
	GameManager.timer_updated.connect(_on_timer_updated)
	GameManager.game_state_changed.connect(_on_game_state_change)
	GameManager.item_placed.connect(_on_item_placed)
	GameManager.fragile_item_damaged.connect(_on_fragile_damaged)

func _setup_buttons() -> void:
	undo_button.pressed.connect(_on_undo_pressed)
	redo_button.pressed.connect(_on_redo_pressed)
	rotate_left_btn.pressed.connect(_on_rotate_ccw)
	rotate_right_btn.pressed.connect(_on_rotate_cw)
	submit_btn.pressed.connect(_on_submit_pressed)
	reset_btn.pressed.connect(_on_reset_pressed)
	pause_btn.pressed.connect(_on_pause_pressed)
	tutorial_next_btn.pressed.connect(_on_tutorial_next)
	tutorial_skip_btn.pressed.connect(_on_tutorial_skip)

func bind_level_manager(lm: LevelManager) -> void:
	level_manager = lm

func _reset_ui() -> void:
	score_label.text = "得分：0"
	timer_label.text = "时间：02:00"
	weight_bar.value = 0
	weight_label.text = "0 / 500 kg"
	items_counter_label.text = "物品：0 / 0"
	mistakes_label.text = "失误：0"
	fragile_status_label.text = "易碎：0 完好"
	fragile_status_label.add_theme_color_override("font_color", Color(0.55, 0.9, 0.55))
	combo_banner.modulate.a = 0.0
	combo_count_label.text = "x0"

func _on_score_updated(new_score: int) -> void:
	score_label.text = "得分：%d" % new_score
	_pop_label(score_label)

func _on_timer_updated(time_left: float, elapsed: float) -> void:
	var mm: int = int(time_left / 60.0)
	var ss: int = int(time_left % 60)
	timer_label.text = "时间：%02d:%02d" % [mm, ss]
	if time_left < 30.0:
		timer_label.add_theme_color_override("font_color", Color(1.0, 0.35, 0.35))
		if int(elapsed * 2) != int((elapsed - 0.016) * 2):
			AudioManager.play_sfx(AudioManager.SFX.TIME_WARNING)
	elif time_left < 60.0:
		timer_label.add_theme_color_override("font_color", Color(1.0, 0.75, 0.3))
	else:
		timer_label.add_theme_color_override("font_color", Color.WHITE)

func update_weight_ui(current: float, maximum: float) -> void:
	var ratio: float = current / max(1.0, maximum)
	weight_bar.max_value = 1.0
	weight_bar.value = ratio
	weight_label.text = "%.0f / %.0f kg" % [current, maximum]
	match true:
		ratio >= 1.0:
			weight_bar.add_theme_color_override("fill_color", Color(1.0, 0.3, 0.3))
		ratio >= 0.9:
			weight_bar.add_theme_color_override("fill_color", Color(1.0, 0.75, 0.2))
		_:
			weight_bar.add_theme_color_override("fill_color", Color(0.4, 0.85, 0.5))

func update_items_ui(placed: int, total: int) -> void:
	items_counter_label.text = "物品：%d / %d" % [placed, total]
	_pop_label(items_counter_label)

func update_mistakes_ui(count: int) -> void:
	mistakes_label.text = "失误：%d" % count
	if count > 2:
		mistakes_label.add_theme_color_override("font_color", Color(1.0, 0.5, 0.5))
	_pop_label(mistakes_label)

func update_fragile_ui(broken: int, total: int) -> void:
	var intact: int = max(0, total - broken)
	fragile_status_label.text = "易碎：%d 完好 / %d" % [intact, total]
	if broken > 0:
		fragile_status_label.add_theme_color_override("font_color", Color(0.9, 0.4, 0.85))
	else:
		fragile_status_label.add_theme_color_override("font_color", Color(0.55, 0.9, 0.55))

func update_level_info(name: String, diff: int) -> void:
	var stars: String = "⭐" * min(5, diff)
	level_info_label.text = "%s  [%s]" % [name, stars]

func show_tutorial(messages_param: Array) -> void:
	if messages_param.is_empty():
		tutorial_panel.visible = false
		return
	tutorial_messages = messages_param.duplicate()
	tutorial_index = 0
	tutorial_panel.visible = true
	_update_tutorial_text()

func _update_tutorial_text() -> void:
	if tutorial_index >= tutorial_messages.size():
		tutorial_panel.visible = false
		return
	tutorial_text.text = "[hint #%d/%d]\n%s" % [
		tutorial_index + 1, tutorial_messages.size(),
		tutorial_messages[tutorial_index]
	]
	tutorial_next_btn.text = "下一条" if tutorial_index < tutorial_messages.size() - 1 else "开始游戏"

func _on_tutorial_next() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	tutorial_index += 1
	if tutorial_index >= tutorial_messages.size():
		tutorial_panel.visible = false
	else:
		_update_tutorial_text()

func _on_tutorial_skip() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	tutorial_panel.visible = false

func show_combo(count: int) -> void:
	if count < 2:
		return
	combo_count_label.text = "x%d" % count
	combo_banner.text = "连击！"
	if combo_tween and combo_tween.is_valid():
		combo_tween.kill()
	combo_tween = create_tween()
	combo_banner.modulate.a = 0.0
	combo_banner.scale = Vector2(0.6, 0.6)
	combo_tween.set_parallel(true)
	combo_tween.tween_property(combo_banner, "modulate:a", 1.0, 0.2)
	combo_tween.tween_property(combo_banner, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK)
	combo_tween.set_parallel(false)
	combo_tween.tween_interval(1.0)
	combo_tween.tween_property(combo_banner, "modulate:a", 0.0, 0.4)

func _pop_label(lbl: Label) -> void:
	var t := create_tween()
	lbl.scale = Vector2(1.15, 1.15)
	t.tween_property(lbl, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_ELASTIC)

func _on_undo_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	InputManager.undo_pressed.emit()

func _on_redo_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	InputManager.redo_pressed.emit()

func _on_rotate_cw() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	InputManager.rotate_cw_pressed.emit()

func _on_rotate_ccw() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	InputManager.rotate_ccw_pressed.emit()

func _on_submit_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	InputManager.submit_pressed.emit()

func _on_reset_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	InputManager.reset_pressed.emit()

func _on_pause_pressed() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	InputManager.pause_pressed.emit()

func _on_game_state_change(_s: int) -> void:
	pass

func _on_item_placed(_item) -> void:
	pass

func _on_fragile_damaged(_item) -> void:
	_shake_ui()

func _shake_ui() -> void:
	var original_pos: Vector2 = position
	var t := create_tween()
	t.set_loops(4)
	t.tween_callback(func():
		position = original_pos + Vector2(randf_range(-4, 4), randf_range(-4, 4))
	)
	t.tween_interval(1.0 / 30.0)
	t.chain().tween_property(self, "position", original_pos, 0.1)

func update_hud_periodic() -> void:
	if GameManager.current_level.is_empty():
		return
	update_weight_ui(GameManager.current_container_weight, GameManager.max_container_weight)
	update_items_ui(GameManager.items_placed_count, GameManager.current_level.get("total_items", 0))
	update_mistakes_ui(GameManager.mistakes_count)
	update_fragile_ui(GameManager.fragile_broken_count, GameManager.current_level.get("fragile_count", 0))
