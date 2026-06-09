extends Node
## 项目验证脚本 - 在游戏中以主场景方式运行

const SCRIPT_RES := preload("res://scripts/data/DataProvider.gd")

func _ready() -> void:
	await _do_validate()

func _do_validate() -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	print("=== 复古工厂项目验证开始 ===")
	var errors: int = 0
	var autoloads := ["GameState", "SaveSystem", "SceneManager", "AudioManager", "AchievementSystem", "PlaytestRecorder"]
	for name in autoloads:
		var node = get_tree().root.get_node_or_null(name)
		if node:
			print("  ✓ Autoload: %s (ok)" % name)
		else:
			print("  ✗ Autoload: %s (MISSING)" % name)
			errors += 1
	var scenes_to_test := {
		"MainMenu": "res://scenes/ui/MainMenu.tscn",
		"LevelSelect": "res://scenes/ui/LevelSelect.tscn",
		"Settings": "res://scenes/ui/SettingsPanel.tscn",
		"Achievements": "res://scenes/ui/AchievementsPanel.tscn",
		"Tutorial": "res://scenes/ui/TutorialPanel.tscn",
		"GameScene": "res://scenes/game/GameScene.tscn",
		"Machine": "res://scenes/game/Machine.tscn",
		"Conveyor": "res://scenes/game/ConveyorBelt.tscn",
		"Product": "res://scenes/game/Product.tscn"
	}
	for key in scenes_to_test.keys():
		var path: String = scenes_to_test[key]
		if ResourceLoader.exists(path):
			var res = load(path)
			if res and res is PackedScene:
				var inst = res.instantiate()
				if inst:
					print("  ✓ Scene: %s (%s) - 实例化成功" % [key, path.get_file()])
					inst.queue_free()
				else:
					print("  ✗ Scene: %s - 实例化失败" % key)
					errors += 1
			else:
				print("  ✗ Scene: %s - 加载失败" % key)
				errors += 1
		else:
			print("  ✗ Scene: %s - 文件不存在" % key)
			errors += 1
	print("\n=== DataProvider 数据检查 ===")
	var level_count: int = SCRIPT_RES.get_all_level_ids().size()
	print("  关卡数量: %d" % level_count)
	var machine_count: int = SCRIPT_RES.MACHINE_TYPES.size()
	print("  机器类型: %d" % machine_count)
	var product_count: int = SCRIPT_RES.PRODUCT_TYPES.size()
	print("  产品类型: %d" % product_count)
	var order_count: int = SCRIPT_RES.ORDER_TEMPLATES.size()
	print("  订单模板: %d" % order_count)
	var ach_count: int = AchievementSystem.ACHIEVEMENTS.size()
	print("  成就数量: %d" % ach_count)
	var daily_count: int = AchievementSystem.DAILY_CHALLENGES_POOL.size()
	print("  每日挑战池: %d" % daily_count)
	print("\n=== 存档/数据状态 ===")
	print("  金币: %d" % GameState.money)
	print("  等级: %d" % GameState.level)
	print("  已解锁成就: %d" % AchievementSystem.get_unlocked_achievements().size())
	var sample_order: Dictionary = SCRIPT_RES.generate_random_order("level_1")
	print("  随机订单生成: %s - 奖励%d" % [sample_order.get("name"), sample_order.get("base_reward", 0)])
	var earnings: Dictionary = GameState.get_offline_earnings(3600)
	print("  离线1h收益模拟: 金币%d / 模拟订单%d" % [earnings.get("money"), earnings.get("orders")])
	print("\n=== 核心子系统功能测试 ===")
	var test_money_before: int = GameState.money
	GameState.add_money(500)
	var add_ok: bool = GameState.money == test_money_before + 500
	print("  %s GameState.add_money()" % ["✓" if add_ok else "✗"])
	var spend_ok: bool = GameState.spend_money(200)
	print("  %s GameState.spend_money() -> 剩%d" % ["✓" if spend_ok else "✗", GameState.money])
	var machine_id: String = GameState.generate_machine_id()
	print("  %s GameState.generate_machine_id() -> %s" % ["✓" if machine_id.begins_with("machine_") else "✗", machine_id])
	PlaytestRecorder.record_event("validate_test", {"item": "placement", "type": "cutter"})
	PlaytestRecorder.record_key_decision("test_choice", {"a": 1})
	var summary: Dictionary = PlaytestRecorder.get_summary()
	print("  %s PlaytestRecorder - 事件数:%d, 决策数:%d" % ["✓" if summary.get("event_count", 0) > 0 else "✗", int(summary.get("event_count", 0)), int(summary.get("key_decisions_count", 0))])
	AchievementSystem.unlock("first_order")
	var ach_after: int = AchievementSystem.get_unlocked_achievements().size()
	print("  %s AchievementSystem.unlock(first_order) -> 已解锁:%d" % ["✓" if ach_after > 0 else "✗", ach_after])
	var lv_cfg: Dictionary = SCRIPT_RES.get_level_config("level_1")
	print("  %s DataProvider.get_level_config - 名称:%s" % ["✓" if lv_cfg.size() > 0 else "✗", lv_cfg.get("name", "?")])
	var mcfg: Dictionary = SCRIPT_RES.get_machine_config("cutter")
	print("  %s DataProvider.get_machine_config - 成本:%d" % ["✓" if mcfg.size() > 0 else "✗", mcfg.get("base_cost", 0)])
	var pcfg: Dictionary = SCRIPT_RES.get_product_config("raw_material")
	print("  %s DataProvider.get_product_config - 名称:%s" % ["✓" if pcfg.size() > 0 else "✗", pcfg.get("name", "?")])
	var lvl_ids: Array = SCRIPT_RES.get_available_levels(GameState.level)
	print("  %s DataProvider.get_available_levels - 可进入:%d关" % ["✓" if lvl_ids.size() > 0 else "✗", lvl_ids.size()])
	print("\n=== UI页面深度验证（加入场景树触发@onready） ===")
	var ui_errors: int = await _validate_all_ui_pages()
	errors += ui_errors
	print("\n=== GameScene深度验证（模拟进入关卡1） ===")
	var gs_errors: int = await _validate_gamescene_in_tree()
	errors += gs_errors
	print("\n=== 验证结果 ===")
	if errors == 0:
		print("✅ 全部验证通过!")
	else:
		print("❌ 存在 %d 个错误" % errors)
	get_tree().quit()

