class_name ReceptionSkill
extends Skill

@export var power_bonus: int = 2
@export var range_bonus: int = 0

func _init() -> void:
	id = "reception_boost"
	display_name = "接待强化"
	description = "提升接待能力值%d点" % power_bonus
	skill_type = Skill.SkillType.ACTIVE
	ap_cost = 1
	cooldown = 2

func get_effect_description() -> String:
	return "接待+%d" % power_bonus
