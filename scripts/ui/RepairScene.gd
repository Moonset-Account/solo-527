extends Control

var level_data: Dictionary = {}
var book_data: Dictionary = {}
var zone_states: Array = []
var damage_zones_nodes: Dictionary = {}
var selected_zone_id: String = ""
var current_time: float = 0.0
var time_limit: float = 180.0
var remaining_strength: float = 60.0
var base_strength: float = 60.0
var current_humidity: float = 50.0
var target_humidity: Variant = null
var humidity_tolerance: float = 5.0
var materials_used: Dictionary = {"paper": {}, "glue": {}}
var action_log: Array[Dictionary] = []
var tutorial_hints: Array = []
var tutorial_hint_index: int = 0
var _step_cn_map: Dictionary = {
	"humidify": "加湿",
	"cut": "裁纸",
	"align": "对齐",
	"paste": "粘胶",
	"press": "按压"
}

@onready var back_button: Button = $TopBar/TopHBox/BackButton
@onready var level_name_label: Label = $TopBar/TopHBox/LevelNameLabel
@onready var timer_label: Label = $TopBar/TopHBox/TimerLabel
@onready var strength_label: Label = $TopBar/TopHBox/StrengthLabel
@onready var humidity_label: Label = $TopBar/TopHBox/HumidityLabel
@onready var gold_label: Label = $TopBar/TopHBox/GoldLabel

@onready var client_name_label: Label = $MainArea/LeftPanel/ClientPanel/ClientVBox/ClientName
@onready var client_urgency_label: Label = $MainArea/LeftPanel/ClientPanel/ClientVBox/ClientUrgency
@onready var client_reward_label: Label = $MainArea/LeftPanel/ClientPanel/ClientVBox/ClientReward

@onready var tools_hbox: HBoxContainer = $MainArea/LeftPanel/ToolPanel/ToolVBox/ToolsHBox

@onready var paper_option: OptionButton = $MainArea/LeftPanel/PaperPanel/PaperVBox/PaperOption
@onready var paper_stock_label: Label = $MainArea/LeftPanel/PaperPanel/PaperVBox/PaperStock

@onready var glue_option: OptionButton = $MainArea/LeftPanel/GluePanel/GlueVBox/GlueOption
@onready var glue_ratio_label: Label = $MainArea/LeftPanel/GluePanel/GlueVBox/GlueRatioLabel
@onready var glue_ratio_slider: HSlider = $MainArea/LeftPanel/GluePanel/GlueVBox/GlueRatioSlider

@onready var humidity_slider_label: Label = $MainArea/LeftPanel/HumidityPanel/HumidityVBox/HumiditySliderLabel
@onready var humidity_slider: HSlider = $MainArea/LeftPanel/HumidityPanel/HumidityVBox/HumiditySlider
@onready var humidity_panel: PanelContainer = $MainArea/LeftPanel/HumidityPanel

@onready var book_content: Control = $MainArea/CenterArea/BookContainer/BookContent
@onready var damage_zones_container: Control = $MainArea/CenterArea/BookContainer/BookContent/DamageZonesContainer
@onready var book_title_label: Label = $MainArea/CenterArea/BookContainer/BookContent/BookTitle

@onready var zones_progress_label: Label = $MainArea/CenterArea/ZonesProgressPanel/ZonesProgressHBox/ZonesProgressLabel
@onready var zones_progress_bar: ProgressBar = $MainArea/CenterArea/ZonesProgressPanel/ZonesProgressHBox/ZonesProgressBar

@onready var zone_name_label: Label = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/ZoneName
@onready var zone_type_label: Label = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/ZoneType
@onready var zone_paper_req_label: Label = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/ZonePaperReq
@onready var zone_glue_req_label: Label = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/ZoneGlueReq
@onready var zone_steps_text_label: Label = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/ZoneStepsText
@onready var zone_progress_label: Label = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/ZoneProgressLabel
@onready var zone_quality_label: Label = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/ZoneQualityLabel
@onready var do_step_button: Button = $MainArea/RightPanel/ZoneDetailPanel/ZoneDetailVBox/DoStepButton

