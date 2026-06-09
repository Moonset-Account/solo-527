extends Control

class_name StatsView

signal back_requested()

var _tab_container: TabContainer
var _global_stats_panel: VBoxContainer
var _slot_stats_panel: VBoxContainer
var _card_stats_panel: VBoxContainer
var _hint_bar: Label

func _ready() -> void:
	_build_ui()
	_refresh_stats()
	if InputManager:
		InputManager.method_changed.connect(_on_input_method_changed)

func _build_ui() -> void:
	for c in get_children():
		c.queue_free()
	anchor_right = 1.0
	anchor_bottom = 1.0

	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.06, 0.04)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var vb := VBoxContainer.new()
	vb.anchor_left = 0.02
	vb.anchor_top = 0.03
	vb.anchor_right = 0.98
	vb.anchor_bottom = 0.92
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.add_theme_constant_override("separation", 12)
	add_child(vb)

	var title_bar := HBoxContainer.new()
	title_bar.add_theme_constant_override("separation", 20)
	vb.add_child(title_bar)

	var title_lbl := Label.new()
	title_lbl.text = "📊 数据记录"
	title_lbl.add_theme_font_size_override("font_size", 32)
	title_lbl.modulate = Color(0.93, 0.84, 0.55)
	title_bar.add_child(title_lbl)

	title_bar.add_spacer()

	var back_btn := Button.new()
	back_btn.text = "← 返回  [%s]" % InputManager.get_hint("ui_cancel")
	_style_button(back_btn, Color(0.25, 0.18, 0.1), Color(0.93, 0.84, 0.55))
	back_btn.pressed.connect(_on_back_pressed)
	title_bar.add_child(back_btn)

	_tab_container = TabContainer.new()
	_tab_container.tab_alignment = BoxContainer.ALIGNMENT_CENTER
	_tab_container.add_theme_font_size_override("font_size", 18)
	vb.add_child(_tab_container)

	_global_stats_panel = _make_tab_panel("📈 全局统计")
	_slot_stats_panel = _make_tab_panel("💾 各存档槽位")
	_card_stats_panel = _make_tab_panel("🃏 卡牌使用统计")

	_hint_bar = Label.new()
	_hint_bar.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hint_bar.add_theme_font_size_override("font_size", 14)
	_hint_bar.modulate = Color(0.7, 0.65, 0.5)
	_refresh_hint_bar()
	vb.add_child(_hint_bar)

func _make_tab_panel(tab_name: String) -> VBoxContainer:
	var sc := ScrollContainer.new()
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_tab_container.add_child(sc)
	_tab_container.set_tab_title(_tab_container.get_tab_count() - 1, tab_name)

	var panel := VBoxContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.add_theme_constant_override("separation", 8)
	sc.add_child(panel)
	return panel

func _refresh_stats() -> void:
	_refresh_global_stats()
	_refresh_slot_stats()
	_refresh_card_stats()

func _refresh_global_stats() -> void:
	for c in _global_stats_panel.get_children():
		c.queue_free()

	var gs: Dictionary = SaveManager.get_global_stats()

	_add_section_title(_global_stats_panel, "🏛️ 博物馆档案")
	_add_stat_row(_global_stats_panel, "总游玩时长", _format_duration(int(gs.get("play_time_seconds", 0))))
	_add_stat_row(_global_stats_panel, "累计获得星数", "%d ⭐" % SaveManager.get_total_stars())
	_add_stat_row(_global_stats_panel, "总战斗次数", "%d 次" % int(gs.get("total_battles", 0)))
	_add_stat_row(_global_stats_panel, "总胜利次数", "%d 次" % int(gs.get("total_victories", 0)))
	_add_stat_row(_global_stats_panel, "累计打出卡牌", "%d 张" % int(gs.get("cards_played_total", 0)))
	_add_stat_row(_global_stats_panel, "累计展品修复", "%d 件" % int(gs.get("exhibits_restored", 0)))

	_add_section_title(_global_stats_panel, "🃏 卡牌收藏")
	var collection: Array = SaveManager.get_unlocked_cards()
	var all_ids: Array = CardDatabase.get_all_card_ids()
	_add_stat_row(_global_stats_panel, "已解锁卡牌", "%d / %d" % [collection.size(), all_ids.size()])
	var most_used: String = String(gs.get("most_used_card", ""))
	if most_used != "" and CardDatabase.card_exists(most_used):
		var mc: Dictionary = CardDatabase.get_card(most_used)
		_add_stat_row(_global_stats_panel, "使用最多卡牌", mc.get("name", most_used))

	_add_section_title(_global_stats_panel, "📖 章节进度")
	for ch_id in SaveManager.get_unlocked_chapters():
		var ch: Dictionary = LevelDatabase.get_chapter(ch_id)
		if ch.is_empty():
			continue
		_add_stat_row(_global_stats_panel, "已解锁章节", "%s - %s" % [ch_id, ch.get("name", "")])

