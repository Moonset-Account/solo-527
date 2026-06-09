extends Control
## 关卡选择界面 - 章节卡片 + 关卡列表

var _chapters_tab: TabContainer
var _levels_scroll: ScrollContainer
var _levels_grid: GridContainer
var _detail_panel: PanelContainer
var _detail_label: Label
var _hint_bar: HBoxContainer
var _back_btn: Button
var _start_btn: Button
var _deck_btn: Button
var _selected_level_id: String = ""

func _ready() -> void:
	_build_ui()
	_build_chapter_tabs()
	_refresh_levels(_chapters_tab.get_current_tab_control().name if _chapters_tab.get_tab_count() > 0 else "chapter_1")
	_refresh_hint_bar()
	InputManager.method_changed.connect(func(_m): _refresh_hint_bar())

func _build_ui() -> void:
	for c in get_children(): c.queue_free()
	var bg: ColorRect = ColorRect.new()
	bg.color = Color(0.08, 0.07, 0.06, 1)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var margin: MarginContainer = MarginContainer.new()
	margin.anchor_right = 1.0
	margin.anchor_bottom = 1.0
	margin.add_theme_constant_override("margin_left", 32)
	margin.add_theme_constant_override("margin_right", 32)
	margin.add_theme_constant_override("margin_top", 24)
	margin.add_theme_constant_override("margin_bottom", 24)
	add_child(margin)

	var root: VBoxContainer = VBoxContainer.new()
	root.add_theme_constant_override("separation", 16)
	margin.add_child(root)

	var topbar: HBoxContainer = HBoxContainer.new()
	topbar.add_theme_constant_override("separation", 12)
	_back_btn = Button.new()
	_back_btn.text = "← 返回"
	_back_btn.add_theme_font_size_override("font_size", 16)
	_back_btn.pressed.connect(_on_back)
	topbar.add_child(_back_btn)
	var title: Label = Label.new()
	title.text = "选择关卡"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	topbar.add_child(title)
	_deck_btn = Button.new()
	_deck_btn.text = "🃏 卡组"
	_deck_btn.add_theme_font_size_override("font_size", 16)
	_deck_btn.pressed.connect(_on_view_deck)
	topbar.add_child(_deck_btn)
	root.add_child(topbar)

	var main_hbox: HBoxContainer = HBoxContainer.new()
	main_hbox.add_theme_constant_override("separation", 20)
	main_hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(main_hbox)

	var left_col: VBoxContainer = VBoxContainer.new()
	left_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_col.add_theme_constant_override("separation", 12)
	main_hbox.add_child(left_col)

	_chapters_tab = TabContainer.new()
	_chapters_tab.tab_alignment = BoxContainer.ALIGNMENT_BEGIN
	_chapters_tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_chapters_tab.tab_changed.connect(_on_tab_changed)
	left_col.add_child(_chapters_tab)

	_levels_scroll = ScrollContainer.new()
	_levels_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_levels_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_levels_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	left_col.add_child(_levels_scroll)
	_levels_grid = GridContainer.new()
	_levels_grid.columns = 2
	_levels_grid.add_theme_constant_override("h_separation", 16)
	_levels_grid.add_theme_constant_override("v_separation", 16)
	_levels_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_levels_scroll.add_child(_levels_grid)

	_detail_panel = PanelContainer.new()
	_detail_panel.custom_minimum_size = Vector2(360, 0)
	_detail_panel.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.14, 0.12, 0.1, 1)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_right = 10
	sb.corner_radius_bottom_left = 10
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(0.45, 0.32, 0.18, 0.6)
	sb.content_margin_left = 20
	sb.content_margin_right = 20
	sb.content_margin_top = 20
	sb.content_margin_bottom = 20
	_detail_panel.add_theme_stylebox_override("panel", sb)
	var dv: VBoxContainer = VBoxContainer.new()
	dv.add_theme_constant_override("separation", 12)
	_detail_panel.add_child(dv)
	var dtl: Label = Label.new()
	dtl.text = "关卡详情"
	dtl.add_theme_font_size_override("font_size", 22)
	dtl.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	dv.add_child(dtl)
	var sep: HSeparator = HSeparator.new()
	dv.add_child(sep)
	_detail_label = Label.new()
	_detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_detail_label.add_theme_font_size_override("font_size", 15)
	_detail_label.add_theme_color_override("font_color", Color(0.82, 0.78, 0.68, 1))
	_detail_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	dv.add_child(_detail_label)
	var ds: HSeparator = HSeparator.new()
	dv.add_child(ds)
	_start_btn = Button.new()
	_start_btn.text = "▶  开始战斗"
	_start_btn.add_theme_font_size_override("font_size", 20)
	_start_btn.disabled = true
	_start_btn.pressed.connect(_on_start_battle)
	dv.add_child(_start_btn)
	main_hbox.add_child(_detail_panel)

	_hint_bar = HBoxContainer.new()
	_hint_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	_hint_bar.add_theme_constant_override("separation", 32)
	root.add_child(_hint_bar)

