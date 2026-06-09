extends CanvasLayer
## OrderList - 当前订单列表面板

const DP := preload("res://scripts/data/DataProvider.gd")

@onready var order_container: VBoxContainer = $Panel/VBox/Orders

var _order_widgets: Dictionary = {}

func initialize() -> void:
	for c in order_container.get_children():
		if c.name != "ListTitle":
			c.queue_free()
	_order_widgets.clear()

func add_order(order: Dictionary) -> void:
	var row := _create_order_widget(order)
	order_container.add_child(row)
	_order_widgets[order["id"]] = row

func remove_order(order_id: String) -> void:
	if _order_widgets.has(order_id):
		var w = _order_widgets[order_id]
		var tween := create_tween()
		tween.tween_property(w, "modulate:a", 0.0, 0.2)
		tween.finished.connect(func():
			if is_instance_valid(w):
				w.queue_free()
		)
		_order_widgets.erase(order_id)

func update_progress(order_id: String, progress: float) -> void:
	if not _order_widgets.has(order_id):
		return
	var w = _order_widgets[order_id]
	var bar = w.get_node_or_null("ProgressBar/Fill")
	if bar:
		bar.size.x = 180.0 * clamp(progress, 0.0, 1.0)
	var pct_lbl = w.get_node_or_null("ProgressPct")
	if pct_lbl:
		pct_lbl.text = "%d%%" % int(progress * 100)

func _create_order_widget(order: Dictionary) -> VBoxContainer:
	var vb := VBoxContainer.new()
	vb.name = order["id"]
	vb.add_theme_constant_override("separation", 6)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.14, 0.1, 0.22, 1)
	style.border_color = Color(1.0, 0.82, 0.33, 0.4)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.corner_radius_top_left = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_right = 6
	var pc := PanelContainer.new()
	pc.custom_minimum_size = Vector2(240, 0)
	pc.add_theme_stylebox_override("panel", style)
	var inner := VBoxContainer.new()
	inner.add_theme_constant_override("separation", 4)
	pc.add_child(inner)
	vb.add_child(pc)
	var name_row := HBoxContainer.new()
	inner.add_child(name_row)
	var name_lbl := Label.new()
	name_lbl.text = order.get("name", "订单")
	name_lbl.modulate = Color(1.0, 0.88, 0.5)
	name_lbl.add_theme_font_size_override("font_size", 13)
	name_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	name_row.add_child(name_lbl)
	var time_lbl := Label.new()
	time_lbl.name = "TimeLabel"
	var t: int = int(order.get("time_limit", 60))
	time_lbl.text = "%02d:%02d" % [t / 60, t % 60]
	time_lbl.modulate = Color(0.8, 0.9, 1.0)
	time_lbl.add_theme_font_size_override("font_size", 11)
	name_row.add_child(time_lbl)
	var reqs: Array = order.get("requirements", [])
	var req_text: String = ""
	for req in reqs:
		var pcfg: Dictionary = DP.get_product_config(req["type"])
		req_text += "  • %s: %d/%d\n" % [pcfg.get("name", req["type"]), order["current_progress"].get(req["type"], 0), req["count"]]
	var req_lbl := Label.new()
	req_lbl.text = req_text
	req_lbl.modulate = Color(0.75, 0.85, 0.8)
	req_lbl.add_theme_font_size_override("font_size", 10)
	req_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	inner.add_child(req_lbl)
	var pbar_bg := ColorRect.new()
	pbar_bg.name = "ProgressBar"
	pbar_bg.color = Color(0.08, 0.06, 0.12)
	pbar_bg.size = Vector2(220, 8)
	pbar_bg.custom_minimum_size = Vector2(220, 8)
	inner.add_child(pbar_bg)
	var bar_fill := ColorRect.new()
	bar_fill.name = "Fill"
	bar_fill.color = Color(0.4, 0.85, 0.5)
	bar_fill.size = Vector2(0, 8)
	bar_fill.custom_minimum_size = Vector2(0, 8)
	inner.add_child(bar_fill)
	var bottom_row := HBoxContainer.new()
	inner.add_child(bottom_row)
	var pct_lbl := Label.new()
	pct_lbl.name = "ProgressPct"
	pct_lbl.text = "0%"
	pct_lbl.modulate = Color(0.7, 0.8, 0.9)
	pct_lbl.add_theme_font_size_override("font_size", 10)
	pct_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom_row.add_child(pct_lbl)
	var rw_lbl := Label.new()
	rw_lbl.text = "💰 %d" % order.get("base_reward", 0)
	rw_lbl.modulate = Color(1.0, 0.85, 0.35)
	rw_lbl.add_theme_font_size_override("font_size", 11)
	bottom_row.add_child(rw_lbl)
	vb.set_script(null)
	return vb

func _process(delta: float) -> void:
	if GameState.is_paused:
		return
	var dt := delta * GameState.game_speed
	for oid in _order_widgets.keys():
		var w = _order_widgets[oid]
		var order: Dictionary = _find_order(oid)
		if order.is_empty():
			continue
		var tlbl = w.get_node_or_null("TimeLabel")
		if tlbl:
			var rt: int = int(max(order.get("remaining_time", 0), 0))
			tlbl.text = "%02d:%02d" % [rt / 60, rt % 60]
			if rt < 30:
				tlbl.modulate = Color(1.0, 0.45, 0.4)
				if fmod(Time.get_ticks_msec() / 1000.0, 1.0) < 0.5:
					tlbl.modulate.a = 0.4
			elif rt < 60:
				tlbl.modulate = Color(1.0, 0.8, 0.4)
			else:
				tlbl.modulate = Color(0.8, 0.9, 1.0)

func _find_order(oid: String) -> Dictionary:
	for o in GameState.active_orders:
		if o.get("id") == oid:
			return o
	return {}
