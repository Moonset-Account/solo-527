class_name LevelRegistry
extends RefCounted

static func get_all_levels() -> Array[Dictionary]:
	var levels: Array[Dictionary] = []
	levels.append(_level_1())
	levels.append(_level_2())
	levels.append(_level_3())
	return levels

static func get_level(id: int) -> LevelConfig:
	var all = get_all_levels()
	for l in all:
		if l.get("level_id", 0) == id:
			return LevelConfig.new(l)
	return null

static func _level_1() -> Dictionary:
	return {
		"level_id": 1,
		"level_name": "初次维修",
		"description": "学习基础维修操作和供水管线维护。供水系统出现轻微泄漏，派遣维修机器人修复管线。",
		"duration": 90.0,
		"robot_count": 2,
		"resources": {
			"water": {"initial": 80.0, "max": 100.0, "decay": 1.5},
			"plant_health": {"initial": 70.0, "max": 100.0, "decay": 0.8},
			"oxygen": {"initial": 100.0, "max": 100.0, "decay": 0.0},
			"solar": {"initial": 100.0, "max": 100.0, "decay": 0.0},
		},
		"unlocked_resources": [&"water", &"plant_health"],
		"event_interval": 18.0,
		"events": [
			{
				"id": "water_leak_minor",
				"name": "供水管线微漏",
				"description": "供水管线出现轻微裂缝，水压正在下降。",
				"target_resource": "water",
				"damage": 8.0,
				"damage_type": "leak",
				"weight": 3.0,
				"cooldown": 20.0,
				"requires_unlock": "",
			},
			{
				"id": "plant_wilt",
				"name": "植物枯萎",
				"description": "供水不足导致部分植物开始枯萎。",
				"target_resource": "plant_health",
				"damage": 5.0,
				"damage_type": "decay",
				"weight": 2.0,
				"cooldown": 25.0,
				"requires_unlock": "",
			},
		],
		"tutorial_steps": [
			{"trigger": "start", "text": "欢迎来到月面温室！你的任务是维护温室系统的正常运转。", "highlight": ""},
			{"trigger": "after_start", "text": "看右上方的资源面板——供水正在下降。点击「供水」区域，派遣一个维修机器人去修复管线。", "highlight": "resource_water"},
			{"trigger": "robot_assigned", "text": "机器人已出发！等待它完成维修。维修期间可以观察资源变化。", "highlight": "robot_queue"},
			{"trigger": "repair_done", "text": "维修完成！供水已恢复。记住：保持资源在安全线以上，否则任务失败。", "highlight": "resource_water"},
		],
	}

static func _level_2() -> Dictionary:
	return {
		"level_id": 2,
		"level_name": "氧气危机",
		"description": "氧气循环系统加入维护。管线老化和陨石撞击同时威胁氧气和供水。",
		"duration": 120.0,
		"robot_count": 3,
		"resources": {
			"oxygen": {"initial": 90.0, "max": 100.0, "decay": 1.0},
			"water": {"initial": 85.0, "max": 100.0, "decay": 1.2},
			"solar": {"initial": 100.0, "max": 100.0, "decay": 0.0},
			"plant_health": {"initial": 75.0, "max": 100.0, "decay": 0.6},
		},
		"unlocked_resources": [&"oxygen", &"water", &"plant_health"],
		"event_interval": 14.0,
		"events": [
			{
				"id": "water_leak_minor",
				"name": "供水管线微漏",
				"description": "供水管线出现轻微裂缝，水压正在下降。",
				"target_resource": "water",
				"damage": 10.0,
				"damage_type": "leak",
				"weight": 2.5,
				"cooldown": 18.0,
				"requires_unlock": "",
			},
			{
				"id": "oxygen_leak_minor",
				"name": "氧气微漏",
				"description": "密封舱壁出现微小裂缝，氧气正在缓慢泄漏。",
				"target_resource": "oxygen",
				"damage": 8.0,
				"damage_type": "leak",
				"weight": 2.0,
				"cooldown": 22.0,
				"requires_unlock": "",
			},
			{
				"id": "plant_wilt",
				"name": "植物枯萎",
				"description": "供水不足导致部分植物开始枯萎。",
				"target_resource": "plant_health",
				"damage": 6.0,
				"damage_type": "decay",
				"weight": 1.5,
				"cooldown": 25.0,
				"requires_unlock": "",
			},
			{
				"id": "oxygen_leak_major",
				"name": "氧气严重泄漏",
				"description": "陨石碎片击穿舱壁，氧气快速泄漏！需要立即维修！",
				"target_resource": "oxygen",
				"damage": 20.0,
				"damage_type": "meteor",
				"weight": 0.8,
				"cooldown": 45.0,
				"requires_unlock": "",
			},
		],
		"tutorial_steps": [
			{"trigger": "start", "text": "氧气循环系统现在也需要维护了！注意左上角的氧气值。", "highlight": "resource_oxygen"},
			{"trigger": "after_start", "text": "当氧气泄漏和供水泄漏同时发生时，优先处理更危急的那个。", "highlight": ""},
		],
	}

