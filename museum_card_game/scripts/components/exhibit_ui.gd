extends PanelContainer

signal exhibit_clicked(index: int)

var exhibit_index: int = -1
var exhibit_data: Dictionary = {}
var is_targetable: bool = false

var _name_label: Label
var _condition_bar: ProgressBar
var _condition_label: Label
var _degradation_label: Label
var _hidden_label: Label
var _status_label: Label
var _point_label: Label
var _inner_vbox: VBoxContainer

func _init() -> void:
	custom_minimum_size = Vector2(200, 250)
	size_flags_vertical = Control.SIZE_SHRINK_CENTER

func _ready() -> void:
	_build_ui()
	_update_visuals()

func setup(p_index: int, p_data: Dictionary, p_targetable: bool) -> void:
	exhibit_index = p_index
	exhibit_data = p_data
	is_targetable = p_targetable
	if _name_label:
		_update_visuals()

func _build_ui() -> void:
	var style = StyleBoxFlat.new()
	style.bg_color = Color("#16213e")
	style.border_color = Color("#334466")
	style.border_width_bottom = 2
	style.border_width_top = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	add_theme_stylebox_override("panel", style)

	_inner_vbox = VBoxContainer.new()
	_inner_vbox.add_theme_constant_override("separation", 6)
	add_child(_inner_vbox)

	_name_label = Label.new()
	_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_name_label.add_theme_font_size_override("font_size", 16)
	_name_label.add_theme_color_override("font_color", Color.WHITE)
	_inner_vbox.add_child(_name_label)

	var cond_hbox = HBoxContainer.new()
	_inner_vbox.add_child(cond_hbox)

	_condition_bar = ProgressBar.new()
	_condition_bar.custom_minimum_size = Vector2(140, 20)
	_condition_bar.show_percentage = false
	_condition_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var bar_bg_style = StyleBoxFlat.new()
	bar_bg_style.bg_color = Color("#1a1a2e")
	bar_bg_style.corner_radius_top_left = 4
	bar_bg_style.corner_radius_top_right = 4
	bar_bg_style.corner_radius_bottom_left = 4
	bar_bg_style.corner_radius_bottom_right = 4
	_condition_bar.add_theme_stylebox_override("background", bar_bg_style)

	var bar_fill_style = StyleBoxFlat.new()
	bar_fill_style.bg_color = Color("#2ecc71")
	bar_fill_style.corner_radius_top_left = 4
	bar_fill_style.corner_radius_top_right = 4
	bar_fill_style.corner_radius_bottom_left = 4
	bar_fill_style.corner_radius_bottom_right = 4
	_condition_bar.add_theme_stylebox_override("fill", bar_fill_style)

	cond_hbox.add_child(_condition_bar)

	_condition_label = Label.new()
	_condition_label.add_theme_font_size_override("font_size", 13)
	_condition_label.add_theme_color_override("font_color", Color.WHITE)
	cond_hbox.add_child(_condition_label)

	_degradation_label = Label.new()
	_degradation_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_degradation_label.add_theme_font_size_override("font_size", 12)
	_degradation_label.add_theme_color_override("font_color", Color("#e94560"))
	_inner_vbox.add_child(_degradation_label)

	_hidden_label = Label.new()
	_hidden_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hidden_label.add_theme_font_size_override("font_size", 12)
	_hidden_label.add_theme_color_override("font_color", Color("#9b59b6"))
	_inner_vbox.add_child(_hidden_label)

	_status_label = Label.new()
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 12)
	_status_label.add_theme_color_override("font_color", Color("#2ecc71"))
	_inner_vbox.add_child(_status_label)

	var sep = HSeparator.new()
	_inner_vbox.add_child(sep)

	_point_label = Label.new()
	_point_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_point_label.add_theme_font_size_override("font_size", 12)
	_point_label.add_theme_color_override("font_color", Color("#ffd700"))
	_inner_vbox.add_child(_point_label)

func _update_visuals() -> void:
	if exhibit_data.is_empty():
		return

	_name_label.text = exhibit_data.get("name", "???")

	var current = int(exhibit_data.get("current_condition", 0))
	var maximum = int(exhibit_data.get("max_condition", 1))
	_condition_bar.max_value = maximum
	_condition_bar.value = current
	_condition_label.text = str(current) + "/" + str(maximum)

	var ratio = float(current) / float(max(maximum, 1))
	var bar_style = _condition_bar.get_theme_stylebox("fill") as StyleBoxFlat
	if bar_style:
		if ratio > 0.6:
			bar_style.bg_color = Color("#2ecc71")
		elif ratio > 0.3:
			bar_style.bg_color = Color("#f39c12")
		else:
			bar_style.bg_color = Color("#e94560")

	var deg = int(exhibit_data.get("degradation_rate", 0)) + int(exhibit_data.get("extra_degradation", 0))
	if deg > 0:
		_degradation_label.text = "▼ 每回合 -" + str(deg)
		_degradation_label.visible = true
	else:
		_degradation_label.visible = false

	var hidden = int(exhibit_data.get("hidden_damage", 0))
	if hidden > 0:
		_hidden_label.text = "⚠ 隐藏损伤: " + str(hidden)
		_hidden_label.visible = true
	else:
		_hidden_label.visible = false

	var status_texts: Array = []
	if exhibit_data.get("prevented", false):
		status_texts.append("🛡 恶化已阻止")
	if exhibit_data.get("marked", false):
		status_texts.append("🔬 已标记 (+" + str(int(exhibit_data.get("buff_amount", 0))) + ")")
	if status_texts.size() > 0:
		_status_label.text = " ".join(status_texts)
		_status_label.visible = true
	else:
		_status_label.visible = false

	_point_label.text = "修复分值: " + str(int(exhibit_data.get("point_value", 0)))

	var style = get_theme_stylebox("panel") as StyleBoxFlat
	if style:
		if current <= 0:
			style.bg_color = Color("#3a1a1a")
			style.border_color = Color("#e94560")
		elif is_targetable:
			style.bg_color = Color("#1a3a5e")
			style.border_color = Color("#4a9eff")
			style.border_width_bottom = 3
			style.border_width_top = 3
			style.border_width_left = 3
			style.border_width_right = 3
		else:
			style.bg_color = Color("#16213e")
			style.border_color = Color("#334466")
			style.border_width_bottom = 2
			style.border_width_top = 2
			style.border_width_left = 2
			style.border_width_right = 2

func refresh(p_data: Dictionary, p_targetable: bool) -> void:
	exhibit_data = p_data
	is_targetable = p_targetable
	_update_visuals()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if is_targetable:
			exhibit_clicked.emit(exhibit_index)
