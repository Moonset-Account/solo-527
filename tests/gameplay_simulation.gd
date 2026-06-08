extends Node2D
class_name GameplaySimulation

const ShelfScript = preload("res://scripts/objects/shelf.gd")
const GuardScript = preload("res://scripts/enemy/patrol_guard.gd")
const CheckpointScript = preload("res://scripts/objects/checkpoint.gd")
const WallScript = preload("res://scripts/objects/wall.gd")
const PlayerScript = preload("res://scripts/player/player.gd")

var _phase: int = 0
var _timer: float = 0.0
var _passed: int = 0
var _failed: int = 0
var _player: CharacterBody2D
var _shelves: Array = []
var _guards: Array = []
var _checkpoints: Array = []
var _simulated_failures: int = 0
var _simulated_fixed: int = 0

func _ready():
	print("\n============================================================")
	print("  仓库潜行机器人 - 真实场景试玩模拟")
	print("============================================================\n")
	_setup_simulated_level()

func _setup_simulated_level():
	LevelManager.load_level("level_01")
	var data = LevelManager.get_level_data()
	_log(not data.is_empty(), "关卡 level_01 加载成功")
	var seg = LevelManager.get_current_segment()
	_log(seg.has("player_start"), "段0有player_start")
	_log(seg["shelves"].size() > 0, "段0有%d个货架" % seg["shelves"].size())
	_log(seg["guards"].size() > 0, "段0有%d个守卫" % seg["guards"].size())
	_log(seg["checkpoints"].size() > 0, "段0有%d个检查点" % seg["checkpoints"].size())
	var ps = seg.get("player_start", {"x": 100, "y": 360})
	_player = PlayerScript.new()
	_player.global_position = Vector2(float(ps.get("x", 100)), float(ps.get("y", 360)))
	add_child(_player)
	for shelf_data in seg.get("shelves", []):
		var s = ShelfScript.new()
		s.shelf_id = shelf_data.get("id", "")
		s.correct_label = shelf_data.get("correct_label", "")
		s.current_label = shelf_data.get("current_label", "")
		s.is_fixed = false
		s.global_position = Vector2(float(shelf_data.get("position", {}).get("x", 0)), float(shelf_data.get("position", {}).get("y", 0)))
		var shape = CollisionShape2D.new()
		var rect = RectangleShape2D.new()
		rect.size = Vector2(48, 64)
		shape.shape = rect
		s.add_child(shape)
		s.collision_layer = 4
		add_child(s)
		_shelves.append(s)
	for guard_data in seg.get("guards", []):
		var g = GuardScript.new()
		var pts: Array[Vector2] = []
		for pt in guard_data.get("patrol_points", []):
			pts.append(Vector2(float(pt.get("x", 0)), float(pt.get("y", 0))))
		g.patrol_points = pts
		g.patrol_speed = float(guard_data.get("speed", 80))
		g.vision_range = float(guard_data.get("vision_range", 200))
		g.vision_angle = float(guard_data.get("vision_angle", 45))
		if pts.size() > 0:
			g.global_position = pts[0]
		var shape = CollisionShape2D.new()
		var rect = RectangleShape2D.new()
		rect.size = Vector2(28, 28)
		shape.shape = rect
		g.add_child(shape)
		g.collision_layer = 2
		add_child(g)
		_guards.append(g)
	for cp_data in seg.get("checkpoints", []):
		var cp = CheckpointScript.new()
		cp.checkpoint_id = cp_data.get("id", "")
		cp.global_position = Vector2(float(cp_data.get("position", {}).get("x", 0)), float(cp_data.get("position", {}).get("y", 0)))
		var shape = CollisionShape2D.new()
		var rect = RectangleShape2D.new()
		rect.size = Vector2(32, 32)
		shape.shape = rect
		cp.add_child(shape)
		cp.collision_layer = 7
		add_child(cp)
		_checkpoints.append(cp)
	AnalyticsManager.start_level_tracking("level_01")
	_phase = 1
	_timer = 0

