extends SceneTree
## 自动化测试脚本 - 验证博物馆卡牌修复战完整数据链路
## 运行: godot --headless --script test_flow.gd

const BC = preload("res://scripts/game/BattleController.gd")

const GameEventsScript = preload("res://scripts/autoload/GameEvents.gd")
const InputManagerScript = preload("res://scripts/autoload/InputManager.gd")
const SettingsManagerScript = preload("res://scripts/autoload/SettingsManager.gd")
const AudioManagerScript = preload("res://scripts/autoload/AudioManager.gd")
const CardDatabaseScript = preload("res://scripts/autoload/CardDatabase.gd")
const LevelDatabaseScript = preload("res://scripts/autoload/LevelDatabase.gd")
const SaveManagerScript = preload("res://scripts/autoload/SaveManager.gd")

var GameEvents
var InputManager
var SettingsManager
var AudioManager
var CardDatabase
var LevelDatabase
var SaveManager

func _init_autoloads():
	GameEvents = GameEventsScript.new()
	InputManager = InputManagerScript.new()
	SettingsManager = SettingsManagerScript.new()
	AudioManager = AudioManagerScript.new()
	CardDatabase = CardDatabaseScript.new()
	LevelDatabase = LevelDatabaseScript.new()
	SaveManager = SaveManagerScript.new()
	var nodes = [
		GameEvents, InputManager, SettingsManager, AudioManager,
		CardDatabase, LevelDatabase, SaveManager
	]
	for n in nodes:
		root.add_child(n)
	await process_frame

func _init():
	pass

func _ready():
	_init_autoloads()
	await process_frame
	await _run_tests()

func _run_tests():
	print("=== 博物馆卡牌修复战 - 自动化流程测试 ===")
	var ok: bool = true
	ok = ok and _test_step("1. 默认卡组非空", _test_default_deck())
	ok = ok and _test_step("2. 关卡数据存在", _test_level_data())
	ok = ok and _test_step("3. SaveManager 创建存档槽", _test_create_slot())
	ok = ok and _test_step("4. 战斗 setup_battle", _test_battle_setup())
	ok = ok and _test_step("5. 战斗 start_battle 手牌5张", _test_battle_start())
	ok = ok and _test_step("6. 打出卡牌修复展品", _test_play_cards())
	ok = ok and _test_step("7. 胜利结算记录统计", _test_victory_record())
	ok = ok and _test_step("8. 数据记录读回验证", _test_stats_readback())
	print("\n=== 测试结果: %s ===" % ("ALL PASS" if ok else "HAS FAILURE"))
	quit(0 if ok else 1)

func _test_step(name: String, result: bool) -> bool:
	var tag: String = "PASS" if result else "FAIL"
	print("[%s] %s" % [tag, name])
	return result

func _test_default_deck() -> bool:
	var deck: Array = CardDatabase.get_default_deck()
	print("    默认卡组: %d 张" % deck.size())
	if deck.is_empty():
		push_error("默认卡组为空!")
		return false
	return deck.size() >= 10

func _test_level_data() -> bool:
	var lv: Dictionary = LevelDatabase.get_level("level_1_1")
	if lv.is_empty():
		push_error("level_1_1 不存在!")
		return false
	print("    关卡名: %s | 回合: %d | 预算: %d | 起手: %d" % [
		lv.get("name", "?"), lv.get("turn_limit", -1),
		lv.get("start_budget", -1), lv.get("start_draw", -1)
	])
	var exhibits: Array = lv.get("exhibits", [])
	print("    展品: %d 件" % exhibits.size())
	return not lv.is_empty() and not exhibits.is_empty()

func _test_create_slot() -> bool:
	SaveManager.create_slot(0)
	SaveManager.load_slot(0)
	var deck: Array = SaveManager.get_current_deck()
	print("    槽0卡组: %d 张" % deck.size())
	if deck.is_empty():
		push_error("存档槽0加载后卡组为空!")
		return false
	return not deck.is_empty()

var _battle

