extends Node2D
## GameSceneController - 游戏场景主控制器
## 动态创建所有子系统、管理游戏循环、胜负判定

const DP := preload("res://scripts/data/DataProvider.gd")

signal level_completed(stats: Dictionary)
signal level_failed(stats: Dictionary)

var placement_system: Node = null
var pipeline: Node = null
var order_manager: Node = null
var top_bar: CanvasLayer = null
var side_panel: CanvasLayer = null
var pause_overlay: CanvasLayer = null
var notifications: CanvasLayer = null
var order_list: CanvasLayer = null
var result_dialog: CanvasLayer = null
var bottleneck_hints: CanvasLayer = null
var tutorial_panel: Control = null

var current_level_id: String = "level_1"
var level_config: Dictionary = {}
var level_started: bool = false
var level_start_time: float = 0.0
var level_timer: float = 0.0
var level_time_limit: float = 0.0
var target_orders: int = 0
var is_level_running: bool = false
var bonus_objectives_state: Dictionary = {}
var _tutorial_shown: bool = false

const SCRIPTS := {
	"placement": preload("res://scripts/game/PlacementSystem.gd"),
	"pipeline": preload("res://scripts/game/PipelineController.gd"),
	"order": preload("res://scripts/game/OrderManager.gd"),
	"topbar": preload("res://scripts/ui/TopBar.gd"),
	"side": preload("res://scripts/ui/SidePanel.gd"),
	"pause": preload("res://scripts/ui/PauseOverlay.gd"),
	"notif": preload("res://scripts/ui/Notifications.gd"),
	"orderlist": preload("res://scripts/ui/OrderList.gd"),
	"result": preload("res://scripts/ui/ResultDialog.gd"),
	"bn": preload("res://scripts/ui/BottleneckHints.gd"),
	"tutorial": preload("res://scripts/ui/TutorialPanel.gd")
}

const SCENES := {
	"tutorial": preload("res://scenes/ui/TutorialPanel.tscn")
}

func receive_scene_data(data: Dictionary) -> void:
	current_level_id = data.get("level_id", "level_1")

func _ready() -> void:
	_build_all_nodes()
	_load_level(current_level_id)
	_connect_signals()
	PlaytestRecorder.record_level_start(current_level_id)
	AudioManager.play_music_loop()
	if not _tutorial_shown:
		_show_tutorial_once()
	_save_on_interval()

func _build_all_nodes() -> void:
	placement_system = Node2D.new()
	placement_system.name = "PlacementSystem"
	placement_system.position = Vector2(40, 90)
	placement_system.set_script(SCRIPTS["placement"])
	add_child(placement_system)
	pipeline = Node2D.new()
	pipeline.name = "PipelineController"
	pipeline.set_script(SCRIPTS["pipeline"])
	add_child(pipeline)
	order_manager = Node.new()
	order_manager.name = "OrderManager"
	order_manager.set_script(SCRIPTS["order"])
	add_child(order_manager)
	top_bar = CanvasLayer.new()
	top_bar.name = "TopBar"
	top_bar.set_script(SCRIPTS["topbar"])
	_build_topbar_ui(top_bar)
	add_child(top_bar)
	side_panel = CanvasLayer.new()
	side_panel.name = "SidePanel"
	side_panel.set_script(SCRIPTS["side"])
	_build_sidepanel_ui(side_panel)
	add_child(side_panel)
	pause_overlay = CanvasLayer.new()
	pause_overlay.name = "PauseOverlay"
	pause_overlay.set_script(SCRIPTS["pause"])
	_build_pause_ui(pause_overlay)
	add_child(pause_overlay)
	notifications = CanvasLayer.new()
	notifications.name = "Notifications"
	notifications.set_script(SCRIPTS["notif"])
	_build_notif_ui(notifications)
	add_child(notifications)
	order_list = CanvasLayer.new()
	order_list.name = "OrderList"
	order_list.set_script(SCRIPTS["orderlist"])
	_build_orderlist_ui(order_list)
	add_child(order_list)
	result_dialog = CanvasLayer.new()
	result_dialog.name = "ResultDialog"
	result_dialog.set_script(SCRIPTS["result"])
	_build_result_ui(result_dialog)
	add_child(result_dialog)
	bottleneck_hints = CanvasLayer.new()
	bottleneck_hints.name = "BottleneckHints"
	bottleneck_hints.set_script(SCRIPTS["bn"])
	_build_bn_ui(bottleneck_hints)
	add_child(bottleneck_hints)