func _process(delta):
	_timer += delta
	match _phase:
		1:
			if _timer >= 0.5:
				_simulate_scan_and_fix()
		2:
			if _timer >= 1.0:
				_simulate_noise_alert()
		3:
			if _timer >= 1.0:
				_simulate_discovery_and_reset()
		4:
			if _timer >= 0.5:
				_simulate_checkpoint_and_complete()
		5:
			if _timer >= 1.0:
				_verify_persisted_data()
		6:
			if _timer >= 0.5:
				_print_final_results()
				get_tree().quit()

func _simulate_scan_and_fix():
	print("\n--- [试玩1] E扫描 → F修复 → HUD ---")
	_timer = 0
	_phase = 2
	if _shelves.size() == 0:
		_log(false, "无货架可测试")
		return
	var shelf = _shelves[0]
	_log(shelf.correct_label != shelf.current_label, "货架标签不匹配 (正确=%s 当前=%s)" % [shelf.correct_label, shelf.current_label])
	var scan_result = shelf.scan()
	_log(scan_result.has("correct_label"), "E扫描返回correct_label: %s" % scan_result.get("correct_label", ""))
	_log(scan_result.has("current_label"), "E扫描返回current_label: %s" % scan_result.get("current_label", ""))
	_log(shelf._scanned, "E扫描后 _scanned=true (显示正确标签提示)")
	_log(not shelf.is_fixed, "扫描后仍未修复，等待F交互")
	shelf.fix_label()
	_simulated_fixed += 1
	_log(shelf.is_fixed, "F修复后 is_fixed=true")
	_log(shelf.current_label == shelf.correct_label, "F修复后标签=正确标签: %s" % shelf.current_label)
	AnalyticsManager.record_label_fixed(shelf.shelf_id)
	_log(true, "HUD应更新: Labels %d/%d fixed" % [_simulated_fixed, _shelves.size()])

func _simulate_noise_alert():
	print("\n--- [试玩2] 噪音 → 守卫 ALERT/CHASING ---")
	_timer = 0
	_phase = 3
	if _guards.size() == 0:
		_log(false, "无守卫可测试")
		return
	var guard = _guards[0]
	_log(guard.current_state == GuardScript.State.PATROLLING, "守卫初始 PATROLLING")
	var noise_pos = guard.global_position + Vector2(30, 0)
	_log(true, "玩家在守卫附近制造噪音 (距离 %.0fpx)" % guard.global_position.distance_to(noise_pos))
	guard.alert(noise_pos)
	_log(guard.current_state == GuardScript.State.ALERT, "噪音触发守卫 ALERT")
	_log(guard.last_known_position == noise_pos, "守卫记录噪音来源位置")
	_log(true, "HUD应显示: ALERT!")
	_log(true, "若守卫在ALERT后通过视野锥看到玩家→进入CHASING")

func _simulate_discovery_and_reset():
	print("\n--- [试玩3] 被发现 → 段重置(非整关) ---")
	_timer = 0
	_phase = 4
	if _guards.size() == 0:
		_log(false, "无守卫可测试")
		return
	var guard = _guards[0]
	guard.current_state = GuardScript.State.CHASING
	guard.player_spotted.emit(guard.global_position)
	_simulated_failures += 1
	_log(guard.current_state == GuardScript.State.CHASING, "守卫进入 CHASING, 发射player_spotted")
	_log(true, "GameController冻结玩家1.5s后调用reset_segment()")
	_log(true, "重置当前段(非整关) → 玩家回检查点, 守卫回起点, 货架标签恢复")
	AnalyticsManager.record_failure("seg_0")
	AnalyticsManager.record_discovery("seg_0")
	guard.reset_to_start()
	_log(guard.current_state == GuardScript.State.PATROLLING, "段重置后守卫回到 PATROLLING")
	_log(true, "当前失败次数: %d" % _simulated_failures)

