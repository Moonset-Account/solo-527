class_name Skill
extends Resource

enum SkillType { PASSIVE, ACTIVE }

@export var id: String = ""
@export var display_name: String = ""
@export var description: String = ""
@export var skill_type: SkillType = SkillType.ACTIVE
@export var ap_cost: int = 1
@export var cooldown: int = 0
@export var current_cooldown: int = 0

func can_use() -> bool:
	return current_cooldown <= 0

func use() -> void:
	current_cooldown = cooldown

func tick_cooldown() -> void:
	if current_cooldown > 0:
		current_cooldown -= 1

func get_effect_description() -> String:
	return description
