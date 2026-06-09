extends Control
## 战斗场景 - 展品区 + 手牌 + 顶部HUD + 回合/事件覆盖层

var battle: BattleController
var _top_hud: HBoxContainer
var _budget_lbl: Label
var _turn_lbl: Label
var _deck_cnt: Label
var _discard_cnt: Label
var _level_name_lbl: Label
var _exhibits_row: HBoxContainer
var _hand_row: HBoxContainer
var _end_turn_btn: Button
var _quit_btn: Button
var _settings_btn: Button
var _hint_bar: HBoxContainer
var _floating_vfx: Node2D
var _target_indicator: Control
var _selected_card_idx: int = -1

func _ready() -> void:
	randomize()
	_build_ui()
	_init_battle()
	_connect_battle_events()
	_refresh_hint_bar()
	InputManager.method_changed.connect(func(_m): _refresh_hint_bar())

func _build_ui() -> void:
	for c in get_children(): c.queue_free()
	var bg: ColorRect = ColorRect.new()
	bg.color = Color(0.06, 0.08, 0.1, 1)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var deco: ColorRect = ColorRect.new()
	deco.color = Color(0.1, 0.14, 0.18, 1)
	deco.anchor_top = 0.0
	deco.anchor_bottom = 0.55
	deco.anchor_right = 1.0
	add_child(deco)

	var root_margin: MarginContainer = MarginContainer.new()
	root_margin.anchor_right = 1.0
	root_margin.anchor_bottom = 1.0
	root_margin.add_theme_constant_override("margin_left", 20)
	root_margin.add_theme_constant_override("margin_right", 20)
	root_margin.add_theme_constant_override("margin_top", 12)
	root_margin.add_theme_constant_override("margin_bottom", 12)
	add_child(root_margin)
	var root: VBoxContainer = VBoxContainer.new()
	root.add_theme_constant_override("separation", 10)
	root_margin.add_child(root)

	_top_hud = HBoxContainer.new()
	_top_hud.add_theme_constant_override("separation", 14)
	_level_name_lbl = Label.new()
	_level_name_lbl.text = ""
	_level_name_lbl.add_theme_font_size_override("font_size", 18)
	_level_name_lbl.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	_level_name_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_top_hud.add_child(_level_name_lbl)
	_turn_lbl = _make_hud_label("Turn", "⏱️", Color(0.55, 0.8, 0.9))
	_top_hud.add_child(_turn_lbl)
	_budget_lbl = _make_hud_label("Budget", "🪙", Color(0.95, 0.8, 0.4))
	_top_hud.add_child(_budget_lbl)
	_deck_cnt = _make_hud_label("Deck", "🂠", Color(0.7, 0.9, 0.6))
	_top_hud.add_child(_deck_cnt)
	_discard_cnt = _make_hud_label("Disc", "🗑️", Color(0.9, 0.6, 0.6))
	_top_hud.add_child(_discard_cnt)
	_settings_btn = Button.new()
	_settings_btn.text = "⚙"
	_settings_btn.custom_minimum_size = Vector2(40, 36)
	_settings_btn.add_theme_font_size_override("font_size", 18)
	_settings_btn.pressed.connect(_on_settings)
	_top_hud.add_child(_settings_btn)
	_quit_btn = Button.new()
	_quit_btn.text = "放弃"
	_quit_btn.add_theme_font_size_override("font_size", 14)
	_quit_btn.add_theme_color_override("font_color", Color(1, 0.55, 0.55, 1))
	_quit_btn.pressed.connect(_confirm_abandon)
	_top_hud.add_child(_quit_btn)
	root.add_child(_top_hud)

	var exh_scroll: ScrollContainer = ScrollContainer.new()
	exh_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	exh_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	exh_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	root.add_child(exh_scroll)
	_exhibits_row = HBoxContainer.new()
	_exhibits_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_exhibits_row.add_theme_constant_override("separation", 24)
	_exhibits_row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_exhibits_row.custom_minimum_size = Vector2(0, 280)
	exh_scroll.add_child(_exhibits_row)

	var hand_container: VBoxContainer = VBoxContainer.new()
	hand_container.add_theme_constant_override("separation", 6)
	root.add_child(hand_container)
	var hand_scroll: ScrollContainer = ScrollContainer.new()
	hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	hand_scroll.custom_minimum_size = Vector2(0, 260)
	hand_container.add_child(hand_scroll)
	_hand_row = HBoxContainer.new()
	_hand_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_hand_row.add_theme_constant_override("separation", 10)
	_hand_row.custom_minimum_size = Vector2(0, 250)
	_hand_row.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	hand_scroll.add_child(_hand_row)

	var action_row: HBoxContainer = HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 16)
	action_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_end_turn_btn = Button.new()
	_end_turn_btn.text = "▶  结束回合  [%s]" % InputManager.get_hint("game_end_turn")
	_end_turn_btn.custom_minimum_size = Vector2(280, 48)
	_end_turn_btn.add_theme_font_size_override("font_size", 20)
	var sbn: StyleBoxFlat = StyleBoxFlat.new()
	sbn.bg_color = Color(0.2, 0.5, 0.3, 1)
	sbn.corner_radius_top_left = 10
	sbn.corner_radius_top_right = 10
	sbn.corner_radius_bottom_right = 10
	sbn.corner_radius_bottom_left = 10
	sbn.border_width_left = 2
	sbn.border_width_right = 2
	sbn.border_width_top = 2
	sbn.border_width_bottom = 2
	sbn.border_color = Color(0.4, 0.8, 0.5, 1)
	_end_turn_btn.add_theme_stylebox_override("normal", sbn)
	var sbh: StyleBoxFlat = sbn.duplicate()
	sbh.bg_color = Color(0.3, 0.65, 0.4, 1)
	sbh.border_color = Color.WHITE
	_end_turn_btn.add_theme_stylebox_override("hover", sbh)
	_end_turn_btn.pressed.connect(_on_end_turn)
	action_row.add_child(_end_turn_btn)
	hand_container.add_child(action_row)

	_hint_bar = HBoxContainer.new()
	_hint_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	_hint_bar.add_theme_constant_override("separation", 28)
	root.add_child(_hint_bar)

	_floating_vfx = Node2D.new()
	_floating_vfx.set_process(true)
	add_child(_floating_vfx)