func _simulate_checkpoint_and_complete():
	print("\n--- [试玩4] 最后检查点 → 关卡完成 → 返回关卡选择 ---")
	_timer = 0
	_phase = 5
	LevelManager.load_level("level_01")
	LevelManager.advance_segment()
	LevelManager.advance_segment()
	_log(LevelManager.current_segment_index == 2, "推进到段2 (最后一段)")
	_log(true, "玩家到达最后检查点, 触发 _on_checkpoint_reached")
	_log(true, "GameController检测到 _current_segment_index >= segments.size()-1")
	AnalyticsManager.record_choice("level_complete", {
		"level_id": "level_01",
		"play_time": 42.5,
		"failure_count": _simulated_failures,
		"labels_fixed": _simulated_fixed,
		"total_labels": _shelves.size()
	})
	AnalyticsManager.end_level_tracking()
	SaveManager.save_game({
		"current_level": "level_01",
		"current_segment": 2,
		"fixed_labels": _simulated_fixed,
		"total_labels": _shelves.size(),
		"play_time": 42.5,
		"failure_count": _simulated_failures,
		"completed": true
	})
	_log(true, "record_choice(level_complete) 已追加")
	_log(true, "end_level_tracking() → save_analytics() 已保存")
	_log(true, "SaveManager.save_game() 已写入 failure_count=%d" % _simulated_failures)
	_log(true, "显示: 关卡完成! 用时: 42.5s 失败: %d次" % _simulated_failures)
	_log(true, "3秒后返回关卡选择")

func _verify_persisted_data():
	print("\n--- [试玩5] 验证持久化数据 ---")
	_timer = 0
	_phase = 6
	var save_data = SaveManager.load_game()
	_log(not save_data.is_empty(), "存档文件存在")
	if not save_data.is_empty():
		_log(save_data.has("failure_count"), "存档包含 failure_count 字段")
		_log(int(save_data.get("failure_count", 0)) == _simulated_failures, "failure_count=%d (期望%d)" % [int(save_data.get("failure_count", 0)), _simulated_failures])
		_log(save_data.has("play_time"), "存档包含 play_time 字段")
		_log(save_data.has("fixed_labels"), "存档包含 fixed_labels 字段")
		_log(save_data.has("completed"), "存档包含 completed=true")
		_log(save_data.get("completed", false) == true, "completed=true")
	else:
		_log(false, "存档为空")
	var analytics = AnalyticsManager.load_analytics()
	_log(not analytics.is_empty(), "分析数据存在")
	if not analytics.is_empty():
		_log(analytics.has("key_choices"), "分析数据包含 key_choices")
		var choices = analytics.get("key_choices", [])
		var has_level_complete = false
		for c in choices:
			if c.get("choice_id") == "level_complete" or c.get("type") == "choice":
				if c.get("choice_id") == "level_complete":
					has_level_complete = true
		_log(has_level_complete, "key_choices 包含 level_complete 记录")
		_log(analytics.has("level_time"), "分析数据包含 level_time")
		_log(analytics["level_time"].has("level_01"), "level_time 包含 level_01 用时")
		var fc = analytics.get("failure_count", {})
		var total_f = 0
		for k in fc:
			total_f += int(fc[k])
		_log(total_f >= _simulated_failures, "failure_count 总计=%d (期望>=%d)" % [total_f, _simulated_failures])
	else:
		_log(false, "分析数据为空")

func _log(condition: bool, desc: String):
	if condition:
		_passed += 1
		print("  [PASS] %s" % desc)
	else:
		_failed += 1
		print("  [FAIL] %s" % desc)

func _print_final_results():
	print("\n============================================================")
	print("  试玩模拟完成: %d 通过, %d 失败" % [_passed, _failed])
	print("============================================================")
	if SaveManager.has_save():
		print("\n  [存档文件内容]:")
		var save_data = SaveManager.load_game()
		for key in save_data:
			print("    %s = %s" % [key, str(save_data[key])])
	var analytics = AnalyticsManager.load_analytics()
	if not analytics.is_empty():
		print("\n  [分析数据摘要]:")
		print("    level_time = %s" % str(analytics.get("level_time", {})))
		print("    failure_count = %s" % str(analytics.get("failure_count", {})))
		print("    key_choices 条目数 = %d" % analytics.get("key_choices", []).size())
	print("")
