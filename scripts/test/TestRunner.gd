extends Node

const TUTORIAL_LEVEL_ID := "tutorial"

var path1_result: Dictionary = {}
var path2_result: Dictionary = {}

func _sep(c: String, n: int) -> String:
	var s: String = ""
	for i in range(n):
		s += c
	return s

func _safe(data, default_val) -> String:
	if data == null:
		return str(default_val)
	return str(data)

func _ready() -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	_run_tests()

func _pad_str(s: String, width: int, is_right: bool = false) -> String:
	var result: String = s
	if result.length() > width:
		result = s.substr(0, width)
	while result.length() < width:
		if is_right:
			result = " " + result
		else:
			result = result + " "
	return result

func _str_num(n: int, width: int) -> String:
	return _pad_str(str(n), width, true)

func _run_tests() -> void:
	var SEP: String = _sep("=", 72)
	var SUBSEP: String = _sep("-", 60)
	print("\n" + SEP)
	print("档案室时间线推理 - 自动化游戏流程测试")
	print("Godot版本: " + str(Engine.get_version_info().get("string", "unknown")))
	print("测试时间: " + Time.get_datetime_string_from_system())
	print(SEP)
	print("\n" + SUBSEP)
	print("【路径 1】完美提交：正确排序 + 正确标签 + 零提示 + 一次成功")
	print(SUBSEP)
	GameManager.start_level(TUTORIAL_LEVEL_ID)
	var cfg: Dictionary = ConfigManager.get_level_config(TUTORIAL_LEVEL_ID)
	print("开始关卡：" + _safe(cfg.get("title", ""), ""))
	print("  关卡ID: " + TUTORIAL_LEVEL_ID)
	print("  卡片数量: " + str(Array(cfg.get("cards", [])).size()))
	print("  关联数量: " + str(Array(cfg.get("evidence_links", [])).size()))
	print("")
	GameManager.place_card("card_t1", 0)
	print("  [放置] card_t1【家书-三月】 -> 第1槽")
	GameManager.place_card("card_t2", 1)
	print("  [放置] card_t2【毕业合影】 -> 第2槽")
	GameManager.place_card("card_t3", 2)
	print("  [放置] card_t3【入职通知书】 -> 第3槽")
	print("")
	GameManager.apply_tag("card_t1", "家书")
	print("  [标签] card_t1 + 家书")
	GameManager.apply_tag("card_t1", "春天")
	print("  [标签] card_t1 + 春天")
	GameManager.apply_tag("card_t2", "照片")
	print("  [标签] card_t2 + 照片")
	GameManager.apply_tag("card_t2", "毕业")
	print("  [标签] card_t2 + 毕业")
	GameManager.apply_tag("card_t3", "公文")
	print("  [标签] card_t3 + 公文")
	GameManager.apply_tag("card_t3", "工作")
	print("  [标签] card_t3 + 工作")
	print("")
	print("  -> 提交评分...")
	path1_result = GameManager.submit_timeline()
	await get_tree().process_frame
	_print_path1_result(SEP, SUBSEP)
	print("\n\n" + SUBSEP)
	print("【路径 2】失败路径：故意错误提交达到最大尝试次数 -> 失败原因面板")
	print(SUBSEP)
	GameManager.start_level(TUTORIAL_LEVEL_ID)
	var max_att: int = int(ConfigManager.get_game_setting("game.max_attempts", 3))
	print("重置关卡：" + _safe(cfg.get("title", ""), ""))
	print("  最大尝试次数: " + str(max_att))
	print("")
	var layouts: Array = [
		{"card_t3": 0, "card_t1": 1, "card_t2": 2},
		{"card_t2": 0, "card_t3": 1, "card_t1": 2},
		{"card_t1": 1, "card_t3": 0, "card_t2": 2}
	]
	for idx in range(max_att):
		var layout: Dictionary = layouts[min(idx, layouts.size() - 1)]
		print("  [第 " + str(idx + 1) + "/" + str(max_att) + " 次提交] 故意放错位置:")
		for cid in layout.keys():
			var slot_idx: int = int(layout[cid])
			GameManager.place_card(cid, slot_idx)
			var card_dt: Dictionary = GameManager.get_card_data(cid)
			var correct_slot: int = idx
			print("    - " + _safe(card_dt.get("title", cid), cid) + " -> 第" + str(slot_idx + 1) + "槽（正确应该在第" + str(correct_slot + 1) + "槽）")
		if idx == 0:
			GameManager.apply_tag("card_t1", "夏天")
			GameManager.apply_tag("card_t2", "公文")
			print("    + 故意加错标签2个（缺失正确标签4个）")
		var res: Dictionary = GameManager.submit_timeline()
		await get_tree().process_frame
		var passed_flag: bool = bool(res.get("passed", false))
		var cur_att: int = int(res.get("attempts", 0))
		var remain: int = max(0, max_att - cur_att)
		print("    结果: passed=" + str(passed_flag) + ", attempts=" + str(cur_att) + ", remaining=" + str(remain))
		print("")
		if idx == max_att - 1:
			path2_result = res
	_print_path2_result(SEP, SUBSEP, max_att)
	_print_final_summary(SEP, SUBSEP, cfg)
	print("\n" + SEP)
	print("✅ 全部测试完成，退出程序")
	print(SEP + "\n")
	get_tree().quit(0)