func _build_topbar_ui(cl: CanvasLayer) -> void:
	var root := Control.new()
	root.name = "TopBar"
	root.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	root.offset_bottom = 70
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.05, 0.14, 0.95)
	var pc := PanelContainer.new()
	pc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	pc.add_theme_stylebox_override("panel", style)
	root.add_child(pc)
	var hb := HBoxContainer.new()
	hb.name = "HBox"
	hb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hb.offset_left = 14
	hb.offset_right = -14
	hb.offset_top = 12
	hb.offset_bottom = -12
	hb.add_theme_constant_override("separation", 18)
	root.add_child(hb)
	_add_money_section(hb)
	_add_level_section(hb)
	_add_stats_section(hb)
	_add_speed_section(hb)
	_add_right_buttons(hb)
	cl.add_child(root)

func _add_money_section(parent: HBoxContainer) -> void:
	var hb := HBoxContainer.new()
	hb.name = "Money"
	hb.add_theme_constant_override("separation", 6)
	parent.add_child(hb)
	var icon := Label.new()
	icon.name = "Icon"
	icon.text = "💰"
	icon.add_theme_font_size_override("font_size", 24)
	hb.add_child(icon)
	var lbl := Label.new()
	lbl.name = "Label"
	lbl.text = "500"
	lbl.add_theme_font_size_override("font_size", 22)
	lbl.modulate = Color(1.0, 0.85, 0.35)
	hb.add_child(lbl)

func _add_level_section(parent: HBoxContainer) -> void:
	var vb := VBoxContainer.new()
	vb.name = "LevelInfo"
	vb.add_theme_constant_override("separation", 3)
	parent.add_child(vb)
	var lvl_lbl := Label.new()
	lvl_lbl.name = "LevelLabel"
	lvl_lbl.text = "Lv.1"
	lvl_lbl.add_theme_font_size_override("font_size", 16)
	lvl_lbl.modulate = Color(0.8, 0.9, 1.0)
	vb.add_child(lvl_lbl)
	var xp_bg := ColorRect.new()
	xp_bg.name = "XPBar"
	xp_bg.color = Color(0.1, 0.08, 0.16)
	xp_bg.size = Vector2(160, 8)
	xp_bg.custom_minimum_size = Vector2(160, 8)
	vb.add_child(xp_bg)
	var xp_fill := ColorRect.new()
	xp_fill.name = "Fill"
	xp_fill.color = Color(0.35, 0.6, 0.95)
	xp_fill.size = Vector2(0, 8)
	xp_fill.custom_minimum_size = Vector2(0, 8)
	xp_bg.add_child(xp_fill)

func _add_stats_section(parent: HBoxContainer) -> void:
	var vb := VBoxContainer.new()
	vb.name = "Stats"
	vb.add_theme_constant_override("separation", 3)
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(vb)
	var o_lbl := Label.new()
	o_lbl.name = "OrdersLabel"
	o_lbl.text = "📦 0/10"
	o_lbl.add_theme_font_size_override("font_size", 15)
	vb.add_child(o_lbl)
	var hb := HBoxContainer.new()
	hb.name = "HBox"
	hb.add_theme_constant_override("separation", 8)
	vb.add_child(hb)
	var h_bg := ColorRect.new()
	h_bg.name = "HealthBar"
	h_bg.color = Color(0.1, 0.08, 0.16)
	h_bg.size = Vector2(140, 8)
	h_bg.custom_minimum_size = Vector2(140, 8)
	hb.add_child(h_bg)
	var h_fill := ColorRect.new()
	h_fill.name = "Fill"
	h_fill.color = Color(0.35, 0.85, 0.45)
	h_fill.size = Vector2(140, 8)
	h_fill.custom_minimum_size = Vector2(140, 8)
	h_bg.add_child(h_fill)
	var hl := Label.new()
	hl.name = "HealthLabel"
	hl.text = "100%"
	hl.add_theme_font_size_override("font_size", 11)
	hl.modulate = Color(0.7, 0.9, 0.7)
	hb.add_child(hl)
	var t_lbl := Label.new()
	t_lbl.name = "TimeLabel"
	t_lbl.text = "♾"
	t_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	t_lbl.add_theme_font_size_override("font_size", 15)
	t_lbl.modulate = Color(0.7, 0.85, 1.0)
	vb.add_child(t_lbl)

