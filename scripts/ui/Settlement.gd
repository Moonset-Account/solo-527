extends Control

var settlement_data: Dictionary = {}

@onready var result_status_label: Label = $ResultStatus
@onready var grade_label: Label = $GradeLabel
@onready var score_number_label: Label = $ScoreNumber
@onready var grade_desc_label: Label = $GradeDesc

@onready var breakdown_vbox: VBoxContainer = $MainContainer/LeftPanel/LeftVBox/BreakdownVBox
@onready var reward_amount_label: Label = $MainContainer/RightPanel/RightVBox/RewardAmount
@onready var stats_vbox: VBoxContainer = $MainContainer/RightPanel/RightVBox/StatsVBox
@onready var materials_vbox: VBoxContainer = $MainContainer/RightPanel/RightVBox/MaterialsVBox
@onready var zones_vbox: VBoxContainer = $MainContainer/RightPanel/RightVBox/ZonesScroll/ZonesVBox

@onready var compare_hbox_inner: HBoxContainer = $ComparePanel/CompareHBox/CompareScroll/CompareHBoxInner

@onready var retry_button: Button = $ButtonContainer/RetryButton
@onready var back_levels_button: Button = $ButtonContainer/BackToLevelsButton

func _ready() -> void:
	LevelLoader.initialize()
	settlement_data = GameData.get_settlement()
	if settlement_data.is_empty():
		GameManager.change_scene("MainMenu")
		return
	_build_ui()
	retry_button.pressed.connect(_on_retry_pressed)
	back_levels_button.pressed.connect(_on_back_levels_pressed)

func _build_ui() -> void:
	var passed: bool = settlement_data.get("passed", false)
	var score: int = settlement_data.get("score", 0)
	var grade: String = settlement_data.get("grade", "F")
	var grade_desc: String = settlement_data.get("grade_desc", "")
	var reward: int = settlement_data.get("reward", 0)
	if passed:
		result_status_label.text = "✔ 修复成功"
		result_status_label.add_theme_color_override("font_color", Color(0.15, 0.55, 0.15, 1))
	else:
		result_status_label.text = "✘ 修复未通过"
		result_status_label.add_theme_color_override("font_color", Color(0.75, 0.15, 0.15, 1))
	grade_label.text = grade
	match grade:
		"S", "A":
			grade_label.add_theme_color_override("font_color", Color(0.85, 0.6, 0.1, 1))
		"B", "C":
			grade_label.add_theme_color_override("font_color", Color(0.2, 0.4, 0.7, 1))
		_:
			grade_label.add_theme_color_override("font_color", Color(0.6, 0.2, 0.2, 1))
	score_number_label.text = "%d 分" % score
	grade_desc_label.text = grade_desc
	reward_amount_label.text = "💰 %d 金币" % reward
	_build_breakdown()
	_build_stats()
	_build_materials()
	_build_zones()
	_build_compare()

func _build_breakdown() -> void:
	for child in breakdown_vbox.get_children():
		child.queue_free()
	var breakdown: Dictionary = settlement_data.get("breakdown", {})
	var repaired: int = breakdown.get("repaired_count", 0)
	var total: int = breakdown.get("total_zones", 0)
	var zone_quality: float = breakdown.get("total_zone_quality", 0.0)
	var repair_score: int = int(float(repaired) / float(max(1, total)) * 40 + zone_quality * 20)
	_add_breakdown_row("修复完成度（%d/%d）" % [repaired, total], repair_score, 60)
	_add_breakdown_row("纸张强度保留", breakdown.get("strength_score", 0), 20)
	_add_breakdown_row("时间效率", breakdown.get("time_score", 0), 15)
	_add_breakdown_row("材料效率", breakdown.get("material_efficiency", 0), 10)
	_add_breakdown_row("湿度控制", breakdown.get("humidity_score", 0), 10)
	var penalty: int = breakdown.get("penalty_score", 0)
	if penalty > 0:
		_add_breakdown_row("操作失误惩罚", -penalty, -20, true)
	var total2 = breakdown.get("total", 0)
	var sep: HSeparator = HSeparator.new()
	breakdown_vbox.add_child(sep)
	_add_breakdown_row("总得分", total2, 100, false, true)

