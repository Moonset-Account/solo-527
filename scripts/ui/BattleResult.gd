extends Control
## 战斗结算页 - 展示星星/数据/奖励（选卡）

var _victory: bool = false
var _stars: int = 0
var _stats: Dictionary = {}
var _level_id: String = ""
var _level_data: Dictionary = {}
var _reward_choice: Array = []
var _chosen_card_id: String = ""
var _reward_grid: GridContainer
var _hint_bar: HBoxContainer
var _confirm_btn: Button

func _ready() -> void:
	randomize()
	_load_result()
	_build_ui()
	_render_rewards()
	_refresh_hint_bar()
	InputManager.method_changed.connect(func(_m): _refresh_hint_bar())

func _load_result() -> void:
	var f := FileAccess.open("user://battle_result.tmp", FileAccess.READ)
	if f:
		var data = f.get_var(true)
		f.close()
		if FileAccess.file_exists("user://battle_result.tmp"):
			DirAccess.remove_absolute("user://battle_result.tmp")
		if typeof(data) == TYPE_DICTIONARY:
			_victory = bool(data.get("victory", false))
			_stats = data.get("stats", {})
			_level_id = data.get("level_id", "")
			_level_data = data.get("level_data", {})
			_stars = int(_stats.get("stars", 0))
	_pick_reward_pool()

func _pick_reward_pool() -> void:
	if not _victory:
		return
	var pool: Array = _level_data.get("reward_cards_pool", [])
	var rc: int = int(_level_data.get("reward_card_count", 3))
	pool.shuffle()
	_reward_choice = pool.slice(0, min(rc, pool.size()))
	if _reward_choice.is_empty():
		_reward_choice = CardDatabase.get_random_unlockable(3, SaveManager.get_current_collection())

