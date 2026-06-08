extends Node2D
class_name RealSceneTest

const GuardScript = preload("res://scripts/enemy/patrol_guard.gd")
const GameControllerScript = preload("res://scripts/core/game_controller.gd")

var _gc: Node2D
var _player: CharacterBody2D
var _hud: CanvasLayer
var _level_container: Node2D
var _phase: int = 0
var _timer: float = 0.0
var _passed: int = 0
var _failed: int = 0
var _seg0_shelf_positions: Array = []
var _seg0_guard_pos: Vector2 = Vector2.ZERO

func _ready():
	print("\n============================================================")
	print("  仓库潜行机器人 - 真实 game.tscn 场景试玩验证")
	print("============================================================\n")
	LevelManager.load_level("level_01")
	var game_scene = load("res://scenes/game.tscn")
	_gc = game_scene.instantiate()
	add_child(_gc)
	await get_tree().process_frame
	await get_tree().process_frame
	_player = _gc.get_node_or_null("Player")
	_hud = _gc.get_node_or_null("HUD")
	_level_container = _gc.get_node_or_null("LevelContainer")
	var loaded = _player != null and _hud != null and _level_container != null
	_log(loaded, "Game场景节点加载: Player=%s HUD=%s LC=%s" % [_player != null, _hud != null, _level_container != null])
	if not loaded:
		_print_results()
		get_tree().quit()
		return
	_collect_segment0_objects()
	_phase = 1
	_timer = 0

func _collect_segment0_objects():
	var seg = LevelManager.get_current_segment()
	for shelf_data in seg.get("shelves", []):
		var pos = shelf_data.get("position", {})
		_seg0_shelf_positions.append(Vector2(float(pos.get("x", 0)), float(pos.get("y", 0))))
	var g = seg.get("guards", [])
	if g.size() > 0:
		var pts = g[0].get("patrol_points", [])
		if pts.size() > 0:
			_seg0_guard_pos = Vector2(float(pts[0].get("x", 0)), float(pts[0].get("y", 0)))

func _process(delta):
	_timer += delta
	match _phase:
		1:
			_verify_initial_state()
			_phase = 2
			_timer = 0
		2:
			if _timer >= 0.3:
				_drive_player_near_shelf()
				_phase = 3
				_timer = 0
		3:
			if _timer >= 0.5:
				_drive_scan_shelf()
				_phase = 4
				_timer = 0
		4:
			if _timer >= 1.2:
				_verify_scan_result()
				_drive_fix_label()
				_phase = 5
				_timer = 0
		5:
			if _timer >= 0.5:
				_verify_fix_and_hud()
				_drive_player_near_guard()
				_phase = 6
				_timer = 0
		6:
			if _timer >= 0.5:
				_drive_noise_trigger()
				_phase = 7
				_timer = 0
		7:
			if _timer >= 1.0:
				_verify_guard_alert()
				_drive_to_last_segment_checkpoint()
				_phase = 8
				_timer = 0
		8:
			if _timer >= 2.0:
				_verify_level_complete_and_persistence()
				_phase = 9
				_timer = 0
		9:
			if _timer >= 0.5:
				_print_results()
				get_tree().quit()

func _verify_initial_state():
	print("\n--- [Phase 1] 初始场景状态 ---")
	_log(_player.current_state == 0, "Player 初始状态 IDLE")
	_log(_player.energy == 100.0, "Player 初始能量 100")
	_log(_gc.get("_fixed_count") == 0, "GameController fixed_count=0")
	_log(_gc.get("_total_labels") == 2, "GameController total_labels=2 (段0有2个货架)")
	var lc_children = _level_container.get_children()
	_log(lc_children.size() > 0, "LevelContainer 有子节点 (数量=%d)" % lc_children.size())
	var shelves_found = 0
	var guards_found = 0
	var checkpoints_found = 0
	for child in lc_children:
		if child.has_method("get_shelf_id"):
			shelves_found += 1
		elif child.has_method("alert") and child.has_signal("player_spotted"):
			guards_found += 1
		elif child.has_signal("checkpoint_reached"):
			checkpoints_found += 1
	_log(shelves_found == 2, "动态生成 %d 个货架 (期望2)" % shelves_found)
	_log(guards_found == 1, "动态生成 %d 个守卫 (期望1)" % guards_found)
	_log(checkpoints_found == 1, "动态生成 %d 个检查点 (期望1)" % checkpoints_found)
	var hud_text = ""
	if _hud.label_counter:
		hud_text = _hud.label_counter.text
	_log(hud_text == "Labels: 0/2 fixed", "HUD 初始标签文本: '%s'" % hud_text)