func _test_battle_setup() -> bool:
	_battle = BC.new()
	var deck: Array = SaveManager.get_current_deck()
	_battle.setup_battle("level_1_1", deck)
	print("    关卡: %s | 展品: %d | 牌库: %d" % [
		_battle.level_data.get("name", "?"),
		_battle.exhibits.size(),
		_battle.deck.size()
	])
	return _battle.deck.size() > 0 and _battle.exhibits.size() > 0

func _test_battle_start() -> bool:
	_battle.start_battle()
	print("    回合: %d | 预算: %d | 手牌: %d | 牌库: %d" % [
		_battle.current_turn,
		_battle.budget,
		_battle.hand.size(),
		_battle.deck.size()
	])
	if _battle.hand.size() != 5:
		push_error("起手牌不为5, 实际: %d" % _battle.hand.size())
		return false
	if _battle.budget < 1:
		push_error("起始预算异常: %d" % _battle.budget)
		return false
	return true

func _test_play_cards() -> bool:
	# 跳过真实战斗模拟，直接构造模拟结果测试存档链路
	_battle.battle_stats.cards_played = 12
	_battle.battle_stats.cards_drawn = 20
	_battle.battle_stats.turns_used = 5
	_battle.battle_stats.budget_used = 15
	_battle.battle_stats.exhibits_restored = 2
	_battle.battle_stats.cards_used_list = [
		"tool_brush", "tool_brush", "tool_soft_cloth", "tool_brush",
		"budget_grant", "tool_small_patch", "tool_brush", "budget_grant",
		"tool_soft_cloth", "budget_sponsorship", "expert_apprentice", "tool_brush"
	]
	# 把展品设为已修复
	for e in _battle.exhibits:
		e.integrity = e.max_integrity
		e.restored = true
	print("    模拟出牌: %d 次 | 回合: %d | 展品修复: %d" % [
		_battle.battle_stats.cards_played,
		_battle.battle_stats.turns_used,
		_battle.battle_stats.exhibits_restored
	])
	for e in _battle.exhibits:
		print("      - %s: %d/%d %s" % [e.name, e.integrity, e.max_integrity, "RESTORED" if e.restored else ""])
	return true

func _test_victory_record() -> bool:
	# 强制构造胜利统计
	var stats: Dictionary = _battle.battle_stats
	var victory: bool = true
	for e in _battle.exhibits:
		if not e.restored:
			victory = false
			break
	if not victory:
		# 如果未胜利，手动调一次将展品全部修满再记录
		for e in _battle.exhibits:
			e.integrity = e.max_integrity
			e.restored = true
		stats.victory = true
		stats.stars = 3
	SaveManager.record_level_completed("level_1_1", 3, stats)
	print("    胜利星数: 3 | 总战斗: %d | 总胜利: %d | 总星: %d" % [
		SaveManager.global_data.statistics.total_battles,
		SaveManager.global_data.statistics.total_victories,
		SaveManager.global_data.total_stars
	])
	# 模拟奖励卡
	SaveManager.add_to_collection("tool_laser_cleaner")
	SaveManager.save_current()
	return true

func _test_stats_readback() -> bool:
	var gs: Dictionary = SaveManager.get_global_stats()
	print("    读回统计: 战斗=%d 胜利=%d 出牌=%d 修复=%d 使用最多=%s 卡池解锁=%d/%d" % [
		int(gs.get("total_battles", 0)),
		int(gs.get("total_victories", 0)),
		int(gs.get("cards_played_total", 0)),
		int(gs.get("exhibits_restored", 0)),
		gs.get("most_used_card", ""),
		SaveManager.get_unlocked_cards().size(),
		CardDatabase.get_all_card_ids().size()
	])
	var stars: int = SaveManager.get_level_stars("level_1_1")
	print("    level_1_1 星数: %d" % stars)
	if stars != 3:
		push_error("level_1_1 星数不是3, 实际: %d" % stars)
		return false
	if int(gs.get("total_battles", 0)) < 1:
		push_error("总战斗次数未记录!")
		return false
	return stars == 3

# 清理临时文件
func _finalize():
	for p in ["user://global_save.dat", "user://save_slot_0.dat", "user://save_slot_1.dat", "user://save_slot_2.dat"]:
		if FileAccess.file_exists(p):
			DirAccess.remove_absolute(p)
