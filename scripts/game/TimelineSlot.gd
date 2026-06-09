extends Control

signal card_dropped_on_slot(slot: Control, card: Control, position: Vector2)
signal slot_hovered(slot: Control, hovered: bool)
signal slot_clicked(slot: Control)

@export var slot_index: int = -1
@export var slot_label: String = ""
@export var card_width: float = 220.0
@export var card_height: float = 280.0

var occupied_card: Control = null
var is_hovered: bool = false
var is_valid_target: bool = true
var highlight_tween: Tween

@onready var slot_panel: Panel = $SlotPanel
@onready var index_label: Label = $IndexLabel
@onready var date_label: Label = $DateLabel
@onready var placeholder: Label = $Placeholder

func _ready() -> void:
	custom_minimum_size = Vector2(card_width + 20, card_height + 60)
	size = Vector2(card_width + 20, card_height + 60)
	mouse_filter = Control.MOUSE_FILTER_PASS
	if slot_panel:
		slot_panel.size = Vector2(card_width, card_height)
		slot_panel.position = Vector2(10, 35)
	if index_label:
		index_label.text = slot_label if not slot_label.is_empty() else "#%d" % (slot_index + 1)
		index_label.position = Vector2(10, 5)
	if placeholder:
		placeholder.text = "拖拽卡片至此处"
		placeholder.position = Vector2(10, 35)
		placeholder.size = Vector2(card_width, card_height)
	_set_slot_style(false)

func set_slot_label(text: String) -> void:
	slot_label = text
	if index_label:
		index_label.text = text

func set_date_hint(text: String) -> void:
	if date_label:
		date_label.text = text
		date_label.visible = not text.is_empty()

func set_occupied_card(card: Control) -> void:
	if occupied_card and occupied_card != card:
		occupied_card.is_placed = false
		occupied_card.slot_index = -1
		occupied_card.return_to_original_parent()
	occupied_card = card
	if card:
		card.is_placed = true
		card.slot_index = slot_index
		if placeholder:
			placeholder.visible = false
	else:
		if placeholder:
			placeholder.visible = true

func clear_slot() -> void:
	if occupied_card:
		occupied_card.is_placed = false
		occupied_card.slot_index = -1
	occupied_card = null
	if placeholder:
		placeholder.visible = true

func _set_slot_style(highlighted: bool) -> void:
	if not slot_panel:
		return
	var sb = StyleBoxFlat.new()
	if highlighted:
		sb.bg_color = Color(0.2, 0.6, 1.0, 0.15)
		sb.border_color = Color(0.2, 0.6, 1.0, 0.8)
		sb.border_width_left = 3
		sb.border_width_right = 3
		sb.border_width_top = 3
		sb.border_width_bottom = 3
	else:
		sb.bg_color = Color(0.15, 0.15, 0.2, 0.4)
		sb.border_color = Color(0.3, 0.3, 0.4, 0.6)
		sb.border_width_left = 2
		sb.border_width_right = 2
		sb.border_width_top = 2
		sb.border_width_bottom = 2
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	slot_panel.add_theme_stylebox_override("panel", sb)

func highlight_slot(highlight: bool) -> void:
	is_hovered = highlight
	_set_slot_style(highlight)
	if highlight_tween:
		highlight_tween.kill()
	if highlight:
		highlight_tween = create_tween().set_loops()
		highlight_tween.tween_interval(0.5)
		var sb = slot_panel.get_theme_stylebox("panel") as StyleBoxFlat
		if sb:
			var orig_alpha = sb.bg_color.a
			highlight_tween.tween_property(sb, "bg_color:a", orig_alpha + 0.2, 0.5).set_trans(Tween.TRANS_SINE)
			highlight_tween.tween_property(sb, "bg_color:a", orig_alpha, 0.5).set_trans(Tween.TRANS_SINE)

func animate_wrong() -> void:
	var tw = create_tween()
	var orig_pos = slot_panel.position
	tw.set_loops(2)
	tw.tween_property(slot_panel, "position:x", orig_pos.x - 6, 0.05 * GameManager.animation_speed)
	tw.tween_property(slot_panel, "position:x", orig_pos.x + 6, 0.05 * GameManager.animation_speed)
	tw.tween_property(slot_panel, "position:x", orig_pos.x, 0.05 * GameManager.animation_speed)
	var sb = slot_panel.get_theme_stylebox("panel") as StyleBoxFlat
	if sb:
		var orig_border = sb.border_color
		sb.border_color = Color(1.0, 0.2, 0.2, 0.9)
		await tw.finished
		sb.border_color = orig_border

func animate_correct() -> void:
	var tw = create_tween()
	var orig_scale = slot_panel.scale
	tw.tween_property(slot_panel, "scale", orig_scale * 1.05, 0.1 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(slot_panel, "scale", orig_scale, 0.15 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	var sb = slot_panel.get_theme_stylebox("panel") as StyleBoxFlat
	if sb:
		var orig_border = sb.border_color
		sb.border_color = Color(0.2, 0.9, 0.4, 0.9)
		await tw.finished
		sb.border_color = orig_border

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		if not is_hovered:
			is_hovered = true
			emit_signal("slot_hovered", self, true)
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		emit_signal("slot_clicked", self)