func _drive_player_near_shelf():
	print("\n--- [Phase 2] 驱动玩家靠近货架 ---")
	if _seg0_shelf_positions.size() == 0:
		_log(false, "无货架位置")
		return
	var target_pos = _seg0_shelf_positions[0] + Vector2(0, 30)
	_player.global_position = target_pos
	_log(true, "Player 移动到货架1附近: (%.0f, %.0f)" % [target_pos.x, target_pos.y])

func _drive_scan_shelf():
	print("\n--- [Phase 3] 按 E 扫描货架 ---")
	var e_event = InputEventKey.new()
	e_event.keycode = KEY_E
	e_event.pressed = true
	_player._unhandled_input(e_event)
	_log(true, "发送 E 键按下事件 → _scan_requested=true")

func _verify_scan_result():
	print("\n--- [Phase 4] 验证扫描结果 ---")
	var found_scanned = false
	var found_correct_label = false
	for child in _level_container.get_children():
		if child.has_method("get_shelf_id") and child.get("_scanned") == true:
			found_scanned = true
			if child.correct_label != child.current_label:
				found_correct_label = true
				_log(true, "货架 %s 已扫描: 当前=%s 正确=%s (显示正确标签提示)" % [child.shelf_id, child.current_label, child.correct_label])
	if not found_scanned:
		_log(false, "没有货架被标记为已扫描 (E键扫描未生效)")

func _drive_fix_label():
	print("\n--- [Phase 4b] 按 F 修复标签 ---")
	var f_event = InputEventKey.new()
	f_event.keycode = KEY_F
	f_event.pressed = true
	_player._unhandled_input(f_event)
	_log(true, "发送 F 键按下事件 → _interact_requested=true")

func _verify_fix_and_hud():
	print("\n--- [Phase 5] 验证修复结果 + HUD 更新 ---")
	var fixed_count = 0
	for child in _level_container.get_children():
		if child.has_method("get_shelf_id") and child.get("is_fixed") == true:
			fixed_count += 1
			_log(true, "货架 %s 已修复: label=%s" % [child.shelf_id, child.current_label])
	_log(fixed_count >= 1, "至少1个货架已修复 (实际=%d)" % fixed_count)
	var gc_fixed = _gc.get("_fixed_count")
	_log(gc_fixed == fixed_count, "GameController._fixed_count=%d (期望=%d)" % [gc_fixed, fixed_count])
	var hud_text = ""
	if _hud.label_counter:
		hud_text = _hud.label_counter.text
	_log(hud_text == "Labels: %d/2 fixed" % fixed_count, "HUD 标签文本: '%s' (期望 'Labels: %d/2 fixed')" % [hud_text, fixed_count])

func _drive_player_near_guard():
	print("\n--- [Phase 5b] 移动玩家到守卫附近 ---")
	var target_pos = _seg0_guard_pos + Vector2(20, 0)
	_player.global_position = target_pos
	_log(true, "Player 移动到守卫附近: (%.0f, %.0f)" % [target_pos.x, target_pos.y])

func _drive_noise_trigger():
	print("\n--- [Phase 6] 制造噪音触发守卫警戒 ---")
	_gc._alert_guards_by_noise(60.0, _player.global_position)
	_log(true, "GameController._alert_guards_by_noise 转发噪音 (radius=60)")