func _make_hud_label(id: String, icon: String, color: Color) -> Label:
	var l: Label = Label.new()
	l.name = id
	l.text = ("%s --" % icon)
	l.add_theme_font_size_override("font_size", 16)
	l.add_theme_color_override("font_color", color)
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0, 0, 0, 0.35)
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_right = 8
	sb.corner_radius_bottom_left = 8
	sb.border_width_left = 1
	sb.border_width_right = 1
	sb.border_width_top = 1
	sb.border_width_bottom = 1
	sb.border_color = color.darkened(0.3)
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	l.add_theme_stylebox_override("normal", sb)
	return l

func _init_battle() -> void:
	battle = BattleController.new()
	add_child(battle)
	var level_id: String = "level_1_1"
	var f := FileAccess.open("user://current_level.tmp", FileAccess.READ)
	if f:
		level_id = f.get_line().strip_edges()
		f.close()
		if FileAccess.file_exists("user://current_level.tmp"):
			DirAccess.remove_absolute("user://current_level.tmp")
	var deck: Array = SaveManager.get_current_deck()
	if deck.is_empty():
		deck = CardDatabase.get_default_deck()
	battle.setup_battle(level_id, deck)
	_level_name_lbl.text = battle.level_data.get("name", level_id) + "  |  " + battle.level_data.get("description", "")
	_refresh_hud()
	_refresh_exhibits()
	_refresh_hand()
	battle.start_battle()