func _build_chapter_tabs() -> void:
	var ch_ids: Array = LevelDatabase.all_chapter_ids()
	for cid in ch_ids:
		var ch: Dictionary = LevelDatabase.get_chapter(cid)
		var unlocked: bool = cid in SaveManager.global_data.get("unlocked_chapters", [])
		if not unlocked and cid != "chapter_1":
			continue
		var scroll: ScrollContainer = ScrollContainer.new()
		scroll.name = cid
		var lbl: Label = Label.new()
		lbl.text = ch.get("name", cid)
		lbl.add_theme_font_size_override("font_size", 16)
		_chapters_tab.add_child(scroll)
		_chapters_tab.set_tab_title(_chapters_tab.get_tab_count() - 1, ch.get("name", cid))

func _on_tab_changed(tab_idx: int) -> void:
	var ctrl: Control = _chapters_tab.get_tab_control(tab_idx)
	if ctrl:
		_refresh_levels(ctrl.name)

func _refresh_levels(chapter_id: String) -> void:
	for c in _levels_grid.get_children(): c.queue_free()
	_selected_level_id = ""
	var levels: Array = LevelDatabase.levels_in_chapter(chapter_id)
	var total_ch_stars: int = 0
	var ch: Dictionary = LevelDatabase.get_chapter(chapter_id)
	var theme_c: Color = ch.get("theme_color", Color(0.45, 0.32, 0.18))
	for lid in levels:
		var lv: Dictionary = LevelDatabase.get_level(lid)
		var unlocked: bool = LevelDatabase.is_level_unlocked(lid)
		var stars: int = SaveManager.get_level_stars(lid)
		total_ch_stars += stars
		var card: Control = _make_level_card(lid, lv, unlocked, stars, theme_c)
		_levels_grid.add_child(card)
	_update_detail("（未选择）\n\n请点击左侧的关卡卡片查看详情。")
	_start_btn.disabled = true

func _make_level_card(lid: String, lv: Dictionary, unlocked: bool, stars: int, theme: Color) -> Control:
	var btn: Button = Button.new()
	btn.custom_minimum_size = Vector2(0, 130)
	btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn.disabled = not unlocked
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = theme.darkened(0.6) if unlocked else Color(0.18, 0.16, 0.14, 1)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_right = 10
	sb.corner_radius_bottom_left = 10
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = theme.lightened(0.2) if unlocked else Color(0.3, 0.28, 0.26, 1)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 14
	sb.content_margin_bottom = 14
	btn.add_theme_stylebox_override("normal", sb)
	var sbh: StyleBoxFlat = sb.duplicate()
	sbh.bg_color = theme.darkened(0.4)
	sbh.border_color = Color.WHITE
	btn.add_theme_stylebox_override("hover", sbh)
	var sbp: StyleBoxFlat = sb.duplicate()
	sbp.bg_color = theme.darkened(0.7)
	btn.add_theme_stylebox_override("pressed", sbp)
	var sbd: StyleBoxFlat = sb.duplicate()
	sbd.bg_color = Color(0.16, 0.14, 0.12, 1)
	sbd.border_color = Color(0.25, 0.23, 0.2, 1)
	btn.add_theme_stylebox_override("disabled", sbd)

	var vb: VBoxContainer = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 6)
	btn.add_child(vb)
	var top: HBoxContainer = HBoxContainer.new()
	var nm: Label = Label.new()
	nm.text = lv.get("name", lid)
	nm.add_theme_font_size_override("font_size", 18)
	nm.add_theme_color_override("font_color", Color.WHITE if unlocked else Color(0.5, 0.5, 0.5, 1))
	nm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(nm)
	var diff: Label = Label.new()
	diff.text = ("难度 " + "★" * int(lv.get("difficulty", 1)))
	diff.add_theme_font_size_override("font_size", 14)
	diff.add_theme_color_override("font_color", Color(0.95, 0.75, 0.4, 1))
	top.add_child(diff)
	vb.add_child(top)

	var desc: Label = Label.new()
	desc.text = lv.get("description", "") if unlocked else "🔒 完成前一关卡后解锁"
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.add_theme_font_size_override("font_size", 13)
	desc.add_theme_color_override("font_color", Color(0.75, 0.7, 0.6, 1) if unlocked else Color(0.45, 0.45, 0.45, 1))
	desc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(desc)

	var bot: HBoxContainer = HBoxContainer.new()
	var st: Label = Label.new()
	st.text = _stars_str(stars)
	st.add_theme_font_size_override("font_size", 16)
	bot.add_child(st)
	var sp: Control = Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bot.add_child(sp)
	var boss_marker: Label = Label.new()
	if lv.get("is_boss", false):
		boss_marker.text = "👑 BOSS"
		boss_marker.add_theme_color_override("font_color", Color(1, 0.6, 0.3, 1))
		boss_marker.add_theme_font_size_override("font_size", 14)
	else:
		var exh_count: int = lv.get("exhibits", []).size()
		boss_marker.text = ("🖼️ 展品x%d  |  ⏱️ %d回合" % [exh_count, int(lv.get("turn_limit", 0))])
		boss_marker.add_theme_color_override("font_color", Color(0.6, 0.85, 0.9, 1))
		boss_marker.add_theme_font_size_override("font_size", 13)
	bot.add_child(boss_marker)
	vb.add_child(bot)

	btn.pressed.connect(func(): _on_level_selected(lid))
	return btn

