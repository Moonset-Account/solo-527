extends Control
class_name DebugPanel

@onready var panel_container: PanelContainer = %DebugPanelRoot
@onready var visibility_btn: Button = %ToggleBtn
@onready var info_label: RichTextLabel = %InfoLabel
@onready var stats_label: Label = %StatsLabel
@onready var spawn_combo: OptionButton = %SpawnItemCombo
@onready var spawn_btn: Button = %SpawnBtn
@onready var weight_slider: HSlider = %WeightSlider
@onready var time_slider: HSlider = %TimeSlider
@onready var gravity_chk: CheckButton = %GravityChk
@onready var snap_chk: CheckButton = %SnapChk
@onready var complete_btn: Button = %CompleteBtn
@onready var fail_btn: Button = %FailBtn
@onready var export_log_btn: Button = %ExportLog
@onready var clear_save_btn: Button = %ClearSaveBtn

var is_visible: bool = false
var level_manager: LevelManager = null
var items_db: Dictionary = {}

func _ready() -> void:
	_load_items()
	_connect_signals()
	_hide_panel()

func _load_items() -> void:
	var res := load("res://config/item_database.tres")
	if res:
		items_db = res.get_all_items()
		spawn_combo.clear()
		for id in items_db.keys():
			var info: Dictionary = items_db[id]
			spawn_combo.add_item("%s - %s" % [info.get("category_icon", "📦"), info.get("item_name", id)])
			spawn_combo.set_item_metadata(spawn_combo.item_count - 1, id)

func _connect_signals() -> void:
	InputManager.debug_toggle_pressed.connect(toggle)
	visibility_btn.pressed.connect(toggle)
	spawn_btn.pressed.connect(_on_spawn_item)
	weight_slider.value_changed.connect(_on_weight_changed)
	time_slider.value_changed.connect(_on_time_changed)
	gravity_chk.toggled.connect(_on_gravity_toggle)
	snap_chk.toggled.connect(_on_snap_toggle)
	complete_btn.pressed.connect(_on_force_complete)
	fail_btn.pressed.connect(_on_force_fail)
	export_log_btn.pressed.connect(_on_export_log)
	clear_save_btn.pressed.connect(_on_clear_save)

func bind_level_manager(lm: LevelManager) -> void:
	level_manager = lm

func toggle() -> void:
	is_visible = not is_visible
	if is_visible:
		_show_panel()
	else:
		_hide_panel()
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)

func _show_panel() -> void:
	panel_container.visible = true
	if panel_container.has_method("modulate"):
		panel_container.modulate.a = 0.0
	var t := create_tween()
	t.tween_property(panel_container, "modulate:a", 1.0, 0.2)
	_process_frame()

func _hide_panel() -> void:
	panel_container.visible = false

func _process(_delta: float) -> void:
	if is_visible:
		_process_frame()

func _process_frame() -> void:
	var info: String = ""
	info += "[b]=== 调试面板 ===[/b]\n"
	info += "[color=#88ff88]FPS: %d[/color]\n" % Engine.get_frames_per_second()
	info += "游戏状态: %s\n" % _state_str()
	info += "关卡: %s (ID: %d)\n" % [GameManager.current_level.get("name", "-"), GameManager.current_level_id]
	info += "得分: %d\n" % GameManager.score
	info += "用时: %.1fs / %.1fs\n" % [GameManager.time_elapsed, GameManager.time_limit]
	info += "容器重量: %.1f / %.1f kg (%.0f%%)\n" % [
		GameManager.current_container_weight,
		GameManager.max_container_weight,
		GameManager.current_container_weight / max(1.0, GameManager.max_container_weight) * 100
	]
	info += "已放置物品: %d / %d\n" % [GameManager.items_placed_count, GameManager.current_level.get("total_items", 0)]
	info += "易碎品损坏: %d / %d\n" % [GameManager.fragile_broken_count, GameManager.current_level.get("fragile_count", 0)]
	info += "失误次数: %d\n" % GameManager.mistakes_count
	info += "撤销栈: %d | 重做栈: %d\n" % [GameManager.undo_history.size(), GameManager.redo_history.size()]
	if level_manager:
		info += "当前选中: %s\n" % (level_manager.selected_item.item_name if level_manager.selected_item else "(无)")
		info += "连击计数: %d\n" % level_manager.placement_chain_count
		if level_manager.container:
			var c := level_manager.container
			info += "容器内物品: %d\n" % c.items_inside.size()
			info += "空间利用率: %.1f%%\n" % (c.get_fill_ratio() * 100)
	info += "\n[b]--- 记录的会话事件 ---[/b]\n"
	info += "事件数: %d\n" % PlaySessionRecorder.get_event_count()
	if is_instance_valid(info_label):
		info_label.text = info

