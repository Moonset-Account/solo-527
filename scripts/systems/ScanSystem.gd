extends Node
## 扫描系统 - 玩家扫描货架，检测错误标签并修复

signal scan_target_locked(target: Node)
signal scan_target_unlocked()

enum ScanState { IDLE, TARGETING, SCANNING, ANALYZING, FIXING, COMPLETE }

var current_state: ScanState = ScanState.IDLE
var current_target: Node = null
var scan_progress: float = 0.0
var fix_progress: float = 0.0

const SCAN_DURATION := 1.5
const ANALYSIS_DURATION := 0.5
const FIX_DURATION := 1.0
const SCAN_RANGE := 150.0
const SCAN_FOV := 60.0

var _player_node: Node2D = null
var _player_direction: Vector2 = Vector2.RIGHT
var _energy_system: Node = null

var nearby_targets: Array = []
var locked_target: Node = null

var scan_line_color: Color = Color(0.2, 1.0, 0.4, 0.8)
var scan_glow_color: Color = Color(0.2, 1.0, 0.4, 0.4)

func _ready() -> void:
	_connect_events()

func _connect_events() -> void:
	EventBus.scan_canceled.connect(_on_scan_canceled)
	EventBus.segment_reset.connect(_on_segment_reset)

func setup(player: Node2D, energy_sys: Node) -> void:
	_player_node = player
	_energy_system = energy_sys

func update_nearby_targets(player_pos: Vector2, player_dir: Vector2, all_shelves: Array) -> void:
	_player_direction = player_dir.normalized() if player_dir.length() > 0.01 else _player_direction
	nearby_targets.clear()
	for shelf in all_shelves:
		if not is_instance_valid(shelf):
			continue
		if shelf.has_method("is_fixed") and shelf.is_fixed():
			continue
		var to_target: Vector2 = shelf.global_position - player_pos
		var dist := to_target.length()
		if dist > SCAN_RANGE:
			continue
		var angle_to_target := _player_direction.angle_to(to_target.normalized())
		if abs(angle_to_target) > deg_to_rad(SCAN_FOV * 0.5):
			continue
		nearby_targets.append({
			"shelf": shelf,
			"distance": dist,
			"angle": angle_to_target,
		})
	nearby_targets.sort_custom(func(a, b): return a["distance"] < b["distance"])
	_auto_select_target()

func _auto_select_target() -> void:
	if current_state == ScanState.SCANNING or current_state == ScanState.ANALYZING or current_state == ScanState.FIXING:
		return
	if nearby_targets.is_empty():
		if locked_target:
			locked_target = null
			scan_target_unlocked.emit()
		return
	var best := nearby_targets[0]
	if best["shelf"] != locked_target:
		locked_target = best["shelf"]
		scan_target_locked.emit(locked_target)

func try_start_scan() -> bool:
	if not locked_target:
		EventBus.emit_ui_toast("没有可扫描的目标", 1.2)
		return false
	if _energy_system and not _energy_system.start_scan():
		return false
	current_state = ScanState.SCANNING
	scan_progress = 0.0
	current_target = locked_target
	EventBus.emit_scan_started(current_target)
	EventBus.emit_sfx_play("scan_start")
	if current_target and current_target.has_method("on_scan_started"):
		current_target.on_scan_started()
	return true

func process_scan(delta: float) -> void:
	match current_state:
		ScanState.SCANNING:
			scan_progress = min(1.0, scan_progress + delta / SCAN_DURATION)
			EventBus.emit_scan_progress(scan_progress)
			if randf() < 0.15:
				EventBus.emit_sfx_play("scan_progress")
			if scan_progress >= 1.0:
				current_state = ScanState.ANALYZING
				fix_progress = 0.0
				EventBus.emit_sfx_play("scan_complete")
				if current_target and current_target.has_method("on_scan_analyzing"):
					current_target.on_scan_analyzing()
		ScanState.ANALYZING:
			fix_progress = min(1.0, fix_progress + delta / ANALYSIS_DURATION)
			EventBus.emit_scan_progress(1.0 + fix_progress * 0.001)
			if fix_progress >= 1.0:
				current_state = ScanState.FIXING
				fix_progress = 0.0
				if current_target and current_target.has_method("on_fix_started"):
					current_target.on_fix_started()
		ScanState.FIXING:
			fix_progress = min(1.0, fix_progress + delta / FIX_DURATION)
			EventBus.emit_scan_progress(1.001 + fix_progress * 0.001)
			if fix_progress >= 1.0:
				_complete_fix()

func cancel_scan() -> void:
	if current_state == ScanState.IDLE:
		return
	if _energy_system:
		_energy_system.stop_scan()
	current_state = ScanState.IDLE
	scan_progress = 0.0
	fix_progress = 0.0
	if current_target and current_target.has_method("on_scan_canceled"):
		current_target.on_scan_canceled()
	current_target = null
	EventBus.emit_scan_canceled()

func _complete_fix() -> void:
	current_state = ScanState.COMPLETE
	if _energy_system:
		_energy_system.stop_scan()
	if current_target:
		if current_target.has_method("fix_tag"):
			current_target.fix_tag()
		EventBus.emit_shelf_tag_fixed(current_target)
		EventBus.emit_scan_completed(current_target)
	EventBus.emit_sfx_play("fix_complete")
	EventBus.emit_ui_toast("标签修复完成！", 2.0)
	await get_tree().create_timer(0.3).timeout
	current_state = ScanState.IDLE
	current_target = null
	scan_progress = 0.0
	fix_progress = 0.0
	nearby_targets.clear()
	locked_target = null
	scan_target_unlocked.emit()

func is_scanning_active() -> bool:
	return current_state == ScanState.SCANNING or current_state == ScanState.ANALYZING or current_state == ScanState.FIXING

func get_scan_percentage() -> float:
	match current_state:
		ScanState.SCANNING:
			return scan_progress * 0.6
		ScanState.ANALYZING:
			return 0.6 + fix_progress * 0.15
		ScanState.FIXING:
			return 0.75 + fix_progress * 0.25
		_:
			return 0.0

func get_scan_phase() -> String:
	match current_state:
		ScanState.IDLE:
			return "待机"
		ScanState.TARGETING:
			return "锁定中"
		ScanState.SCANNING:
			return "扫描中"
		ScanState.ANALYZING:
			return "分析中"
		ScanState.FIXING:
			return "修复中"
		ScanState.COMPLETE:
			return "完成"
		_:
			return ""

func get_scan_range() -> float:
	return SCAN_RANGE

func get_scan_fov_degrees() -> float:
	return SCAN_FOV

func _on_scan_canceled() -> void:
	if _energy_system:
		_energy_system.stop_scan()
	current_state = ScanState.IDLE

func _on_segment_reset() -> void:
	cancel_scan()