func _add_speed_section(parent: HBoxContainer) -> void:
	var vb := VBoxContainer.new()
	vb.name = "SpeedControl"
	vb.add_theme_constant_override("separation", 4)
	parent.add_child(vb)
	var s_lbl := Label.new()
	s_lbl.name = "SpeedLabel"
	s_lbl.text = "1.0x"
	s_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	s_lbl.add_theme_font_size_override("font_size", 14)
	s_lbl.modulate = Color(0.9, 0.95, 1.0)
	vb.add_child(s_lbl)
	var hb := HBoxContainer.new()
	hb.name = "HBox"
	hb.add_theme_constant_override("separation", 4)
	vb.add_child(hb)
	var b1 := Button.new()
	b1.name = "SpeedDown"
	b1.text = "−"
	b1.custom_minimum_size = Vector2(32, 28)
	b1.add_theme_font_size_override("font_size", 14)
	hb.add_child(b1)
	var b2 := Button.new()
	b2.name = "SpeedUp"
	b2.text = "+"
	b2.custom_minimum_size = Vector2(32, 28)
	b2.add_theme_font_size_override("font_size", 14)
	hb.add_child(b2)

func _add_right_buttons(parent: HBoxContainer) -> void:
	var bp := Button.new()
	bp.name = "PauseButton"
	bp.text = "⏸"
	bp.custom_minimum_size = Vector2(50, 44)
	bp.add_theme_font_size_override("font_size", 20)
	parent.add_child(bp)
	var bm := Button.new()
	bm.name = "MenuButton"
	bm.text = "☰"
	bm.custom_minimum_size = Vector2(50, 44)
	bm.add_theme_font_size_override("font_size", 20)
	parent.add_child(bm)

func _build_sidepanel_ui(cl: CanvasLayer) -> void:
	var root := Control.new()
	root.name = "Panel"
	root.set_anchors_and_offsets_preset(Control.PRESET_RIGHT_WIDE)
	root.offset_left = 1280 - 310
	root.offset_top = 80
	root.offset_bottom = -10
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.09, 0.06, 0.15, 0.96)
	style.border_color = Color(1.0, 0.82, 0.33, 0.35)
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	var pc := PanelContainer.new()
	pc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	pc.add_theme_stylebox_override("panel", style)
	root.add_child(pc)
	var vb := VBoxContainer.new()
	vb.name = "VBox"
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 10
	vb.offset_right = -10
	vb.offset_top = 10
	vb.offset_bottom = -10
	vb.add_theme_constant_override("separation", 8)
	root.add_child(vb)
	var title := Label.new()
	title.name = "TitleLabel"
	title.text = "🏭 建造面板"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 18)
	title.modulate = Color(1.0, 0.88, 0.45)
	vb.add_child(title)
	var sep := HSeparator.new()
	vb.add_child(sep)
	var mlist := VBoxContainer.new()
	mlist.name = "MachineList"
	mlist.add_theme_constant_override("separation", 6)
	var sc := ScrollContainer.new()
	sc.name = "Scroll"
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = 0
	var mt := Label.new()
	mt.name = "MachineListTitle"
	mt.text = "选择机器放置  按[R]旋转"
	mt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mt.add_theme_font_size_override("font_size", 11)
	mt.modulate = Color(0.65, 0.7, 0.9)
	mlist.add_child(mt)
	sc.add_child(mlist)
	vb.add_child(sc)
	var sep2 := HSeparator.new()
	vb.add_child(sep2)
	var dp := VBoxContainer.new()
	dp.name = "DetailPanel"
	dp.visible = false
	dp.add_theme_constant_override("separation", 8)
	vb.add_child(dp)
	var dt := Label.new()
	dt.text = "⚙ 机器详情"
	dt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dt.add_theme_font_size_override("font_size", 15)
	dt.modulate = Color(0.85, 0.9, 1.0)
	dp.add_child(dt)
	var ri := RichTextLabel.new()
	ri.name = "InfoLabel"
	ri.size_flags_vertical = Control.SIZE_EXPAND_FILL
	ri.bbcode_enabled = true
	ri.scroll_following = false
	dp.add_child(ri)
	var btns := HBoxContainer.new()
	btns.name = "Buttons"
	btns.add_theme_constant_override("separation", 6)
	dp.add_child(btns)
	var bc := Button.new()
	bc.name = "CloseButton"
	bc.text = "← 返回"
	bc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bc.custom_minimum_size = Vector2(0, 38)
	btns.add_child(bc)
	var bu := Button.new()
	bu.name = "UpgradeButton"
	bu.text = "⬆ 升级"
	bu.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bu.custom_minimum_size = Vector2(0, 38)
	btns.add_child(bu)
	var bs := Button.new()
	bs.name = "SellButton"
	bs.text = "💸 出售"
	bs.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bs.custom_minimum_size = Vector2(0, 38)
	btns.add_child(bs)
	cl.add_child(root)