func _add_breakdown_row(label: String, value: int, max_val: int, negative: bool = false, bold: bool = false) -> void:
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	breakdown_vbox.add_child(row)
	var l: Label = Label.new()
	l.text = label
	l.custom_minimum_size = Vector2(180, 0)
	if bold:
		l.add_theme_font_size_override("font_size", 18)
	row.add_child(l)
	var bar: ProgressBar = ProgressBar.new()
	bar.custom_minimum_size = Vector2(200, 20)
	bar.max_value = float(max_val)
	var bar_val: float = float(value) if not negative else 0.0
	bar.value = clamp(bar_val, 0, float(max_val))
	if negative:
		bar.add_theme_color_override("background_color", Color(0.9, 0.8, 0.8, 1))
		bar.add_theme_color_override("fill_color", Color(0.8, 0.3, 0.3, 1))
	row.add_child(bar)
	var v: Label = Label.new()
	var sign: String = "+" if value >= 0 else ""
	v.text = "%s%d / %d" % [sign, value, max_val]
	v.custom_minimum_size = Vector2(100, 0)
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	if bold:
		v.add_theme_font_size_override("font_size", 18)
	if negative:
		v.add_theme_color_override("font_color", Color(0.7, 0.2, 0.2, 1))
	row.add_child(v)

func _build_stats() -> void:
	for child in stats_vbox.get_children():
		child.queue_free()
	var time_taken: float = settlement_data.get("time_taken", 0)
	var time_limit: float = settlement_data.get("time_limit", 0)
	var mins: int = int(time_taken) / 60
	var secs: int = int(time_taken) % 60
	var tlmins: int = int(time_limit) / 60
	var tlsecs: int = int(time_limit) % 60
	_add_stat_row("⏱ 用时", "%d分%02d秒 / %d分%02d秒" % [mins, secs, tlmins, tlsecs])
	var s_result: float = settlement_data.get("strength_result", 0)
	var s_base: float = settlement_data.get("strength_base", 0)
	_add_stat_row("💪 纸张强度", "%.0f / %.0f（保留 %.0f%%）" % [
		s_result, s_base, s_result / max(1.0, s_base) * 100
	])
	var dmg_rep: int = settlement_data.get("damage_repaired", 0)
	var dmg_total: int = settlement_data.get("damage_total", 0)
	_add_stat_row("🔧 修复区域", "%d / %d" % [dmg_rep, dmg_total])

func _add_stat_row(label: String, value: String) -> void:
	var hbox: HBoxContainer = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 10)
	stats_vbox.add_child(hbox)
	var l: Label = Label.new()
	l.text = label
	l.custom_minimum_size = Vector2(140, 0)
	l.add_theme_font_size_override("font_size", 14)
	hbox.add_child(l)
	var v: Label = Label.new()
	v.text = value
	v.add_theme_font_size_override("font_size", 14)
	hbox.add_child(v)

func _build_materials() -> void:
	for child in materials_vbox.get_children():
		child.queue_free()
	var materials: Dictionary = settlement_data.get("materials_used", {})
	var total_cost: int = 0
	var papers: Dictionary = materials.get("paper", {})
	var glues: Dictionary = materials.get("glue", {})
	if papers.is_empty() and glues.is_empty():
		var l: Label = Label.new()
		l.text = "（无记录）"
		l.add_theme_font_size_override("font_size", 13)
		materials_vbox.add_child(l)
		return
	for pname in papers.keys():
		var count: int = papers[pname]
		var pinfo: Dictionary = LevelLoader.get_paper_by_name(pname)
		var cost: int = pinfo.get("cost", 0) * count
		total_cost += cost
		_add_material_row("📄 %s × %d" % [pname, count], cost)
	for gname in glues.keys():
		var count: int = glues[gname]
		var ginfo: Dictionary = LevelLoader.get_glue_by_name(gname)
		var cost: int = ginfo.get("cost", 0) * count
		total_cost += cost
		_add_material_row("🩹 %s × %d" % [gname, count], cost)
	var sep: HSeparator = HSeparator.new()
	materials_vbox.add_child(sep)
	var total_hbox: HBoxContainer = HBoxContainer.new()
	total_hbox.add_theme_constant_override("separation", 10)
	materials_vbox.add_child(total_hbox)
	var tl: Label = Label.new()
	tl.text = "合计成本"
	tl.add_theme_font_size_override("font_size", 14)
	tl.custom_minimum_size = Vector2(160, 0)
	total_hbox.add_child(tl)
	var tv: Label = Label.new()
	tv.text = "💰 %d 金" % total_cost
	tv.add_theme_font_size_override("font_size", 14)
	tv.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	total_hbox.add_child(tv)

func _add_material_row(label: String, cost: int) -> void:
	var hbox: HBoxContainer = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 10)
	materials_vbox.add_child(hbox)
	var l: Label = Label.new()
	l.text = label
	l.custom_minimum_size = Vector2(160, 0)
	l.add_theme_font_size_override("font_size", 13)
	hbox.add_child(l)
	var v: Label = Label.new()
	v.text = "💰 %d 金" % cost
	v.add_theme_font_size_override("font_size", 13)
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(v)

