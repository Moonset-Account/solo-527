extends SceneTree

var _test_pass: int = 0
var _test_fail: int = 0
var _level_manager: Node
var _analytics_manager: Node
var _save_manager: Node

func _init():
	pass

func _iteration(_delta):
	if not _level_manager:
		_level_manager = root.get_node_or_null("LevelManager")
		_analytics_manager = root.get_node_or_null("AnalyticsManager")
		_save_manager = root.get_node_or_null("SaveManager")
		return
	_print_header()
	_test_level_data_integrity()
	_test_segment_advancement()
	_test_analytics_recording()
	_test_save_data()
	_test_guard_alert_logic()
	_test_shelf_logic()
	_print_footer()
	quit()

func _print_header():
	print("\n========================================")
	print("   仓库潜行机器人 - 游戏逻辑验证")
	print("========================================\n")

func _print_footer():
	print("\n========================================")
	print("  验证完成: %d 通过, %d 失败" % [_test_pass, _test_fail])
	print("========================================\n")

func _assert(condition: bool, description: String):
	if condition:
		_test_pass += 1
		print("  [PASS] %s" % description)
	else:
		_test_fail += 1
		print("  [FAIL] %s" % description)

func _test_level_data_integrity():
	print("[1] 关卡数据完整性")
	if not _level_manager:
		_assert(false, "LevelManager 未加载")
		return
	_level_manager.load_level("level_01")
	var data = _level_manager.get_level_data()
	_assert(not data.is_empty(), "level_01 数据加载成功")
	_assert(data.has("id"), "关卡有 id 字段")
	_assert(data.has("segments"), "关卡有 segments 字段")
	var segments = data.get("segments", [])
	_assert(segments.size() == 3, "level_01 有3个段 (实际: %d)" % segments.size())
	for i in segments.size():
		var seg = segments[i]
		var has_shelves = seg.has("shelves") and seg["shelves"].size() > 0
		var has_guards = seg.has("guards") and seg["guards"].size() > 0
		var has_checkpoints = seg.has("checkpoints") and seg["checkpoints"].size() > 0
		var has_walls = seg.has("walls")
		_assert(has_shelves, "段%d 有货架" % i)
		_assert(has_guards, "段%d 有守卫" % i)
		_assert(has_checkpoints, "段%d 有检查点" % i)
		_assert(has_walls, "段%d 有墙壁" % i)
		for shelf in seg.get("shelves", []):
			_assert(shelf.has("id"), "段%d 货架有id" % i)
			_assert(shelf.has("correct_label"), "段%d 货架有correct_label" % i)
			_assert(shelf.has("current_label"), "段%d 货架有current_label" % i)
			_assert(shelf["correct_label"] != shelf["current_label"], "段%d 货架标签不匹配(需要修复)" % i)
		for guard in seg.get("guards", []):
			_assert(guard.has("id"), "段%d 守卫有id" % i)
			_assert(guard.has("patrol_points"), "段%d 守卫有patrol_points" % i)
			_assert(guard["patrol_points"].size() >= 2, "段%d 守卫至少2个巡逻点" % i)
	print("")

func _test_segment_advancement():
	print("[2] 段推进与重置")
	if not _level_manager:
		_assert(false, "LevelManager 不可用")
		return
	_level_manager.load_level("level_01")
	_assert(_level_manager.current_segment_index == 0, "初始段索引=0")
	_level_manager.advance_segment()
	_assert(_level_manager.current_segment_index == 1, "推进后段索引=1")
	_level_manager.advance_segment()
	_assert(_level_manager.current_segment_index == 2, "推进后段索引=2 (最后一段)")
	_level_manager.reset_current_segment()
	_assert(_level_manager.current_segment_index == 2, "重置后段索引不变=2")
	var seg = _level_manager.get_current_segment()
	_assert(not seg.is_empty(), "重置后当前段数据有效")
	print("")

