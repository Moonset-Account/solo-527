extends Node
## 事件总线 - 全局事件分发中心
## 用于各系统间解耦通信

signal player_moved(position: Vector2, noise_level: float)
signal player_detected()
signal player_caught()
signal scan_started(target_node: Node)
signal scan_progress(progress: float)
signal scan_completed(target_node: Node)
signal scan_canceled()
signal energy_changed(current: float, max: float)
signal energy_depleted()
signal noise_triggered(position: Vector2, strength: float)
signal shelf_tag_fixed(shelf: Node)
signal shelf_scanned(shelf: Node)
signal checkpoint_reached(checkpoint_id: String)
signal segment_reset()
signal level_started(level_id: String)
signal level_completed(level_id: String)
signal game_paused()
signal game_resumed()
signal tutorial_step_changed(step: int)
signal tutorial_completed()
signal ui_toast(message: String, duration: float)
signal sfx_play(sound: String)
signal music_play(track: String)
signal alert_level_changed(level: int)

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func emit_player_moved(pos: Vector2, noise: float) -> void:
	player_moved.emit(pos, noise)

func emit_player_detected() -> void:
	player_detected.emit()

func emit_player_caught() -> void:
	player_caught.emit()

func emit_scan_started(target: Node) -> void:
	scan_started.emit(target)

func emit_scan_progress(prog: float) -> void:
	scan_progress.emit(prog)

func emit_scan_completed(target: Node) -> void:
	scan_completed.emit(target)

func emit_scan_canceled() -> void:
	scan_canceled.emit()

func emit_energy_changed(current: float, max_energy: float) -> void:
	energy_changed.emit(current, max_energy)

func emit_energy_depleted() -> void:
	energy_depleted.emit()

func emit_noise_triggered(pos: Vector2, strength: float) -> void:
	noise_triggered.emit(pos, strength)

func emit_shelf_tag_fixed(shelf_node: Node) -> void:
	shelf_tag_fixed.emit(shelf_node)

func emit_shelf_scanned(shelf_node: Node) -> void:
	shelf_scanned.emit(shelf_node)

func emit_checkpoint_reached(cp_id: String) -> void:
	checkpoint_reached.emit(cp_id)

func emit_segment_reset() -> void:
	segment_reset.emit()

func emit_level_started(lvl_id: String) -> void:
	level_started.emit(lvl_id)

func emit_level_completed(lvl_id: String) -> void:
	level_completed.emit(lvl_id)

func emit_game_paused() -> void:
	game_paused.emit()

func emit_game_resumed() -> void:
	game_resumed.emit()

func emit_tutorial_step_changed(step_idx: int) -> void:
	tutorial_step_changed.emit(step_idx)

func emit_tutorial_completed() -> void:
	tutorial_completed.emit()

func emit_ui_toast(msg: String, dur: float = 2.0) -> void:
	ui_toast.emit(msg, dur)

func emit_sfx_play(sound: String) -> void:
	sfx_play.emit(sound)

func emit_music_play(track: String) -> void:
	music_play.emit(track)

func emit_alert_level_changed(level: int) -> void:
	alert_level_changed.emit(level)