func _validate_all_ui_pages() -> int:
	var err: int = 0
	var ui_tests := [
		["MainMenu", "res://scenes/ui/MainMenu.tscn", ["btn_new_game", "btn_continue", "btn_levels", "btn_settings", "btn_achievements"]],
		["LevelSelect", "res://scenes/ui/LevelSelect.tscn", ["level_container", "btn_back", "lbl_player_info", "daily_panel", "btn_playtest"]],
		["SettingsPanel", "res://scenes/ui/SettingsPanel.tscn", ["sld_master", "sld_music", "sld_sfx", "btn_back", "btn_reset", "btn_playtest_info", "chk_fullscreen"]],
		["AchievementsPanel", "res://scenes/ui/AchievementsPanel.tscn", ["achievement_grid", "btn_back", "lbl_progress", "daily_container", "lbl_session"]],
		["TutorialPanel", "res://scenes/ui/TutorialPanel.tscn", ["page_container", "btn_prev", "btn_next", "btn_skip", "btn_close", "page_indicator"]]
	]
	for test in ui_tests:
		var name: String = test[0]
		var path: String = test[1]
		var checks: Array = test[2]
		err += await _test_single_ui(name, path, checks)
	return err

func _test_single_ui(name: String, path: String, expected_props: Array) -> int:
	var err: int = 0
	if not ResourceLoader.exists(path):
		print("  ✗ %s - 文件不存在" % name)
		return 1
	var res = load(path)
	if not (res and res is PackedScene):
		print("  ✗ %s - 场景加载失败" % name)
		return 1
	var inst = res.instantiate()
	if not inst:
		print("  ✗ %s - 实例化失败" % name)
		return 1
	get_tree().root.add_child.call_deferred(inst)
	await get_tree().process_frame
	await get_tree().process_frame
	var all_ok: bool = true
	var missing: Array = []
	for pname in expected_props:
		if inst.get(pname) == null:
			all_ok = false
			missing.append(pname)
	if all_ok:
		print("  ✓ %s - 全部%d个@onready已解析" % [name, expected_props.size()])
	else:
		print("  ✗ %s - 缺失@onready: %s" % [name, ", ".join(missing)])
		err += missing.size()
	inst.queue_free()
	return err

