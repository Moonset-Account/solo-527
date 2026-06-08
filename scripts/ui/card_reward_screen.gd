extends Control

signal card_selected(card_id: String)
signal selection_skipped

@onready var card_container: HBoxContainer = $VBoxContainer/CardContainer
@onready var skip_button: Button = $VBoxContainer/SkipButton
@onready var title_label: Label = $VBoxContainer/TitleLabel

var _reward_card_ids: Array[String] = []
var _selected: bool = false

func _ready() -> void:
	skip_button.pressed.connect(_on_skip)

func setup_rewards(card_ids: Array[String]) -> void:
	_reward_card_ids = card_ids
	_selected = false
	for child in card_container.get_children():
		child.queue_free()
	title_label.text = "选择一张新卡加入卡组"
	for card_id in card_ids:
		var card_data = GameResources.create_card_by_id(card_id)
		if card_data:
			var card_display = _create_card_display(card_data)
			card_container.add_child(card_display)

func _create_card_display(card_data: CardData) -> Control:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(140, 200)
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	var name_label = Label.new()
	name_label.text = card_data.card_name
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var type_label = Label.new()
	type_label.text = CardData.CardType.keys()[card_data.type]
	type_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var cost_label = Label.new()
	cost_label.text = "费用: %d" % card_data.cost
	cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var desc_label = RichTextLabel.new()
	desc_label.bbcode_enabled = true
	desc_label.text = card_data.description
	desc_label.fit_content = true
	desc_label.custom_minimum_size = Vector2(120, 60)
	var rarity_label = Label.new()
	rarity_label.text = card_data.rarity
	rarity_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_label)
	vbox.add_child(type_label)
	vbox.add_child(cost_label)
	vbox.add_child(desc_label)
	vbox.add_child(rarity_label)
	panel.add_child(vbox)
	var button = Button.new()
	button.text = "选择"
	button.pressed.connect(_on_card_selected.bind(card_data.id))
	vbox.add_child(button)
	return panel

func _on_card_selected(card_id: String) -> void:
	if _selected:
		return
	_selected = true
	var card = GameResources.create_card_by_id(card_id)
	if card:
		GameManager.player_deck.add_card(card)
	card_selected.emit(card_id)
	SaveManager.save_game()

func _on_skip() -> void:
	selection_skipped.emit()
