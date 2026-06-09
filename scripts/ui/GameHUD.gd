extends CanvasLayer

class_name GameHUD

@onready var energy_bar: ProgressBar = $TopPanel/EnergyBar
@onready var time_label: Label = $TopPanel/TimeLabel
@onready var level_name_label: Label = $TopPanel/LevelNameLabel
@onready var objectives_label: Label = $TopPanel/ObjectivesLabel
@onready var detect_label: Label = $TopPanel/DetectLabel
@onready var noise_bar: ProgressBar = $BottomPanel/NoiseBar
@onready var controls_label: Label = $BottomPanel/ControlsLabel
@onready var debug_log_panel: PanelContainer = $DebugLogPanel
@onready var debug_log_vbox: VBoxContainer = $DebugLogPanel/ScrollContainer/VBoxContainer
@onready var achievement_popup: PanelContainer = $AchievementPopup
@onready var achievement_name: Label = $AchievementPopup/AchievementName
@onready var achievement_desc: Label = $AchievementPopup/AchievementDesc
@onready var center_message: Label = $CenterMessage

var _achievement_timer: float = 0.0
var _center_msg_timer: float = 0.0

func _ready():
	GameManager.state_changed.connect(_on_game_state_changed)
	AchievementManager.achievement_unlocked.connect(_on_achievement_unlocked)
	DebugLog.log_added.connect(_on_log_added)
	center_message.visible = false
	achievement_popup.visible = false
	if SaveManager.settings.get("show_debug_log", true):
		debug_log_panel.visible = true
	else:
		debug_log_panel.visible = false
	_refresh_debug_log()
	controls_label.text = "[WASD]移动 | [空格]扫描 | [E]交互 | [Shift]冲刺 | [Ctrl]蹲伏 | [Esc]暂停"

func _process(delta):
	_update_game_info()
	if _achievement_timer > 0:
		_achievement_timer -= delta
		if _achievement_timer <= 0:
			achievement_popup.visible = false
	if _center_msg_timer > 0:
		_center_msg_timer -= delta
		if _center_msg_timer <= 0:
			center_message.visible = false

func _update_game_info():
	if not GameManager.is_playing():
		return
	var progress = GameManager.get_progress()
	energy_bar.value = progress["energy"]
	energy_bar.get_parent().get_node("EnergyLabel").text = "能量: %d%%" % int(progress["energy"])
	var mins = int(progress["time"]) / 60
	var secs = int(progress["time"]) % 60
	time_label.text = "时间: %02d:%02d" % [mins, secs]
	if GameManager.current_level > 0:
		var level_data = LevelConfig.get_level(GameManager.current_level)
		level_name_label.text = "关卡 %d - %s" % [GameManager.current_level, level_data.get("name", "")]
	objectives_label.text = "扫描: %d/%d  修复: %d/%d" % [
		progress["scans"], progress["total_scans"],
		progress["fixes"], progress["total_fixes"]
	]
	detect_label.text = "被发现: %d" % progress["detections"]
	var player = get_tree().get_first_node_in_group("player")
	if player:
		noise_bar.value = player.noise_level * 100

func show_center_message(msg: String, duration: float = 2.0):
	center_message.text = msg
	center_message.visible = true
	_center_msg_timer = duration

func _on_game_state_changed(new_state: int, old_state: int):
	match new_state:
		GameManager.GameState.LEVEL_COMPLETE:
			show_center_message("关卡完成！", 3.0)
		GameManager.GameState.MENU:
			visible = false

func _on_achievement_unlocked(id: String, name: String, description: String):
	achievement_name.text = "成就解锁: %s" % name
	achievement_desc.text = description
	achievement_popup.visible = true
	_achievement_timer = 4.0
	AudioManager.play_sfx("achievement", 1.0, 0.7)

func _on_log_added(message: String, log_type: String):
	if not debug_log_panel.visible:
		return
	var label = Label.new()
	label.text = "[%s] %s" % [log_type, message]
	match log_type:
		"OK", "SUCCESS":
			label.modulate = Color(0.4, 1.0, 0.4)
		"ERR", "ERROR":
			label.modulate = Color(1.0, 0.4, 0.4)
		"WARN":
			label.modulate = Color(1.0, 0.9, 0.4)
		"DBG":
			label.modulate = Color(0.6, 0.8, 1.0)
		_:
			label.modulate = Color(0.9, 0.9, 0.9)
	label.add_theme_font_size_override("font_size", 12)
	debug_log_vbox.add_child(label)
	while debug_log_vbox.get_child_count() > 80:
		debug_log_vbox.get_child(0).queue_free()

func _refresh_debug_log():
	for log in DebugLog.get_logs():
		_on_log_added(log["message"], log["type"])

func toggle_debug_log():
	debug_log_panel.visible = not debug_log_panel.visible
	SaveManager.settings["show_debug_log"] = debug_log_panel.visible
	SaveManager.save_settings()
	if debug_log_panel.visible:
		for child in debug_log_vbox.get_children():
			child.queue_free()
		_refresh_debug_log()