func _build_ui() -> void:
	for c in get_children(): c.queue_free()
	var bg: ColorRect = ColorRect.new()
	bg.color = Color(0.05, 0.06, 0.08, 1)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var overlay: ColorRect = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.4)
	overlay.anchor_right = 1.0
	overlay.anchor_bottom = 1.0
	add_child(overlay)

	var root: MarginContainer = MarginContainer.new()
	root.anchor_right = 1.0
	root.anchor_bottom = 1.0
	root.add_theme_constant_override("margin_left", 64)
	root.add_theme_constant_override("margin_right", 64)
	root.add_theme_constant_override("margin_top", 40)
	root.add_theme_constant_override("margin_bottom", 40)
	add_child(root)

	var center: VBoxContainer = VBoxContainer.new()
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_theme_constant_override("separation", 20)
	root.add_child(center)

	var title_lbl: Label = Label.new()
	title_lbl.text = "🏆 修复成功！" if _victory else "💔 修复失败"
	title_lbl.add_theme_font_size_override("font_size", 52)
	title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_lbl.add_theme_color_override("font_color", Color(0.95, 0.85, 0.4, 1) if _victory else Color(1, 0.55, 0.55, 1))
	center.add_child(title_lbl)

	var level_lbl: Label = Label.new()
	level_lbl.text = "%s  |  %s" % [_level_data.get("name", _level_id), _level_data.get("chapter", "")]
	level_lbl.add_theme_font_size_override("font_size", 20)
	level_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_lbl.add_theme_color_override("font_color", Color(0.7, 0.65, 0.55, 1))
	center.add_child(level_lbl)

	var stars_lbl: Label = Label.new()
	stars_lbl.text = _stars_str(_stars)
	stars_lbl.add_theme_font_size_override("font_size", 56)
	stars_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(stars_lbl)

	var stats_panel: PanelContainer = PanelContainer.new()
	stats_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.12, 0.14, 0.16, 1)
	sb.corner_radius_top_left = 12
	sb.corner_radius_top_right = 12
	sb.corner_radius_bottom_right = 12
	sb.corner_radius_bottom_left = 12
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(0.45, 0.32, 0.18, 0.6)
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 18
	sb.content_margin_bottom = 18
	stats_panel.add_theme_stylebox_override("panel", sb)
	var sv: VBoxContainer = VBoxContainer.new()
	sv.add_theme_constant_override("separation", 8)
	stats_panel.add_child(sv)
	var s_title: Label = Label.new()
	s_title.text = "战斗统计"
	s_title.add_theme_font_size_override("font_size", 22)
	s_title.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	s_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sv.add_child(s_title)
	var rows: Array = [
		["⏱️  使用回合数", "%d / %d" % [int(_stats.get("turns_used", 0)), int(_level_data.get("turn_limit", 0))]],
		["🃏  打出卡牌数", str(int(_stats.get("cards_played", 0)))],
		["📥  总抽牌数", str(int(_stats.get("cards_drawn", 0)))],
		["✨  修复展品数", "%d / %d" % [int(_stats.get("exhibits_restored", 0)), int(_level_data.get("exhibits", []).size())]],
		["🪙  预算奖励", "+%d" % int(_level_data.get("reward_budget", 0)) if _victory else "（未获得）"],
	]
	for r in rows:
		var h: HBoxContainer = HBoxContainer.new()
		var a: Label = Label.new()
		a.text = r[0]
		a.add_theme_font_size_override("font_size", 16)
		a.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1))
		a.custom_minimum_size = Vector2(220, 0)
		h.add_child(a)
		var b: Label = Label.new()
		b.text = r[1]
		b.add_theme_font_size_override("font_size", 16)
		b.add_theme_color_override("font_color", Color.WHITE)
		h.add_child(b)
		sv.add_child(h)
	center.add_child(stats_panel)

	if _victory and _reward_choice.size() > 0:
		var reward_title: Label = Label.new()
		reward_title.text = "💎 选择一张卡牌加入你的收藏"
		reward_title.add_theme_font_size_override("font_size", 26)
		reward_title.add_theme_color_override("font_color", Color(0.55, 0.85, 0.95, 1))
		reward_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		center.add_child(reward_title)
		var scroll: ScrollContainer = ScrollContainer.new()
		scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		scroll.custom_minimum_size = Vector2(0, 280)
		center.add_child(scroll)
		var hb: HBoxContainer = hb = HBoxContainer.new()
		hb.alignment = BoxContainer.ALIGNMENT_CENTER
		hb.add_theme_constant_override("separation", 16)
		scroll.add_child(hb)
		_reward_grid = GridContainer.new()
		_reward_grid.columns = 5
		_reward_grid.add_theme_constant_override("h_separation", 16)
		_reward_grid.add_theme_constant_override("v_separation", 16)
		hb.add_child(_reward_grid)
		var skip_hint: Label = Label.new()
		skip_hint.text = "（可跳过不选，或选一张卡永久加入收藏）"
		skip_hint.add_theme_font_size_override("font_size", 14)
		skip_hint.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
		skip_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		center.add_child(skip_hint)

	var action_bar: HBoxContainer = HBoxContainer.new()
	action_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	action_bar.add_theme_constant_override("separation", 24)
	var skip_btn: Button = Button.new()
	skip_btn.text = "跳过奖励" if _victory else "重新挑战"
	skip_btn.custom_minimum_size = Vector2(200, 52)
	skip_btn.add_theme_font_size_override("font_size", 18)
	skip_btn.pressed.connect(_on_skip_or_retry)
	action_bar.add_child(skip_btn)
	var confirm_btn: Button = Button.new()
	_confirm_btn = confirm_btn
	confirm_btn.name = "ConfirmBtn"
	if _victory:
		confirm_btn.text = "确认并领取"
	else:
		confirm_btn.text = "返回关卡选择"
	confirm_btn.custom_minimum_size = Vector2(240, 52)
	confirm_btn.add_theme_font_size_override("font_size", 18)
	confirm_btn.disabled = _victory and _reward_choice.size() > 0 and _chosen_card_id == ""
	confirm_btn.pressed.connect(_on_confirm_wrapper)
	action_bar.add_child(confirm_btn)
	center.add_child(action_bar)

	_hint_bar = HBoxContainer.new()
	_hint_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	_hint_bar.add_theme_constant_override("separation", 32)
	center.add_child(_hint_bar)