func _build_pause_ui(cl: CanvasLayer) -> void:
	var overlay := ColorRect.new()
	overlay.name = "Overlay"
	overlay.color = Color(0, 0, 0, 0.72)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	cl.add_child(overlay)
	var pc := PanelContainer.new()
	pc.name = "Panel"
	pc.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	pc.offset_left = -200
	pc.offset_top = -210
	pc.offset_right = 200
	pc.offset_bottom = 210
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.12, 0.08, 0.22, 1)
	style.border_color = Color(1.0, 0.82, 0.33, 0.8)
	style.border_width_left = 3
	style.border_width_right = 3
	style.border_width_top = 3
	style.border_width_bottom = 3
	pc.add_theme_stylebox_override("panel", style)
	overlay.add_child(pc)
	var vb := VBoxContainer.new()
	vb.name = "VBox"
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 20
	vb.offset_right = -20
	vb.offset_top = 20
	vb.offset_bottom = -20
	vb.add_theme_constant_override("separation", 10)
	pc.add_child(vb)
	var t := Label.new()
	t.name = "Title"
	t.text = "⏸ 游戏暂停"
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	t.add_theme_font_size_override("font_size", 26)
	t.modulate = Color(1.0, 0.88, 0.45)
	vb.add_child(t)
	var sep := HSeparator.new()
	vb.add_child(sep)
	var btn_labels := [["继续游戏", "ButtonResume"], ["⚙ 设置", "ButtonSettings"], ["💾 保存游戏", "ButtonSave"], ["🔁 重新开始", "ButtonRestart"], ["🏠 返回菜单", "ButtonMenu"]]
	for pair in btn_labels:
		var b := Button.new()
		b.name = pair[1]
		b.text = pair[0]
		b.custom_minimum_size = Vector2(0, 48)
		b.add_theme_font_size_override("font_size", 16)
		vb.add_child(b)
	cl.visible = false

func _build_notif_ui(cl: CanvasLayer) -> void:
	var vb := VBoxContainer.new()
	vb.name = "Stack"
	vb.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	vb.offset_left = 1280 - 340
	vb.offset_top = 85
	vb.offset_right = -10
	vb.add_theme_constant_override("separation", 6)
	cl.add_child(vb)

func _build_orderlist_ui(cl: CanvasLayer) -> void:
	var root := Control.new()
	root.name = "Panel"
	root.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	root.offset_left = 10
	root.offset_top = 85
	root.offset_right = 280
	root.offset_bottom = 680
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.05, 0.14, 0.95)
	style.border_color = Color(1.0, 0.82, 0.33, 0.3)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	var pc := PanelContainer.new()
	pc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	pc.add_theme_stylebox_override("panel", style)
	root.add_child(pc)
	var vb := VBoxContainer.new()
	vb.name = "VBox"
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 8
	vb.offset_right = -8
	vb.offset_top = 8
	vb.offset_bottom = -8
	vb.add_theme_constant_override("separation", 6)
	root.add_child(vb)
	var title := Label.new()
	title.name = "ListTitle"
	title.text = "📋 订单列表"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 16)
	title.modulate = Color(1.0, 0.88, 0.5)
	vb.add_child(title)
	var orders_vb := VBoxContainer.new()
	orders_vb.name = "Orders"
	orders_vb.add_theme_constant_override("separation", 8)
	var sc := ScrollContainer.new()
	sc.name = "Scroll"
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = 0
	sc.add_child(orders_vb)
	vb.add_child(sc)
	cl.add_child(root)