func _build_zones() -> void:
	for child in zones_vbox.get_children():
		child.queue_free()
	var zones: Array = settlement_data.get("zones_detail", [])
	for zd in zones:
		var panel: PanelContainer = PanelContainer.new()
		zones_vbox.add_child(panel)
		var vbox: VBoxContainer = VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 2)
		panel.add_child(vbox)
		var name_hbox: HBoxContainer = HBoxContainer.new()
		name_hbox.add_theme_constant_override("separation", 8)
		vbox.add_child(name_hbox)
		var mark: String = "✔" if zd.get("repaired", false) else "✘"
		var color: Color = Color(0.15, 0.55, 0.15, 1) if zd.get("repaired", false) else Color(0.7, 0.2, 0.2, 1)
		var nl: Label = Label.new()
		nl.text = "%s %s" % [mark, zd.get("zone_name", "")]
		nl.add_theme_font_size_override("font_size", 14)
		nl.add_theme_color_override("font_color", color)
		name_hbox.add_child(nl)
		var quality: float = zd.get("quality", 0.0)
		var steps_done: int = zd.get("steps", 0)
		var steps_total: int = zd.get("total_steps", 0)
		var ql: Label = Label.new()
		ql.text = "品质 %.0f%%  |  步骤 %d/%d" % [quality * 100, steps_done, steps_total]
		ql.add_theme_font_size_override("font_size", 12)
		vbox.add_child(ql)
		var errors: Array = zd.get("errors", [])
		if errors.size() > 0:
			var el: Label = Label.new()
			el.text = "⚠ 失误：%d 项" % errors.size()
			el.add_theme_font_size_override("font_size", 11)
			el.add_theme_color_override("font_color", Color(0.7, 0.2, 0.2, 1))
			vbox.add_child(el)

func _build_compare() -> void:
	for child in compare_hbox_inner.get_children():
		child.queue_free()
	var level_id: int = settlement_data.get("level_id", 0)
	var records: Array[Dictionary] = GameManager.get_codex_records_for_level(level_id)
	if records.size() <= 1:
		var hint: Label = Label.new()
		hint.text = "完成本关多次后可在此对比不同方案的材料消耗与得分。"
		hint.add_theme_font_size_override("font_size", 14)
		hint.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
		compare_hbox_inner.add_child(hint)
		return
	records.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a.get("timestamp", 0) < b.get("timestamp", 0))
	for idx in range(records.size()):
		var rec: Dictionary = records[idx]
		var panel: PanelContainer = PanelContainer.new()
		panel.custom_minimum_size = Vector2(150, 0)
		compare_hbox_inner.add_child(panel)
		var vbox: VBoxContainer = VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 4)
		panel.add_child(vbox)
		var title: Label = Label.new()
		var is_current: bool = (idx == records.size() - 1)
		title.text = "方案 %d%s" % [idx + 1, "（本次）" if is_current else ""]
		title.add_theme_font_size_override("font_size", 13)
		title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if is_current:
			title.add_theme_color_override("font_color", Color(0.85, 0.5, 0.1, 1))
		vbox.add_child(title)
		var sc: Label = Label.new()
		var s: int = rec.get("score", 0)
		var g: String = ScoringSystem.get_grade(s)
		sc.text = "得分：%d (%s)" % [s, g]
		sc.add_theme_font_size_override("font_size", 12)
		sc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(sc)
		var mu: Dictionary = rec.get("materials_used", {})
		var pc: int = 0
		var papers: Dictionary = mu.get("paper", {})
		for p in papers.keys():
			pc += papers[p]
		var gc: int = 0
		var glues: Dictionary = mu.get("glue", {})
		for gg in glues.keys():
			gc += glues[gg]
		var ml: Label = Label.new()
		ml.text = "📄%d + 🩹%d" % [pc, gc]
		ml.add_theme_font_size_override("font_size", 12)
		ml.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(ml)
		var tt: float = rec.get("time_taken", 0)
		var tl: Label = Label.new()
		tl.text = "⏱ %d分%02d秒" % [int(tt) / 60, int(tt) % 60]
		tl.add_theme_font_size_override("font_size", 11)
		tl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(tl)

func _on_retry_pressed() -> void:
	var level_id: int = settlement_data.get("level_id", 0)
	GameManager.start_level(level_id)

func _on_back_levels_pressed() -> void:
	GameManager.change_scene("LevelSelect")