@onready var param1_label: Label = $MainArea/RightPanel/ParamsPanel/ParamsVBox/Param1Label
@onready var param1_slider: HSlider = $MainArea/RightPanel/ParamsPanel/ParamsVBox/Param1Slider
@onready var param2_label: Label = $MainArea/RightPanel/ParamsPanel/ParamsVBox/Param2Label
@onready var param2_slider: HSlider = $MainArea/RightPanel/ParamsPanel/ParamsVBox/Param2Slider
@onready var param3_label: Label = $MainArea/RightPanel/ParamsPanel/ParamsVBox/Param3Label
@onready var param3_slider: HSlider = $MainArea/RightPanel/ParamsPanel/ParamsVBox/Param3Slider

@onready var log_text: RichTextLabel = $MainArea/RightPanel/LogPanel/LogVBox/LogText
@onready var finish_button: Button = $MainArea/RightPanel/LogPanel/LogVBox/FinishButton

@onready var tutorial_label: Label = $TutorialHint/TutorialLabel
@onready var tutorial_hint_panel: PanelContainer = $TutorialHint

func _ready() -> void:
	LevelLoader.initialize()
	var level_id: int = GameManager.current_level_id
	level_data = LevelLoader.get_level(level_id)
	if level_data.is_empty():
		push_error("Level %d not found" % level_id)
		GameManager.change_scene("LevelSelect")
		return
	book_data = level_data.get("book", {})
	_init_topbar()
	_init_client_panel()
	_init_tools()
	_init_material_options()
	_init_humidity()
	_init_book_view()
	_init_zone_states()
	_init_params()
	_init_signals()
	base_strength = float(book_data.get("base_strength", 50))
	remaining_strength = base_strength
	time_limit = float(level_data.get("time_limit", 180))
	current_time = 0.0
	tutorial_hints = level_data.get("tutorial_hints", [])
	if tutorial_hints.size() > 0:
		tutorial_hint_index = 0
		_show_tutorial_hint()
	else:
		tutorial_hint_panel.visible = false
	_append_log("[系统] 修复工作开始！请仔细处理每一处损伤。")
	$TopBar/TopHBox/BackButton.pressed.connect(_on_back_pressed)

func _process(delta: float) -> void:
	current_time += delta
	_update_timer()
	if current_time >= time_limit + 30:
		_on_finish_pressed()

func _init_topbar() -> void:
	level_name_label.text = level_data.get("name", "")
	gold_label.text = "💰 %d" % GameManager.player_gold
	_update_strength()
	_update_humidity_display()

func _init_client_panel() -> void:
	var client: Dictionary = level_data.get("client", {})
	client_name_label.text = "客户：%s" % client.get("name", "匿名")
	client_urgency_label.text = "紧急度：%s" % ClientSystem.get_urgency_stars(client.get("urgency", 1))
	client_reward_label.text = "基础酬金：%d" % client.get("reward", 0)

func _init_tools() -> void:
	var tools: Array[String] = level_data.get("unlocked_tools", [])
	ToolSystem.set_available_tools(tools)
	var tool_details: Array[Dictionary] = ToolSystem.get_available_tools_detail()
	for detail in tool_details:
		var btn: Button = Button.new()
		btn.custom_minimum_size = Vector2(70, 70)
		btn.text = "%s\n%s" % [detail.get("icon", "🛠"), detail.get("name", "")]
		btn.add_theme_font_size_override("font_size", 14)
		var tool_id: String = detail.get("id", "")
		btn.pressed.connect(_on_tool_pressed.bind(tool_id))
		tools_hbox.add_child(btn)
	if not tools.is_empty():
		ToolSystem.select_tool(ToolSystem.available_tools[0])