func _build_result_ui(cl: CanvasLayer) -> void:
	var overlay := ColorRect.new()
	overlay.name = "Overlay"
	overlay.color = Color(0, 0, 0, 0.78)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	cl.add_child(overlay)
	var pc := PanelContainer.new()
	pc.name = "Panel"
	pc.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	pc.offset_left = -300
	pc.offset_top = -280
	pc.offset_right = 300
	pc.offset_bottom = 280
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.06, 0.18, 1)
	style.border_color = Color(1.0, 0.82, 0.33, 0.9)
	style.border_width_left = 4
	style.border_width_right = 4
	style.border_width_top = 4
	style.border_width_bottom = 4
	pc.add_theme_stylebox_override("panel", style)
	overlay.add_child(pc)
	var vb := VBoxContainer.new()
	vb.name = "VBox"
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 24
	vb.offset_right = -24
	vb.offset_top = 20
	vb.offset_bottom = -20
	vb.add_theme_constant_override("separation", 10)
	pc.add_child(vb)
	var t := Label.new()
	t.name = "Title"
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	t.add_theme_font_size_override("font_size", 30)
	vb.add_child(t)
	var sd := Label.new()
	sd.name = "ScoreDisplay"
	sd.text = "得分: 0"
	sd.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sd.add_theme_font_size_override("font_size", 20)
	vb.add_child(sd)
	var stats := RichTextLabel.new()
	stats.name = "Stats"
	stats.bbcode_enabled = true
	stats.size_flags_vertical = Control.SIZE_EXPAND_FILL
	stats.scroll_following = false
	vb.add_child(stats)
	var btns := HBoxContainer.new()
	btns.name = "Buttons"
	btns.add_theme_constant_override("separation", 8)
	vb.add_child(btns)
	for pair in [["➡ 下一关", "ButtonNext"], ["🔁 重试", "ButtonRetry"], ["🏠 菜单", "ButtonMenu"]]:
		var b := Button.new()
		b.name = pair[1]
		b.text = pair[0]
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.custom_minimum_size = Vector2(0, 46)
		b.add_theme_font_size_override("font_size", 15)
		btns.add_child(b)
	cl.visible = false

func _build_bn_ui(cl: CanvasLayer) -> void:
	var root := Control.new()
	root.name = "Panel"
	root.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	root.offset_left = 1280 - 290
	root.offset_top = 620
	root.offset_right = -10
	root.offset_bottom = -10
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.14, 0.06, 0.05, 0.9)
	style.border_color = Color(1.0, 0.45, 0.3, 0.6)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	var pc := PanelContainer.new()
	pc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	pc.add_theme_stylebox_override("panel", style)
	root.add_child(pc)
	var vb := VBoxContainer.new()
	vb.name = "List"
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 8
	vb.offset_right = -8
	vb.offset_top = 6
	vb.offset_bottom = -6
	vb.add_theme_constant_override("separation", 4)
	root.add_child(vb)
	var title := Label.new()
	title.name = "ListTitle"
	title.text = "⚠ 瓶颈提示"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 13)
	title.modulate = Color(1.0, 0.6, 0.4)
	vb.add_child(title)
	cl.add_child(root)

func _show_tutorial_once() -> void:
	_tutorial_shown = true
	tutorial_panel = SCENES["tutorial"].instantiate()
	if tutorial_panel:
		add_child(tutorial_panel)

func _save_on_interval() -> void:
	var t := Timer.new()
	t.wait_time = 45.0
	t.autostart = true
	t.timeout.connect(func():
		if is_level_running:
			SaveSystem.save_game()
	)
	add_child(t)

