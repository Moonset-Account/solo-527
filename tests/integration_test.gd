extends Node2D
class_name IntegrationTest

const ShelfScript = preload("res://scripts/objects/shelf.gd")
const GuardScript = preload("res://scripts/enemy/patrol_guard.gd")
const CheckpointScript = preload("res://scripts/objects/checkpoint.gd")

var _phase: int = 0
var _timer: float = 0.0
var _test_log: Array = []
var _player: CharacterBody2D
var _shelves: Array = []
var _guards: Array = []
var _checkpoints: Array = []
var _passed: int = 0
var _failed: int = 0

func _ready():
	print("\n========================================")
	print("  仓库潜行机器人 - 集成验证")
	print("========================================\n")
	_setup_test_level()

func _setup_test_level():
	LevelManager.load_level("level_01")
	var data = LevelManager.get_level_data()
	_log(not data.is_empty(), "关卡数据加载")
	var seg = LevelManager.get_current_segment()
	_log(seg.has("shelves"), "段包含shelves (数量: %d)" % seg.get("shelves", []).size())
	_log(seg.has("guards"), "段包含guards (数量: %d)" % seg.get("guards", []).size())
	_log(seg.has("checkpoints"), "段包含checkpoints")
	_phase = 1

func _process(delta):
	_timer += delta
	match _phase:
		1:
			_test_shelf_scan_and_fix()
			_phase = 2
			_timer = 0
		2:
			_test_guard_alert()
			_phase = 3
			_timer = 0
		3:
			_test_checkpoint_completion()
			_phase = 4
			_timer = 0
		4:
			_test_analytics()
			_print_results()
			get_tree().quit()

func _test_shelf_scan_and_fix():
	print("[1] 货架扫描→修复闭环")
	var seg = LevelManager.get_current_segment()
	var shelves_data = seg.get("shelves", [])
	if shelves_data.size() == 0:
		_log(false, "没有货架可测试")
		return
	var shelf = ShelfScript.new()
	var sd = shelves_data[0]
	shelf.shelf_id = sd.get("id", "test")
	shelf.correct_label = sd.get("correct_label", "")
	shelf.current_label = sd.get("current_label", "")
	shelf.is_fixed = false
	_log(shelf.correct_label != shelf.current_label, "货架标签不匹配 (正确: %s, 当前: %s)" % [shelf.correct_label, shelf.current_label])
	var scan_result = shelf.scan()
	_log(scan_result.has("shelf_id"), "扫描返回shelf_id")
	_log(scan_result.has("correct_label"), "扫描返回correct_label")
	_log(shelf._scanned, "扫描后 _scanned=true")
	shelf.fix_label()
	_log(shelf.is_fixed, "修复后 is_fixed=true")
	_log(shelf.current_label == shelf.correct_label, "修复后标签=正确标签")
	shelf.free()

func _test_guard_alert():
	print("[2] 噪音→守卫警戒闭环")
	var seg = LevelManager.get_current_segment()
	var guards_data = seg.get("guards", [])
	if guards_data.size() == 0:
		_log(false, "没有守卫可测试")
		return
	var guard = GuardScript.new()
	var gd_data = guards_data[0]
	guard.patrol_speed = float(gd_data.get("speed", 80))
	guard.vision_range = float(gd_data.get("vision_range", 200))
	guard.vision_angle = float(gd_data.get("vision_angle", 45))
	var pts: Array[Vector2] = []
	for pt in gd_data.get("patrol_points", []):
		pts.append(Vector2(float(pt.get("x", 0)), float(pt.get("y", 0))))
	guard.patrol_points = pts
	_log(guard.current_state == GuardScript.State.PATROLLING, "守卫初始 PATROLLING")
	var noise_pos = Vector2(200, 200)
	guard.alert(noise_pos)
	_log(guard.current_state == GuardScript.State.ALERT, "噪音触发 ALERT")
	_log(guard.last_known_position == noise_pos, "记录噪音位置")
	guard.reset_to_start()
	_log(guard.current_state == GuardScript.State.PATROLLING, "重置后 PATROLLING")
	guard.free()

func _test_checkpoint_completion():
	print("[3] 检查点→关卡完成闭环")
	LevelManager.load_level("level_01")
	var data = LevelManager.get_level_data()
	var segments = data.get("segments", [])
	_log(LevelManager.current_segment_index == 0, "初始段=0")
	LevelManager.advance_segment()
	_log(LevelManager.current_segment_index == 1, "推进到段1")
	LevelManager.advance_segment()
	_log(LevelManager.current_segment_index == 2, "推进到段2 (最后一段)")
	var cp = CheckpointScript.new()
	cp.checkpoint_id = "test_cp"
	_log(not cp.is_active, "检查点初始未激活")
	cp.activate()
	_log(cp.is_active, "检查点激活")
	cp.free()

func _test_analytics():
	print("[4] 试玩数据记录")
	AnalyticsManager.start_level_tracking("integration_test")
	AnalyticsManager.record_failure("seg_0")
	AnalyticsManager.record_discovery("seg_0")
	AnalyticsManager.record_label_fixed("shelf_test")
	AnalyticsManager.record_choice("fix_label", {"shelf_id": "shelf_test"})
	AnalyticsManager.end_level_tracking()
	var summary = AnalyticsManager.get_session_summary()
	_log(int(summary.get("total_failures", 0)) > 0, "记录失败次数")
	_log(int(summary.get("total_discoveries", 0)) > 0, "记录发现次数")
	_log(int(summary.get("total_labels_fixed", 0)) > 0, "记录标签修复")
	_log(int(summary.get("total_choices", 0)) > 0, "记录关键选择")
	_log(summary.has("level_times"), "记录关卡用时")

func _log(condition: bool, desc: String):
	if condition:
		_passed += 1
		print("  [PASS] %s" % desc)
	else:
		_failed += 1
		print("  [FAIL] %s" % desc)

func _print_results():
	print("\n========================================")
	print("  验证完成: %d 通过, %d 失败" % [_passed, _failed])
	print("========================================\n")
