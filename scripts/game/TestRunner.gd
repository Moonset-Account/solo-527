extends Node

class TestResult:
    var test_name: String = ""
    var passed: bool = false
    var message: String = ""
    var duration_ms: int = 0
    
    func _init(name: String) -> void:
        test_name = name

var results: Array = []
var test_start_time: int = 0
var current_test: TestResult = null

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result

func _ready() -> void:
    print("\n" + _repeat_str("=", 60))
    print("🏪 小镇集市经营模拟 - 验收测试")
    print(_repeat_str("=", 60))
    name = "TestRunner"
    
func run_all_tests() -> void:
    print("\n[开始执行测试套件]\n")
    test_start_time = Time.get_ticks_msec()
    
    results.clear()
    
    _test_input_mapper()
    _test_save_manager()
    _test_inventory_system()
    _test_money_system()
    _test_settlement_system()
    _test_customer_preferences()
    _test_level_config()
    _test_stall_upgrade()
    _test_scene_manager()
    _test_audio_manager()
    
    var total_time = Time.get_ticks_msec() - test_start_time
    _print_summary(total_time)

func _start_test(name: String) -> void:
    current_test = TestResult.new(name)
    print("[测试] %s..." % name)

func _end_test(passed: bool, message: String = "") -> void:
    if current_test == null:
        return
    current_test.passed = passed
    current_test.message = message
    current_test.duration_ms = Time.get_ticks_msec() - test_start_time
    results.append(current_test)
    
    if passed:
        print("  ✅ 通过%s" % (" - " + message if not message.is_empty() else ""))
    else:
        print("  ❌ 失败 - %s" % message)

