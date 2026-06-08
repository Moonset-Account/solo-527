extends Node

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result

func _safe_test(test_fn: Callable, name: String, passed_ref: Array, total_ref: Array) -> void:
    total_ref[0] += 1
    var ok: bool = false
    var msg: String = ""
    var result: Variant = null
    result = test_fn.call()
    if result is Array and result.size() >= 1:
        ok = result[0]
        if result.size() >= 2:
            msg = result[1]
    if ok:
        print("✅ %d. %s" % [total_ref[0], name])
        if msg.length() > 0:
            print("   " + msg)
        passed_ref[0] += 1
    else:
        print("❌ %d. %s - %s" % [total_ref[0], name, msg])

func _ready() -> void:
    name = "QuickTest"
    var passed: Array = [0]
    var total: Array = [0]
    
    print("\n" + _repeat_str("=", 60))
    print("🏪 小镇集市经营模拟 - 快速验证")
    print(_repeat_str("=", 60) + "\n")
    
    # 测试1: 类注册/实例化
    _safe_test(func ():
        var hud = load("res://scripts/ui/GameHUD.gd").new()
        var pp = load("res://scripts/ui/PurchasePanel.gd").new()
        var sp = load("res://scripts/ui/SellPanel.gd").new()
        var setp = load("res://scripts/ui/SettlementPanel.gd").new()
        var to = load("res://scripts/ui/TutorialOverlay.gd").new()
        var cs = load("res://scripts/game/CustomerSystem.gd").new()
        var ta = load("res://scripts/game/TutorialAdvice.gd").new()
        var uif = load("res://scripts/ui/UIFeedback.gd").new()
        var ihb = load("res://scripts/ui/InputHintsBar.gd").new()
        var ok = (hud != null and pp != null and sp != null and setp != null and to != null)
        ok = ok and (cs != null and ta != null and uif != null and ihb != null)
        # 清理不需要的节点, hud等不加入树就不构建UI
        queue_free_recursive([hud, pp, sp, setp, to, cs, ta, uif, ihb])
        return [ok, "9个核心类全部成功加载/实例化"]
    , "核心类全局注册", passed, total)
    
    # 测试2: InputMapper 多输入
    _safe_test(func ():
        var actions = ["ui_accept","ui_cancel","ui_up","ui_down","pause","next_phase","upgrade_stall"]
        var all_ok = true
        var hints_str = "当前输入模式: " + InputMapper.get_input_mode_name() + "\n"
        for a in actions:
            var hint = InputMapper.get_action_hint(a)
            if hint == "" or hint == "未知":
                all_ok = false
            hints_str += "     %s = [%s]\n" % [a, hint]
        return [all_ok, hints_str]
    , "多输入映射按键提示", passed, total)
    
    # 测试3: 关卡配置
    _safe_test(func ():
        var ids = LevelConfig.get_level_ids()
        var all_ok = ids.size() == 4
        var info = "共 %d 个关卡\n" % ids.size()
        for id in ids:
            var d = LevelConfig.get_level(id)
            var ok = (d != null and d.get("name","") != "")
            if not ok: all_ok = false
            info += "     %s: %s, %d天, 目标%d金币\n" % [id, d.get("name","?"), d.get("days",0), d.get("target_money",0)]
        return [all_ok, info]
    , "4关卡配置完整", passed, total)
    
    # 测试4: 商品数据库
    _safe_test(func ():
        var items = ["apple","bread","carrot","fish","meat","cheese","vegetable","fruit","craft","flower"]
        var all_ok = true
        var info = ""
        for i in items:
            var n = ItemsDB.get_item_name(i)
            var cost = ItemsDB.get_cost_price(i)
            var cat = ItemsDB.get_category(i)
            if n == "" or cost <= 0: all_ok = false
            info += "     %s(%s): 成本%d, %s类\n" % [n, i, cost, cat]
        return [all_ok, info]
    , "10种商品数据完整", passed, total)
    
    # 测试5: 存档系统
    _safe_test(func ():
        SaveManager.save_level_progress("level_1", 3, 5000)
        SaveManager.update_setting("master_volume", 0.7)
        SaveManager.save_settings()
        var unlocked = SaveManager.is_level_unlocked("level_2")
        var s1 = SaveManager.get_level_progress("level_1")
        var s2 = SaveManager.settings.get("master_volume", 0.0)
        SaveManager.reset_progress()
        SaveManager.update_setting("master_volume", 0.8)
        SaveManager.save_settings()
        var ok = unlocked and s1.get("best_stars",0) == 3 and s2 == 0.7
        var info = "level_2解锁: %s, level_1星级:%d, 音量设置:%s\n" % [str(unlocked), s1.get("best_stars",0), str(s2)]
        info += "   (已重置进度防止残留)"
        return [ok, info]
    , "存档保存/读取/重置", passed, total)
    
    # 测试6: 采购/库存/金币
    _safe_test(func ():
        GameManager.start_new_game("level_1")
        var start_m = GameManager.money
        GameManager.purchase_item("apple", 10)
        GameManager.purchase_item("fish", 3)
        var mid_m = GameManager.money
        var apple_stock = GameManager.inventory.get("apple", 0)
        var fish_stock = GameManager.inventory.get("fish", 0)
        GameManager.change_money(800)
        var end_m = GameManager.money
        var ok = (start_m > 0 and mid_m < start_m and apple_stock == 10 and fish_stock == 3 and end_m == mid_m + 800)
        var info = "初始:%d → 采购后:%d → 加销售:%d\n" % [start_m, mid_m, end_m]
        info += "   库存: 苹果×%d, 鱼×%d" % [apple_stock, fish_stock]
        return [ok, info]
    , "采购/库存/金币系统", passed, total)
    
    # 测试7: 摊位升级
    _safe_test(func ():
        # 先确保有足够金币
        GameManager.change_money(1000)
        var pre_lvl = GameManager.stall_level
        var pre_slots = GameManager.display_slots
        var ok = GameManager.upgrade_stall()
        var post_lvl = GameManager.stall_level
        var post_slots = GameManager.display_slots
        ok = ok and (post_lvl == pre_lvl + 1) and (post_slots == pre_slots + 1)
        var info = "升级前: Lv%d/%d槽 → 升级后: Lv%d/%d槽" % [pre_lvl, pre_slots, post_lvl, post_slots]
        return [ok, info]
    , "摊位升级系统", passed, total)
    
    # 测试8: 顾客系统
    _safe_test(func ():
        var cs = load("res://scripts/game/CustomerSystem.gd").new()
        add_child(cs)
        cs.setup_for_level("level_1")
        cs.generate_customers("level_1", 1)
        var all_ok = true
        var info = ""
        for i in range(3):
            var c = cs.get_next_customer()
            if c == null or c.name == "":
                all_ok = false
            else:
                var will = c.will_buy("apple", 20)
                info += "     %s: 预算%d, 想买%s, 买苹果(20)? %s\n" % [c.name, c.budget, str(c.desired_items), str(will)]
        cs.queue_free()
        return [all_ok, info]
    , "顾客生成/购买决策", passed, total)
    
    # 测试9: 星级评定
    _safe_test(func ():
        var s1 = LevelConfig.calculate_stars("level_1", 300)
        var s2 = LevelConfig.calculate_stars("level_1", 600)
        var s3 = LevelConfig.calculate_stars("level_1", 900)
        var ok = (s1 >= 1 and s2 >= 2 and s3 >= 3)
        var info = "300金币:%d星, 600:%d星, 900:%d星 (目标600)" % [s1, s2, s3]
        return [ok, info]
    , "关卡星级评定逻辑", passed, total)
    
    # 测试10: 每日结算
    _safe_test(func ():
        var report = GameManager._end_day_simulation(2000, 300, 1200, 8)
        var profit = report.get("profit", -999999)
        var end_money = report.get("end_money", 0)
        var ok = (profit == 900 and end_money == 2900 and GameManager.current_day == 2)
        var info = "起始2000 - 采购300 + 销售1200 = 剩余%d, 利润%d\n" % [end_money, profit]
        info += "   顾客数: %d, 明细: %s, 天数: %d" % [report.get("customers_served",0), str(report.get("items_sold")), GameManager.current_day]
        return [ok, info]
    , "每日结算状态/计算", passed, total)
    
    # 测试11: 音频系统
    _safe_test(func ():
        AudioManager.set_master_volume(0.5)
        AudioManager.set_bgm_volume(0.3)
        AudioManager.set_sfx_volume(0.8)
        AudioManager.play_sfx("coin")
        AudioManager.play_sfx("sale")
        AudioManager.play_sfx("upgrade")
        AudioManager.play_sfx("success")
        var sfx_list = ["coin","pickup","sale","upgrade","transition","click","error","success","customer_arrive","customer_leave"]
        var cnt = 0
        for s in sfx_list:
            if AudioManager.SFX_LIBRARY.has(s):
                cnt += 1
        var ok = (cnt == 10)
        var info = "%d种SFX库检查完毕, 音量设置调用无报错" % cnt
        return [ok, info]
    , "音频系统播放/音量", passed, total)
    
    # 测试12: 新手引导/经营建议
    _safe_test(func ():
        var ta = load("res://scripts/game/TutorialAdvice.gd").new()
        add_child(ta)
        var steps = ta.get_total_steps()
        var step_dict = ta.get_current_step()
        var step_idx = ta.current_tutorial_step
        var advice_dict = ta.generate_advice(0, {})
        ta.next_step()
        var step_idx2 = ta.current_tutorial_step
        ta.queue_free()
        var advice_text = ""
        if advice_dict.size() > 0:
            advice_text = str(advice_dict)
        var ok = (steps >= 7 and step_idx >= 0 and step_idx2 > step_idx and advice_text.length() > 10)
        var info = "教程总步数: %d, 步骤推进: %d→%d\n" % [steps, step_idx, step_idx2]
        info += "   当前步骤: %s\n" % str(step_dict.get("title","?"))
        info += "   阶段建议摘要: %s" % advice_text.substr(0, min(80, advice_text.length()))
        return [ok, info]
    , "新手引导/经营建议", passed, total)
    
    print("\n" + _repeat_str("=", 60))
    print("📊 核心系统验证结果: %d / %d 项通过" % [passed[0], total[0]])
    if passed[0] == total[0]:
        print("🎉 12/12 项全部通过验证！")
        print("   → 采购流程、库存系统、结算状态正常")
        print("   → 多输入切换、存档系统、摊位升级、顾客系统正常")
        print("   → 新手引导、经营建议、音频反馈、星级评定正常")
    elif passed[0] >= total[0] - 2:
        print("👍 大部分通过 (%d项), 可能存在小问题" % (passed[0]))
    else:
        print("⚠️  存在 %d 项失败，请检查具体报错" % (total[0] - passed[0]))
    print(_repeat_str("=", 60) + "\n")
    
    get_tree().quit()

func queue_free_recursive(nodes: Array) -> void:
    for n in nodes:
        if n != null and is_instance_valid(n):
            if n.get_parent() == null:
                n.free()
            else:
                n.queue_free()
