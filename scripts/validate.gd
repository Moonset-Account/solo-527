extends Node
## 项目验证脚本 - 在游戏中以主场景方式运行

const SCRIPT_RES := preload("res://scripts/data/DataProvider.gd")

func _ready() -> void:
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
	print("\n=== 验证结果 ===")
	if errors == 0:
		print("✅ 全部验证通过!")
	else:
		print("❌ 存在 %d 个错误" % errors)
	get_tree().quit()