func _test_input_mapper() -> void:
    _start_test("输入映射系统")
    
    try:
        var hint = InputMapper.get_action_hint("ui_accept")
        if hint.is_empty():
            _end_test(false, "输入提示返回空")
            return
        
        var all_hints = InputMapper.get_all_action_hints()
        if all_hints.size() < 5:
            _end_test(false, "输入提示数量不足")
            return
        
        var mode_name = InputMapper.get_input_mode_name()
        if mode_name.is_empty():
            _end_test(false, "输入模式名称为空")
            return
        
        InputMapper.set_input_mode(InputMapper.InputMode.GAMEPAD)
        if InputMapper.current_mode != InputMapper.InputMode.GAMEPAD:
            _end_test(false, "输入模式切换失败")
            return
        
        InputMapper.set_input_mode(InputMapper.InputMode.KEYBOARD_MOUSE)
        
        _end_test(true, "支持%d种操作提示" % all_hints.size())
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_save_manager() -> void:
    _start_test("存档系统")
    
    try:
        var original_progress = SaveManager.level_progress.duplicate(true)
        var original_money = SaveManager.total_money_earned
        
        SaveManager.save_level_progress("test_level", 2, 1500)
        var progress = SaveManager.get_level_progress("test_level")
        
        if progress.get("best_stars", 0) != 2:
            _end_test(false, "星级保存失败")
            return
        
        if progress.get("best_money", 0) != 1500:
            _end_test(false, "金额保存失败")
            return
        
        if not progress.get("completed", false):
            _end_test(false, "完成状态未设置")
            return
        
        var exported = SaveManager.export_save()
        if exported.is_empty():
            _end_test(false, "存档导出失败")
            return
        
        SaveManager.reset_progress()
        if SaveManager.total_money_earned != 0:
            _end_test(false, "进度重置失败")
            return
        
        var import_result = SaveManager.import_save({
            "level_progress": {"test_level": {"best_stars": 3, "best_money": 2000, "completed": true}},
            "total_money_earned": 5000,
            "games_played": 10,
            "settings": {}
        })
        
        if not import_result:
            _end_test(false, "存档导入失败")
            return
        
        var imported_progress = SaveManager.get_level_progress("test_level")
        if imported_progress.get("best_stars", 0) != 3:
            _end_test(false, "导入后星级不正确")
            return
        
        SaveManager.level_progress = original_progress
        SaveManager.total_money_earned = original_money
        SaveManager.save_progress()
        
        var settings_key = "test_setting"
        SaveManager.settings[settings_key] = "test_value"
        SaveManager.save_settings()
        SaveManager.load_settings()
        if SaveManager.settings.get(settings_key, "") != "test_value":
            _end_test(false, "设置保存/加载失败")
            return
        SaveManager.settings.erase(settings_key)
        
        _end_test(true, "保存/读取/导出/导入/重置均正常")
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_inventory_system() -> void:
    _start_test("库存系统")
    
    try:
        var original_inventory = GameManager.inventory.duplicate(true)
        
        GameManager.inventory.clear()
        
        GameManager.add_item("apple", 5)
        if GameManager.inventory.get("apple", 0) != 5:
            _end_test(false, "添加物品失败")
            return
        
        GameManager.add_item("apple", 3)
        if GameManager.inventory.get("apple", 0) != 8:
            _end_test(false, "累加物品失败")
            return
        
        var result = GameManager.remove_item("apple", 2)
        if not result:
            _end_test(false, "移除物品返回错误")
            return
        if GameManager.inventory.get("apple", 0) != 6:
            _end_test(false, "移除物品数量不正确")
            return
        
        var remove_fail = GameManager.remove_item("apple", 100)
        if remove_fail:
            _end_test(false, "超量移除未返回错误")
            return
        
        GameManager.add_item("nonexistent_test", 1)
        GameManager.remove_item("nonexistent_test", 1)
        if "nonexistent_test" in GameManager.inventory:
            _end_test(false, "物品数量为0时未清除")
            return
        
        GameManager.inventory = original_inventory
        
        _end_test(true, "增删查均正常")
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_money_system() -> void:
    _start_test("金币系统")
    
    try:
        var original_money = GameManager.money
        var original_earned = GameManager.total_earned
        
        GameManager.money = 100
        GameManager.total_earned = 0
        
        var result_add = GameManager.change_money(50)
        if not result_add:
            _end_test(false, "增加金币返回错误")
            return
        if GameManager.money != 150:
            _end_test(false, "增加金币后金额不正确: %d" % GameManager.money)
            return
        if GameManager.total_earned != 50:
            _end_test(false, "累计收入未更新")
            return
        
        var result_sub = GameManager.change_money(-30)
        if not result_sub:
            _end_test(false, "减少金币返回错误")
            return
        if GameManager.money != 120:
            _end_test(false, "减少金币后金额不正确")
            return
        
        var result_over = GameManager.change_money(-10000)
        if result_over:
            _end_test(false, "超支扣除未返回错误")
            return
        if GameManager.money != 120:
            _end_test(false, "超支扣除后金额被修改")
            return
        
        GameManager.money = original_money
        GameManager.total_earned = original_earned
        
        _end_test(true, "加减扣除、超支保护、累计统计正常")
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_settlement_system() -> void:
    _start_test("结算系统")
    
    try:
        var original_day = GameManager.current_day
        var original_phase = GameManager.current_phase
        var original_state = GameManager.current_state
        var original_money = GameManager.money
        var original_inventory = GameManager.inventory.duplicate(true)
        var original_report = GameManager.daily_report.duplicate(true)
        
        GameManager.current_day = 1
        GameManager.max_days = 3
        GameManager.money = 500
        GameManager.inventory.clear()
        GameManager.current_level_id = "level_1"
        
        GameManager.start_day()
        if GameManager.current_phase != GameManager.Phase.PURCHASE:
            _end_test(false, "每日开始未进入采购阶段")
            return
        if GameManager.daily_report.get("start_money", -1) != 500:
            _end_test(false, "起始资金未记录: %d" % GameManager.daily_report.get("start_money", -1))
            return
        
        GameManager.current_level_id = "level_1"
        GameManager.purchase_item("apple", 5)
        GameManager.item_prices["apple"] = 25
        GameManager.display_items = ["apple"]
        GameManager.sell_item("apple")
        GameManager.sell_item("apple")
        
        if GameManager.daily_report.get("customers_served", 0) != 2:
            _end_test(false, "服务顾客数未记录")
            return
        
        if GameManager.daily_report.get("sales_revenue", 0) != 50:
            _end_test(false, "销售收入未记录: %d" % GameManager.daily_report.get("sales_revenue", 0))
            return
        
        var purchase_cost = ItemsDB.get_cost_price("apple") * 5
        if GameManager.daily_report.get("purchase_cost", 0) != purchase_cost:
            _end_test(false, "采购成本未记录: %d vs %d" % [GameManager.daily_report.get("purchase_cost", 0), purchase_cost])
            return
        
        GameManager.next_phase()
        if GameManager.current_phase != GameManager.Phase.SELL:
            _end_test(false, "未切换到销售阶段: %d" % GameManager.current_phase)
            return
        
        GameManager.next_phase()
        if GameManager.current_phase != GameManager.Phase.SETTLEMENT:
            _end_test(false, "未切换到结算阶段")
            return
        if GameManager.current_state != GameManager.GameState.SETTLEMENT:
            _end_test(false, "游戏状态未切换到结算")
            return
        
        var expected_profit = 50 - purchase_cost
        if GameManager.daily_report.get("profit", -9999) != expected_profit:
            _end_test(false, "利润计算错误: %d vs %d" % [GameManager.daily_report.get("profit", -9999), expected_profit])
            return
        
        var items_sold = GameManager.daily_report.get("items_sold", {})
        if items_sold.get("apple", 0) != 2:
            _end_test(false, "售出明细未记录")
            return
        
        GameManager.current_day = original_day
        GameManager.current_phase = original_phase
        GameManager.current_state = original_state
        GameManager.money = original_money
        GameManager.inventory = original_inventory
        GameManager.daily_report = original_report
        
        _end_test(true, "阶段切换、数据记录、利润计算均正常")
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_customer_preferences() -> void:
    _start_test("顾客偏好系统")
    
    try:
        var cs = CustomerSystem.new()
        cs.setup_for_level("level_1")
        
        var prefs = LevelConfig.get_customer_preferences("level_1")
        if prefs.is_empty():
            _end_test(false, "关卡偏好数据为空")
            return
        
        var customers = cs.generate_customers("level_1", 1)
        if customers.size() == 0:
            _end_test(false, "未生成顾客")
            return
        
        var first_customer = customers[0]
        if first_customer.name.is_empty():
            _end_test(false, "顾客未命名")
            return
        if first_customer.desired_items.size() == 0:
            _end_test(false, "顾客无购买意愿")
            return
        if first_customer.budget <= 0:
            _end_test(false, "顾客预算无效: %d" % first_customer.budget)
            return
        
        var buy_prob = first_customer.will_buy("apple", 1000)
        if buy_prob > 0.5:
            _end_test(false, "超高价格购买概率过高: %f" % buy_prob)
            return
        
        var trending = cs.get_trending_items()
        if trending.size() == 0:
            _end_test(false, "热门商品分析为空")
            return
        
        var customers2 = cs.generate_customers("level_4", 5)
        if customers2.size() <= customers.size():
            _end_test(false, "高关卡/天数顾客数未增加")
            return
        
        _end_test(true, "生成顾客%d人、预算/偏好/概率计算正常" % customers.size())
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_level_config() -> void:
    _start_test("关卡配置系统")
    
    try:
        var levels = LevelConfig.get_all_levels()
        if levels.size() < 2:
            _end_test(false, "关卡数量不足: %d" % levels.size())
            return
        
        var level1 = LevelConfig.get_level("level_1")
        if level1.is_empty():
            _end_test(false, "关卡1数据不存在")
            return
        
        if level1.get("days", 0) <= 0:
            _end_test(false, "关卡天数无效")
            return
        
        var items = LevelConfig.get_available_items("level_1")
        if items.size() == 0:
            _end_test(false, "关卡可用商品为空")
            return
        
        var price_range = LevelConfig.get_item_price_range("apple")
        if price_range.size() != 2 or price_range[0] >= price_range[1]:
            _end_test(false, "商品价格范围无效")
            return
        
        var rec_price = LevelConfig.get_recommended_price("apple")
        if rec_price <= 0:
            _end_test(false, "推荐价格无效")
            return
        
        var customer_count = LevelConfig.get_customer_count("level_1", 3)
        if customer_count <= 0:
            _end_test(false, "顾客数计算错误")
            return
        
        var level4 = LevelConfig.get_level("level_4")
        if level4.get("prerequisite", "") != "level_3":
            _end_test(false, "关卡前置条件不正确")
            return
        
        _end_test(true, "%d个关卡、数据完整、解锁条件正常" % levels.size())
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_stall_upgrade() -> void:
    _start_test("摊位升级系统")
    
    try:
        var original_level = GameManager.stall_level
        var original_slots = GameManager.display_slots
        var original_multiplier = GameManager.customer_multiplier
        var original_money = GameManager.money
        
        GameManager.money = 10000
        GameManager.stall_level = 1
        GameManager.display_slots = 4
        GameManager.customer_multiplier = 1.0
        
        var cost = GameManager.get_upgrade_cost()
        if cost != 200:
            _end_test(false, "升级成本计算错误: %d (应为200)" % cost)
            return
        
        var result = GameManager.upgrade_stall()
        if not result:
            _end_test(false, "升级失败")
            return
        
        if GameManager.stall_level != 2:
            _end_test(false, "摊位等级未提升: %d" % GameManager.stall_level)
            return
        
        if GameManager.display_slots != 5:
            _end_test(false, "陈列槽未增加: %d" % GameManager.display_slots)
            return
        
        if GameManager.customer_multiplier <= 1.0:
            _end_test(false, "顾客系数未增加")
            return
        
        if GameManager.money != 10000 - 200:
            _end_test(false, "升级费用扣除错误")
            return
        
        GameManager.money = 0
        var fail_result = GameManager.upgrade_stall()
        if fail_result:
            _end_test(false, "资金不足时升级未返回错误")
            return
        
        GameManager.stall_level = original_level
        GameManager.display_slots = original_slots
        GameManager.customer_multiplier = original_multiplier
        GameManager.money = original_money
        
        _end_test(true, "成本计算、效果提升、资金验证均正常")
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_scene_manager() -> void:
    _start_test("场景管理系统")
    
    try:
        var scenes = SceneManager.SCENES
        if scenes.size() < 3:
            _end_test(false, "场景注册数量不足")
            return
        
        var expected_scenes = ["Main", "LevelSelect", "Game"]
        for scene_name in expected_scenes:
            if not (scene_name in scenes):
                _end_test(false, "缺少场景注册: " + scene_name)
                return
        
        _end_test(true, "%d个场景已注册" % scenes.size())
    except var err:
        _end_test(false, "异常: " + str(err))

