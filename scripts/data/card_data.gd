class_name CardData
extends RefCounted

enum CardType { REPAIR, BUDGET, EXPERT }

var id: String = ""
var card_name: String = ""
var type: CardType = CardType.REPAIR
var cost: int = 1
var repair_value: int = 0
var budget_gain: int = 0
var description: String = ""
var rarity: String = "common"
var effect: String = ""
var repair_bonus: int = 0
var self_damage: int = 0
var draw_count: int = 0
var discard_count: int = 0

func is_repair() -> bool:
	return type == CardType.REPAIR

func is_budget() -> bool:
	return type == CardType.BUDGET

func is_expert() -> bool:
	return type == CardType.EXPERT

func get_display_color() -> Color:
	match type:
		CardType.REPAIR:
			return Color(0.3, 0.6, 0.9)
		CardType.BUDGET:
			return Color(0.9, 0.8, 0.2)
		CardType.EXPERT:
			return Color(0.6, 0.9, 0.4)
		_:
			return Color.WHITE

func get_rarity_color() -> Color:
	match rarity:
		"common":
			return Color(0.8, 0.8, 0.8)
		"uncommon":
			return Color(0.3, 0.8, 0.3)
		"rare":
			return Color(0.9, 0.6, 0.1)
		_:
			return Color.WHITE