func _render_rewards() -> void:
	if not _reward_grid:
		return
	for c in _reward_grid.get_children(): c.queue_free()
	for cid in _reward_choice:
		var c: Dictionary = CardDatabase.get_card(cid)
		var in_coll: bool = cid in SaveManager.get_current_collection()
		var already: Label = Label.new()
		already.text = "（已在收藏中）" if in_coll else ""
		already.add_theme_color_override("font_color", Color(0.8, 0.7, 0.4, 1))
		already.add_theme_font_size_override("font_size", 11)
		var pc: PanelContainer = PanelContainer.new()
		pc.custom_minimum_size = Vector2(180, 260)
		var tcol: Color = CardDatabase.type_color(int(c.get("type", 0)))
		var rcol: Color = CardDatabase.rarity_color(int(c.get("rarity", 0)))
		var selected: bool = _chosen_card_id == cid
		var csb: StyleBoxFlat = StyleBoxFlat.new()
		csb.bg_color = tcol.darkened(0.5)
		csb.corner_radius_top_left = 10
		csb.corner_radius_top_right = 10
		csb.corner_radius_bottom_right = 10
		csb.corner_radius_bottom_left = 10
		csb.border_width_left = 4
		csb.border_width_right = 4
		csb.border_width_top = 4
		csb.border_width_bottom = 4
		csb.border_color = Color.WHITE if selected else rcol
		csb.content_margin_left = 10
		csb.content_margin_right = 10
		csb.content_margin_top = 10
		csb.content_margin_bottom = 10
		pc.add_theme_stylebox_override("panel", csb)
		var vb: VBoxContainer = VBoxContainer.new()
		vb.add_theme_constant_override("separation", 4)
		pc.add_child(vb)
		var tr: HBoxContainer = HBoxContainer.new()
		var cost: PanelContainer = PanelContainer.new()
		var csb2: StyleBoxFlat = StyleBoxFlat.new()
		csb2.bg_color = Color(0.95, 0.8, 0.4, 1)
		csb2.corner_radius_top_left = 14
		csb2.corner_radius_top_right = 14
		csb2.corner_radius_bottom_right = 14
		csb2.corner_radius_bottom_left = 14
		csb2.content_margin_left = 8
		csb2.content_margin_right = 8
		csb2.content_margin_top = 2
		csb2.content_margin_bottom = 2
		cost.add_theme_stylebox_override("panel", csb2)
		var cl: Label = Label.new()
		cl.text = str(int(c.get("cost", 0)))
		cl.add_theme_color_override("font_color", Color.BLACK)
		cl.add_theme_font_size_override("font_size", 18)
		cost.add_child(cl)
		tr.add_child(cost)
		var sp: Control = Control.new()
		sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tr.add_child(sp)
		var rl: Label = Label.new()
		rl.text = ["普","稀","史","传"][int(c.get("rarity", 0))]
		rl.add_theme_color_override("font_color", rcol)
		tr.add_child(rl)
		vb.add_child(tr)
		var tp: Label = Label.new()
		tp.text = CardDatabase.type_name(int(c.get("type", 0)))
		tp.add_theme_font_size_override("font_size", 12)
		tp.add_theme_color_override("font_color", Color(0.9, 0.9, 1, 1))
		vb.add_child(tp)
		var nm: Label = Label.new()
		nm.text = c.get("name", "")
		nm.add_theme_color_override("font_color", Color.WHITE)
		nm.add_theme_font_size_override("font_size", 17)
		vb.add_child(nm)
		var ic: Label = Label.new()
		match int(c.get("type", 0)):
			0: ic.text = "🖌️"
			1: ic.text = "💰"
			2: ic.text = "🧑‍🔬"
			_: ic.text = "🃏"
		ic.add_theme_font_size_override("font_size", 44)
		ic.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(ic)
		var ds: Label = Label.new()
		ds.text = c.get("desc", "")
		ds.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		ds.add_theme_font_size_override("font_size", 12)
		ds.add_theme_color_override("font_color", Color(0.9, 0.88, 0.82, 1))
		ds.size_flags_vertical = Control.SIZE_EXPAND_FILL
		vb.add_child(ds)
		vb.add_child(already)
		var chk: Button = Button.new()
		chk.text = "✓ 已选择" if selected else "选择"
		chk.add_theme_font_size_override("font_size", 13)
		chk.disabled = selected
		chk.pressed.connect(func():
			_chosen_card_id = cid
			_render_rewards()
		)
		vb.add_child(chk)
		_reward_grid.add_child(pc)
	if _confirm_btn:
		_confirm_btn.disabled = _victory and _reward_choice.size() > 0 and _chosen_card_id == ""

func _on_confirm_wrapper() -> void:
	_on_confirm(_confirm_btn.disabled if _confirm_btn else false)

func _stars_str(s: int) -> String:
	var f: String = "★" * s
	var e: String = "☆" * max(0, 3 - s)
	return f + e

func _refresh_hint_bar() -> void:
	for c in _hint_bar.get_children(): c.queue_free()
	var hints: Array = [
		["ui_accept", "确认"],
		["ui_cancel", "跳过/返回"],
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

func _on_skip_or_retry() -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	if _victory:
		SaveManager.save_current()
		get_tree().change_scene_to_file("res://scenes/LevelSelect.tscn")
	else:
		var f := FileAccess.open("user://current_level.tmp", FileAccess.WRITE)
		if f:
			f.store_line(_level_id)
			f.close()
		get_tree().change_scene_to_file("res://scenes/BattleScene.tscn")

func _on_confirm(disabled: bool) -> void:
	if disabled:
		return
	GameEvents.sfx_requested.emit("ui_accept", -2.0)
	if _victory and _chosen_card_id != "":
		SaveManager.add_to_collection(_chosen_card_id)
		var cur_deck: Array = SaveManager.get_current_deck()
		if cur_deck.size() < 30:
			cur_deck.append(_chosen_card_id)
			SaveManager.set_current_deck(cur_deck)
		GameEvents.reward_granted.emit("card", {"card_id": _chosen_card_id})
	SaveManager.save_current()
	get_tree().change_scene_to_file("res://scenes/LevelSelect.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_skip_or_retry()
