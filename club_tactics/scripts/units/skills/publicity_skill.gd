class_name PublicitySkill
extends Skill

@export var power_bonus: int = 2
@export var range_bonus: int = 0

func _init() -> void:
	id = "publicity_boost"
	display_name = "宣传强化"
	description = "提升宣传能力值%d点" % power_bonus
	skill_type = Skill.SkillType.ACTIVE
	ap_cost = 1
	cooldown = 2

func get_effect_description() -> String:
	return "宣传+%d" % power_bonus