func _connect_battle_events() -> void:
	battle.state_changed.connect(func(s: String):
		_end_turn_btn.disabled = s != "PLAYING"
	)
	battle.budget_changed.connect(func(_d, c): _refresh_hud())
	battle.turn_started.connect(func(_n): _refresh_hud(); _refresh_exhibits(); _refresh_hand())
	battle.turn_ended.connect(func(_n): _refresh_hud())
	battle.hand_changed.connect(_refresh_hand)
	battle.deck_count_changed.connect(func(c: int): _deck_cnt.text = "🂠 %d" % c)
	battle.discard_count_changed.connect(func(c: int): _discard_cnt.text = "🗑️ %d" % c)
	battle.exhibit_list_changed.connect(_refresh_exhibits)
	battle.battle_ended.connect(_on_battle_end)
	GameEvents.vfx_requested.connect(_on_vfx)
	GameEvents.event_triggered.connect(_on_event_show)
	GameEvents.exhibit_progress_changed.connect(_on_exhibit_progress)

func _refresh_hud() -> void:
	_budget_lbl.text = ("🪙 %d" % battle.budget)
	_turn_lbl.text = ("⏱️ %d/%d" % [battle.current_turn, battle.max_turns])
	_deck_cnt.text = ("🂠 %d" % battle.deck.size())
	_discard_cnt.text = ("🗑️ %d" % battle.discard.size())

func _refresh_exhibits() -> void:
	for c in _exhibits_row.get_children(): c.queue_free()
	for e in battle.exhibits:
		_exhibits_row.add_child(_make_exhibit_panel(e))

func _make_exhibit_panel(e: Dictionary) -> Control:
	var pc: PanelContainer = PanelContainer.new()
	pc.custom_minimum_size = Vector2(240, 280)
	pc.name = "exh_" + e.id
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.12, 0.14, 0.16, 1) if not e.restored else Color(0.15, 0.28, 0.2, 1)
	sb.corner_radius_top_left = 12
	sb.corner_radius_top_right = 12
	sb.corner_radius_bottom_right = 12
	sb.corner_radius_bottom_left = 12
	sb.border_width_left = 3
	sb.border_width_right = 3
	sb.border_width_top = 3
	sb.border_width_bottom = 3
	sb.border_color = Color(0.55, 0.4, 0.25, 1) if not e.restored else Color(0.5, 0.9, 0.5, 1)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 14
	sb.content_margin_bottom = 14
	pc.add_theme_stylebox_override("panel", sb)
	var vb: VBoxContainer = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 8)
	pc.add_child(vb)

	var name_lbl: Label = Label.new()
	name_lbl.text = e.name
	name_lbl.add_theme_font_size_override("font_size", 17)
	name_lbl.add_theme_color_override("font_color", Color.WHITE)
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(name_lbl)

	var icon_lbl: Label = Label.new()
	icon_lbl.text = "🖼️" if not e.restored else "✅"
	icon_lbl.add_theme_font_size_override("font_size", 56)
	icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(icon_lbl)

	var ratio: float = float(e.integrity) / float(max(1, e.max_integrity))
	var progress: ProgressBar = ProgressBar.new()
	progress.max_value = float(e.max_integrity)
	progress.value = float(e.integrity)
	progress.custom_minimum_size = Vector2(0, 20)
	progress.add_theme_font_size_override("font_size", 13)
	progress.show_percentage = false
	var pct_lbl: Label = Label.new()
	pct_lbl.text = ("完整度: %d / %d  (%.0f%%)" % [e.integrity, e.max_integrity, ratio * 100])
	pct_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pct_lbl.add_theme_font_size_override("font_size", 13)
	pct_lbl.add_theme_color_override("font_color", Color(0.8, 0.9, 0.8, 1))
	vb.add_child(progress)
	vb.add_child(pct_lbl)

	if e.statuses.size() > 0 and not e.restored:
		var st_hb: HBoxContainer = HBoxContainer.new()
		st_hb.alignment = BoxContainer.ALIGNMENT_CENTER
		st_hb.add_theme_constant_override("separation", 8)
		for s in e.statuses:
			var bp: PanelContainer = PanelContainer.new()
			var bsb: StyleBoxFlat = StyleBoxFlat.new()
			bsb.bg_color = Color(0.55, 0.25, 0.25, 0.85)
			bsb.corner_radius_top_left = 6
			bsb.corner_radius_top_right = 6
			bsb.corner_radius_bottom_right = 6
			bsb.corner_radius_bottom_left = 6
			bsb.content_margin_left = 6
			bsb.content_margin_right = 6
			bsb.content_margin_top = 2
			bsb.content_margin_bottom = 2
			bp.add_theme_stylebox_override("panel", bsb)
			var bl: Label = Label.new()
			bl.text = "%s×%d" % [_status_icon(s.type), int(s.value)]
			bl.add_theme_font_size_override("font_size", 12)
			bl.add_theme_color_override("font_color", Color.WHITE)
			bp.add_child(bl)
			st_hb.add_child(bp)
		vb.add_child(st_hb)
	var rb: Label = Label.new()
	rb.text = ("修复奖励: +%d 🪙" % int(e.reward_budget)) if not e.restored else "✨ 已完成"
	rb.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rb.add_theme_font_size_override("font_size", 12)
	rb.add_theme_color_override("font_color", Color(0.95, 0.85, 0.5, 1))
	vb.add_child(rb)

	var tbtn: Button = Button.new()
	tbtn.custom_minimum_size = Vector2(0, 36)
	tbtn.add_theme_font_size_override("font_size", 14)
	tbtn.text = ("🎯 指定为修复目标" if not e.restored else "已修复")
	tbtn.disabled = e.restored or _selected_card_idx < 0 or not battle.awaiting_target
	tbtn.pressed.connect(func(): _on_target_exhibit(e.id))
	vb.add_child(tbtn)
	pc.gui_input.connect(func(ev):
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			if battle.awaiting_target and _selected_card_idx >= 0 and not e.restored:
				_on_target_exhibit(e.id)
	)
	return pc