func _init_material_options() -> void:
	var avail_paper: Array = level_data.get("available_materials", {}).get("paper", [])
	paper_option.clear()
	for pname in avail_paper:
		paper_option.add_item(pname)
	paper_option.selected = 0
	_on_paper_selected(0)
	paper_option.item_selected.connect(_on_paper_selected)
	var avail_glue: Array = level_data.get("available_materials", {}).get("glue", [])
	glue_option.clear()
	for gname in avail_glue:
		glue_option.add_item(gname)
	glue_option.selected = 0
	glue_option.item_selected.connect(_on_glue_selected)
	var min_ratio: float = level_data.get("available_materials", {}).get("min_glue_ratio", 0.2)
	var max_ratio: float = level_data.get("available_materials", {}).get("max_glue_ratio", 0.8)
	glue_ratio_slider.min_value = min_ratio
	glue_ratio_slider.max_value = max_ratio
	glue_ratio_slider.value = (min_ratio + max_ratio) * 0.5
	glue_ratio_label.text = "胶水浓度：%.2f" % glue_ratio_slider.value
	glue_ratio_slider.value_changed.connect(_on_glue_ratio_changed)

func _init_humidity() -> void:
	var htarget = book_data.get("humidity_target", null)
	target_humidity = htarget
	if htarget == null:
		humidity_panel.visible = false
		return
	humidity_tolerance = float(book_data.get("humidity_tolerance", 5))
	current_humidity = float(target_humidity)
	humidity_slider.value = current_humidity
	_update_humidity_display()
	humidity_slider.value_changed.connect(_on_humidity_changed)

func _init_book_view() -> void:
	book_title_label.text = "%s  ——  %s" % [book_data.get("name", ""), book_data.get("dynasty", "")]
	var paper_type_name: String = book_data.get("paper_type", "")
	var paper_info: Dictionary = LevelLoader.get_paper_by_name(paper_type_name)
	if not paper_info.is_empty():
		var color_str: String = paper_info.get("color", "#f0e6d2")
		var c: Color = Color(color_str)
		var tex: ColorRect = book_content.get_node("PaperTexture")
		tex.color = c
	for child in damage_zones_container.get_children():
		child.queue_free()
	damage_zones_nodes.clear()
	var zones: Array = book_data.get("damage_zones", [])
	for z in zones:
		_create_zone_node(z)
	_update_zones_progress()

func _create_zone_node(zdata: Dictionary) -> void:
	var zid: String = zdata.get("id", "")
	var ztype: String = zdata.get("type", "")
	var size: int = zdata.get("size", 1)
	var x: float = zdata.get("x", 0.5)
	var y: float = zdata.get("y", 0.5)
	var w: float = 30.0 + float(size) * 18.0
	var h: float = 30.0 + float(size) * 18.0
	var content_size: Vector2 = damage_zones_container.size
	var pos_x: float = x * content_size.x - w * 0.5
	var pos_y: float = y * content_size.y - h * 0.5
	var btn: Button = Button.new()
	btn.position = Vector2(pos_x, pos_y)
	btn.custom_minimum_size = Vector2(w, h)
	btn.tooltip_text = zdata.get("name", "")
	match ztype:
		"wormhole":
			btn.add_theme_color_override("font_color", Color(0.9, 0.3, 0.2, 1))
			btn.text = "🐛"
		"tear":
			btn.add_theme_color_override("font_color", Color(0.7, 0.4, 0.2, 1))
			btn.text = "⚡"
		"crack":
			btn.add_theme_color_override("font_color", Color(0.5, 0.3, 0.2, 1))
			btn.text = "💥"
		"separation":
			btn.add_theme_color_override("font_color", Color(0.3, 0.5, 0.7, 1))
			btn.text = "📏"
		"water_damage":
			btn.add_theme_color_override("font_color", Color(0.2, 0.4, 0.6, 1))
			btn.text = "💧"
		_:
			btn.text = "?"
	btn.add_theme_font_size_override("font_size", int(16 + size * 4))
	btn.pressed.connect(_on_zone_pressed.bind(zid))
	damage_zones_container.add_child(btn)
	damage_zones_nodes[zid] = btn