func _print_path1_result(SEP: String, SUBSEP: String) -> void:
	print("")
	print("【验证结果】")
	var passed: bool = bool(path1_result.get("passed", false))
	var perfect: bool = bool(path1_result.get("perfect", false))
	var final_score: int = int(path1_result.get("final_score", 0))
	var grade: String = str(path1_result.get("grade", "-"))
	var hints_used: int = int(path1_result.get("hints_used", -1))
	var attempts: int = int(path1_result.get("attempts", -1))
	var all_cards: bool = bool(path1_result.get("all_cards_correct", false))
	var all_tags: bool = bool(path1_result.get("all_tags_correct", false))
	var all_links: bool = bool(path1_result.get("all_links_correct", false))
	print("  passed = " + str(passed) + "    (期望: true)")
	print("  perfect = " + str(perfect) + "   (期望: true)")
	print("  hints_used = " + str(hints_used) + " (期望: 0)")
	print("  attempts = " + str(attempts) + "   (期望: 1)")
	print("  all_cards_correct = " + str(all_cards) + " (期望: true)")
	print("  all_tags_correct  = " + str(all_tags) + " (期望: true)")
	print("  all_links_correct = " + str(all_links) + " (期望: true) [教程关无关联，按已满足处理]")
	print("  grade = " + grade + "        (期望: S)")
	print("  final_score = " + str(final_score) + " (完美奖励应已计入总分)")
	var breakdown: Array = []
	var scfg: Dictionary = ConfigManager.scoring_config
	var score_base: int = int(scfg.get("base_score", 1000))
	var score_per_card: int = int(scfg.get("per_card_correct", 150))
	var score_per_tag: int = int(scfg.get("per_tag_correct", 50))
	var score_perfect: int = int(scfg.get("perfect_bonus", 500))
	var score_nohint: int = int(scfg.get("no_hint_bonus", 300))
	var score_firsttry: int = int(scfg.get("first_try_bonus", 200))
	var cards_correct: int = int(path1_result.get("cards_correct", 0))
	var cards_total: int = int(path1_result.get("cards_total", 0))
	var tags_correct: int = int(path1_result.get("tags_correct", 0))
	var tags_total: int = int(path1_result.get("tags_total", 0))
	breakdown.append({"label": "基础分数", "value": score_base})
	breakdown.append({"label": "时间线正确 (" + str(cards_correct) + "/" + str(cards_total) + ")", "value": cards_correct * score_per_card})
	if tags_total > 0:
		breakdown.append({"label": "标签正确 (" + str(tags_correct) + "/" + str(tags_total) + ")", "value": tags_correct * score_per_tag})
	if hints_used == 0:
		breakdown.append({"label": "零提示奖励", "value": score_nohint})
	if attempts == 1:
		breakdown.append({"label": "一次成功奖励", "value": score_firsttry})
	if perfect:
		breakdown.append({"label": "完美奖励", "value": score_perfect})
	var calc_total: int = 0
	for it in breakdown:
		var item: Dictionary = it
		calc_total += int(item.get("value", 0))
	print("")
	print("  【结果面板 - 成功奖励预览】")
	print("    ┌─────────────────────────────────────────┐")
	print("    │  🎉 推理成功！                          │")
	print("    │                                         │")
	var gradestr: String = grade
	if gradestr.length() == 0:
		gradestr = "?"
	var score_display: String = _str_num(final_score, 5)
	print("    │   ┌─┐   最终得分：" + score_display + "                │")
	print("    │   │ " + gradestr.substr(0, 1) + " │   等级：" + gradestr + "                     │")
	if perfect and hints_used == 0 and attempts == 1:
		print("    │   └─┘   🏆完美通关 ⭐一次成功 🔍零提示   │")
	elif perfect:
		print("    │   └─┘   🏆完美通关                      │")
	else:
		print("    │   └─┘                                    │")
	print("    │                                         │")
	print("    │  【得分明细】                           │")
	for item2 in breakdown:
		var dd: Dictionary = item2
		var label_s: String = str(dd.get("label", "?"))
		var value_v: int = int(dd.get("value", 0))
		var sign: String = "+" if value_v >= 0 else ""
		var label_padded: String = _pad_str(label_s, 25)
		var value_str: String = _pad_str(sign + str(value_v), 5, true)
		print("    │    " + label_padded + " " + value_str + "        │")
		calc_total += 0
	print("    │    ─────────────────────────            │")
	var calc_str: String = _pad_str(str(calc_total), 5, true)
	print("    │    合计                     " + calc_str + "        │")
	print("    └─────────────────────────────────────────┘")
	print("")
	print("  ✅ 检查：")
	var ok1: String = "✅" if passed else "❌"
	var ok2: String = "✅" if perfect else "❌"
	var ok3: String = "✅" if final_score == calc_total else "❌"
	var ok4: String = "✅" if grade == "S" else "❌"
	print("     " + ok1 + " 成功面板能进入 (passed=true)")
	print("     " + ok2 + " perfect=true -> 完美奖励 +500 已计算")
	print("     " + ok3 + " 总分final_score=" + str(final_score) + " = 明细逐项相加=" + str(calc_total) + "（完美奖励已计入）")
	print("     " + ok4 + " 等级为 S（满分）")

