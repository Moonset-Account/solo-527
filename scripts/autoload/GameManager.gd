extends Node
## 游戏管理器 - 全局状态管理与流程控制

enum GameState { MENU, TUTORIAL, PLAYING, PAUSED, SEGMENT_FAIL, LEVEL_COMPLETE, SETTINGS }

var current_state: GameState = GameState.MENU
var current_level_id: String = "level_01"
var current_checkpoint_id: String = "cp_start"
var alert_level: int = 0
var max_alert_level: int = 3
var fixed_shelves: int = 0
var total_shelves: int = 0
var current_segment_index: int = 0
var tutorial_completed: bool = false
var tutorial_step: int = 0
var caught_count: int = 0

const LEVEL_SCENE_MAP := {
	"tutorial": "res://scenes/levels/TutorialLevel.tscn",
	"level_01": "res://scenes/levels/Level_01.tscn",
}

var _pending_segment_reset: bool = false
var _level_scene_path: String = ""

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_connect_events()

func _connect_events() -> void:
	EventBus.player_caught.connect(_on_player_caught)
	EventBus.checkpoint_reached.connect(_on_checkpoint_reached)
	EventBus.shelf_tag_fixed.connect(_on_shelf_fixed)
	EventBus.game_paused.connect(_on_game_paused)
	EventBus.game_resumed.connect(_on_game_resumed)
	EventBus.level_started.connect(_on_level_started)
	EventBus.segment_reset.connect(_on_segment_reset)

func start_game() -> void:
	SaveManager.load_settings()
	SaveManager.load_save()
	tutorial_completed = SaveManager.get_save_data("tutorial_completed", false)
	load_level(current_level_id)

func start_tutorial() -> void:
	current_state = GameState.TUTORIAL
	tutorial_step = 0
	_level_scene_path = "res://scenes/levels/TutorialLevel.tscn"
	get_tree().change_scene_to_file(_level_scene_path)
	EventBus.emit_tutorial_step_changed(0)
	EventBus.emit_music_play("tutorial")

func advance_tutorial_step() -> void:
	tutorial_step += 1
	match tutorial_step:
		1:
			EventBus.emit_tutorial_step_changed(1)
		2:
			EventBus.emit_tutorial_step_changed(2)
		3:
			EventBus.emit_tutorial_step_changed(3)
		4:
			EventBus.emit_tutorial_step_changed(4)
		_:
			complete_tutorial()

func complete_tutorial() -> void:
	tutorial_completed = true
	SaveManager.set_save_data("tutorial_completed", true)
	SaveManager.save_all()
	EventBus.emit_tutorial_completed()
	EventBus.emit_ui_toast("教程完成！开始正式任务", 3.0)
	await get_tree().create_timer(1.5).timeout
	load_level(current_level_id)

func load_level(level_id: String) -> void:
	current_level_id = level_id
	current_checkpoint_id = "cp_start"
	current_segment_index = 0
	alert_level = 0
	fixed_shelves = 0
	caught_count = 0
	current_state = GameState.PLAYING
	if LEVEL_SCENE_MAP.has(level_id):
		_level_scene_path = LEVEL_SCENE_MAP[level_id]
	else:
		_level_scene_path = "res://scenes/levels/Level_01.tscn"
	get_tree().change_scene_to_file(_level_scene_path)
	EventBus.emit_level_started(level_id)
	EventBus.emit_music_play("level_" + level_id)

func pause_game() -> void:
	if current_state != GameState.PLAYING and current_state != GameState.SEGMENT_FAIL:
		return
	var prev_state = current_state
	current_state = GameState.PAUSED
	get_tree().paused = true
	EventBus.emit_game_paused()

func resume_game() -> void:
	if current_state != GameState.PAUSED:
		return
	current_state = GameState.PLAYING
	get_tree().paused = false
	EventBus.emit_game_resumed()

func open_settings_from_menu() -> void:
	current_state = GameState.SETTINGS

func return_to_menu() -> void:
	current_state = GameState.MENU
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/MainMenu.tscn")

func request_segment_reset() -> void:
	_pending_segment_reset = true
	alert_level = 0
	EventBus.emit_segment_reset()

func is_playing() -> bool:
	return current_state == GameState.PLAYING

func set_total_shelves(count: int) -> void:
	total_shelves = count

func _on_player_caught() -> void:
	caught_count += 1
	alert_level = max_alert_level
	current_state = GameState.SEGMENT_FAIL
	EventBus.emit_sfx_play("caught")
	get_tree().paused = true
	await get_tree().create_timer(1.5).timeout
	get_tree().paused = false
	request_segment_reset()

func _on_checkpoint_reached(cp_id: String) -> void:
	if cp_id == current_checkpoint_id:
		return
	current_checkpoint_id = cp_id
	var parts = cp_id.split("_")
	if parts.size() >= 2:
		current_segment_index = int(parts[-1]) if parts[-1].is_valid_int() else current_segment_index
	SaveManager.set_save_data("last_checkpoint", cp_id)
	SaveManager.save_all()
	EventBus.emit_sfx_play("checkpoint")
	EventBus.emit_ui_toast("存档点已激活：段 %d" % current_segment_index, 2.5)

func _on_shelf_fixed(_shelf: Node) -> void:
	fixed_shelves += 1
	alert_level = max(0, alert_level - 1)
	EventBus.emit_alert_level_changed(alert_level)
	EventBus.emit_sfx_play("fix_complete")
	if total_shelves > 0 and fixed_shelves >= total_shelves:
		complete_level()

func _on_game_paused() -> void:
	pass

func _on_game_resumed() -> void:
	pass

func _on_level_started(_lvl_id: String) -> void:
	pass

func _on_segment_reset() -> void:
	current_state = GameState.PLAYING
	_pending_segment_reset = false

func complete_level() -> void:
	current_state = GameState.LEVEL_COMPLETE
	SaveManager.set_save_data("level_completed_%s" % current_level_id, true)
	SaveManager.save_all()
	EventBus.emit_level_completed(current_level_id)
	EventBus.emit_music_play("victory")
	EventBus.emit_ui_toast("关卡完成！修复了 %d 个货架标签" % fixed_shelves, 5.0)
	await get_tree().create_timer(3.0).timeout
	return_to_menu()
