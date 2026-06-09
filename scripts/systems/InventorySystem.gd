extends Node

signal material_consumed(material_type: String, material_id: String, amount: int)
signal inventory_updated()

var paper_inventory: Dictionary = {}
var glue_inventory: Dictionary = {}
var gold: int = 0

func _ready() -> void:
	initialize_default()

func initialize_default() -> void:
	paper_inventory = {
		"bamboo": 20,
		"xuan": 10,
		"cotton": 15,
		"hide": 5
	}
	glue_inventory = {
		"starch": 30,
		"wheat_starch": 15,
		"dextrin": 20
	}
	gold = 500

func get_paper_count(paper_id: String) -> int:
	return paper_inventory.get(paper_id, 0)

func get_glue_count(glue_id: String) -> int:
	return glue_inventory.get(glue_id, 0)

func consume_paper(paper_id: String, amount: int = 1) -> bool:
	var current: int = paper_inventory.get(paper_id, 0)
	if current < amount:
		return false
	paper_inventory[paper_id] = current - amount
	emit_signal("material_consumed", "paper", paper_id, amount)
	emit_signal("inventory_updated")
	return true

func consume_glue(glue_id: String, amount: int = 1) -> bool:
	var current: int = glue_inventory.get(glue_id, 0)
	if current < amount:
		return false
	glue_inventory[glue_id] = current - amount
	emit_signal("material_consumed", "glue", glue_id, amount)
	emit_signal("inventory_updated")
	return true

func can_consume_paper(paper_id: String, amount: int = 1) -> bool:
	return paper_inventory.get(paper_id, 0) >= amount

func can_consume_glue(glue_id: String, amount: int = 1) -> bool:
	return glue_inventory.get(glue_id, 0) >= amount

func purchase_paper(paper_id: String, amount: int) -> bool:
	var paper_data: Dictionary = LevelLoader.get_paper_by_id(paper_id)
	if paper_data.is_empty():
		return false
	var cost: int = paper_data.get("cost", 10) * amount
	if gold < cost:
		return false
	gold -= cost
	paper_inventory[paper_id] = paper_inventory.get(paper_id, 0) + amount
	emit_signal("inventory_updated")
	return true

func purchase_glue(glue_id: String, amount: int) -> bool:
	var glue_data: Dictionary = LevelLoader.get_glue_by_id(glue_id)
	if glue_data.is_empty():
		return false
	var cost: int = glue_data.get("cost", 5) * amount
	if gold < cost:
		return false
	gold -= cost
	glue_inventory[glue_id] = glue_inventory.get(glue_id, 0) + amount
	emit_signal("inventory_updated")
	return true

func add_gold(amount: int) -> void:
	gold += amount
	emit_signal("inventory_updated")

func get_inventory_summary() -> Dictionary:
	return {
		"paper": paper_inventory.duplicate(),
		"glue": glue_inventory.duplicate(),
		"gold": gold
	}