func _stars_str(stars: int) -> String:
	var full: String = "★" * stars
	var empty: String = "☆" * max(0, 3 - stars)
	return full + empty

func _on_level_selected(lid: String) -> void:
	GameEvents.sfx_requested.emit("ui_accept", -4.0)
	_selected_level_id = lid
	var lv: Dictionary = LevelDatabase.get_level(lid)
	var exh_info: String = ""
	var i: int = 1
	for e in lv.get("exhibits", []):
		var st_text: String = ""
		for s in e.get("statuses", []):
			st_text += "%s x%d  " % [_status_cn(String(s.get("type", ""))), int(s.get("value", 0))]
		exh_info += ("\n  %d. 🖼️ 『%s』 完整度 0/%d\n     初始病害: %s\n     修复奖励: +%d 预算" % [
			i, e.get("name", ""), int(e.get("max_integrity", 0)),
			st_text if st_text != "" else "（无）",
			int(e.get("reward_budget", 0))])
		i += 1
	var reward_pool: Array = lv.get("reward_cards_pool", [])
	var rc: int = int(lv.get("reward_card_count", 0))
	var rb: int = int(lv.get("reward_budget", 0))
	var rw_txt: String = ""
	for rid in reward_pool:
		var c: Dictionary = CardDatabase.get_card(rid)
		rw_txt += ("\n     · %s [%s] - %s" % [c.get("name", rid), CardDatabase.type_name(int(c.get("type", 0))), c.get("desc", "")])
	_update_detail(
		"【%s】\n难度 %s ｜ 回合上限: %d｜起始预算: %d/回合\n%s\n\n修复目标:%s\n\n通关奖励:\n  💎 完成可选卡牌: %d 选 1%s\n  🪙 全局货币奖励: %d" % [
		lv.get("name", lid),
		"★" * int(lv.get("difficulty", 1)),
		int(lv.get("turn_limit", 0)),
		int(lv.get("budget_per_turn", 0)),
		lv.get("description", ""),
		exh_info,
		rc,
		rw_txt if rw_txt != "" else "",
		rb])
	_start_btn.disabled = false

func _status_cn(t: String) -> String:
	match t:
		"dirt": return "污渍"
		"rust": return "铜锈"
		"mold": return "霉变"
		"crack": return "裂隙"
		"brittle": return "脆化"
		"peeling": return "起翘"
		"vulnerable": return "易修复"
	return t

func _update_detail(text: String) -> void:
	_detail_label.text = text