func _print_path2_result(SEP: String, SUBSEP: String, max_att: int) -> void:
	print("【验证结果】")
	var passed: bool = bool(path2_result.get("passed", false))
	var final_score: int = int(path2_result.get("final_score", 0))
	var grade: String = str(path2_result.get("grade", "-"))
	var attempts: int = int(path2_result.get("attempts", -1))
	var failure_reasons: Array = Array(path2_result.get("failure_reasons", []))
	var wrong_cards_count: int = Array(path2_result.get("cards_wrong", [])).size()
	var wrong_tags_count: int = Array(path2_result.get("tags_wrong", [])).size()
	print("  passed = " + str(passed) + "    (期望: false)")
	print("  attempts = " + str(attempts) + "   (期望: " + str(max_att) + " = 最大尝试次数)")
	print("  grade = " + grade + "        (期望: D或最低等级)")
	print("  final_score = " + str(final_score) + " (应有重试惩罚等扣分)")
	print("  错位卡片数: " + str(wrong_cards_count))
	print("  标签错误数: " + str(wrong_tags_count))
	print("  失败原因条目数: " + str(failure_reasons.size()) + " (期望 >= 2)")
	print("")
	print("  【结果面板 - 失败原因预览】")
	print("    ┌─────────────────────────────────────────────────┐")
	print("    │  推理失败                                       │")
	print("    │                                                 │")
	var gradestr2: String = grade
	if gradestr2.length() == 0:
		gradestr2 = "-"
	var scorestr2: String = _str_num(final_score, 5)
	print("    │   ┌─┐   最终得分：" + scorestr2 + "                        │")
	print("    │   │ " + gradestr2.substr(0, 1) + " │   达到最大尝试次数，请重新挑战。            │")
	print("    │   └─┘                                           │")
	print("    │                                                 │")
	print("    │  【失败原因分析】                               │")
	if failure_reasons.size() > 0:
		var ri: int = 0
		for r in failure_reasons:
			ri += 1
			var rs: String = str(r)
			var lines2: PackedStringArray = rs.split("\n")
			var ln: int = 0
			for rl in lines2:
				ln += 1
				var head: String = ("    • " + str(ri) + " ") if ln == 1 else "      "
				var content_s: String = str(rl)
				var display: String = _pad_str(content_s, 44)
				print("    │ " + head + display + "│")
	else:
		print("    │  ⚠️  无失败原因输出（这是BUG！）                  │")
	print("    │                                                 │")
	print("    └─────────────────────────────────────────────────┘")
	var specific: bool = false
	if failure_reasons.size() > 0:
		var cnt: int = 0
		for r2 in failure_reasons:
			var rs2: String = str(r2)
			if rs2.contains("第") and rs2.contains("槽"):
				cnt += 1
			elif rs2.contains("【") and rs2.contains("】"):
				cnt += 1
			elif rs2.contains("❌") or rs2.contains("🏷️") or rs2.contains("🔗"):
				cnt += 1
		specific = (cnt >= 1)
	print("")
	print("  ✅ 检查：")
	var fa1: String = "✅" if (not passed) else "❌"
	var fa2: String = "✅" if (failure_reasons.size() >= 2) else "❌"
	var fa3: String = "✅" if specific else "❌"
	var fa4: String = "✅" if (final_score > 0 and attempts > 1) else "❌"
	print("     " + fa1 + " 失败面板能进入 (passed=false且达到最大尝试次数)")
	print("     " + fa2 + " 失败原因有具体条目 (失败原因>=2项：卡片顺序错误 + 标签问题)")
	print("     " + fa3 + " 失败原因包含详细信息（卡片名/槽位号等，非空泛文本）")
	print("     " + fa4 + " 有扣分计算（基础分 + 重试惩罚等）")