func _load_level(lvl_id: String) -> void:
	level_config = DP.get_level_config(lvl_id).duplicate(true)
	level_config["id"] = lvl_id
	if GameState.money < level_config.get("start_money", 500):
		GameState.money = level_config.get("start_money", 500)
		GameState.money_changed.emit(GameState.money)
	level_start_time = Time.get_unix_time_from_system()
	level_timer = 0.0
	level_time_limit = float(level_config.get("time_limit_seconds", 0))
	target_orders = level_config.get("target_orders", 10)
	bonus_objectives_state.clear()
	for obj in level_config.get("bonus_objectives", []):
		bonus_objectives_state[obj["id"]] = {"completed": false, "data": obj}
	placement_system.setup_for_level(level_config)
	order_manager.setup_for_level(level_config)
	pipeline.initialize(placement_system, order_manager)
	top_bar.initialize(level_config)
	side_panel.initialize(level_config, placement_system)
	order_list.initialize()
	pause_overlay.initialize()
	bottleneck_hints.initialize()
	result_dialog.visible = false
	level_started = true
	is_level_running = true
	_connect_placement_machine_selection()

func _connect_placement_machine_selection() -> void:
	pass

func _connect_signals() -> void:
	placement_system.item_placed.connect(_on_item_placed)
	placement_system.machine_selected.connect(_on_machine_selected)
	order_manager.order_added.connect(_on_order_added)
	order_manager.order_removed.connect(_on_order_removed)
	order_manager.order_progress_updated.connect(_on_order_progress)
	order_manager.order_time_warning.connect(_on_order_warning)
	pipeline.bottleneck_detected.connect(_on_bottleneck)
	GameState.money_changed.connect(_on_money_changed)
	GameState.level_changed.connect(_on_player_level)

func _on_item_placed(item_type: String, grid_pos: Vector2i) -> void:
	if item_type == "conveyor":
		pipeline.spawn_conveyor(grid_pos, placement_system.selected_rotation)
	else:
		var m = pipeline.spawn_machine(item_type, grid_pos, placement_system.selected_rotation)
		if m:
			m.input_event.connect(func(viewport, ev, _s):
				if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
					_on_machine_node_clicked(m)
	)
	side_panel.on_machine_placed()

func _on_machine_node_clicked(machine_node: Node) -> void:
	side_panel.show_machine_detail(machine_node)
	placement_system.select_machine_by_id(machine_node.machine_id)

func _on_machine_selected(mid: String) -> void:
	var machine = pipeline.get_machine_by_id(mid)
	if machine and side_panel:
		side_panel.show_machine_detail(machine)

func _on_order_added(order: Dictionary) -> void:
	order_list.add_order(order)
	notifications.show_notification("新订单: %s" % order.get("name", "订单"), "info")

func _on_order_removed(order_id: String, completed: bool) -> void:
	order_list.remove_order(order_id)
	var text: String = "订单完成!" if completed else "订单失败..."
	var ntype: String = "success" if completed else "error"
	notifications.show_notification(text, ntype)
	if completed:
		_check_level_objectives()

func _on_order_progress(oid: String, progress: float) -> void:
	order_list.update_progress(oid, progress)

func _on_order_warning(oid: String) -> void:
	notifications.show_notification("订单即将超时!", "warning")

func _on_bottleneck(mid: String, score: float) -> void:
	bottleneck_hints.add_hint(mid, score)

func _on_money_changed(amt: int) -> void:
	top_bar.update_money(amt)

func _on_player_level(lvl: int) -> void:
	notifications.show_notification("恭喜升级! 当前等级: %d" % lvl, "success")

func _process(delta: float) -> void:
	if not is_level_running or GameState.is_paused:
		return
	var dt := delta * GameState.game_speed
	level_timer += dt
	if level_time_limit > 0:
		var remaining: float = level_time_limit - level_timer
		top_bar.update_time_limit(max(remaining, 0.0))
		if remaining <= 0:
			_check_level_end_on_timeout()
	top_bar.update_stats(pipeline.get_statistics(), order_manager.get_summary())
	_check_level_objectives()

