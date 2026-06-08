class_name ResourcePanel
extends Control

var _resource_manager: ResourceManager
var _labels: Dictionary = {}
var _bars: Dictionary = {}

func setup(rm: ResourceManager) -> void:
	_resource_manager = rm
	_resource_manager.resource_changed.connect(_on_resource_changed)
	_build_ui()

func _build_ui() -> void:
	var container := VBoxContainer.new()
	container.set_anchors_preset(Control.PRESET_FULL_RECT)
	container.offset_left = 10
	container.offset_top = 10
	container.offset_right = 200
	container.offset_bottom = 300
	add_child(container)

	var title := Label.new()
	title.text = "资源面板"
	title.add_theme_font_size_override("font_size", 18)
	container.add_child(title)

	for t: ResourceType.Type in ResourceType.all_types():
		var hbox := HBoxContainer.new()
		var icon_label := Label.new()
		icon_label.text = ResourceType.type_icon_hint(t)
		icon_label.custom_minimum_size.x = 30
		hbox.add_child(icon_label)

		var name_label := Label.new()
		name_label.text = ResourceType.type_name(t)
		name_label.custom_minimum_size.x = 60
		hbox.add_child(name_label)

		var bar := ProgressBar.new()
		bar.min_value = 0
		bar.max_value = _resource_manager.get_max(t)
		bar.value = _resource_manager.get_value(t)
		bar.custom_minimum_size.x = 100
		bar.show_percentage = true
		hbox.add_child(bar)

		var val_label := Label.new()
		val_label.text = str(_resource_manager.get_value(t))
		val_label.custom_minimum_size.x = 50
		hbox.add_child(val_label)

		container.add_child(hbox)
		_labels[t] = val_label
		_bars[t] = bar

func _on_resource_changed(type: ResourceType.Type, old_val: int, new_val: int) -> void:
	if _labels.has(type):
		(_labels[type] as Label).text = str(new_val)
	if _bars.has(type):
		(_bars[type] as ProgressBar).value = new_val
		var ratio := _resource_manager.get_ratio(type)
		var bar: ProgressBar = _bars[type]
		if ratio <= 0.25:
			bar.modulate = Color.RED
		elif ratio <= 0.5:
			bar.modulate = Color.YELLOW
		else:
			bar.modulate = Color.WHITE