func _refresh_slot_stats() -> void:
	for c in _slot_stats_panel.get_children():
		c.queue_free()

	for i in range(SaveManager.SLOT_COUNT):
		var slot: Dictionary = SaveManager.get_slot_data(i)
		var exists: bool = bool(slot.get("exists", false))

		var slot_box := VBoxContainer.new()
		slot_box.add_theme_constant_override("separation", 6)

		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0.14, 0.11, 0.08)
		sb.border_color = Color(0.6, 0.5, 0.3)
		sb.border_width_left = 2
		sb.border_width_top = 2
		sb.border_width_right = 2
		sb.border_width_bottom = 2
		sb.corner_radius_top_left = 8
		sb.corner_radius_top_right = 8
		sb.corner_radius_bottom_left = 8
		sb.corner_radius_bottom_right = 8
		sb.content_margin_left = 12
		sb.content_margin_top = 10
		sb.content_margin_right = 12
		sb.content_margin_bottom = 10

		var p := Panel.new()
		p.custom_minimum_size = Vector2(0, 150)
		p.add_theme_stylebox_override("panel", sb)
		var pv := VBoxContainer.new()
		pv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		pv.add_theme_constant_override("separation", 4)
		p.add_child(pv)
		_slot_stats_panel.add_child(p)

		var title := Label.new()
		var t_str: String = ""
		if exists:
			var tm: int = int(slot.get("timestamp", 0))
			if tm > 0:
				var d: Dictionary = Time.get_datetime_dict_from_unix_time(tm, true)
				t_str = "%04d-%02d-%02d %02d:%02d" % [d.year, d.month, d.day, d.hour, d.minute]
		title.text = "💾 存档槽位 %d%s" % [i + 1, (" - " + t_str) if exists and t_str != "" else (" - (空)" if not exists else "")]
		title.add_theme_font_size_override("font_size", 18)
		title.modulate = Color(0.93, 0.84, 0.55)
		pv.add_child(title)

		if exists:
			var ss: Dictionary = slot.get("statistics", {})
			var total_slot_stars: int = 0
			var ch_prog: Dictionary = slot.get("chapter_progress", {})
			for ch_id in ch_prog.keys():
				var chd: Dictionary = ch_prog[ch_id]
				var cpl: Dictionary = chd.get("completed_levels", {})
				for lv_st in cpl.values():
					total_slot_stars += int(lv_st)
			var deck: Array = slot.get("player_deck", [])
			var coll: Array = slot.get("player_collection", [])
			_add_stat_row(pv, "  星数", "%d ⭐" % total_slot_stars)
			_add_stat_row(pv, "  战斗/胜利", "%d / %d 次" % [int(ss.get("battles", 0)), int(ss.get("wins", 0))])
			_add_stat_row(pv, "  修复展品", "%d 件" % int(ss.get("exhibits_restored", 0)))
			_add_stat_row(pv, "  打出卡牌", "%d 张" % int(ss.get("cards_played", 0)))
			_add_stat_row(pv, "  卡组大小", "%d 张" % deck.size())
			_add_stat_row(pv, "  收藏大小", "%d 张" % coll.size())
			var prog_str := ""
			for ch_id in ch_prog.keys():
				var pd: Dictionary = ch_prog[ch_id]
				var cpl: Dictionary = pd.get("completed_levels", {})
				var ch_stars: int = 0
				for st in cpl.values():
					ch_stars += int(st)
				prog_str += "%s:%d⭐ " % [ch_id, ch_stars]
			if prog_str != "":
				_add_stat_row(pv, "  章节进度", prog_str)

		var sep := HSeparator.new()
		sep.modulate = Color(0.3, 0.25, 0.15)
		_slot_stats_panel.add_child(sep)