func _status_icon(t: String) -> String:
	match t:
		"dirt": return "💩污渍"
		"rust": return "🔩铜锈"
		"mold": return "🍄霉变"
		"crack": return "💥裂隙"
		"brittle": return "🥚脆化"
		"peeling": return "📄起翘"
		"vulnerable": return "🎯易修"
	return t

func _refresh_hand() -> void:
	for c in _hand_row.get_children(): c.queue_free()
	_selected_card_idx = -1
	battle.selected_card_index = -1
	battle.awaiting_target = false
	for i in battle.hand.size():
		var cid: String = battle.hand[i]
		var card: Dictionary = CardDatabase.get_card(cid)
		_hand_row.add_child(_make_card_ui(i, cid, card))

func _make_card_ui(idx: int, cid: String, card: Dictionary) -> Control:
	var playable: bool = battle.can_play_card(idx)
	var cost: int = battle.get_card_cost(cid)
	var pc: PanelContainer = PanelContainer.new()
	pc.custom_minimum_size = Vector2(170, 240)
	pc.name = "card_%d" % idx
	var tcol: Color = CardDatabase.type_color(int(card.get("type", 0)))
	var rcol: Color = CardDatabase.rarity_color(int(card.get("rarity", 0)))
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = tcol.darkened(0.55) if playable else Color(0.16, 0.14, 0.14, 1)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_right = 10
	sb.corner_radius_bottom_left = 10
	sb.border_width_left = 3
	sb.border_width_right = 3
	sb.border_width_top = 3
	sb.border_width_bottom = 3
	sb.border_color = rcol if playable else Color(0.3, 0.28, 0.28, 1)
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	pc.add_theme_stylebox_override("panel", sb)
	var sbh: StyleBoxFlat = sb.duplicate()
	sbh.bg_color = tcol.darkened(0.3)
	sbh.border_color = Color.WHITE
	pc.add_theme_stylebox_override("hover", sbh)
	pc.mouse_filter = Control.MOUSE_FILTER_STOP

	var vb: VBoxContainer = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 5)
	pc.add_child(vb)

	var top_row: HBoxContainer = HBoxContainer.new()
	var cost_panel: PanelContainer = PanelContainer.new()
	var csb: StyleBoxFlat = StyleBoxFlat.new()
	csb.bg_color = Color(0.95, 0.8, 0.4, 1) if playable else Color(0.5, 0.45, 0.4, 1)
	csb.corner_radius_top_left = 14
	csb.corner_radius_top_right = 14
	csb.corner_radius_bottom_right = 14
	csb.corner_radius_bottom_left = 14
	csb.content_margin_left = 8
	csb.content_margin_right = 8
	csb.content_margin_top = 2
	csb.content_margin_bottom = 2
	cost_panel.add_theme_stylebox_override("panel", csb)
	var cost_lbl: Label = Label.new()
	cost_lbl.text = str(cost)
	cost_lbl.add_theme_color_override("font_color", Color.BLACK)
	cost_lbl.add_theme_font_size_override("font_size", 18)
	cost_panel.add_child(cost_lbl)
	top_row.add_child(cost_panel)
	var sp: Control = Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_row.add_child(sp)
	var rarity_lbl: Label = Label.new()
	rarity_lbl.text = ["普","稀","史","传"][int(card.get("rarity", 0))]
	rarity_lbl.add_theme_color_override("font_color", rcol)
	rarity_lbl.add_theme_font_size_override("font_size", 14)
	top_row.add_child(rarity_lbl)
	vb.add_child(top_row)

	var type_lbl: Label = Label.new()
	type_lbl.text = CardDatabase.type_name(int(card.get("type", 0)))
	type_lbl.add_theme_color_override("font_color", Color(0.9, 0.9, 1, 1))
	type_lbl.add_theme_font_size_override("font_size", 12)
	vb.add_child(type_lbl)

	var name_lbl: Label = Label.new()
	name_lbl.text = card.get("name", "")
	name_lbl.add_theme_color_override("font_color", Color.WHITE)
	name_lbl.add_theme_font_size_override("font_size", 16)
	vb.add_child(name_lbl)

	var icon: Label = Label.new()
	icon.text = _type_emoji(int(card.get("type", 0)))
	icon.add_theme_font_size_override("font_size", 40)
	icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(icon)

	var desc: Label = Label.new()
	desc.text = card.get("desc", "")
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.add_theme_color_override("font_color", Color(0.9, 0.88, 0.82, 1))
	desc.add_theme_font_size_override("font_size", 11)
	desc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(desc)

	var hint_lbl: Label = Label.new()
	hint_lbl.text = ("[%s] 打出" % InputManager.get_hint("game_card_%d" % (idx + 1))) if idx < 5 else "点击打出"
	hint_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint_lbl.add_theme_color_override("font_color", Color(0.7, 0.9, 1, 1))
	hint_lbl.add_theme_font_size_override("font_size", 10)
	vb.add_child(hint_lbl)

	pc.gui_input.connect(func(ev):
		if not playable:
			return
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			_on_card_clicked(idx)
	)
	return pc