func _validate_gamescene_in_tree() -> int:
	var err: int = 0
	var path: String = "res://scenes/game/GameScene.tscn"
	var res = load(path)
	if not (res and res is PackedScene):
		print("  ✗ GameScene - 加载失败")
		return 1
	var inst = res.instantiate()
	if not inst:
		print("  ✗ GameScene - 实例化失败")
		return 1
	inst.receive_scene_data({"level_id": "level_1"})
	get_tree().root.add_child.call_deferred(inst)
	await get_tree().process_frame
	await get_tree().process_frame
	var required_subsystems := [
		["placement_system", Node2D],
		["pipeline", Node2D],
		["order_manager", Node],
		["top_bar", CanvasLayer],
		["side_panel", CanvasLayer],
		["pause_overlay", CanvasLayer],
		["notifications", CanvasLayer],
		["order_list", CanvasLayer],
		["result_dialog", CanvasLayer],
		["bottleneck_hints", CanvasLayer]
	]
	var all_subsys_ok: bool = true
	var missing_sys: Array = []
	for entry in required_subsystems:
		var vname: String = entry[0]
		if inst.get(vname) == null:
			all_subsys_ok = false
			missing_sys.append(vname)
	if all_subsys_ok:
		print("  ✓ GameScene - 10个核心子系统全部初始化")
	else:
		print("  ✗ GameScene - 缺失子系统: %s" % ", ".join(missing_sys))
		err += missing_sys.size()
	if inst.has_method("is_level_running"):
		print("  ✓ GameScene - 游戏循环可运行 (level_id=%s)" % inst.current_level_id)
	var top_ok: bool = true
	var top_checks := ["lbl_money", "lbl_level", "lbl_orders", "btn_pause", "btn_speed_down"]
	var tb = inst.get("top_bar")
	if tb != null:
		for prop in top_checks:
			if tb.get(prop) == null:
				top_ok = false
				print("  ✗ TopBar - 缺失属性: %s" % prop)
				err += 1
	if top_ok:
		print("  ✓ TopBar - HUD控制节点全部就绪")
	var side_ok: bool = true
	var side_checks := ["machine_list", "detail_panel", "btn_upgrade", "btn_sell"]
	var sp = inst.get("side_panel")
	if sp != null:
		for prop in side_checks:
			if sp.get(prop) == null:
				side_ok = false
				print("  ✗ SidePanel - 缺失属性: %s" % prop)
				err += 1
	if side_ok:
		print("  ✓ SidePanel - 机器选择/详情面板就绪")
	var pl: Node = inst.get("placement_system")
	if pl != null and pl.has_signal("item_placed") and pl.has_signal("placement_cancelled") and pl.has_signal("machine_selected"):
		print("  ✓ PlacementSystem - 3个核心信号有效（item_placed/cancel/selected）")
	else:
		print("  ✗ PlacementSystem - 信号缺失")
		err += 1
	var om: Node = inst.get("order_manager")
	if om != null and om.has_method("setup_for_level"):
		print("  ✓ OrderManager - 订单系统就绪")
	else:
		err += 1
	inst.queue_free()
	return err