func _refresh_hint_bar() -> void:
	for c in _hint_bar.get_children(): c.queue_free()
	var hints: Array = [
		["ui_accept", "选择/进入"],
		["ui_cancel", "返回"],
		["ui_left", "切换章节(左)"],
		["ui_right", "切换章节(右)"],
	]
	for h in hints:
		var box: HBoxContainer = HBoxContainer.new()
		box.add_theme_constant_override("separation", 6)
		var k: Label = Label.new()
		k.text = ("[%s]" % InputManager.get_hint(h[0]))
		k.add_theme_color_override("font_color", Color(0.95, 0.8, 0.4, 1))
		k.add_theme_font_size_override("font_size", 14)
		box.add_child(k)
		var d: Label = Label.new()
		d.text = h[1]
		d.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1))
		d.add_theme_font_size_override("font_size", 14)
		box.add_child(d)
		_hint_bar.add_child(box)

func _on_back() -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	SaveManager.save_current()
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _on_view_deck() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	_show_deck_viewer()

func _show_deck_viewer() -> void:
	var w: Window = Window.new()
	w.title = "当前卡组"
	w.unresizable = false
	w.min_size = Vector2i(640, 480)
	w.size = Vector2i(800, 560)
	var sv: ScrollContainer = ScrollContainer.new()
	sv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sv.size_flags_vertical = Control.SIZE_EXPAND_FILL
	w.add_child(sv)
	var grid: GridContainer = GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sv.add_child(grid)
	var deck: Array = SaveManager.get_current_deck()
	var counts: Dictionary = {}
	for cid in deck:
		counts[cid] = counts.get(cid, 0) + 1
	for cid in counts.keys():
		var c: Dictionary = CardDatabase.get_card(cid)
		var cnt: int = int(counts[cid])
		var pc: PanelContainer = PanelContainer.new()
		pc.custom_minimum_size = Vector2(170, 220)
		var ssb: StyleBoxFlat = StyleBoxFlat.new()
		ssb.bg_color = CardDatabase.type_color(int(c.get("type", 0))).darkened(0.6)
		ssb.corner_radius_top_left = 8
		ssb.corner_radius_top_right = 8
		ssb.corner_radius_bottom_right = 8
		ssb.corner_radius_bottom_left = 8
		ssb.border_width_left = 2
		ssb.border_width_right = 2
		ssb.border_width_top = 2
		ssb.border_width_bottom = 2
		ssb.border_color = CardDatabase.rarity_color(int(c.get("rarity", 0)))
		ssb.content_margin_left = 10
		ssb.content_margin_right = 10
		ssb.content_margin_top = 10
		ssb.content_margin_bottom = 10
		pc.add_theme_stylebox_override("panel", ssb)
		var v: VBoxContainer = VBoxContainer.new()
		v.add_theme_constant_override("separation", 4)
		pc.add_child(v)
		var t: Label = Label.new()
		t.text = ("%s (x%d)" % [c.get("name", ""), cnt])
		t.add_theme_font_size_override("font_size", 14)
		t.add_theme_color_override("font_color", Color.WHITE)
		v.add_child(t)
		var type_lbl: Label = Label.new()
		type_lbl.text = ("%s  |  %s  |  费用 %d" % [CardDatabase.type_name(int(c.get("type", 0))),
			["普","稀","史","传"][int(c.get("rarity", 0))], int(c.get("cost", 0))])
		type_lbl.add_theme_font_size_override("font_size", 11)
		type_lbl.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85, 1))
		v.add_child(type_lbl)
		var d: Label = Label.new()
		d.text = c.get("desc", "")
		d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		d.add_theme_font_size_override("font_size", 11)
		d.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9, 1))
		d.size_flags_vertical = Control.SIZE_EXPAND_FILL
		v.add_child(d)
		grid.add_child(pc)
	w.close_requested.connect(w.queue_free)
	get_tree().root.add_child(w)
	w.popup_centered()

func _on_start_battle() -> void:
	if _selected_level_id == "":
		return
	GameEvents.sfx_requested.emit("ui_accept", -2.0)
	SaveManager.save_current()
	var f := FileAccess.open("user://current_level.tmp", FileAccess.WRITE)
	if f:
		f.store_line(_selected_level_id)
		f.close()
	get_tree().change_scene_to_file("res://scenes/BattleScene.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_back()
	elif event.is_action_pressed("game_toggle_settings"):
		_push_settings()

func _push_settings() -> void:
	var prev: String = get_tree().current_scene.scene_file_path
	var f := FileAccess.open("user://prev_scene.tmp", FileAccess.WRITE)
	if f: f.store_line(prev); f.close()
	get_tree().change_scene_to_file("res://scenes/SettingsPage.tscn")
