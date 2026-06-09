extends Control

var selected_level_id: int = 0

@onready var back_button: Button = $BackButton
@onready var level_select_option: OptionButton = $TabBar/RecordsTab/LevelSelectHBox/LevelSelectOption
@onready var record_count_label: Label = $TabBar/RecordsTab/LevelSelectHBox/RecordCountLabel
@onready var records_vbox: VBoxContainer = $TabBar/RecordsTab/RecordsScroll/RecordsVBox

@onready var paper_grid: GridContainer = $TabBar/MaterialsTab/PaperGrid
@onready var glue_grid: GridContainer = $TabBar/MaterialsTab/GlueGrid

@onready var tools_grid: GridContainer = $TabBar/ToolsTab/ToolsGrid

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	_build_level_select()
	_build_materials()
	_build_tools()
	level_select_option.item_selected.connect(_on_level_selected)
	if selected_level_id > 0:
		_build_records(selected_level_id)

func _build_level_select() -> void:
	level_select_option.clear()
	var all_levels: Array[Dictionary] = LevelLoader.get_all_levels()
	var first_id: int = 0
	for level in all_levels:
		var lid: int = level.get("id", 0)
		if lid in GameManager.unlocked_levels:
			level_select_option.add_item("[%d] %s" % [lid, level.get("name", "")], lid)
			if first_id == 0:
				first_id = lid
	if first_id > 0:
		selected_level_id = first_id
		level_select_option.selected = 0

func _on_level_selected(idx: int) -> void:
	selected_level_id = level_select_option.get_item_id(idx)
	_build_records(selected_level_id)

