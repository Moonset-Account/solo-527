extends PanelContainer

signal card_clicked(index: int)

var card_index: int = -1
var card_data: Dictionary = {}
var display_cost: int = 0
var is_selected: bool = false
var is_playable: bool = true

var _cost_label: Label
var _name_label: Label
var _type_label: Label
var _desc_label: Label
var _bg_panel: Panel

const TYPE_COLORS: Dictionary = {
	"tool": Color("#4a9eff"),
	"budget": Color("#ffd700"),
	"expert": Color("#9b59b6")
}

const RARITY_COLORS: Dictionary = {
	"common": Color("#cccccc"),
	"uncommon": Color("#2ecc71"),
	"rare": Color("#f39c12")
}

func _init() -> void:
	custom_minimum_size = Vector2(120, 170)
	size_flags_vertical = Control.SIZE_SHRINK_CENTER

func _ready() -> void:
	_build_ui()
	_update_visuals()

func setup(p_index: int, p_card_data: Dictionary, p_cost: int, p_playable: bool) -> void:
	card_index = p_index
	card_data = p_card_data
	display_cost = p_cost
	is_playable = p_playable
	is_selected = false
	if _name_label:
		_update_visuals()

func _build_ui() -> void:
	var style = StyleBoxFlat.new()
	style.bg_color = Color("#0f3460")
	style.border_color = Color("#cccccc")
	style.border_width_bottom = 2
	style.border_width_top = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	add_child(vbox)

	var cost_hbox = HBoxContainer.new()
	vbox.add_child(cost_hbox)

	_cost_label = Label.new()
	_cost_label.text = "0"
	_cost_label.add_theme_font_size_override("font_size", 20)
	_cost_label.add_theme_color_override("font_color", Color("#ffd700"))
	cost_hbox.add_child(_cost_label)

	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cost_hbox.add_child(spacer)

	_type_label = Label.new()
	_type_label.add_theme_font_size_override("font_size", 12)
	_type_label.add_theme_color_override("font_color", Color.WHITE)
	cost_hbox.add_child(_type_label)

	_name_label = Label.new()
	_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_name_label.add_theme_font_size_override("font_size", 14)
	_name_label.add_theme_color_override("font_color", Color.WHITE)
	_name_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	vbox.add_child(_name_label)

	var sep = HSeparator.new()
	vbox.add_child(sep)

	_desc_label = Label.new()
	_desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_desc_label.add_theme_font_size_override("font_size", 11)
	_desc_label.add_theme_color_override("font_color", Color("#aaaaaa"))
	_desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_desc_label.custom_minimum_size = Vector2(100, 0)
	vbox.add_child(_desc_label)

func _update_visuals() -> void:
	if card_data.is_empty():
		return

	_cost_label.text = str(display_cost)
	_name_label.text = card_data.get("name", "")
	_desc_label.text = card_data.get("description", "")

	var card_type = card_data.get("card_type", "tool")
	var type_names = {"tool": "工具", "budget": "预算", "expert": "专家"}
	_type_label.text = type_names.get(card_type, card_type)
	_type_label.add_theme_color_override("font_color", TYPE_COLORS.get(card_type, Color.WHITE))

	var rarity = card_data.get("rarity", "common")
	var style = get_theme_stylebox("panel") as StyleBoxFlat
	if style:
		style.border_color = RARITY_COLORS.get(rarity, Color("#cccccc"))
		if not is_playable:
			style.bg_color = Color("#333344")
		elif is_selected:
			style.bg_color = Color("#1a5276")
			style.border_color = Color("#e94560")
			style.border_width_bottom = 4
			style.border_width_top = 4
			style.border_width_left = 4
			style.border_width_right = 4
		else:
			style.bg_color = Color("#0f3460")
			style.border_width_bottom = 2
			style.border_width_top = 2
			style.border_width_left = 2
			style.border_width_right = 2

	modulate.a = 1.0 if is_playable else 0.5

func set_selected(p_selected: bool) -> void:
	is_selected = p_selected
	_update_visuals()

func set_playable(p_playable: bool) -> void:
	is_playable = p_playable
	_update_visuals()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if is_playable:
			card_clicked.emit(card_index)