func _type_emoji(t: int) -> String:
	match t:
		0: return "🖌️"
		1: return "💰"
		2: return "🧑‍🔬"
	return "🃏"

func _on_card_clicked(idx: int) -> void:
	if not battle.can_play_card(idx):
		return
	GameEvents.sfx_requested.emit("card_select", -5.0)
	var was_selected: bool = (_selected_card_idx == idx)
	_selected_card_idx = idx
	battle.select_card(idx)
	for i in _hand_row.get_child_count():
		var ch: Control = _hand_row.get_child(i)
		var sb = ch.get_theme_stylebox("normal", "PanelContainer")
		if i == idx and battle.awaiting_target:
			sb = sb.duplicate() if sb else StyleBoxFlat.new()
			sb.border_color = Color.WHITE
			sb.border_width_left = 5
			sb.border_width_right = 5
			sb.border_width_top = 5
			sb.border_width_bottom = 5
			ch.add_theme_stylebox_override("normal", sb)
	if was_selected and battle.awaiting_target:
		pass
	elif not battle.awaiting_target:
		battle.play_selected_card("")
		_selected_card_idx = -1
	_refresh_exhibits()

func _on_target_exhibit(exhibit_id: String) -> void:
	if _selected_card_idx < 0 or not battle.awaiting_target:
		return
	battle.play_selected_card(exhibit_id)
	_selected_card_idx = -1
	_refresh_exhibits()

