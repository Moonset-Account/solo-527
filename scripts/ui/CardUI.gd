extends Control
## 卡牌UI组件 - 运行时动态构建UI节点树
## 独立的UI模块，可通过new()直接创建使用

class_name CardUI

signal card_clicked(card_ui: Control)
signal card_hovered(card_ui: Control, is_hover: bool)

const CARD_WIDTH: int = 140
const CARD_HEIGHT: int = 200
const HOVER_LIFT: int = -40
const HOVER_SCALE: float = 1.15
const ANIM_DURATION: float = 0.2

var card_data: Dictionary = {}
var hand_index: int = -1
var is_playable: bool = true
var is_selected: bool = false
var is_target_mode: bool = false

var _base_position: Vector2 = Vector2.ZERO
var _base_rotation: float = 0.0
var _is_hovered: bool = false
var _tween: Tween = null

var _card_panel: Panel
var _type_banner: ColorRect
var _rarity_border: ColorRect
var _name_label: Label
var _cost_container: HBoxContainer
var _art_rect: ColorRect
var _desc_label: Label
var _type_icon: Label
var _invalid_overlay: ColorRect

func _init() -> void:
	size = Vector2(CARD_WIDTH, CARD_HEIGHT)
	custom_minimum_size = Vector2(CARD_WIDTH, CARD_HEIGHT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_build_ui_tree()

func _ready() -> void:
	_connect_signals()

func _build_ui_tree() -> void:
	_card_panel = Panel.new()
	_card_panel.name = "CardPanel"
	_card_panel.offset_left = 4
	_card_panel.offset_top = 4
	_card_panel.offset_right = CARD_WIDTH - 4
	_card_panel.offset_bottom = CARD_HEIGHT - 4
	add_child(_card_panel)
	
	var panel_sb: StyleBoxFlat = StyleBoxFlat.new()
	panel_sb.bg_color = Color(0.13, 0.1, 0.08, 1)
	panel_sb.corner_radius_top_left = 8
	panel_sb.corner_radius_top_right = 8
	panel_sb.corner_radius_bottom_left = 8
	panel_sb.corner_radius_bottom_right = 8
	panel_sb.border_width_left = 1
	panel_sb.border_width_top = 1
	panel_sb.border_width_right = 1
	panel_sb.border_width_bottom = 1
	panel_sb.border_color = Color(0.3, 0.25, 0.18, 0.8)
	_card_panel.add_theme_stylebox_override("panel", panel_sb)
	
	_type_banner = ColorRect.new()
	_type_banner.name = "TypeBanner"
	_type_banner.offset_left = 0
	_type_banner.offset_top = 0
	_type_banner.offset_right = CARD_WIDTH - 8
	_type_banner.offset_bottom = 8
	_type_banner.color = Color(0.4, 0.6, 0.9, 1)
	_card_panel.add_child(_type_banner)
	
	_rarity_border = ColorRect.new()
	_rarity_border.name = "RarityBorder"
	_rarity_border.offset_left = -1
	_rarity_border.offset_top = -1
	_rarity_border.offset_right = CARD_WIDTH - 7
	_rarity_border.offset_bottom = CARD_HEIGHT - 7
	_rarity_border.color = Color(0.7, 0.7, 0.7, 1)
	_rarity_border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var rarity_sb = _rarity_border
	var border_mat = CanvasItemMaterial.new()
	border_mat.blend_mode = CanvasItemMaterial.BLEND_MODE_MIX
	_rarity_border.material = border_mat
	_card_panel.add_child(_rarity_border)
	
	_name_label = Label.new()
	_name_label.name = "NameLabel"
	_name_label.offset_left = 6
	_name_label.offset_top = 12
	_name_label.offset_right = CARD_WIDTH - 14
	_name_label.offset_bottom = 34
	_name_label.text = "卡牌名称"
	_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_name_label.add_theme_font_size_override("font_size", 13)
	_name_label.add_theme_color_override("font_color", Color(1, 0.95, 0.8))
	_card_panel.add_child(_name_label)
	
	_cost_container = HBoxContainer.new()
	_cost_container.name = "CostContainer"
	_cost_container.offset_left = 6
	_cost_container.offset_top = 34
	_cost_container.offset_right = CARD_WIDTH - 14
	_cost_container.offset_bottom = 54
	_cost_container.alignment = BoxContainer.ALIGNMENT_CENTER
	_card_panel.add_child(_cost_container)
	
	_art_rect = ColorRect.new()
	_art_rect.name = "ArtRect"
	_art_rect.offset_left = 10
	_art_rect.offset_top = 56
	_art_rect.offset_right = CARD_WIDTH - 18
	_art_rect.offset_bottom = 110
	_art_rect.color = Color(0.2, 0.3, 0.5, 1)
	var art_sb: StyleBoxFlat = StyleBoxFlat.new()
	art_sb.bg_color = _art_rect.color
	art_sb.corner_radius_top_left = 4
	art_sb.corner_radius_top_right = 4
	art_sb.corner_radius_bottom_left = 4
	art_sb.corner_radius_bottom_right = 4
	_card_panel.add_child(_art_rect)
	
	_type_icon = Label.new()
	_type_icon.name = "TypeIcon"
	_type_icon.offset_left = 44
	_type_icon.offset_top = 72
	_type_icon.offset_right = 88
	_type_icon.offset_bottom = 100
	_type_icon.text = "工"
	_type_icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_type_icon.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_type_icon.add_theme_font_size_override("font_size", 28)
	_type_icon.add_theme_color_override("font_color", Color(1, 1, 1, 0.7))
	_card_panel.add_child(_type_icon)
	
	_desc_label = Label.new()
	_desc_label.name = "DescLabel"
	_desc_label.offset_left = 8
	_desc_label.offset_top = 114
	_desc_label.offset_right = CARD_WIDTH - 16
	_desc_label.offset_bottom = 180
	_desc_label.text = "卡牌描述内容..."
	_desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_desc_label.add_theme_font_size_override("font_size", 11)
	_desc_label.add_theme_color_override("font_color", Color(0.9, 0.85, 0.75))
	_card_panel.add_child(_desc_label)
	
	_invalid_overlay = ColorRect.new()
	_invalid_overlay.name = "InvalidOverlay"
	_invalid_overlay.offset_left = 0
	_invalid_overlay.offset_top = 0
	_invalid_overlay.offset_right = CARD_WIDTH - 8
	_invalid_overlay.offset_bottom = CARD_HEIGHT - 8
	_invalid_overlay.color = Color(0, 0, 0, 0.5)
	_invalid_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_invalid_overlay.visible = false
	_card_panel.add_child(_invalid_overlay)

func _connect_signals() -> void:
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	gui_input.connect(_on_gui_input)

func setup(data: Dictionary, index: int) -> void:
	card_data = data
	hand_index = index
	_refresh_display()

func set_playable(playable: bool) -> void:
	is_playable = playable
	if _invalid_overlay:
		_invalid_overlay.visible = not playable
		modulate = Color(0.9, 0.9, 0.9) if playable else Color(0.6, 0.6, 0.6)

func set_selected(selected: bool) -> void:
	is_selected = selected
	if _rarity_border:
		var target_color: Color
		if selected:
			target_color = Color(1.0, 0.9, 0.2, 1)
			_bounce_animation()
		else:
			target_color = CardRegistry.get_rarity_color(card_data.get("rarity", "common"))
		_tween_color(_rarity_border, "color", target_color, 0.15)

func play_discard_animation(to_pos: Vector2, callback: Callable) -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	t.tween_property(self, "position", to_pos, 0.4)
	t.parallel().tween_property(self, "scale", Vector2(0.3, 0.3), 0.3)
	t.tween_property(self, "modulate:a", 0.0, 0.3)
	t.tween_callback(callback)

func play_draw_animation(from_pos: Vector2, delay: float = 0.0) -> void:
	modulate.a = 0.0
	position = from_pos
	scale = Vector2(0.5, 0.5)
	var t: Tween = create_tween().set_delay(delay).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	t.parallel().tween_property(self, "modulate:a", 1.0, ANIM_DURATION)
	t.parallel().tween_property(self, "scale", Vector2(1, 1), ANIM_DURATION)
	t.tween_property(self, "position", _base_position, ANIM_DURATION)

func play_play_animation(to_pos: Vector2, callback: Callable) -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	t.parallel().tween_property(self, "position", to_pos, 0.35)
	t.parallel().tween_property(self, "scale", Vector2(1.3, 1.3), 0.35)
	t.tween_property(self, "modulate:a", 0.0, 0.2)
	t.tween_callback(callback)

func play_shake_animation() -> void:
	var original_pos: Vector2 = position
	var t: Tween = create_tween()
	for i in range(4):
		var offset: Vector2 = Vector2(randf_range(-6, 6), randf_range(-4, 4))
		t.tween_property(self, "position", original_pos + offset, 0.05)
	t.tween_property(self, "position", original_pos, 0.1)

func set_base_position(pos: Vector2, rotation: float = 0.0) -> void:
	_base_position = pos
	_base_rotation = rotation
	position = pos
	self.rotation = rotation

func _refresh_display() -> void:
	if card_data.is_empty():
		return
	if _name_label:
		_name_label.text = card_data.get("name", "未知卡牌")
	if _desc_label:
		_desc_label.text = card_data.get("description", "")
	if _type_banner:
		_type_banner.color = CardRegistry.get_card_type_color(card_data.get("type", "tool"))
	if _rarity_border:
		_rarity_border.color = CardRegistry.get_rarity_color(card_data.get("rarity", "common"))
	if _art_rect:
		_art_rect.color = _get_art_color()
	if _type_icon:
		var type_text: String = "工"
		match card_data.get("type", ""):
			"budget": type_text = "金"
			"expert": type_text = "师"
		_type_icon.text = type_text
	_refresh_cost()

func _get_art_color() -> Color:
	var base: Color = CardRegistry.get_card_type_color(card_data.get("type", "tool"))
	return Color(base.r * 0.35 + 0.12, base.g * 0.35 + 0.1, base.b * 0.35 + 0.1, 1.0)

func _refresh_cost() -> void:
	if not _cost_container:
		return
	for child in _cost_container.get_children():
		child.queue_free()
	var cost: Dictionary = card_data.get("cost", {})
	if cost.is_empty():
		var lbl: Label = Label.new()
		lbl.text = "免费"
		lbl.add_theme_font_size_override("font_size", 13)
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl.add_theme_color_override("font_color", Color(0.7, 1, 0.7))
		_cost_container.add_child(lbl)
		return
	var order: Array = ["budget", "tools", "experts"]
	var icons: Dictionary = {"budget": "💰", "tools": "🔧", "experts": "👤"}
	for key in order:
		if not cost.has(key):
			continue
		var hb: HBoxContainer = HBoxContainer.new()
		hb.add_theme_constant_override("separation", 2)
		var ic: Label = Label.new()
		ic.text = icons.get(key, "?")
		ic.add_theme_font_size_override("font_size", 14)
		var vl: Label = Label.new()
		vl.text = str(cost[key])
		vl.add_theme_font_size_override("font_size", 14)
		vl.add_theme_color_override("font_color", Color(1, 0.95, 0.7))
		hb.add_child(ic)
		hb.add_child(vl)
		_cost_container.add_child(hb)

func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		emit_signal("card_clicked", self)
		AudioManager.play_ui_click()
		accept_event()

func _on_mouse_entered() -> void:
	_is_hovered = true
	emit_signal("card_hovered", self, true)
	AudioManager.play_sfx(AudioManager.SFXType.CARD_HOVER, 0.3)
	_hover_effect(true)

func _on_mouse_exited() -> void:
	_is_hovered = false
	emit_signal("card_hovered", self, false)
	_hover_effect(false)

func _hover_effect(enter: bool) -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	if enter:
		_tween.parallel().tween_property(self, "position", _base_position + Vector2(0, HOVER_LIFT), ANIM_DURATION)
		_tween.parallel().tween_property(self, "scale", Vector2(HOVER_SCALE, HOVER_SCALE), ANIM_DURATION)
		_tween.parallel().tween_property(self, "rotation", 0.0, ANIM_DURATION)
		z_index = 100
	else:
		_tween.parallel().tween_property(self, "position", _base_position, ANIM_DURATION)
		_tween.parallel().tween_property(self, "scale", Vector2(1, 1), ANIM_DURATION)
		_tween.parallel().tween_property(self, "rotation", _base_rotation, ANIM_DURATION)
		z_index = hand_index

func _bounce_animation() -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	t.tween_property(self, "scale", Vector2(1.25, 1.25), 0.2)
	t.tween_property(self, "scale", Vector2(HOVER_SCALE if _is_hovered else 1.0, HOVER_SCALE if _is_hovered else 1.0), 0.3)

func _tween_color(rect: ColorRect, prop: String, target: Color, duration: float) -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	t.tween_property(rect, prop, target, duration)
