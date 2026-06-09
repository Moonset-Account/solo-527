extends Control

const EVIDENCE_CARD_SCENE = preload("res://scenes/EvidenceCard.tscn")

signal card_request_link(card: Control)

@export var card_width: float = 220.0
@export var card_height: float = 280.0
@export var columns: int = 3
@export var padding: float = 12.0

var grid_container: GridContainer
var cards: Dictionary = {}
var selected_card: Control = null
var link_mode: bool = false
var link_from_card: Control = null

func _ready() -> void:
	_setup_area()

func _setup_area() -> void:
	var title = Label.new()
	title.text = "待归档档案"
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.9, 0.9, 0.95, 1))
	title.custom_minimum_size.y = 32
	add_child(title)
	var scroll = ScrollContainer.new()
	scroll.name = "UnplacedScroll"
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(scroll)
	grid_container = GridContainer.new()
	grid_container.name = "CardGrid"
	grid_container.columns = columns
	grid_container.add_theme_constant_override("h_separation", int(padding))
	grid_container.add_theme_constant_override("v_separation", int(padding))
	grid_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(grid_container)

func set_columns(cols: int) -> void:
	columns = cols
	if grid_container:
		grid_container.columns = cols

func initialize_from_config(config: Dictionary) -> void:
	clear_all()
	var cards_data: Array = config.get("cards", [])
	for card_data in cards_data:
		_create_card(card_data)

func _create_card(data: Dictionary) -> void:
	var card_scene: Control = EVIDENCE_CARD_SCENE.instantiate() as Control
	card_scene.set_card_data(data)
	card_scene.card_pressed.connect(_on_card_pressed)
	card_scene.card_double_clicked.connect(_on_card_double_clicked)
	card_scene.card_drag_started.connect(_on_card_drag_started)
	card_scene.card_drag_ended.connect(_on_card_drag_ended)
	grid_container.add_child(card_scene)
	card_scene.home_parent = grid_container
	card_scene.home_position = card_scene.position
	cards[data["id"]] = card_scene

func get_card(card_id: String) -> Control:
	return cards.get(card_id, null)

func get_all_cards() -> Dictionary:
	return cards.duplicate()

func set_link_mode(enabled: bool, from_card: Control = null) -> void:
	link_mode = enabled
	link_from_card = from_card
	for card in cards.values():
		if link_mode and card != from_card:
			card.set_selected(true)
		else:
			card.set_selected(card == selected_card)

func _on_card_pressed(card: Control) -> void:
	if link_mode and link_from_card and card != link_from_card:
		emit_signal("card_request_link", card)
		return
	if selected_card:
		selected_card.set_selected(false)
	selected_card = card
	card.set_selected(true)

func _on_card_double_clicked(card: Control) -> void:
	EventBus.emit_signal("card_pressed", card.card_id)

func _on_card_drag_started(card: Control) -> void:
	pass

func _on_card_drag_ended(card: Control, position: Vector2) -> void:
	if not card.is_placed and card.get_parent() != grid_container:
		if card.get_parent():
			card.get_parent().remove_child(card)
		grid_container.add_child(card)
	if cards.has(card.card_id):
		cards[card.card_id] = card

func add_card_back(card: Control) -> void:
	if card.get_parent() != grid_container:
		if card.get_parent():
			card.get_parent().remove_child(card)
		grid_container.add_child(card)
	card.is_placed = false
	card.slot_index = -1
	card.refresh_tags_display()

func clear_all() -> void:
	for card in cards.values():
		card.queue_free()
	cards.clear()
	selected_card = null
	link_mode = false
	link_from_card = null

func show_cards_appear_animation() -> void:
	var idx: int = 0
	for card in cards.values():
		card.animate_appear(idx * 0.05)
		idx += 1

func refresh_card_tags(card_id: String) -> void:
	var card: Control = get_card(card_id)
	if card:
		card.refresh_tags_display()

func set_card_visible(card_id: String, visible: bool) -> void:
	var card: Control = get_card(card_id)
	if card:
		card.visible = visible