func _check_level_objectives() -> void:
	var completed: int = GameState.total_orders_completed
	if completed >= target_orders and is_level_running:
		_end_level(true)

func _check_level_end_on_timeout() -> void:
	var completed: int = GameState.total_orders_completed
	if completed >= target_orders:
		_end_level(true)
	else:
		_end_level(false)

func _end_level(success: bool) -> void:
	is_level_running = false
	GameState.is_paused = true
	var stats: Dictionary = _compile_level_stats(success)
	_evaluate_bonus_objectives(stats)
	PlaytestRecorder.record_level_end(current_level_id, "completed" if success else "timeout", stats.get("score", 0))
	result_dialog.show_result(success, stats)
	SaveSystem.save_game()
	if success:
		level_completed.emit(stats)
		AudioManager.play_sfx("success")
	else:
		level_failed.emit(stats)
		AudioManager.play_sfx("fail")

func _compile_level_stats(success: bool) -> Dictionary:
	var pipeline_stats: Dictionary = pipeline.get_statistics()
	var order_stats: Dictionary = order_manager.get_summary()
	var duration: int = int(level_timer)
	var score: int = order_stats.get("completed", 0) * 100
	score += int((180 - duration) * 5 if duration < 180 else 0)
	score += int(GameState.money * 0.1)
	return {
		"level_id": current_level_id,
		"success": success,
		"duration_seconds": duration,
		"orders_completed": order_stats.get("completed", 0),
		"orders_failed": order_stats.get("failed", 0),
		"orders_target": target_orders,
		"machines_used": pipeline_stats.get("machines", 0),
		"conveyors_used": pipeline_stats.get("conveyors", 0),
		"total_produced": pipeline_stats.get("produced", 0),
		"money_remaining": GameState.money,
		"score": score,
		"pipeline_health": pipeline_stats.get("health", 0.0)
	}

func _evaluate_bonus_objectives(stats: Dictionary) -> void:
	var bonus_earned: int = 0
	for obj_id in bonus_objectives_state.keys():
		var entry: Dictionary = bonus_objectives_state[obj_id]
		var obj: Dictionary = entry.get("data", {})
		var done: bool = false
		match obj_id:
			"no_fail":
				done = stats.get("orders_failed", 0) == 0
			"speed":
				done = stats.get("duration_seconds", 9999) < 300
			"use_quality":
				done = _count_machine_type("quality") > 0
			"all_machines":
				done = _count_machine_type("cutter") > 0 and _count_machine_type("assembler") > 0 and _count_machine_type("forger") > 0 and _count_machine_type("finisher") > 0
			"time_attack":
				done = stats.get("duration_seconds", 9999) < 360 and stats.get("success")
			"perfect_streak":
				done = order_manager.get_summary().get("consecutive", 0) >= 15
		if done:
			entry["completed"] = true
			var rw: int = obj.get("reward", 0)
			bonus_earned += rw
			GameState.add_money(rw)
	stats["bonus_reward"] = bonus_earned
	stats["bonus_objectives"] = bonus_objectives_state

func _count_machine_type(mtype: String) -> int:
	var n: int = 0
	for m in pipeline.machine_nodes.values():
		if m.machine_type == mtype:
			n += 1
	return n

func toggle_pause() -> void:
	GameState.is_paused = not GameState.is_paused
	if GameState.is_paused:
		PlaytestRecorder.notify_pause()
	else:
		PlaytestRecorder.notify_resume()
	pause_overlay.visible = GameState.is_paused

func speed_up() -> void:
	GameState.game_speed = min(GameState.game_speed + 0.5, 3.0)

func speed_down() -> void:
	GameState.game_speed = max(GameState.game_speed - 0.5, 0.5)

func exit_to_menu() -> void:
	SaveSystem.save_game()
	GameState.reset_for_new_level()
	SceneManager.change_scene("LevelSelect")

func retry_level() -> void:
	GameState.reset_for_new_level()
	SceneManager.change_scene("GameScene", true, {"level_id": current_level_id})

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_ESCAPE, KEY_SPACE:
				toggle_pause()
			KEY_EQUAL, KEY_PLUS:
				speed_up()
			KEY_MINUS:
				speed_down()