func _test_analytics_recording():
	print("[3] 试玩数据记录")
	if not _analytics_manager:
		_assert(false, "AnalyticsManager 未加载")
		return
	_analytics_manager.start_level_tracking("test_verify")
	_analytics_manager.record_failure("seg_0")
	_analytics_manager.record_failure("seg_0")
	_analytics_manager.record_discovery("seg_1")
	_analytics_manager.record_label_fixed("shelf_a1")
	_analytics_manager.record_label_fixed("shelf_a2")
	_analytics_manager.record_choice("fix_label", {"shelf_id": "shelf_a1"})
	_analytics_manager.record_choice("avoid_guard", {"guard_id": "guard_1"})
	_analytics_manager.end_level_tracking()
	var summary = _analytics_manager.get_session_summary()
	_assert(int(summary.get("total_failures", 0)) >= 2, "失败次数>=2 (实际: %d)" % summary.get("total_failures", 0))
	_assert(int(summary.get("total_discoveries", 0)) >= 1, "发现次数>=1 (实际: %d)" % summary.get("total_discoveries", 0))
	_assert(int(summary.get("total_labels_fixed", 0)) >= 2, "标签修复>=2 (实际: %d)" % summary.get("total_labels_fixed", 0))
	_assert(int(summary.get("total_choices", 0)) >= 2, "关键选择>=2 (实际: %d)" % summary.get("total_choices", 0))
	_assert(summary.has("level_times"), "记录了关卡用时")
	_assert(summary["level_times"].has("test_verify"), "test_verify 有用时记录")
	print("")

func _test_save_data():
	print("[4] 存档数据")
	if not _save_manager:
		_assert(false, "SaveManager 未加载")
		return
	var test_data = {
		"current_level": "level_01",
		"current_segment": 1,
		"fixed_labels": 3,
		"total_labels": 9,
		"play_time": 42.5,
		"failure_count": 2
	}
	_save_manager.save_game(test_data)
	_assert(_save_manager.has_save(), "存档存在")
	var loaded = _save_manager.load_game()
	_assert(loaded["current_level"] == "level_01", "存档关卡=level_01")
	_assert(loaded["current_segment"] == 1, "存档段=1")
	_assert(loaded["fixed_labels"] == 3, "存档修复数=3")
	_assert(loaded["failure_count"] == 2, "存档失败数=2")
	_save_manager.delete_save()
	_assert(not _save_manager.has_save(), "删除存档后不存在")
	print("")

func _test_guard_alert_logic():
	print("[5] 守卫警戒逻辑 (数据层)")
	if not _level_manager:
		_assert(false, "LevelManager 不可用")
		return
	_level_manager.load_level("level_01")
	var seg = _level_manager.get_current_segment()
	var guards = seg.get("guards", [])
	_assert(guards.size() > 0, "段有守卫")
	if guards.size() > 0:
		var g = guards[0]
		_assert(g.has("speed"), "守卫有 speed")
		_assert(g.has("vision_range"), "守卫有 vision_range")
		_assert(g.has("vision_angle"), "守卫有 vision_angle")
		_assert(g.has("patrol_points"), "守卫有 patrol_points")
		var pts = g["patrol_points"]
		_assert(pts.size() >= 2, "守卫至少2个巡逻点")
		for pt in pts:
			_assert(pt.has("x") and pt.has("y"), "巡逻点有坐标")
	var shelves = seg.get("shelves", [])
	_assert(shelves.size() > 0, "段有货架")
	for shelf in shelves:
		_assert(shelf["correct_label"] != shelf["current_label"], "货架有错误标签需要修复")
	print("")

func _test_shelf_logic():
	print("[6] 货架扫描修复逻辑 (纯数据)")
	var shelf_data = {
		"id": "test_shelf",
		"correct_label": "Sci-Fi A-F",
		"current_label": "History 101",
		"is_fixed": false
	}
	_assert(shelf_data["correct_label"] != shelf_data["current_label"], "标签不匹配，需修复")
	_assert(not shelf_data["is_fixed"], "初始未修复")
	shelf_data["is_fixed"] = true
	shelf_data["current_label"] = shelf_data["correct_label"]
	_assert(shelf_data["is_fixed"], "修复后 is_fixed=true")
	_assert(shelf_data["current_label"] == shelf_data["correct_label"], "修复后标签匹配")
	print("")