func _state_str() -> String:
	match GameManager.game_state:
		GameManager.GameState.MAIN_MENU: return "主菜单"
		GameManager.GameState.LEVEL_SELECT: return "选关"
		GameManager.GameState.PLAYING: return "[color=#44ff88]游戏中[/color]"
		GameManager.GameState.PAUSED: return "[color=#ffaa44]暂停[/color]"
		GameManager.GameState.RESULT_SCREEN: return "结算界面"
		_: return "未知"

func _on_spawn_item() -> void:
	if spawn_combo.selected < 0 or level_manager == null:
		return
	var id: String = spawn_combo.get_item_metadata(spawn_combo.selected)
	if not items_db.has(id):
		return
	var cfg: Dictionary = items_db[id]
	var uid: int = 900000 + Time.get_ticks_msec() % 10000
	var item: PackableItem = level_manager._create_item_from_config(cfg, 999)
	item.item_uid = uid
	item.spawn_index = 999
	var pos: Vector2 = level_manager.tray_position + Vector2(randf_range(-100, 100), randf_range(-80, 80))
	item.position = pos
	item.original_position = pos
	item.original_rotation = 0
	item.original_z_index = 200
	item.z_index = 200
	level_manager.active_items.append(item)
	level_manager.add_child(item)
	AudioManager.play_sfx(AudioManager.SFX.PLACE)
	UIManager.show_toast("调试生成: %s" % cfg.get("item_name", id), 1.2, "success")

func _on_weight_changed(v: float) -> void:
	GameManager.max_container_weight = float(int(v))
	if level_manager and level_manager.container:
		level_manager.container.max_weight = GameManager.max_container_weight
	UIManager.show_toast("重量上限已改为 %d kg" % int(v), 1.0, "info")

func _on_time_changed(v: float) -> void:
	GameManager.time_limit = float(int(v))
	UIManager.show_toast("时间上限已改为 %d 秒" % int(v), 1.0, "info")

func _on_gravity_toggle(v: bool) -> void:
	ProjectSettings.set_setting("physics/2d/default_gravity", 980.0 if v else 0.0)
	UIManager.show_toast("重力: %s" % ("开启" if v else "关闭"), 1.0, "info")

func _on_snap_toggle(v: bool) -> void:
	UIManager.show_toast("吸附: %s (调试预留)" % ("开启" if v else "关闭"), 1.0, "info")

func _on_force_complete() -> void:
	if GameManager.is_playing():
		GameManager.complete_level()

func _on_force_fail() -> void:
	if GameManager.is_playing():
		GameManager.fail_level("调试强制失败")

func _on_export_log() -> void:
	var log: String = PlaySessionRecorder.export_session_to_json()
	var path: String = "user://debug_session_%d.json" % Time.get_unix_time_from_system()
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f:
		f.store_string(log)
		f.close()
		UIManager.show_toast("会话日志已导出到 user://", 2.0, "success")
		var sessions: Array = PlaySessionRecorder.get_last_sessions(3)
		var info2: String = "[b]最近3次会话:[/b]\n"
		for s in sessions:
			info2 += "- [%s] L%d %d事件 %.1fs\n" % [
				s.get("timestamp", "?"),
				s.get("level_id", 0),
				s.get("summary", {}).get("total_events", 0),
				float(s.get("duration_ms", 0)) / 1000.0
			]
		stats_label.text = info2
	else:
		UIManager.show_toast("导出失败!", 1.5, "error")

func _on_clear_save() -> void:
	UIManager.confirm_dialog("清除存档", "将清除所有进度数据！确定吗？", Callable(self, "_do_clear_save"))

func _do_clear_save() -> void:
	SaveManager.reset_all_data()
	UIManager.show_toast("已清除所有存档", 2.0, "success")