func _build_records(level_id: int) -> void:
	for child in records_vbox.get_children():
		child.queue_free()
	var records: Array[Dictionary] = GameManager.get_codex_records_for_level(level_id)
	record_count_label.text = "记录数：%d" % records.size()
	if records.is_empty():
		var none: Label = Label.new()
		none.text = "\n\n本关暂无修复记录。\n完成关卡后可在此查看并对比不同方案的材料消耗与得分。\n"
		none.add_theme_font_size_override("font_size", 18)
		none.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		none.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
		records_vbox.add_child(none)
		return
	records.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a.get("score", 0) > b.get("score", 0))
	var best_score: int = records[0].get("score", 0) if records.size() > 0 else 0
	var best_cost: int = 99999
	for rec in records:
		var cost = _calc_cost(rec.get("materials_used", {}))
		if cost < best_cost and rec.get("score", 0) >= 60:
			best_cost = cost
	for idx in range(records.size()):
		var rec: Dictionary = records[idx]
		var panel: PanelContainer = PanelContainer.new()
		records_vbox.add_child(panel)
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 20)
		panel.add_child(hbox)
		var left: VBoxContainer = VBoxContainer.new()
		left.custom_minimum_size = Vector2(140, 0)
		left.add_theme_constant_override("separation", 4)
		hbox.add_child(left)
		var rank_hbox: HBoxContainer = HBoxContainer.new()
		rank_hbox.add_theme_constant_override("separation", 8)
		left.add_child(rank_hbox)
		var rank: Label = Label.new()
		var is_best: bool = rec.get("score", 0) == best_score
		rank.text = "#%d" % (idx + 1)
		rank.add_theme_font_size_override("font_size", 20)
		if is_best:
			rank.add_theme_color_override("font_color", Color(0.85, 0.6, 0.1, 1))
		rank_hbox.add_child(rank)
		if is_best:
			var crown: Label = Label.new()
			crown.text = "👑"
			crown.add_theme_font_size_override("font_size", 20)
			rank_hbox.add_child(crown)
		var sc: int = rec.get("score", 0)
		var gr: String = ScoringSystem.get_grade(sc)
		var score_label: Label = Label.new()
		score_label.text = "%d 分  %s" % [sc, gr]
		score_label.add_theme_font_size_override("font_size", 22)
		if is_best:
			score_label.add_theme_color_override("font_color", Color(0.85, 0.5, 0.1, 1))
		left.add_child(score_label)
		var ts: int = rec.get("timestamp", 0)
		var time_str: String = Time.get_date_string_from_unix_time(ts)
		var tl: Label = Label.new()
		tl.text = time_str
		tl.add_theme_font_size_override("font_size", 12)
		tl.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
		left.add_child(tl)
		var center: VBoxContainer = VBoxContainer.new()
		center.custom_minimum_size = Vector2(400, 0)
		center.add_theme_constant_override("separation", 4)
		hbox.add_child(center)
		var row1: HBoxContainer = HBoxContainer.new()
		row1.add_theme_constant_override("separation", 20)
		center.add_child(row1)
		var tt: float = rec.get("time_taken", 0)
		var ttl: Label = Label.new()
		ttl.text = "⏱ %d分%02d秒" % [int(tt) / 60, int(tt) % 60]
		ttl.add_theme_font_size_override("font_size", 14)
		row1.add_child(ttl)
		var sresult: float = rec.get("strength_result", 0)
		var sl: Label = Label.new()
		sl.text = "💪 强度 %.0f" % sresult
		sl.add_theme_font_size_override("font_size", 14)
		row1.add_child(sl)
		var drep: int = rec.get("damage_repaired", 0)
		var dl: Label = Label.new()
		dl.text = "🔧 %d处" % drep
		dl.add_theme_font_size_override("font_size", 14)
		row1.add_child(dl)
		var mu: Dictionary = rec.get("materials_used", {})
		var row2: HBoxContainer = HBoxContainer.new()
		row2.add_theme_constant_override("separation", 15)
		center.add_child(row2)
		var papers: Dictionary = mu.get("paper", {})
		for pname in papers.keys():
			var pl: Label = Label.new()
			pl.text = "📄%s×%d" % [pname, papers[pname]]
			pl.add_theme_font_size_override("font_size", 13)
			row2.add_child(pl)
		var glues: Dictionary = mu.get("glue", {})
		for gname in glues.keys():
			var gl: Label = Label.new()
			gl.text = "🩹%s×%d" % [gname, glues[gname]]
			gl.add_theme_font_size_override("font_size", 13)
			row2.add_child(gl)
		var right: VBoxContainer = VBoxContainer.new()
		right.custom_minimum_size = Vector2(160, 0)
		right.alignment = BoxContainer.ALIGNMENT_CENTER
		hbox.add_child(right)
		var cost: int = _calc_cost(mu)
		var cost_label: Label = Label.new()
		cost_label.text = "💰 成本 %d 金" % cost
		cost_label.add_theme_font_size_override("font_size", 16)
		cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		if cost == best_cost and sc >= 60:
			cost_label.add_theme_color_override("font_color", Color(0.2, 0.55, 0.2, 1))
			var tag: Label = Label.new()
			tag.text = "🏆 最低成本"
			tag.add_theme_font_size_override("font_size", 12)
			tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
			right.add_child(tag)
		right.add_child(cost_label)

func _calc_cost(materials: Dictionary) -> int:
	var cost: int = 0
	var papers: Dictionary = materials.get("paper", {})
	for pname in papers.keys():
		var pinfo: Dictionary = LevelLoader.get_paper_by_name(pname)
		cost += pinfo.get("cost", 0) * papers[pname]
	var glues: Dictionary = materials.get("glue", {})
	for gname in glues.keys():
		var ginfo: Dictionary = LevelLoader.get_glue_by_name(gname)
		cost += ginfo.get("cost", 0) * glues[gname]
	return cost

func _build_materials() -> void:
	var papers: Array[Dictionary] = LevelLoader.get_all_papers()
	for p in papers:
		_add_material_card(paper_grid, p, "paper")
	var glues: Array[Dictionary] = LevelLoader.get_all_glues()
	for g in glues:
		_add_material_card(glue_grid, g, "glue")