static func _level_3() -> Dictionary:
	return {
		"level_id": 3,
		"level_name": "全面危机",
		"description": "所有系统都需要维护，陨石撞击频繁，太阳能板也会受损。",
		"duration": 150.0,
		"robot_count": 4,
		"resources": {
			"oxygen": {"initial": 85.0, "max": 100.0, "decay": 1.2},
			"water": {"initial": 80.0, "max": 100.0, "decay": 1.5},
			"solar": {"initial": 90.0, "max": 100.0, "decay": 0.5},
			"plant_health": {"initial": 70.0, "max": 100.0, "decay": 0.8},
		},
		"unlocked_resources": [&"oxygen", &"water", &"solar", &"plant_health"],
		"event_interval": 12.0,
		"events": [
			{
				"id": "water_leak_minor",
				"name": "供水管线微漏",
				"description": "供水管线出现轻微裂缝，水压正在下降。",
				"target_resource": "water",
				"damage": 10.0,
				"damage_type": "leak",
				"weight": 2.0,
				"cooldown": 16.0,
				"requires_unlock": "",
			},
			{
				"id": "water_leak_major",
				"name": "供水管爆裂",
				"description": "供水主管道爆裂！大量水资源正在流失！",
				"target_resource": "water",
				"damage": 25.0,
				"damage_type": "burst",
				"weight": 0.6,
				"cooldown": 50.0,
				"requires_unlock": "",
			},
			{
				"id": "oxygen_leak_minor",
				"name": "氧气微漏",
				"description": "密封舱壁出现微小裂缝，氧气正在缓慢泄漏。",
				"target_resource": "oxygen",
				"damage": 10.0,
				"damage_type": "leak",
				"weight": 2.0,
				"cooldown": 18.0,
				"requires_unlock": "",
			},
			{
				"id": "oxygen_leak_major",
				"name": "氧气严重泄漏",
				"description": "陨石碎片击穿舱壁，氧气快速泄漏！需要立即维修！",
				"target_resource": "oxygen",
				"damage": 22.0,
				"damage_type": "meteor",
				"weight": 0.8,
				"cooldown": 40.0,
				"requires_unlock": "",
			},
			{
				"id": "solar_damage",
				"name": "太阳能板受损",
				"description": "微陨石撞击导致太阳能板效率下降，供电量减少。",
				"target_resource": "solar",
				"damage": 15.0,
				"damage_type": "meteor",
				"weight": 1.5,
				"cooldown": 30.0,
				"requires_unlock": "",
			},
			{
				"id": "plant_disease",
				"name": "植物病害",
				"description": "温室内爆发植物病害，需要紧急处理。",
				"target_resource": "plant_health",
				"damage": 12.0,
				"damage_type": "disease",
				"weight": 1.0,
				"cooldown": 35.0,
				"requires_unlock": "",
			},
			{
				"id": "solar_flare",
				"name": "太阳耀斑",
				"description": "太阳耀斑冲击！太阳能系统过载，部分面板失效。",
				"target_resource": "solar",
				"damage": 20.0,
				"damage_type": "flare",
				"weight": 0.4,
				"cooldown": 60.0,
				"requires_unlock": "",
			},
		],
		"tutorial_steps": [
			{"trigger": "start", "text": "所有系统全面运行！注意太阳能——如果断电，维修速度会减半。", "highlight": "resource_solar"},
			{"trigger": "after_start", "text": "合理分配机器人，在多个危机之间找到平衡。你可以撤销上一步分配。", "highlight": ""},
		],
	}