func _refresh_card_stats() -> void:
	for c in _card_stats_panel.get_children():
		c.queue_free()

	_add_section_title(_card_stats_panel, "🃏 卡牌使用排行 (根据次数)")
	var usage: Dictionary = SaveManager.get_global_stats().get("card_usage_count", {})
	var card_ids_sorted: Array = CardDatabase.get_all_card_ids()
	card_ids_sorted.sort_custom(func(a: String, b: String) -> bool:
		return int(usage.get(a, 0)) > int(usage.get(b, 0))
	)

	var rank: int = 0
	var shown: int = 0
	for card_id in card_ids_sorted:
		var count: int = int(usage.get(card_id, 0))
		if count == 0 and shown > 8:
			continue
		rank += 1
		shown += 1
		var card: Dictionary = CardDatabase.get_card(card_id)
		if card.is_empty():
			continue
		var ctype: int = int(card.get("type", -1))
		var type_icon := "🖌️" if ctype == CardDatabase.CardType.TOOL else ("💰" if ctype == CardDatabase.CardType.BUDGET else ("🧑‍🔬" if ctype == CardDatabase.CardType.EXPERT else "🃏"))
		var rank_str := "#%02d" % rank if rank <= 99 else "   "
		var rarity_str: String = ["普","稀","史","传"][int(card.get("rarity", 0))]
		_add_stat_row(_card_stats_panel, "%s %s  %s  [%s]" % [rank_str, type_icon, card.get("name", card_id), rarity_str], "%d 次" % count)

func _add_section_title(parent: VBoxContainer, text: String) -> void:
	var sep := HSeparator.new()
	sep.modulate = Color(0.3, 0.25, 0.15)
	parent.add_child(sep)
	var lbl := Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", 20)
	lbl.modulate = Color(0.93, 0.84, 0.55)
	parent.add_child(lbl)

func _add_stat_row(parent: VBoxContainer, key: String, value: String) -> void:
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 12)
	var k := Label.new()
	k.text = key
	k.add_theme_font_size_override("font_size", 16)
	k.modulate = Color(0.8, 0.75, 0.65)
	k.custom_minimum_size.x = 300
	hb.add_child(k)
	var v := Label.new()
	v.text = value
	v.add_theme_font_size_override("font_size", 16)
	v.modulate = Color(1.0, 0.95, 0.85)
	hb.add_child(v)
	parent.add_child(hb)

func _format_duration(secs: int) -> String:
	var h: int = secs / 3600
	var m: int = (secs % 3600) / 60
	var s: int = secs % 60
	if h > 0:
		return "%d小时 %d分 %d秒" % [h, m, s]
	elif m > 0:
		return "%d分 %d秒" % [m, s]
	else:
		return "%d秒" % s

func _style_button(btn: Button, bg: Color, fg: Color) -> void:
	btn.add_theme_font_size_override("font_size", 18)
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = fg
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.content_margin_left = 14
	sb.content_margin_top = 8
	sb.content_margin_right = 14
	sb.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", sb)
	var sb_hover := sb.duplicate()
	sb_hover.bg_color = bg.lightened(0.15)
	btn.add_theme_stylebox_override("hover", sb_hover)
	var sb_pressed := sb.duplicate()
	sb_pressed.bg_color = bg.darkened(0.15)
	btn.add_theme_stylebox_override("pressed", sb_pressed)
	btn.modulate = fg

func _refresh_hint_bar() -> void:
	if not _hint_bar:
		return
	var hints := []
	hints.append("[%s] 返回" % InputManager.get_hint("ui_cancel"))
	hints.append("[%s/%s] 切换标签" % [InputManager.get_hint("ui_left"), InputManager.get_hint("ui_right")])
	hints.append("当前输入：%s" % InputManager.method_name())
	_hint_bar.text = "   ".join(hints)

func _on_back_pressed() -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _on_input_method_changed(_method: int) -> void:
	_refresh_hint_bar()
	queue_redraw()

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_back_pressed()
		get_viewport().set_input_as_handled()