func _test_audio_manager() -> void:
    _start_test("音频管理系统")
    
    try:
        AudioManager.set_master_volume(0.5)
        if abs(AudioManager.get_master_volume() - 0.5) > 0.001:
            _end_test(false, "主音量设置失败")
            return
        
        AudioManager.set_bgm_volume(0.4)
        if abs(AudioManager.get_bgm_volume() - 0.4) > 0.001:
            _end_test(false, "BGM音量设置失败")
            return
        
        AudioManager.set_sfx_volume(0.6)
        if abs(AudioManager.get_sfx_volume() - 0.6) > 0.001:
            _end_test(false, "音效音量设置失败")
            return
        
        var sfx_count = AudioManager.SFX_LIBRARY.size()
        if sfx_count < 5:
            _end_test(false, "音效库数量不足: %d" % sfx_count)
            return
        
        AudioManager.set_master_volume(SaveManager.settings.get("master_volume", 0.8))
        AudioManager.set_bgm_volume(SaveManager.settings.get("bgm_volume", 0.6))
        AudioManager.set_sfx_volume(SaveManager.settings.get("sfx_volume", 0.9))
        
        _end_test(true, "音量控制、%d种音效库正常" % sfx_count)
    except var err:
        _end_test(false, "异常: " + str(err))