func _init_zone_states() -> void:
	zone_states.clear()
	var zones: Array = book_data.get("damage_zones", [])
	for z in zones:
		var zs = RepairSystem.ZoneState.new(z)
		zone_states.append(zs)

func _init_params() -> void:
	param1_slider.value_changed.connect(func(v: float): param1_label.text = "剪裁精度：%.2f" % v)
	param2_slider.value_changed.connect(func(v: float): param2_label.text = "对齐精度：%.2f" % v)
	param3_slider.value_changed.connect(func(v: float): param3_label.text = "按压力度：%.2f" % v)
	do_step_button.pressed.connect(_on_do_step_pressed)
	finish_button.pressed.connect(_on_finish_pressed)

func _init_signals() -> void:
	RepairSystem.step_completed.connect(_on_step_completed)
	RepairSystem.step_failed.connect(_on_step_failed)
	RepairSystem.zone_repaired.connect(_on_zone_repaired)

func _update_timer() -> void:
	var remaining: float = max(0.0, time_limit - current_time)
	var mins: int = int(remaining) / 60
	var secs: int = int(remaining) % 60
	if remaining < 30:
		timer_label.add_theme_color_override("font_color", Color(0.9, 0.2, 0.2, 1))
	else:
		timer_label.add_theme_color_override("font_color", Color(0, 0, 0, 1))
	timer_label.text = "⏱ %02d:%02d" % [mins, secs]

func _update_strength() -> void:
	strength_label.text = "💪 强度：%.0f/%.0f" % [remaining_strength, base_strength]
	if remaining_strength < base_strength * 0.4:
		strength_label.add_theme_color_override("font_color", Color(0.9, 0.2, 0.2, 1))
	elif remaining_strength < base_strength * 0.7:
		strength_label.add_theme_color_override("font_color", Color(0.8, 0.6, 0.1, 1))
	else:
		strength_label.add_theme_color_override("font_color", Color(0, 0, 0, 1))

func _update_humidity_display() -> void:
	humidity_label.text = "💧 湿度：%.0f%%" % current_humidity
	if target_humidity != null:
		humidity_slider_label.text = "当前：%.0f%%  |  目标：%.0f±%.0f%%" % [
			current_humidity, float(target_humidity), humidity_tolerance
		]

func _update_zones_progress() -> void:
	var total: int = zone_states.size()
	var repaired: int = 0
	for zs in zone_states:
		if zs.repaired:
			repaired += 1
	zones_progress_label.text = "修复进度：%d/%d" % [repaired, total]
	if total > 0:
		zones_progress_bar.value = float(repaired) / float(total) * 100.0