func _add_material_card(grid: GridContainer, data: Dictionary, mtype: String) -> void:
	var panel: PanelContainer = PanelContainer.new()
	panel.custom_minimum_size = Vector2(400, 110)
	grid.add_child(panel)
	var hbox: HBoxContainer = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 16)
	panel.add_child(hbox)
	var color_rect: ColorRect = ColorRect.new()
	color_rect.custom_minimum_size = Vector2(90, 90)
	var color_str: String = data.get("color", "#f0e6d2")
	color_rect.color = Color(color_str)
	hbox.add_child(color_rect)
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 3)
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(vbox)
	var name_hbox: HBoxContainer = HBoxContainer.new()
	name_hbox.add_theme_constant_override("separation", 10)
	vbox.add_child(name_hbox)
	var name: Label = Label.new()
	name.text = data.get("name", "")
	name.add_theme_font_size_override("font_size", 18)
	name_hbox.add_child(name)
	var cost: Label = Label.new()
	cost.text = "💰 %d金" % data.get("cost", 0)
	cost.add_theme_font_size_override("font_size", 14)
	cost.add_theme_color_override("font_color", Color(0.7, 0.5, 0.1, 1))
	name_hbox.add_child(cost)
	var desc: Label = Label.new()
	desc.text = data.get("description", "")
	desc.add_theme_font_size_override("font_size", 12)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(desc)
	var stats_hbox: HBoxContainer = HBoxContainer.new()
	stats_hbox.add_theme_constant_override("separation", 15)
	vbox.add_child(stats_hbox)
	if mtype == "paper":
		var st: Label = Label.new()
		st.text = "强度：%d" % data.get("strength", 0)
		st.add_theme_font_size_override("font_size", 12)
		stats_hbox.add_child(st)
		var comp: Array = data.get("compatibility", [])
		var cpl: Label = Label.new()
		cpl.text = "兼容：%s" % (", ".join(comp) if comp.size() > 0 else "-")
		cpl.add_theme_font_size_override("font_size", 12)
		stats_hbox.add_child(cpl)
	elif mtype == "glue":
		var adh: Label = Label.new()
		adh.text = "粘合力：%d" % data.get("adhesion", 0)
		adh.add_theme_font_size_override("font_size", 12)
		stats_hbox.add_child(adh)
		var rev: Label = Label.new()
		rev.text = "可逆性：%d" % data.get("reversibility", 0)
		rev.add_theme_font_size_override("font_size", 12)
		stats_hbox.add_child(rev)

func _build_tools() -> void:
	var tools: Array[Dictionary] = LevelLoader.get_all_tools()
	for t in tools:
		var panel: PanelContainer = PanelContainer.new()
		panel.custom_minimum_size = Vector2(340, 160)
		tools_grid.add_child(panel)
		var vbox: VBoxContainer = VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 6)
		panel.add_child(vbox)
		var icon_hbox: HBoxContainer = HBoxContainer.new()
		icon_hbox.add_theme_constant_override("separation", 12)
		vbox.add_child(icon_hbox)
		var icon: Label = Label.new()
		icon.text = t.get("icon", "🛠")
		icon.add_theme_font_size_override("font_size", 36)
		icon_hbox.add_child(icon)
		var name_vbox: VBoxContainer = VBoxContainer.new()
		name_vbox.add_theme_constant_override("separation", 2)
		icon_hbox.add_child(name_vbox)
		var name: Label = Label.new()
		name.text = t.get("name", "")
		name.add_theme_font_size_override("font_size", 20)
		name_vbox.add_child(name)
		var ul: int = t.get("unlock_level", 1)
		var unlock_label: Label = Label.new()
		var is_unlocked: bool = ul in GameManager.unlocked_levels or ul <= 3
		if is_unlocked:
			unlock_label.text = "✔ 第%d章解锁（已解锁）" % ul
			unlock_label.add_theme_color_override("font_color", Color(0.2, 0.55, 0.2, 1))
		else:
			unlock_label.text = "🔒 第%d章解锁" % ul
			unlock_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
		unlock_label.add_theme_font_size_override("font_size", 13)
		name_vbox.add_child(unlock_label)
		var desc: Label = Label.new()
		desc.text = t.get("description", "")
		desc.add_theme_font_size_override("font_size", 13)
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vbox.add_child(desc)
		var action_label: Label = Label.new()
		action_label.text = "对应操作：%s" % {
			"humidify": "加湿",
			"cut": "裁纸",
			"align": "对齐",
			"paste": "粘胶",
			"press": "按压"
		}.get(t.get("action", ""), t.get("action", ""))
		action_label.add_theme_font_size_override("font_size", 12)
		action_label.add_theme_color_override("font_color", Color(0.3, 0.45, 0.7, 1))
		vbox.add_child(action_label)

func _on_back_pressed() -> void:
	GameManager.change_scene("MainMenu")