func _print_final_summary(SEP: String, SUBSEP: String, cfg: Dictionary) -> void:
	var p1_passed: bool = bool(path1_result.get("passed", false))
	var p1_perfect: bool = bool(path1_result.get("perfect", false))
	var p1_ok: bool = p1_passed and p1_perfect
	var p1_score: int = int(path1_result.get("final_score", 0))
	var sconfig: Dictionary = ConfigManager.scoring_config
	var bd1_calc: int = 0
	var cards_c: int = int(path1_result.get("cards_correct", 0))
	var tags_c: int = int(path1_result.get("tags_correct", 0))
	var hints_u: int = int(path1_result.get("hints_used", 0))
	var att_n: int = int(path1_result.get("attempts", 1))
	bd1_calc += int(sconfig.get("base_score", 1000))
	bd1_calc += cards_c * int(sconfig.get("per_card_correct", 150))
	bd1_calc += tags_c * int(sconfig.get("per_tag_correct", 50))
	if hints_u == 0:
		bd1_calc += int(sconfig.get("no_hint_bonus", 300))
	if att_n == 1:
		bd1_calc += int(sconfig.get("first_try_bonus", 200))
	if p1_perfect:
		bd1_calc += int(sconfig.get("perfect_bonus", 500))
	var p1_grade_ok: bool = (str(path1_result.get("grade", "")) == "S")
	var p1_score_ok: bool = (p1_score == bd1_calc)
	var p2_fail: bool = (not bool(path2_result.get("passed", false))) and (Array(path2_result.get("failure_reasons", [])).size() >= 2)
	var reasons2: Array = Array(path2_result.get("failure_reasons", []))
	var p2_specific: bool = false
	if reasons2.size() > 0:
		var cc: int = 0
		for rr in reasons2:
			var rr_s: String = str(rr)
			if rr_s.contains("❌") or rr_s.contains("🏷️") or rr_s.contains("🔗") or rr_s.contains("第"):
				cc += 1
		p2_specific = cc >= 1
	var all_ok: bool = p1_ok and p1_score_ok and p1_grade_ok and p2_fail and p2_specific
	print("\n" + SEP)
	print("【测试总结】")
	print(SEP)
	var rows: Array = []
	rows.append(["", "检查项", "实际结果", "通过"])
	rows.append(["1", "成功面板：passed=true + perfect=true", str(p1_ok), "✅" if p1_ok else "❌"])
	var score_res_str: String = "final_score=" + str(p1_score) + "==明细合计=" + str(bd1_calc)
	rows.append(["2", "成功面板：完美奖励500已计入总分", score_res_str, "✅" if p1_score_ok else "❌"])
	rows.append(["3", "成功面板：等级S（完美）", "等级=" + str(path1_result.get("grade", "?")), "✅" if p1_grade_ok else "❌"])
	rows.append(["4", "失败面板：passed=false + 失败原因>=2项", "失败原因=" + str(reasons2.size()) + "项", "✅" if p2_fail else "❌"])
	rows.append(["5", "失败面板：原因包含具体细节", str(p2_specific), "✅" if p2_specific else "❌"])
	for r in rows:
		var ra: Array = r
		var c0: String = _pad_str(str(ra[0]), 4)
		var c1: String = _pad_str(str(ra[1]), 38)
		var c2: String = _pad_str(str(ra[2]), 25)
		var c3: String = _pad_str(str(ra[3]), 3)
		print("  " + c0 + c1 + c2 + c3)
	print("")
	if all_ok:
		print("🎉🎉🎉 全部5项检查通过！")
		print("    教程关正确排序+标签 → 成功奖励面板（完美奖励已计入总分） ✅")
		print("    错误提交达到最大尝试次数 → 失败原因面板（具体细节） ✅")
	else:
		print("⚠️  部分检查未通过，请检查上方详细日志。")
