class_name ResourcePanel
extends HBoxContainer

const BAR_COLORS: Dictionary = {
	&"oxygen": Color(0.3, 0.7, 1.0),
	&"water": Color(0.2, 0.5, 1.0),
	&"solar": Color(1.0, 0.85, 0.2),
	&"plant_health": Color(0.3, 0.85, 0.3),
}

const BAR_BG: Dictionary = {
	&"oxygen": Color(0.15, 0.25, 0.35),
	&"water": Color(0.1, 0.2, 0.35),
	&"solar": Color(0.35, 0.3, 0.1),
	&"plant_health": Color(0.15, 0.3, 0.15),
}

var _bars: Dictionary = {}
var _labels: Dictionary = {}
var _decay_labels: Dictionary = {}
var _visible_resources: Array[StringName] = []
var _resource_manager: ResourceManager

func setup(res_manager: ResourceManager, unlocked: Array[StringName]) -> void:
	_resource_manager = res_manager
	_visible_resources = unlocked
	_build_ui()
	res_manager.resource_changed.connect(_on_resource_changed)
	res_manager.resource_depleted.connect(_on_resource_depleted)

func _build_ui() -> void:
	for child in get_children():
		child.queue_free()
	_bars.clear()
	_labels.clear()
	_decay_labels.clear()
	for res in _visible_resources:
		var panel = PanelContainer.new()
		panel.custom_minimum_size = Vector2(200, 80)
		var vbox = VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 2)
		var name_label = Label.new()
		name_label.text = ResourceManager.resource_display_name(res)
		name_label.add_theme_font_size_override("font_size", 16)
		name_label.add_theme_color_override("font_color", BAR_COLORS.get(res, Color.WHITE))
		vbox.add_child(name_label)
		var bar = ProgressBar.new()
		bar.custom_minimum_size = Vector2(180, 20)
		bar.show_percentage = false
		bar.max_value = _resource_manager.get_max(res)
		bar.value = _resource_manager.get_value(res)
		var style_bg = StyleBoxFlat.new()
		style_bg.bg_color = BAR_BG.get(res, Color.DARK_GRAY)
		style_bg.set_corner_radius_all(4)
		bar.add_theme_stylebox_override("background", style_bg)
		var style_fill = StyleBoxFlat.new()
		style_fill.bg_color = BAR_COLORS.get(res, Color.GREEN)
		style_fill.set_corner_radius_all(4)
		bar.add_theme_stylebox_override("fill", style_fill)
		vbox.add_child(bar)
		var info_row = HBoxContainer.new()
		var val_label = Label.new()
		val_label.text = "%d / %d" % [int(_resource_manager.get_value(res)), int(_resource_manager.get_max(res))]
		val_label.add_theme_font_size_override("font_size", 13)
		val_label.add_theme_color_override("font_color", Color.LIGHT_GRAY)
		info_row.add_child(val_label)
		var decay_label = Label.new()
		var decay_rate = _resource_manager.get_decay_rate(res)
		if decay_rate > 0:
			decay_label.text = " -%.1f/s" % decay_rate
		else:
			decay_label.text = ""
		decay_label.add_theme_font_size_override("font_size", 12)
		decay_label.add_theme_color_override("font_color", Color(1.0, 0.6, 0.3))
		info_row.add_child(decay_label)
		vbox.add_child(info_row)
		panel.add_child(vbox)
		add_child(panel)
		_bars[res] = bar
		_labels[res] = val_label
		_decay_labels[res] = decay_label
		_on_resource_changed(res, _resource_manager.get_value(res))

func _on_resource_changed(resource_type: StringName, new_value: float) -> void:
	if not _bars.has(resource_type):
		return
	var bar: ProgressBar = _bars[resource_type]
	bar.value = new_value
	var label: Label = _labels[resource_type]
	label.text = "%d / %d" % [int(new_value), int(_resource_manager.get_max(resource_type))]
	var ratio = new_value / _resource_manager.get_max(resource_type)
	var base_color: Color = BAR_COLORS.get(resource_type, Color.GREEN)
	if ratio < 0.25:
		var flash = Color.RED.lerp(base_color, ratio / 0.25)
		var style_fill = bar.get_theme_stylebox("fill") as StyleBoxFlat
		if style_fill:
			style_fill.bg_color = flash
	elif ratio < 0.5:
		var style_fill = bar.get_theme_stylebox("fill") as StyleBoxFlat
		if style_fill:
			style_fill.bg_color = base_color.lerp(Color.YELLOW, (0.5 - ratio) / 0.25)
	else:
		var style_fill = bar.get_theme_stylebox("fill") as StyleBoxFlat
		if style_fill:
			style_fill.bg_color = base_color

func _on_resource_depleted(resource_type: StringName) -> void:
	if _labels.has(resource_type):
		var label: Label = _labels[resource_type]
		label.add_theme_color_override("font_color", Color.RED)

func update_decay_display() -> void:
	for res in _decay_labels:
		var rate = _resource_manager.get_decay_rate(res)
		var label: Label = _decay_labels[res]
		if rate > 0:
			label.text = " -%.1f/s" % rate
		else:
			label.text = ""