func _update_zone_detail() -> void:
	if selected_zone_id.is_empty():
		zone_name_label.text = "（点击损伤区域查看）"
		zone_type_label.text = ""
		zone_paper_req_label.text = ""
		zone_glue_req_label.text = ""
		zone_steps_text_label.text = ""
		zone_progress_label.text = "步骤进度：0/0"
		zone_quality_label.text = "当前品质：--"
		do_step_button.disabled = true
		return
	var zs = _get_zone_state(selected_zone_id)
	if zs == null:
		return
	var zdata: Dictionary = zs.zone_data
	zone_name_label.text = zdata.get("name", "")
	zone_type_label.text = "类型：%s  |  等级：%d" % [
		_type_cn(zdata.get("type", "")), zdata.get("size", 1)
	]
	var req_paper: String = zdata.get("required_paper_type", "")
	zone_paper_req_label.text = "📄 推荐补纸：%s" % req_paper
	var req_ratio: float = zdata.get("required_glue_ratio", 0.5)
	zone_glue_req_label.text = "🩹 推荐胶水浓度：约 %.2f" % req_ratio
	var order: Array = zdata.get("step_order", [])
	var names: Array = []
	for idx in range(order.size()):
		var s: String = order[idx]
		var completed: bool = idx < zs.completed_steps.size()
		var mark: String = "✅" if completed else ("➡️" if idx == zs.completed_steps.size() else "⬜")
		names.append("%s %s" % [mark, _step_cn(s)])
	zone_steps_text_label.text = "\n".join(names)
	zone_progress_label.text = "步骤进度：%d/%d" % [zs.completed_steps.size(), order.size()]
	if zs.repaired:
		zone_quality_label.text = "品质：%.0f%% ✔已完成" % (zs.quality * 100.0)
		zone_quality_label.add_theme_color_override("font_color", Color(0.2, 0.6, 0.2, 1))
		do_step_button.disabled = true
	else:
		if zs.completed_steps.size() > 0:
			zone_quality_label.text = "当前品质：%.0f%%" % (zs.quality * 100.0 / float(max(1, order.size())))
		else:
			zone_quality_label.text = "当前品质：--"
		zone_quality_label.add_theme_color_override("font_color", Color(0, 0, 0, 1))
		var expected_idx: int = zs.completed_steps.size()
		if expected_idx < order.size():
			var expected_step: String = order[expected_idx]
			do_step_button.text = "执行：%s" % _step_cn(expected_step)
			do_step_button.disabled = false
		else:
			do_step_button.disabled = true

func _get_zone_state(zid: String):
	for zs in zone_states:
		if zs.zone_id == zid:
			return zs
	return null

func _type_cn(t: String) -> String:
	match t:
		"wormhole": return "虫蛀"
		"tear": return "撕裂"
		"crack": return "脆裂"
		"separation": return "脱胶"
		"water_damage": return "水渍"
		_: return t

func _step_cn(s: String) -> String:
	return _step_cn_map.get(s, s)

func _append_log(msg: String, color_hex: String = "#333333") -> void:
	log_text.append_text("[color=%s]%s[/color]\n" % [color_hex, msg])
	log_text.scroll_to_line(log_text.get_line_count() - 1)

func _show_tutorial_hint() -> void:
	if tutorial_hint_index < tutorial_hints.size():
		tutorial_label.text = "💡 " + tutorial_hints[tutorial_hint_index]
	else:
		tutorial_hint_panel.visible = false

func _advance_tutorial() -> void:
	tutorial_hint_index += 1
	_show_tutorial_hint()

func _on_paper_selected(idx: int) -> void:
	var pname: String = paper_option.get_item_text(idx)
	var pinfo: Dictionary = LevelLoader.get_paper_by_name(pname)
	if pinfo.is_empty():
		paper_stock_label.text = "库存：--"
		return
	var pid: String = pinfo.get("id", "")
	var stock: int = InventorySystem.get_paper_count(pid)
	paper_stock_label.text = "库存：%d  |  单价：%d金" % [stock, pinfo.get("cost", 0)]

func _on_glue_selected(idx: int) -> void:
	pass

func _on_glue_ratio_changed(v: float) -> void:
	glue_ratio_label.text = "胶水浓度：%.2f" % v

func _on_humidity_changed(v: float) -> void:
	current_humidity = v
	_update_humidity_display()

func _on_tool_pressed(tool_id: String) -> void:
	ToolSystem.select_tool(tool_id)
	_append_log("已切换工具：%s" % tool_id, "#4466aa")

func _on_zone_pressed(zid: String) -> void:
	selected_zone_id = zid
	_update_zone_detail()
	var zs = _get_zone_state(zid)
	if zs:
		_append_log("选中区域：%s" % zs.zone_data.get("name", ""), "#666666")

