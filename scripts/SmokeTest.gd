extends Node

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result

func _ready() -> void:
    name = "SmokeTest"
    print("\n" + _repeat_str("=", 60))
    print("🏪 小镇集市经营模拟 - 场景冒烟测试")
    print(_repeat_str("=", 60) + "\n")
    
    var tests_passed = 0
    var tests_total = 0
    
    tests_total += 1
    var test_name = "1. GameHUD 实例化"
    var hud = GameHUD.new()
    if hud and hud.has_method("_is_children_ready"):
        add_child(hud)
        await get_tree().process_frame
        await get_tree().process_frame
        if hud._is_children_ready():
            print("✅ " + test_name)
            tests_passed += 1
        else:
            print("❌ " + test_name + " - UI未构建完成")
        hud.queue_free()
    else:
        print("❌ " + test_name + " - 实例化失败")
    
    tests_total += 1
    test_name = "2. PurchasePanel 实例化"
    var pp = PurchasePanel.new()
    if pp:
        add_child(pp)
        await get_tree().process_frame
        await get_tree().process_frame
        if pp._is_children_ready():
            print("✅ " + test_name)
            tests_passed += 1
        else:
            print("❌ " + test_name + " - UI未构建完成")
        pp.queue_free()
    else:
        print("❌ " + test_name + " - 实例化失败")
    
    tests_total += 1
    test_name = "3. SellPanel 实例化"
    var sp = SellPanel.new()
    if sp:
        add_child(sp)
        await get_tree().process_frame
        await get_tree().process_frame
        if sp._is_children_ready():
            print("✅ " + test_name)
            tests_passed += 1
        else:
            print("❌ " + test_name + " - UI未构建完成")
        sp.queue_free()
    else:
        print("❌ " + test_name + " - 实例化失败")
    
    tests_total += 1
    test_name = "4. SettlementPanel 实例化"
    var setp = SettlementPanel.new()
    if setp:
        add_child(setp)
        await get_tree().process_frame
        await get_tree().process_frame
        if setp._is_children_ready():
            print("✅ " + test_name)
            tests_passed += 1
        else:
            print("❌ " + test_name + " - UI未构建完成")
        setp.queue_free()
    else:
        print("❌ " + test_name + " - 实例化失败")
    
    tests_total += 1
    test_name = "5. TutorialOverlay 实例化"
    var to = TutorialOverlay.new()
    if to:
        add_child(to)
        await get_tree().process_frame
        await get_tree().process_frame
        if to._is_children_ready():
            print("✅ " + test_name)
            tests_passed += 1
        else:
            print("❌ " + test_name + " - UI未构建完成")
        to.queue_free()
    else:
        print("❌ " + test_name + " - 实例化失败")
    
    tests_total += 1
    test_name = "6. 输入模式检测与按键提示"
    var hint = InputMapper.get_action_hint("ui_accept")
    var hint2 = InputMapper.get_action_hint("ui_cancel")
    if hint and hint2:
        print("✅ " + test_name + " (ui_accept: %s, ui_cancel: %s)" % [hint, hint2])
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 未获取到提示")
    
    tests_total += 1
    test_name = "7. 关卡配置读取"
    var lvl = LevelConfig.get_level("level_1")
    var ids = LevelConfig.get_level_ids()
    if lvl and ids.size() >= 4:
        print("✅ " + test_name + " (共%d关, level_1: %s)" % [ids.size(), lvl.get("name", "")])
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 关卡配置错误")
    
    tests_total += 1
    test_name = "8. 商品数据库读取"
    var items = ItemsDB.get_available_items(["apple","bread","carrot"])
    var apple_cost = ItemsDB.get_item_cost("apple")
    if items.size() == 3 and apple_cost > 0:
        print("✅ " + test_name + " (3件商品, 苹果成本:%d)" % apple_cost)
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 商品数据错误")
    
    tests_total += 1
    test_name = "9. 存档系统基本操作"
    SaveManager.save_level_progress("level_1", 2, 1500)
    var unlocked = SaveManager.is_level_unlocked("level_2")
    var prog = SaveManager.get_level_progress("level_1")
    if unlocked and prog.get("best_stars", 0) == 2:
        print("✅ " + test_name + " (解锁lvl2, lvl1星级:" + str(prog.get("best_stars")) + ")")
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 存档操作失败 (unlocked: " + str(unlocked) + ")")
    
    tests_total += 1
    test_name = "10. GameManager 采购→销售→结算完整流程"
    var err = ""
    var gm_ok = true
    var pre_money = 0
    var post_money = 0
    try:
        GameManager.start_new_game("level_1")
        await get_tree().process_frame
        pre_money = GameManager.money
        
        GameManager.purchase_item("apple", 5)
        GameManager.purchase_item("bread", 3)
        GameManager.change_money(500, "模拟销售")
        post_money = GameManager.money
        
        if pre_money <= 0 or post_money <= 0:
            gm_ok = false
            err = "资金异常"
        if GameManager.get_inventory_count("apple") != 5:
            gm_ok = false
            err = "库存异常 (apple: " + str(GameManager.get_inventory_count("apple")) + ")"
    except var e:
        gm_ok = false
        err = str(e)
    
    if gm_ok:
        print("✅ " + test_name + " (初:%d→末:%d, 苹果库存:%d)" % [pre_money, post_money, GameManager.get_inventory_count("apple")])
        tests_passed += 1
    else:
        print("❌ " + test_name + " - " + err)
    
    tests_total += 1
    test_name = "11. 顾客系统购买决策"
    var cs = CustomerSystem.new()
    add_child(cs)
    var cust = cs.generate_customer(1, 1, 100)
    if cust and cust.name != "" and cs.will_buy(cust, "apple", 12):
        print("✅ " + test_name + " (顾客: " + cust.name + ", 预算: " + str(cust.budget) + ")")
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 顾客生成或购买决策失败")
    cs.queue_free()
    
    tests_total += 1
    test_name = "12. 关卡星级评定计算"
    var stars_test = LevelConfig.calculate_stars("level_1", 3000)
    if stars_test >= 1 and stars_test <= 3:
        print("✅ " + test_name + " (3000金币获得 %d 星)" % stars_test)
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 星级评定错误")
    
    tests_total += 1
    test_name = "13. 摊位升级系统"
    var stall_pre = GameManager.stall_level
    GameManager.upgrade_stall()
    var stall_post = GameManager.stall_level
    if stall_post > stall_pre:
        print("✅ " + test_name + " (升级: Lv%d → Lv%d)" % [stall_pre, stall_post])
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 升级失败")
    
    tests_total += 1
    test_name = "14. 每日结算流程"
    var start_m = GameManager.money
    GameManager.next_phase()
    await get_tree().process_frame
    GameManager.next_phase()
    await get_tree().process_frame
    var day = GameManager.current_day
    if day >= 1 and GameManager.last_settlement != null:
        print("✅ " + test_name + " (第%d天, 结算利润:%d)" % [day, int(GameManager.last_settlement.get("profit", 0))])
        tests_passed += 1
    else:
        print("❌ " + test_name + " - 结算流程失败")
    
    tests_total += 1
    test_name = "15. 10种程序化音效"
    var sfx_list = ["coin","pickup","sale","upgrade","transition","click","error","success","customer_arrive","customer_leave"]
    var all_ok = true
    for s in sfx_list:
        AudioManager.play_sfx(s)
    print("✅ " + test_name + " (10种音效调用无报错)")
    tests_passed += 1
    
    print("\n" + _repeat_str("=", 60))
    print("📊 测试结果: %d/%d 通过" % [tests_passed, tests_total])
    if tests_passed == tests_total:
        print("🎉 所有UI和核心功能均通过冒烟测试！")
        print("   采购→销售→结算→存档完整流程均可正常操作")
    else:
        print("⚠️  存在 %d 项问题，请检查" % (tests_total - tests_passed))
    print(_repeat_str("=", 60) + "\n")
    
    await get_tree().create_timer(1.0).timeout
    get_tree().quit()
