class_name Deck
extends RefCounted

var _cards: Array[CardData] = []
var _draw_pile: Array[CardData] = []
var _discard_pile: Array[CardData] = []
var _hand: Array[CardData] = []
var max_hand_size: int = 7

signal hand_changed
signal deck_shuffled

func add_card(card: CardData) -> void:
	_cards.append(card)
	_draw_pile.append(card)

func remove_card(card_id: String) -> void:
	_cards = _cards.filter(func(c): return c.id != card_id)
	_draw_pile = _draw_pile.filter(func(c): return c.id != card_id)
	_discard_pile = _discard_pile.filter(func(c): return c.id != card_id)
	_hand = _hand.filter(func(c): return c.id != card_id)

func draw_cards(count: int) -> Array[CardData]:
	var drawn: Array[CardData] = []
	for i in count:
		if _hand.size() >= max_hand_size:
			break
		if _draw_pile.is_empty():
			_reshuffle_discard()
		if _draw_pile.is_empty():
			break
		var card = _draw_pile.pop_back()
		_hand.append(card)
		drawn.append(card)
	hand_changed.emit()
	return drawn

func play_card(card: CardData) -> void:
	var idx = _hand.find(card)
	if idx >= 0:
		_hand.remove_at(idx)
		_discard_pile.append(card)
		hand_changed.emit()

func discard_hand() -> void:
	for card in _hand:
		_discard_pile.append(card)
	_hand.clear()
	hand_changed.emit()

func _reshuffle_discard() -> void:
	_draw_pile.append_array(_discard_pile)
	_discard_pile.clear()
	_shuffle_draw_pile()

func _shuffle_draw_pile() -> void:
	_draw_pile.shuffle()
	deck_shuffled.emit()

func shuffle() -> void:
	_draw_pile.clear()
	_discard_pile.clear()
	_hand.clear()
	_draw_pile.append_array(_cards)
	_shuffle_draw_pile()

func get_hand() -> Array[CardData]:
	return _hand

func get_draw_pile_size() -> int:
	return _draw_pile.size()

func get_discard_pile_size() -> int:
	return _discard_pile.size()

func get_all_card_ids() -> Array[String]:
	var ids: Array[String] = []
	for card in _cards:
		ids.append(card.id)
	return ids

func get_card_count() -> int:
	return _cards.size()

func reset_for_battle() -> void:
	_hand.clear()
	_draw_pile.clear()
	_discard_pile.clear()
	_draw_pile.append_array(_cards)
	_shuffle_draw_pile()