func _print_summary(total_time_ms: int) -> void:
    var passed = 0
    var failed = 0
    for r in results:
        if r.passed:
            passed += 1
        else:
            failed += 1
    
    print("\n" + _repeat_str("=", 60))
    print("📊 测试总结")
    print(_repeat_str("=", 60))
    print("总计: %d 项测试" % results.size())
    print("✅ 通过: %d 项" % passed)
    print("❌ 失败: %d 项" % failed)
    print("⏱️  耗时: %d ms" % total_time_ms)
    
    if failed > 0:
        print("\n失败项目:")
        for r in results:
            if not r.passed:
                print("  - %s: %s" % [r.test_name, r.message])
    
    print("\n" + _repeat_str("=", 60))
    if failed == 0:
        print("🎉 所有测试通过！游戏核心功能验收合格！")
    else:
        print("⚠️  存在%d项失败，请检查上述问题。" % failed)
    print(_repeat_str("=", 60) + "\n")
    
    _write_test_report(total_time_ms, passed, failed)

func _write_test_report(total_time_ms: int, passed: int, failed: int) -> void:
    var file = FileAccess.open("user://test_report.txt", FileAccess.WRITE)
    if file == null:
        return
    
    file.store_string("🏪 小镇集市经营模拟 - 验收测试报告\n")
    file.store_string("报告生成时间: " + Time.get_datetime_string_from_system() + "\n")
    file.store_string(_repeat_str("=", 60) + "\n\n")
    
    for r in results:
        var status = "✅" if r.passed else "❌"
        file.store_string("%s %s\n" % [status, r.test_name])
        if not r.passed:
            file.store_string("   原因: %s\n" % r.message)
    
    file.store_string("\n" + _repeat_str("=", 60) + "\n")
    file.store_string("总计: %d | 通过: %d | 失败: %d | 耗时: %dms\n" % [results.size(), passed, failed, total_time_ms])
    
    if failed == 0:
        file.store_string("\n验收结论: 🎉 合格\n")
        file.store_string("检查项:\n")
        file.store_string("  ✅ 输入反馈系统 (多输入支持、按键提示动态切换)\n")
        file.store_string("  ✅ 存档系统 (进度保存/读取/导入导出/重置)\n")
        file.store_string("  ✅ 结算状态 (每日结算、利润计算、明细统计)\n")
        file.store_string("  ✅ 库存系统 (增删改查、超量保护)\n")
        file.store_string("  ✅ 金币系统 (增减、超支保护、累计统计)\n")
        file.store_string("  ✅ 摊位升级 (成本、效果、条件)\n")
        file.store_string("  ✅ 顾客偏好 (生成、概率计算、热门分析)\n")
        file.store_string("  ✅ 关卡配置 (数据完整、解锁条件)\n")
    else:
        file.store_string("\n验收结论: ⚠️ 不合格，请修复上述问题\n")
    
    file.close()
    print("📝 详细报告已保存至 user://test_report.txt")

func get_results() -> Array:
    return results
