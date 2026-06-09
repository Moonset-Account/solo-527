extends Control
class_name CharacterNode

signal clicked(idx: int)

var character_data: Dictionary = {}
var tile_size: int = 64
var char_idx: int = -1
var avatar: ColorRect
var emoji_label: Label
var ap_bar: ColorRect
var ap_bg: ColorRect
var name_label: Label
var buff_icons: HBoxContainer

func setup(data: Dictionary, ts: int, idx: int):
	character_data = data
	tile_size = ts
	char_idx = idx
	size = Vector2(tile_size, tile_size)
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = size
	_build_ui()
	update_visual(data)

func _build_ui():
	avatar = ColorRect.new()
	avatar.size = Vector2(tile_size - 12, tile_size - 28)
	avatar.position = Vector2(6, 4)
	avatar.color = Color(character_data.get("color", "#888888"))
	avatar.corner_radius_top_left = 6
	avatar.corner_radius_top_right = 6
	avatar.corner_radius_bottom_left = 6
	avatar.corner_radius_bottom_right = 6
	add_child(avatar)
	emoji_label = Label.new()
	emoji_label.text = str(character_data.get("portrait_emoji", "👤"))
	emoji_label.add_theme_font_size_override("font_size", int(tile_size * 0.45))
	emoji_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	emoji_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	emoji_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	emoji_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(emoji_label)
	name_label = Label.new()
	name_label.text = str(character_data.get("name", "角色"))
	name_label.add_theme_font_size_override("font_size", 11)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.position = Vector2(0, tile_size - 22)
	name_label.size = Vector2(tile_size, 14)
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(name_label)
	ap_bg = ColorRect.new()
	ap_bg.color = Color(0, 0, 0, 0.6)
	ap_bg.position = Vector2(4, tile_size - 8)
	ap_bg.size = Vector2(tile_size - 8, 5)
	ap_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(ap_bg)
	ap_bar = ColorRect.new()
	ap_bar.color = Color(0.3, 0.85, 0.45)
	ap_bar.position = ap_bg.position
	ap_bar.size = ap_bg.size
	ap_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(ap_bar)
	buff_icons = HBoxContainer.new()
	buff_icons.position = Vector2(2, 2)
	buff_icons.size = Vector2(tile_size - 4, 12)
	buff_icons.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(buff_icons)

func update_visual(data: Dictionary):
	character_data = data
	var max_ap: int = int(data.get("max_ap", 3))
	var cur_ap: int = int(data.get("ap", 0))
	var ratio: float = float(cur_ap) / float(max_ap) if max_ap > 0 else 0.0
	ap_bar.size = Vector2((tile_size - 8) * ratio, 5)
	ap_bar.color = Color(0.3, 0.85, 0.45) if ratio > 0.33 else (Color(0.95, 0.85, 0.25) if ratio > 0.0 else Color(0.9, 0.3, 0.3))
	avatar.color = Color(character_data.get("color", "#888888"))
	modulate = Color.WHITE if cur_ap > 0 else Color(0.6, 0.6, 0.6)
	for c in buff_icons.get_children():
		c.queue_free()
	var buffs: Array = data.get("buffs", [])
	for i in buffs.size():
		if i >= 4:
			break
		var b: Dictionary = buffs[i]
		var bl: Label = Label.new()
		bl.text = "⬆"
		bl.add_theme_font_size_override("font_size", 10)
		bl.modulate = Color(0.5, 0.9, 1.0)
		buff_icons.add_child(bl)

func _gui_input(event: InputEvent):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		emit_signal("clicked", char_idx)
		get_viewport().set_input_as_handled()