func _on_do_step_pressed() -> void:
	if selected_zone_id.is_empty():
		return
	var zs = _get_zone_state(selected_zone_id)
	if zs == null or zs.repaired:
		return
	var order: Array = zs.zone_data.get("step_order", [])
	var idx: int = zs.completed_steps.size()
	if idx >= order.size():
		return
	var step: String = order[idx]
	var params: Dictionary = {}
	match step:
		"humidify":
			params = {
				"humidity": current_humidity,
				"target_humidity": float(target_humidity) if target_humidity != null else 55.0,
				"tolerance": humidity_tolerance
			}
		"cut":
			var pname: String = paper_option.get_item_text(paper_option.selected)
			var pinfo: Dictionary = LevelLoader.get_paper_by_name(pname)
			var pid: String = pinfo.get("id", "")
			if not InventorySystem.can_consume_paper(pid):
				_append_log("❌ 补纸【%s】库存不足！" % pname, "#cc2222")
				return
			params = {
				"paper_name": pname,
				"cut_precision": param1_slider.value
			}
		"align":
			params = {
				"alignment_quality": param2_slider.value
			}
		"paste":
			var gname: String = glue_option.get_item_text(glue_option.selected)
			var ginfo: Dictionary = LevelLoader.get_glue_by_name(gname)
			var gid: String = ginfo.get("id", "")
			if not InventorySystem.can_consume_glue(gid):
				_append_log("❌ 胶水【%s】库存不足！" % gname, "#cc2222")
				return
			params = {
				"glue_name": gname,
				"glue_ratio": glue_ratio_slider.value
			}
		"press":
			params = {
				"press_strength": param3_slider.value,
				"press_duration": 2.0
			}
	action_log.append({
		"timestamp": current_time,
		"zone_id": selected_zone_id,
		"step": step,
		"params": params
	})
	var result = RepairSystem.execute_step(zs, step, params)
	if result.success:
		if step == "cut":
			var pname: String = paper_option.get_item_text(paper_option.selected)
			var pinfo: Dictionary = LevelLoader.get_paper_by_name(pname)
			var pid: String = pinfo.get("id", "")
			InventorySystem.consume_paper(pid)
			var papers_dict: Dictionary = materials_used["paper"]
			papers_dict[pname] = papers_dict.get(pname, 0) + 1
			_on_paper_selected(paper_option.selected)
		elif step == "paste":
			var gname: String = glue_option.get_item_text(glue_option.selected)
			var ginfo: Dictionary = LevelLoader.get_glue_by_name(gname)
			var gid: String = ginfo.get("id", "")
			InventorySystem.consume_glue(gid)
			var glues_dict: Dictionary = materials_used["glue"]
			glues_dict[gname] = glues_dict.get(gname, 0) + 1
		var penalty = result.penalty
		if penalty > 0:
			remaining_strength = max(0.0, remaining_strength - penalty * 0.3)
			_update_strength()
		_append_log("✅ [%s] %s - %s" % [zs.zone_data.get("name",""), _step_cn(step), result.reason], "#228822")
		_update_zone_node(selected_zone_id)
	else:
		var penalty = result.penalty
		if penalty > 0:
			remaining_strength = max(0.0, remaining_strength - penalty * 0.5)
			_update_strength()
		_append_log("❌ [%s] %s - %s" % [zs.zone_data.get("name",""), _step_cn(step), result.reason], "#cc2222")
	_update_zone_detail()
	_advance_tutorial()

func _on_step_completed(zid: String, step: String) -> void:
	pass

func _on_step_failed(zid: String, step: String, reason: String) -> void:
	pass

func _on_zone_repaired(zid: String, quality: float) -> void:
	_update_zones_progress()
	_update_zone_node(zid)

func _update_zone_node(zid: String) -> void:
	var zs = _get_zone_state(zid)
	var node = damage_zones_nodes.get(zid, null)
	if zs == null or node == null:
		return
	if zs.repaired:
		node.modulate = Color(0.5, 1.0, 0.5, 0.8)
		var original_text: String = node.text
		node.text = "✔" + original_text.left(1)
	elif zs.completed_steps.size() > 0:
		node.modulate = Color(0.9, 0.9, 0.5, 1.0)

func _on_back_pressed() -> void:
	GameManager.change_scene("LevelSelect")

