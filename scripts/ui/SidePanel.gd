extends CanvasLayer
## SidePanel - 侧边栏（机器选择、机器详情）

const DP := preload("res://scripts/data/DataProvider.gd")

@onready var machine_list: VBoxContainer = $Panel/VBox/Scroll/MachineList
@onready var detail_panel: VBoxContainer = $Panel/VBox/DetailPanel
@onready var lbl_panel_title: Label = $Panel/VBox/TitleLabel
@onready var btn_sell: Button = $Panel/VBox/DetailPanel/Buttons/SellButton
@onready var btn_upgrade: Button = $Panel/VBox/DetailPanel/Buttons/UpgradeButton
@onready var detail_info: RichTextLabel = $Panel/VBox/DetailPanel/InfoLabel
@onready var selected_machine: Node = null
@onready var placement_sys: Node = null
@onready var btn_close_detail: Button = $Panel/VBox/DetailPanel/Buttons/CloseButton

var level_cfg: Dictionary = {}
var _machine_buttons: Array = []

func initialize(cfg: Dictionary, ps: Node) -> void:
	level_cfg = cfg
	placement_sys = ps
	_build_machine_list()
	hide_detail()
	_connect_buttons()

func _connect_buttons() -> void:
	btn_sell.pressed.connect(_on_sell)
	btn_upgrade.pressed.connect(_on_upgrade)
	btn_close_detail.pressed.connect(_on_close_detail)
	for b in [btn_sell, btn_upgrade, btn_close_detail]:
		b.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _build_machine_list() -> void:
	for c in machine_list.get_children():
		if c.name != "MachineListTitle":
			c.queue_free()
	_machine_buttons.clear()
	var avail: Array = level_cfg.get("available_machines", [])
	var categories: Array = DP.get_all_machine_categories()
	var seen_cats: Dictionary = {}
	for cat in categories:
		var machines_in_cat: Array = []
		for mtype in avail:
			var mcfg: Dictionary = DP.get_machine_config(mtype)
			if mcfg.get("category", "") == cat:
				machines_in_cat.append(mtype)
		if machines_in_cat.is_empty():
			continue
		var cat_lbl := Label.new()
		cat_lbl.text = "— %s —" % cat
		cat_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cat_lbl.modulate = Color(0.75, 0.7, 0.9)
		cat_lbl.add_theme_font_size_override("font_size", 12)
		machine_list.add_child(cat_lbl)
		for mtype in machines_in_cat:
			var btn := _create_machine_button(mtype)
			machine_list.add_child(btn)
			_machine_buttons.append(btn)

func _create_machine_button(mtype: String) -> Control:
	var mcfg: Dictionary = DP.get_machine_config(mtype)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	var icon := ColorRect.new()
	icon.color = mcfg.get("color", Color.GRAY)
	icon.size = Vector2(36, 36)
	icon.custom_minimum_size = Vector2(36, 36)
	row.add_child(icon)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 2)
	row.add_child(vb)
	var name_lbl := Label.new()
	name_lbl.text = mcfg.get("name", mtype)
	name_lbl.modulate = Color(0.92, 0.88, 1.0)
	name_lbl.add_theme_font_size_override("font_size", 14)
	vb.add_child(name_lbl)
	var desc_lbl := Label.new()
	desc_lbl.text = "%d💰 | %.2f/s" % [mcfg.get("base_cost", 0), mcfg.get("base_rate", 1.0)]
	desc_lbl.modulate = Color(0.7, 0.75, 0.85)
	desc_lbl.add_theme_font_size_override("font_size", 10)
	vb.add_child(desc_lbl)
	var btn := Button.new()
	btn.text = "放置"
	btn.custom_minimum_size = Vector2(70, 36)
	var cost: int = mcfg.get("base_cost", 0)
	btn.disabled = GameState.money < cost
	btn.add_theme_font_size_override("font_size", 12)
	btn.pressed.connect(func(): _on_place_clicked(mtype))
	btn.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))
	row.add_child(btn)
	GameState.money_changed.connect(func(_m):
		if is_instance_valid(btn):
			btn.disabled = GameState.money < cost
	)
	return row

func _on_place_clicked(mtype: String) -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("place_%s" % mtype, "SidePanel")
	if placement_sys:
		placement_sys.start_placing(mtype)

func show_machine_detail(machine: Node) -> void:
	selected_machine = machine
	if machine == null:
		hide_detail()
		return
	detail_panel.visible = true
	machine_list.visible = false
	lbl_panel_title.text = "机器详情"
	var mcfg: Dictionary = DP.get_machine_config(machine.machine_type)
	var info: String = ""
	info += "[b]%s[/b] (Lv.%d)\n" % [mcfg.get("name", "?"), machine.level]
	info += "%s\n\n" % mcfg.get("desc", "")
	info += "[color=yellow]⚡ 效率: %.2f / 秒[/color]\n" % machine.production_rate
	info += "[color=cyan]📦 已生产: %d[/color]\n" % machine.total_produced
	info += "[color=green]⏱ 工作时间: %.0fs[/color]\n" % machine.total_work_time
	info += "[color=red]⏸ 空闲时间: %.0fs[/color]\n\n" % machine.total_idle_time
	if machine.is_bottleneck():
		info += "[color=red]⚠ 流水线瓶颈! (空闲率%d%%)[/color]\n" % int(machine.bottleneck_score * 100)
	else:
		info += "[color=green]✓ 运行正常[/color]\n"
	info += "\n[b]升级费用:[/b] %d 💰\n" % machine.get_upgrade_cost()
	info += "[color=gray]升级后效率 +25%[/color]"
	detail_info.text = info
	btn_upgrade.disabled = not GameState.can_afford(machine.get_upgrade_cost()) or machine.level >= 10

func hide_detail() -> void:
	detail_panel.visible = false
	machine_list.visible = true
	lbl_panel_title.text = "建造面板"

func on_machine_placed() -> void:
	for row in _machine_buttons:
		for child in row.get_children():
			if child is Button:
				var mtype: String = _extract_type_from_row(row)
				if mtype:
					var mcfg: Dictionary = DP.get_machine_config(mtype)
					child.disabled = GameState.money < mcfg.get("base_cost", 0)

func _extract_type_from_row(row: HBoxContainer) -> String:
	for child in row.get_children():
		if child is VBoxContainer:
			for lbl in child.get_children():
				if lbl is Label:
					var t: String = lbl.text
					var mtypes: Array = ["cutter", "assembler", "forger", "finisher", "conveyor", "quality", "storage"]
					for mt in mtypes:
						var cfg: Dictionary = DP.get_machine_config(mt)
						if cfg.get("name") == t:
							return mt
	return ""

func _on_sell() -> void:
	AudioManager.play_sfx("click")
	if selected_machine == null:
		return
	var refund: int = int(selected_machine.base_cost * 0.5)
	GameState.add_money(refund)
	if get_tree().current_scene and get_tree().current_scene.has_method("pipeline"):
		var p = get_tree().current_scene.get_node("PipelineController")
		if p:
			p.remove_machine(selected_machine.machine_id)
	PlaytestRecorder.record_ui_click("sell_machine", "SidePanel")
	hide_detail()
	selected_machine = null

func _on_upgrade() -> void:
	AudioManager.play_sfx("click")
	if selected_machine and selected_machine.do_upgrade():
		show_machine_detail(selected_machine)
		PlaytestRecorder.record_key_decision("upgrade_machine", {"type": selected_machine.machine_type})

func _on_close_detail() -> void:
	AudioManager.play_sfx("click")
	hide_detail()
	if placement_sys:
		placement_sys.clear_selection()
