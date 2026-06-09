extends Control
## 存档选择界面

var _slots_box: HBoxContainer
var _hint_bar: HBoxContainer

func _ready() -> void:
	_build_ui()
	_refresh()
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
	margin.add_theme_constant_override("margin_left", 48)
	margin.add_theme_constant_override("margin_right", 48)
	margin.add_theme_constant_override("margin_top", 40)
	margin.add_theme_constant_override("margin_bottom", 40)
	add_child(margin)

	var vbox: VBoxContainer = vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 24)
	margin.add_child(vbox)

	var back_bar: HBoxContainer = HBoxContainer.new()
	var back_btn: Button = Button.new()
	back_btn.text = ("← 返回主菜单  [%s]" % InputManager.get_hint("ui_cancel"))
	back_btn.add_theme_font_size_override("font_size", 16)
	back_btn.pressed.connect(_on_back)
	back_bar.add_child(back_btn)
	var spacer: Control = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	back_bar.add_child(spacer)
	vbox.add_child(back_bar)

	var title: Label = Label.new()
	title.text = "选择存档槽位"
	title.add_theme_font_size_override("font_size", 42)
	title.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var sub: Label = Label.new()
	sub.text = "加载或创建新存档以继续游戏进度"
	sub.add_theme_font_size_override("font_size", 18)
	sub.add_theme_color_override("font_color", Color(0.7, 0.65, 0.55, 1))
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(sub)

	var fill: Control = Control.new()
	fill.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(fill)

	_slots_box = HBoxContainer.new()
	_slots_box.alignment = BoxContainer.ALIGNMENT_CENTER
	_slots_box.add_theme_constant_override("separation", 32)
	vbox.add_child(_slots_box)

	var fill2: Control = Control.new()
	fill2.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(fill2)

	_hint_bar = HBoxContainer.new()
	_hint_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(_hint_bar)

func _refresh() -> void:
	for c in _slots_box.get_children(): c.queue_free()
	for i in SaveManager.SLOT_COUNT:
		_slots_box.add_child(_make_slot_card(i))

func _make_slot_card(idx: int) -> Control:
	var panel: PanelContainer = PanelContainer.new()
	panel.custom_minimum_size = Vector2(280, 360)
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.18, 0.16, 0.14, 1)
	sb.corner_radius_top_left = 12
	sb.corner_radius_top_right = 12
	sb.corner_radius_bottom_right = 12
	sb.corner_radius_bottom_left = 12
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(0.45, 0.32, 0.18, 0.7)
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 16
	sb.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", sb)

	var vb: VBoxContainer = vb = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 12)
	panel.add_child(vb)

	var slot_name: Label = Label.new()
	slot_name.text = ("存档 %d" % (idx + 1))
	slot_name.add_theme_font_size_override("font_size", 22)
	slot_name.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	slot_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(slot_name)

	var info: Label = Label.new()
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_theme_font_size_override("font_size", 15)
	info.add_theme_color_override("font_color", Color(0.8, 0.78, 0.7, 1))
	info.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(info)

	var sep: HSeparator = HSeparator.new()
	vb.add_child(sep)

	var has: bool = SaveManager.has_slot(idx)
	var data: Dictionary = SaveManager.get_slot_info(idx)
	if has and bool(data.get("exists", false)):
		var ch: int = 0
		var total_stars: int = 0
		var prog: Dictionary = data.get("chapter_progress", {})
		for c in prog.keys():
			ch += 1
			var levels: Dictionary = prog[c].get("completed_levels", {})
			for lv in levels.values():
				total_stars += int(lv)
		var tm: int = int(data.get("timestamp", 0))
		var d: String = ""
		if tm > 0:
			d = Time.get_datetime_dict_from_unix_time(tm, true)
			d = "%04d-%02d-%02d %02d:%02d" % [d.year, d.month, d.day, d.hour, d.minute]
		info.text = "📜 章节：%d 章已解锁\n⭐ 累计星数：%d\n⏱️  最近保存：\n  %s\n🃏 卡组：%d 张" % [
			ch, total_stars, d, int(data.get("player_deck", []).size())
		]
	else:
		info.text = "（空槽位）\n\n点击创建新存档"
		info.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))

	var load_btn: Button = Button.new()
	load_btn.text = "加载存档" if has else "创建新存档"
	load_btn.add_theme_font_size_override("font_size", 16)
	load_btn.pressed.connect(func(): _on_load(idx))
	vb.add_child(load_btn)

	if has:
		var del_btn: Button = Button.new()
		del_btn.text = "删除存档"
		del_btn.add_theme_font_size_override("font_size", 14)
		del_btn.add_theme_color_override("font_color", Color(1, 0.5, 0.5, 1))
		del_btn.pressed.connect(func(): _on_delete(idx))
		vb.add_child(del_btn)
	return panel

func _refresh_hint_bar() -> void:
	for c in _hint_bar.get_children(): c.queue_free()
	var hints: Array = [
		["ui_accept", "选择"],
		["ui_cancel", "返回"],
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

func _on_load(idx: int) -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	if not SaveManager.has_slot(idx):
		SaveManager.create_slot(idx)
	SaveManager.load_slot(idx)
	get_tree().change_scene_to_file("res://scenes/LevelSelect.tscn")

func _on_delete(idx: int) -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	var dialog: AcceptDialog = AcceptDialog.new()
	dialog.title = "确认删除"
	dialog.dialog_text = ("确定要删除存档 %d 吗？此操作不可撤销。" % (idx + 1))
	dialog.confirmed.connect(func():
		SaveManager.delete_slot(idx)
		_refresh()
	)
	add_child(dialog)
	dialog.popup_centered()

func _on_back() -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_back()