func _on_finish_pressed() -> void:
	var all_errors: Array[String] = []
	for zs in zone_states:
		all_errors.append_array(zs.errors)
	var book_d = level_data.get("book", {})
	var score_breakdown = ScoringSystem.calculate_score(
		level_data,
		zone_states,
		remaining_strength,
		current_time,
		materials_used,
		current_humidity,
		all_errors
	)
	var final_score: int = score_breakdown.total
	var grade: String = ScoringSystem.get_grade(final_score)
	var passing_score: int = level_data.get("passing_score", 60)
	var reward: int = ClientSystem.calculate_reward(
		level_data, final_score, grade, current_time, time_limit
	)
	var repaired: int = 0
	var total_zones: int = zone_states.size()
	var zones_detail: Array = []
	for zs in zone_states:
		if zs.repaired:
			repaired += 1
		zones_detail.append({
			"zone_id": zs.zone_id,
			"zone_name": zs.zone_data.get("name", ""),
			"repaired": zs.repaired,
			"quality": zs.quality,
			"steps": zs.completed_steps.size(),
			"total_steps": zs.zone_data.get("step_order", []).size(),
			"errors": zs.errors.duplicate()
		})
	var failures = FailureAnalyzer.analyze_failure(
		zone_states,
		current_time,
		time_limit,
		remaining_strength,
		base_strength,
		final_score,
		passing_score
	)
	var data_for_settlement: Dictionary = {
		"level_id": level_data.get("id", 0),
		"score": final_score,
		"grade": grade,
		"grade_desc": ScoringSystem.get_grade_description(grade),
		"reward": reward,
		"time_taken": current_time,
		"time_limit": time_limit,
		"strength_result": remaining_strength,
		"strength_base": base_strength,
		"damage_repaired": repaired,
		"damage_total": total_zones,
		"materials_used": materials_used,
		"zones_detail": zones_detail,
		"breakdown": ScoringSystem.breakdown_to_dict(score_breakdown, repaired, total_zones),
		"failures": [],
		"passed": final_score >= passing_score
	}
	if final_score >= passing_score and failures.is_empty():
		GameManager.complete_level(level_data.get("id", 0), final_score, data_for_settlement)
		StoreSettlementData(data_for_settlement)
		GameManager.change_scene("Settlement")
	else:
		var failure_list: Array = []
		for f in failures:
			failure_list.append({
				"type": FailureAnalyzer.failure_type_to_string(f.type),
				"zone_id": f.zone_id,
				"zone_name": f.zone_name,
				"description": f.description,
				"suggestion": f.suggestion,
				"severity": f.severity
			})
		data_for_settlement["failures"] = failure_list
		data_for_settlement["passed"] = false
		var replay_data: Dictionary = FailureAnalyzer.generate_replay_data(
			level_data.get("id", 0),
			zone_states,
			current_time,
			materials_used,
			remaining_strength,
			current_humidity,
			action_log
		)
		GameManager.fail_level(level_data.get("id", 0), {
			"failures": failure_list,
			"final_score": final_score,
			"passing_score": passing_score
		}, replay_data)
		StoreSettlementData(data_for_settlement)
		if failure_list.size() > 0:
			StoreFailReplayData(data_for_settlement, replay_data)
			GameManager.change_scene("FailReplay")
		else:
			GameManager.change_scene("Settlement")

var _settlement_cache: Dictionary = {}
var _fail_replay_cache: Dictionary = {}

static func StoreSettlementData(data: Dictionary) -> void:
	_settlement_cache = data.duplicate(true)

static func GetSettlementData() -> Dictionary:
	return _settlement_cache

static func StoreFailReplayData(settlement_data: Dictionary, replay: Dictionary) -> void:
	_fail_replay_cache = {
		"settlement": settlement_data.duplicate(true),
		"replay": replay.duplicate(true)
	}

static func GetFailReplayData() -> Dictionary:
	return _fail_replay_cache