func _verify_guard_alert():
	print("\n--- [Phase 7] 验证守卫进入 ALERT ---")
	var guard = null
	for child in _level_container.get_children():
		if child.has_method("alert") and child.has_signal("player_spotted"):
			guard = child
			break
	if guard:
		var state = guard.current_state
		var is_alert_or_chasing = (state == GuardScript.State.ALERT or state == GuardScript.State.CHASING)
		_log(is_alert_or_chasing, "守卫对噪音响应: %s (state=%d)" % ["ALERT" if state == GuardScript.State.ALERT else "CHASING" if state == GuardScript.State.CHASING else "OTHER", state])
		_log(guard.last_known_position.distance_to(_player.global_position) < 100, "守卫记录噪音/玩家位置")
	else:
		_log(false, "找不到守卫节点")
	var alert_text = ""
	if _hud.get("alert_status"):
		alert_text = _hud.alert_status.text
	_log(alert_text == "ALERT!", "HUD 显示: '%s' (期望 'ALERT!')" % alert_text)

func _drive_to_last_segment_checkpoint():
	print("\n--- [Phase 7b] 推进到最后段检查点 ---")
	LevelManager.current_segment_index = 2
	_gc.set("_current_segment_index", 2)
	_gc._spawn_level_objects()
	await get_tree().process_frame
	await get_tree().process_frame
	var seg = LevelManager.get_current_segment()
	var cp_pos = Vector2(3700, 560)
	var cps = seg.get("checkpoints", [])
	if cps.size() > 0:
		cp_pos = Vector2(float(cps[0].get("position", {}).get("x", 3700)), float(cps[0].get("position", {}).get("y", 560)))
	_player.global_position = cp_pos + Vector2(0, -5)
	_log(true, "Player 移动到段2检查点: (%.0f, %.0f)" % [_player.global_position.x, _player.global_position.y])
	await get_tree().process_frame
	await get_tree().process_frame
	_level_container = _gc.get_node_or_null("LevelContainer")
	for child in _level_container.get_children():
		if child.has_signal("checkpoint_reached") and not child.get("_triggered"):
			child._on_body_entered(_player)
			_log(true, "触发检查点 body_entered: %s" % child.checkpoint_id)
			break

func _verify_level_complete_and_persistence():
	print("\n--- [Phase 8] 验证关卡完成 + 数据持久化 ---")
	var completed_flag = _gc.get("_level_completed_flag")
	_log(completed_flag == true, "GameController._level_completed_flag = true")
	var save_data = SaveManager.load_game()
	_log(not save_data.is_empty(), "存档文件存在")
	if not save_data.is_empty():
		_log(save_data.has("failure_count"), "存档包含 failure_count")
		_log(save_data.has("play_time"), "存档包含 play_time")
		_log(save_data.has("fixed_labels"), "存档包含 fixed_labels")
		_log(save_data.get("completed", false) == true, "存档 completed=true")
		print("    存档内容: failure_count=%s, play_time=%.1fs, fixed_labels=%s, completed=%s" % [
			str(save_data.get("failure_count", "MISSING")),
			float(save_data.get("play_time", 0)),
			str(save_data.get("fixed_labels", "MISSING")),
			str(save_data.get("completed", "MISSING"))
		])
	else:
		_log(false, "存档为空")
	var analytics = AnalyticsManager.load_analytics()
	_log(not analytics.is_empty(), "分析数据文件存在")
	if not analytics.is_empty():
		var has_level_complete_choice = false
		for c in analytics.get("key_choices", []):
			if c.get("choice_id") == "level_complete":
				has_level_complete_choice = true
				print("    level_complete: play_time=%s, failure_count=%s" % [
					str(c.get("play_time", "MISSING")),
					str(c.get("failure_count", "MISSING"))
				])
		_log(has_level_complete_choice, "key_choices 包含 level_complete 记录")

func _log(condition: bool, desc: String):
	if condition:
		_passed += 1
		print("  [PASS] %s" % desc)
	else:
		_failed += 1
		print("  [FAIL] %s" % desc)

func _print_results():
	print("\n============================================================")
	print("  真实场景试玩验证完成: %d 通过, %d 失败" % [_passed, _failed])
	print("============================================================\n")