func _on_end_turn() -> void:
	GameEvents.sfx_requested.emit("turn_end_btn", -3.0)
	battle.end_turn()

func _refresh_hint_bar() -> void:
	for c in _hint_bar.get_children(): c.queue_free()
	var hints: Array = [
		["game_card_1", "卡1"], ["game_card_2", "卡2"], ["game_card_3", "卡3"],
		["game_card_4", "卡4"], ["game_card_5", "卡5"],
		["game_end_turn", "结束回合"],
		["game_view_deck", "牌库"],
		["game_toggle_settings", "设置"],
		["ui_cancel", "放弃"],
	]
	for h in hints:
		var box: HBoxContainer = HBoxContainer.new()
		box.add_theme_constant_override("separation", 4)
		var k: Label = Label.new()
		k.text = ("[%s]" % InputManager.get_hint(h[0]))
		k.add_theme_color_override("font_color", Color(0.95, 0.8, 0.4, 1))
		k.add_theme_font_size_override("font_size", 12)
		box.add_child(k)
		var d: Label = Label.new()
		d.text = h[1]
		d.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1))
		d.add_theme_font_size_override("font_size", 12)
		box.add_child(d)
		_hint_bar.add_child(box)
	_end_turn_btn.text = "▶  结束回合  [%s]" % InputManager.get_hint("game_end_turn")

func _on_settings() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	var f := FileAccess.open("user://prev_scene.tmp", FileAccess.WRITE)
	if f: f.store_line("res://scenes/BattleScene.tscn"); f.close()
	get_tree().change_scene_to_file("res://scenes/SettingsPage.tscn")

func _confirm_abandon() -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	var d: AcceptDialog = AcceptDialog.new()
	d.title = "确认放弃战斗？"
	d.dialog_text = "放弃本次战斗将不计入存档数据。是否继续？"
	d.confirmed.connect(func():
		battle.abandon_battle()
	)
	add_child(d)
	d.popup_centered()

func _on_vfx(vfx_type: String, pos: Vector2, params: Dictionary) -> void:
	if vfx_type == "restore_sparks":
		var tid: String = params.get("target_id", "")
		var amt: int = int(params.get("amount", 0))
		var node: Node = _exhibits_row.get_node_or_null("exh_" + tid)
		if node and amt > 0:
			_show_floating_number(node, "+%d" % amt, Color(0.5, 0.95, 0.5, 1))
			_animate_panel_pulse(node, Color(0.5, 0.9, 0.5, 1))

func _show_floating_number(anchor: Control, text: String, color: Color) -> void:
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_color_override("font_color", color)
	lbl.add_theme_font_size_override("font_size", 32)
	lbl.add_theme_color_override("font_outline_color", Color.BLACK)
	lbl.add_theme_constant_override("outline_size", 4)
	var gp: Control = Control.new()
	gp.set_position(anchor.get_global_rect().position + Vector2(anchor.size.x / 2, -10))
	gp.add_child(lbl)
	add_child(gp)
	var t: Tween = create_tween()
	t.tween_property(lbl, "position:y", lbl.position.y - 70, 0.8).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	t.parallel().tween_property(lbl, "modulate:a", 0.0, 0.8)
	t.finished.connect(gp.queue_free)

func _animate_panel_pulse(panel: Control, border_color: Color) -> void:
	var orig = panel.get_theme_stylebox("normal", "PanelContainer")
	if orig == null or not (orig is StyleBoxFlat):
		return
	var pulse: StyleBoxFlat = orig.duplicate()
	pulse.border_color = border_color
	pulse.border_width_left = 6
	pulse.border_width_right = 6
	pulse.border_width_top = 6
	pulse.border_width_bottom = 6
	panel.add_theme_stylebox_override("normal", pulse)
	var t: Tween = create_tween()
	t.tween_interval(0.25)
	t.tween_callback(func(): panel.add_theme_stylebox_override("normal", orig))

