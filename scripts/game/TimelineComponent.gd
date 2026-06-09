extends Control

const EVIDENCE_CARD_SCENE = preload("res://scenes/EvidenceCard.tscn")
const TIMELINE_SLOT_SCENE = preload("res://scenes/TimelineSlot.tscn")

signal timeline_changed()

@export var card_gap: float = 16.0
@export var max_visible_slots: int = 6

var slots_container: HBoxContainer
var slots: Array = []
var cards: Dictionary = {}
var dragging_card: Control = null
var hovered_slot: Control = null

func _ready() -> void:
	_setup_container()

func _setup_container() -> void:
	var scroll = ScrollContainer.new()
	scroll.name = "TimelineScroll"
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(scroll)
	slots_container = HBoxContainer.new()
	slots_container.name = "SlotsContainer"
	slots_container.add_theme_constant_override("separation", int(card_gap))
	slots_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(slots_container)

func initialize_from_config(config: Dictionary) -> void:
	clear_all()
	var slot_count: int = int(config.get("timeline_slots", config.get("cards", []).size()))
	for i in range(slot_count):
		var slot_scene: Control = TIMELINE_SLOT_SCENE.instantiate() as Control
		slot_scene.slot_index = i
		slot_scene.card_dropped_on_slot.connect(_on_card_dropped_on_slot)
		slot_scene.slot_hovered.connect(_on_slot_hovered)
		slots_container.add_child(slot_scene)
		slots.append(slot_scene)
		slot_scene.set_slot_label("第 %d 位" % (i + 1))

func register_card(card: Control) -> void:
	if not card.card_id.is_empty():
		cards[card.card_id] = card
		if not card.card_drag_started.is_connected(_on_card_drag_started):
			card.card_drag_started.connect(_on_card_drag_started)
		if not card.card_drag_ended.is_connected(_on_card_drag_ended):
			card.card_drag_ended.connect(_on_card_drag_ended)
		if not card.card_double_clicked.is_connected(_on_card_double_clicked):
			card.card_double_clicked.connect(_on_card_double_clicked)

func get_card(card_id: String) -> Control:
	return cards.get(card_id, null)

func get_all_cards() -> Dictionary:
	return cards.duplicate()

func get_slot(index: int) -> Control:
	if index >= 0 and index < slots.size():
		return slots[index]
	return null

func get_slot_count() -> int:
	return slots.size()

func _on_card_drag_started(card: Control) -> void:
	dragging_card = card
	for slot in slots:
		slot.mouse_filter = Control.MOUSE_FILTER_STOP

func _on_card_drag_ended(card: Control, position: Vector2) -> void:
	dragging_card = null
	for slot in slots:
		slot.mouse_filter = Control.MOUSE_FILTER_PASS
	var dropped_slot: Control = _find_slot_at_global_position(position)
	if dropped_slot:
		_handle_drop_on_slot(card, dropped_slot, position)
	else:
		_handle_drop_outside(card)
	emit_signal("timeline_changed")

func _find_slot_at_global_position(global_pos: Vector2) -> Control:
	for slot in slots:
		var rect = Rect2(slot.get_global_position(), slot.size)
		if rect.has_point(global_pos):
			return slot
	return null

func _handle_drop_on_slot(card: Control, slot: Control, _position: Vector2) -> void:
	var previous_slot_index: int = card.slot_index
	if previous_slot_index == slot.slot_index:
		card.return_to_original_parent()
		if slot.occupied_card:
			slot.occupied_card.position = Vector2(10, 35)
		return
	var old_slot_card = slot.occupied_card
	if previous_slot_index >= 0 and previous_slot_index < slots.size():
		var prev_slot: Control = slots[previous_slot_index]
		prev_slot.clear_slot()
		if old_slot_card:
			prev_slot.set_occupied_card(old_slot_card)
			_position_card_in_slot(old_slot_card, prev_slot)
			GameManager.place_card(old_slot_card.card_id, previous_slot_index)
	if card.is_placed and previous_slot_index < 0:
		pass
	if card.get_parent():
		card.get_parent().remove_child(card)
	slot.add_child(card)
	card.position = Vector2(10, 35)
	slot.set_occupied_card(card)
	GameManager.place_card(card.card_id, slot.slot_index)
	slot.animate_correct()

func _handle_drop_outside(card: Control) -> void:
	var prev_slot_index: int = card.slot_index
	if prev_slot_index >= 0 and prev_slot_index < slots.size():
		slots[prev_slot_index].clear_slot()
		GameManager.remove_card_from_slot(prev_slot_index)
	card.return_to_original_parent()

func _position_card_in_slot(card: Control, slot: Control) -> void:
	if card.get_parent() != slot:
		if card.get_parent():
			card.get_parent().remove_child(card)
		slot.add_child(card)
	card.position = Vector2(10, 35)

func _on_card_dropped_on_slot(_slot: Control, _card: Control, _position: Vector2) -> void:
	pass

func _on_slot_hovered(slot: Control, hovered: bool) -> void:
	if dragging_card:
		slot.highlight_slot(hovered)
		if hovered:
			hovered_slot = slot
		elif hovered_slot == slot:
			hovered_slot = null

func _on_card_double_clicked(card: Control) -> void:
	EventBus.emit_signal("card_pressed", card.card_id)

func place_card_in_slot(card_id: String, slot_index: int) -> void:
	var card: Control = get_card(card_id)
	var slot: Control = get_slot(slot_index)
	if not card or not slot:
		return
	var old_index: int = card.slot_index
	if old_index >= 0 and old_index < slots.size():
		slots[old_index].clear_slot()
	var old_slot_card = slot.occupied_card
	if old_slot_card and old_slot_card != card:
		if old_index >= 0 and old_index < slots.size():
			slots[old_index].set_occupied_card(old_slot_card)
			_position_card_in_slot(old_slot_card, slots[old_index])
	card.slot_index = slot_index
	card.is_placed = true
	_position_card_in_slot(card, slot)
	slot.set_occupied_card(card)
	if old_slot_card and old_slot_card != card and old_index < 0:
		old_slot_card.slot_index = -1
		old_slot_card.is_placed = false

func remove_card(card_id: String) -> void:
	var card: Control = get_card(card_id)
	if not card:
		return
	var slot_index: int = card.slot_index
	if slot_index >= 0 and slot_index < slots.size():
		slots[slot_index].clear_slot()
	card.slot_index = -1
	card.is_placed = false
	card.return_to_original_parent()

func animate_slot_result(slot_index: int, correct: bool) -> void:
	var slot: Control = get_slot(slot_index)
	if slot:
		if correct:
			slot.animate_correct()
		else:
			slot.animate_wrong()
		if slot.occupied_card:
			if correct:
				slot.occupied_card.animate_correct()
			else:
				slot.occupied_card.animate_wrong()

func get_current_order() -> Array:
	var order: Array = []
	for slot in slots:
		if slot.occupied_card:
			order.append(slot.occupied_card.card_id)
		else:
			order.append(null)
	return order

func clear_all() -> void:
	for slot in slots:
		if slot.occupied_card and slot.occupied_card.is_inside_tree():
			slot.occupied_card.return_to_original_parent()
		slot.queue_free()
	slots.clear()
	cards.clear()
	dragging_card = null
	hovered_slot = null

func show_cards_appear_animation() -> void:
	var idx: int = 0
	for card in cards.values():
		card.animate_appear(idx * 0.08)
		idx += 1
