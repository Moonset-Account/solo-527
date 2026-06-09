extends CanvasLayer
## TopBar - 顶部HUD信息栏

@onready var lbl_money: Label = $TopBar/HBox/Money/Label
@onready var icon_money: Label = $TopBar/HBox/Money/Icon
@onready var lbl_level: Label = $TopBar/HBox/LevelInfo/LevelLabel
@onready var bar_xp: ColorRect = $TopBar/HBox/LevelInfo/XPBar/Fill
@onready var bar_xp_bg: ColorRect = $TopBar/HBox/LevelInfo/XPBar
@onready var lbl_orders: Label = $TopBar/HBox/Stats/OrdersLabel
@onready var lbl_time: Label = $TopBar/HBox/Stats/TimeLabel
@onready var lbl_speed: Label = $TopBar/HBox/SpeedControl/SpeedLabel
@onready var btn_speed_down: Button = $TopBar/HBox/SpeedControl/SpeedDown
@onready var btn_speed_up: Button = $TopBar/HBox/SpeedControl/SpeedUp
@onready var btn_pause: Button = $TopBar/HBox/PauseButton
@onready var btn_menu: Button = $TopBar/HBox/MenuButton
@onready var lbl_health: Label = $TopBar/HBox/Stats/HealthLabel
@onready var bar_health: ColorRect = $TopBar/HBox/Stats/HealthBar/Fill
@onready var bar_health_bg: ColorRect = $TopBar/HBox/Stats/HealthBar

var level_cfg: Dictionary = {}
var time_limit: float = 0.0
var current_stats: Dictionary = {}

func initialize(cfg: Dictionary) -> void:
	level_cfg = cfg
	time_limit = float(cfg.get("time_limit_seconds", 0))
	update_money(GameState.money)
	update_level_ui()
	_connect_buttons()
	if time_limit > 0:
		lbl_time.modulate = Color(1.0, 0.9, 0.6)
	else:
		lbl_time.text = "♾"
		lbl_time.modulate = Color(0.6, 0.85, 0.7)
	GameState.level_changed.connect(func(_l): update_level_ui())

func _connect_buttons() -> void:
	btn_speed_down.pressed.connect(_on_speed_down)
	btn_speed_up.pressed.connect(_on_speed_up)
	btn_pause.pressed.connect(_on_pause)
	btn_menu.pressed.connect(_on_menu)
	for b in [btn_speed_down, btn_speed_up, btn_pause, btn_menu]:
		b.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func update_money(amount: int) -> void:
	lbl_money.text = "%d" % amount
	var pulse_tween := create_tween()
	pulse_tween.tween_property(lbl_money, "scale", Vector2(1.15, 1.15), 0.1)
	pulse_tween.tween_property(lbl_money, "scale", Vector2(1.0, 1.0), 0.15)
	lbl_money.modulate = Color(0.7, 1.0, 0.7) if amount >= 0 else Color(1.0, 0.6, 0.5)
	var color_tween := create_tween()
	color_tween.tween_interval(0.4)
	color_tween.tween_property(lbl_money, "modulate", Color(1.0, 0.85, 0.35), 0.3)

func update_level_ui() -> void:
	lbl_level.text = "Lv.%d" % GameState.level
	var p: float = GameState.get_level_progress()
	bar_xp.size.x = max(bar_xp_bg.size.x * p, 2)

func update_time_limit(remaining: float) -> void:
	var m: int = int(remaining) / 60
	var s: int = int(remaining) % 60
	lbl_time.text = "%02d:%02d" % [m, s]
	if remaining < 30:
		lbl_time.modulate = Color(1.0, 0.4, 0.4)
	elif remaining < 60:
		lbl_time.modulate = Color(1.0, 0.75, 0.3)
	else:
		lbl_time.modulate = Color(0.7, 0.85, 1.0)

func update_stats(pipeline_stats: Dictionary, order_stats: Dictionary) -> void:
	current_stats = pipeline_stats
	var completed: int = order_stats.get("completed", 0)
	var target: int = level_cfg.get("target_orders", 10)
	lbl_orders.text = "📦 %d/%d" % [completed, target]
	lbl_orders.modulate = Color(0.85, 0.95, 0.85)
	var health: float = pipeline_stats.get("health", 1.0)
	bar_health.size.x = max(bar_health_bg.size.x * health, 2)
	if health > 0.7:
		bar_health.color = Color(0.35, 0.8, 0.45)
		lbl_health.modulate = Color(0.6, 0.9, 0.6)
	elif health > 0.4:
		bar_health.color = Color(0.9, 0.8, 0.35)
		lbl_health.modulate = Color(0.95, 0.85, 0.45)
	else:
		bar_health.color = Color(0.9, 0.4, 0.35)
		lbl_health.modulate = Color(1.0, 0.55, 0.45)
	lbl_health.text = "%d%%" % int(health * 100)
	lbl_speed.text = "%.1fx" % GameState.game_speed

func _on_speed_down() -> void:
	AudioManager.play_sfx("click")
	GameState.game_speed = max(GameState.game_speed - 0.5, 0.5)

func _on_speed_up() -> void:
	AudioManager.play_sfx("click")
	GameState.game_speed = min(GameState.game_speed + 0.5, 3.0)

func _on_pause() -> void:
	AudioManager.play_sfx("click")
	if get_tree().current_scene and get_tree().current_scene.has_method("toggle_pause"):
		get_tree().current_scene.toggle_pause()

func _on_menu() -> void:
	AudioManager.play_sfx("click")
	if get_tree().current_scene and get_tree().current_scene.has_method("toggle_pause"):
		get_tree().current_scene.toggle_pause()
