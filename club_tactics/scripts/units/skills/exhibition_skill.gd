class_name ExhibitionSkill
extends Skill

@export var power_bonus: int = 2
@export var range_bonus: int = 0

func _init() -> void:
	id = "exhibition_boost"
	display_name = "布展强化"
	description = "提升布展能力值%d点" % power_bonus
	skill_type = Skill.SkillType.ACTIVE
	ap_cost = 1
	cooldown = 2

func get_effect_description() -> String:
	return "布展+%d" % power_bonus