func _on_event_show(_id: String, ev: Dictionary) -> void:
	var w: Window = Window.new()
	w.title = "发生事件"
	w.unresizable = true
	w.size = Vector2i(520, 260)
	var mv: MarginContainer = MarginContainer.new()
	mv.add_theme_constant_override("margin_all", 24)
	w.add_child(mv)
	var v: VBoxContainer = VBoxContainer.new()
	v.add_theme_constant_override("separation", 14)
	mv.add_child(v)
	var tl: Label = Label.new()
	tl.text = ev.get("name", "事件")
	tl.add_theme_font_size_override("font_size", 26)
	tl.add_theme_color_override("font_color", Color(0.95, 0.8, 0.4, 1))
	v.add_child(tl)
	var dl: Label = Label.new()
	dl.text = ev.get("desc", "")
	dl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dl.add_theme_font_size_override("font_size", 16)
	dl.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9, 1))
	dl.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(dl)
	var ok: Button = Button.new()
	ok.text = "继续  [%s]" % InputManager.get_hint("ui_accept")
	ok.add_theme_font_size_override("font_size", 16)
	ok.pressed.connect(w.queue_free)
	v.add_child(ok)
	get_tree().root.add_child(w)
	w.popup_centered()

func _on_exhibit_progress(eid: String, _d, _c, _m) -> void:
	pass

func _on_battle_end(victory: bool, stats: Dictionary) -> void:
	await get_tree().process_frame
	var lv_id: String = battle.level_id
	if victory:
		var stars: int = int(stats.get("stars", 0))
		SaveManager.record_level_completed(lv_id, stars, stats)
		_process_chapter_rewards(lv_id)
	else:
		SaveManager.save_current()
	var f := FileAccess.open("user://battle_result.tmp", FileAccess.WRITE)
	if f:
		var data: Dictionary = {
			"victory": victory, "stats": stats, "level_id": lv_id,
			"level_data": battle.level_data,
		}
		f.store_var(data, true)
		f.close()
	get_tree().change_scene_to_file("res://scenes/BattleResult.tscn")

func _process_chapter_rewards(level_id: String) -> void:
	var lv: Dictionary = LevelDatabase.get_level(level_id)
	var ch_id: String = lv.get("chapter", "")
	if not lv.get("is_boss", false):
		return
	var ch: Dictionary = LevelDatabase.get_chapter(ch_id)
	var reward: Dictionary = ch.get("completion_reward", {})
	if reward.has("unlock_cards"):
		for cid in reward.unlock_cards:
			SaveManager.add_to_collection(cid)
	if reward.has("unlock_chapter"):
		SaveManager.unlock_chapter(reward.unlock_chapter)
	SaveManager.save_current()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("game_end_turn"):
		_on_end_turn()
	elif event.is_action_pressed("game_toggle_settings"):
		_on_settings()
	elif event.is_action_pressed("game_card_1"):
		_on_card_clicked(0)
	elif event.is_action_pressed("game_card_2"):
		_on_card_clicked(1)
	elif event.is_action_pressed("game_card_3"):
		_on_card_clicked(2)
	elif event.is_action_pressed("game_card_4"):
		_on_card_clicked(3)
	elif event.is_action_pressed("game_card_5"):
		_on_card_clicked(4)
	elif event.is_action_pressed("game_view_deck"):
		_popup_simple("牌库共 " + str(battle.deck.size()) + " 张：\n" + _summarize_cards(battle.deck))
	elif event.is_action_pressed("game_view_discard"):
		_popup_simple("弃牌堆共 " + str(battle.discard.size()) + " 张：\n" + _summarize_cards(battle.discard))
	elif event.is_action_pressed("ui_cancel"):
		_confirm_abandon()

func _summarize_cards(arr: Array) -> String:
	var cnt: Dictionary = {}
	for id in arr:
		cnt[id] = cnt.get(id, 0) + 1
	var out: String = ""
	for id in cnt.keys():
		var c: Dictionary = CardDatabase.get_card(id)
		out += ("  · %s  x%d\n" % [c.get("name", id), int(cnt[id])])
	return out if out != "" else "（空）"

func _popup_simple(text: String) -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	var a: AcceptDialog = AcceptDialog.new()
	a.dialog_text = text
	a.size = Vector2i(420, 360)
	add_child(a)
	a.popup_centered()
