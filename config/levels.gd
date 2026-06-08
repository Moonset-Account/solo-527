extends Resource
class_name LevelDataResource

var _levels_data: Dictionary = {}

func _init() -> void:
	_build_levels()

func get_level_data() -> Dictionary:
	return _levels_data

func _build_levels() -> void:
	_levels_data = {
		1: _create_level_1(),
		2: _create_level_2(),
		3: _create_level_3(),
		4: _create_level_4(),
		5: _create_level_5(),
		6: _create_level_6(),
		7: _create_level_7(),
		8: _create_level_8()
	}

func _create_level_1() -> Dictionary:
	return {
		"id": 1,
		"name": "初学乍练 - 入门",
		"description": "简单小箱子，先热热身！",
		"difficulty": 1,
		"time_limit": 120.0,
		"timer_enabled": true,
		"max_weight": 300.0,
		"target_fill_ratio": 0.7,
		"perfect_threshold": 0.85,
		"good_threshold": 0.65,
		"container_size": Vector2(500, 400),
		"total_items": 8,
		"fragile_count": 0,
		"unlocks": [2],
		"items": [
			{"config_id": "box_small", "count": 4},
			{"config_id": "box_medium", "count": 2},
			{"config_id": "books_stack", "count": 2}
		],
		"tutorial_hints": [
			"拖拽物品放入箱子",
			"用 Q/E 或鼠标滚轮旋转",
			"按 Ctrl+Z 撤销操作"
		]
	}

func _create_level_2() -> Dictionary:
	return {
		"id": 2,
		"name": "玻璃小心 - 易碎品初体验",
		"description": "注意！有玻璃制品，别让重物压到它",
		"difficulty": 2,
		"time_limit": 150.0,
		"timer_enabled": true,
		"max_weight": 400.0,
		"target_fill_ratio": 0.75,
		"perfect_threshold": 0.85,
		"good_threshold": 0.65,
		"container_size": Vector2(520, 440),
		"total_items": 10,
		"fragile_count": 2,
		"unlocks": [3],
		"items": [
			{"config_id": "box_small", "count": 3},
			{"config_id": "box_medium", "count": 3},
			{"config_id": "glass_cup", "count": 2},
			{"config_id": "clothes_bag", "count": 2}
		],
		"tutorial_hints": [
			"易碎品要放最上面",
			"紫色边框表示易碎物品",
			"重物别压在易碎品上方"
		]
	}

func _create_level_3() -> Dictionary:
	return {
		"id": 3,
		"name": "家当登场 - 家具大件",
		"description": "挑战一下大件家具的空间利用率",
		"difficulty": 2,
		"time_limit": 180.0,
		"timer_enabled": true,
		"max_weight": 600.0,
		"target_fill_ratio": 0.78,
		"perfect_threshold": 0.88,
		"good_threshold": 0.68,
		"container_size": Vector2(600, 480),
		"total_items": 12,
		"fragile_count": 1,
		"unlocks": [4],
		"items": [
			{"config_id": "furniture_small", "count": 2},
			{"config_id": "box_medium", "count": 3},
			{"config_id": "box_large", "count": 1},
			{"config_id": "books_stack", "count": 2},
			{"config_id": "china_plate", "count": 1},
			{"config_id": "lamp", "count": 1},
			{"config_id": "clothes_bag", "count": 2}
		],
		"tutorial_hints": [
			"大件先放，小件填空隙",
			"注意总重量不要超标"
		]
	}

func _create_level_4() -> Dictionary:
	return {
		"id": 4,
		"name": "瓶瓶罐罐 - 厨房大作战",
		"description": "厨房里的各种形状，考验你的摆放技巧",
		"difficulty": 3,
		"time_limit": 180.0,
		"timer_enabled": true,
		"max_weight": 500.0,
		"target_fill_ratio": 0.8,
		"perfect_threshold": 0.9,
		"good_threshold": 0.7,
		"container_size": Vector2(560, 460),
		"total_items": 14,
		"fragile_count": 4,
		"unlocks": [5],
		"items": [
			{"config_id": "box_small", "count": 2},
			{"config_id": "cylinder_pot", "count": 3},
			{"config_id": "glass_cup", "count": 3},
			{"config_id": "china_plate", "count": 2},
			{"config_id": "kitchen_pan", "count": 2},
			{"config_id": "clothes_bag", "count": 2}
		],
		"tutorial_hints": [
			"圆柱体可以旋转节省空间",
			"平底锅是扁平的，适合填空"
		]
	}

func _create_level_5() -> Dictionary:
	return {
		"id": 5,
		"name": "电子风暴 - 精密设备",
		"description": "一堆电子设备和电视音响，轻拿轻放！",
		"difficulty": 3,
		"time_limit": 200.0,
		"timer_enabled": true,
		"max_weight": 700.0,
		"target_fill_ratio": 0.78,
		"perfect_threshold": 0.9,
		"good_threshold": 0.7,
		"container_size": Vector2(620, 500),
		"total_items": 12,
		"fragile_count": 3,
		"unlocks": [6],
		"items": [
			{"config_id": "electronics_tv", "count": 1},
			{"config_id": "electronics_speaker", "count": 2},
			{"config_id": "electronics_laptop", "count": 1},
			{"config_id": "box_medium", "count": 3},
			{"config_id": "glass_cup", "count": 2},
			{"config_id": "mirror", "count": 1},
			{"config_id": "books_stack", "count": 2}
		],
		"tutorial_hints": [
			"镜面朝上或靠墙放",
			"电子产品也要轻拿轻放"
		]
	}

func _create_level_6() -> Dictionary:
	return {
		"id": 6,
		"name": "异形挑战 - 不规则物品",
		"description": "各种奇形怪状的东西，想办法塞进去",
		"difficulty": 4,
		"time_limit": 220.0,
		"timer_enabled": true,
		"max_weight": 800.0,
		"target_fill_ratio": 0.75,
		"perfect_threshold": 0.88,
		"good_threshold": 0.68,
		"container_size": Vector2(640, 520),
		"total_items": 14,
		"fragile_count": 3,
		"unlocks": [7],
		"items": [
			{"config_id": "furniture_chair", "count": 1},
			{"config_id": "irregular_guitar", "count": 1},
			{"config_id": "plant_pot", "count": 2},
			{"config_id": "cylinder_pot", "count": 2},
			{"config_id": "box_large", "count": 1},
			{"config_id": "box_medium", "count": 2},
			{"config_id": "china_plate", "count": 2},
			{"config_id": "lamp", "count": 1},
			{"config_id": "soft_pillow", "count": 2}
		],
		"tutorial_hints": [
			"异形物品需要多次尝试旋转",
			"软物品可以塞在缝隙中"
		]
	}

func _create_level_7() -> Dictionary:
	return {
		"id": 7,
		"name": "重量危机 - 极限负荷",
		"description": "超重警报！每件都是重量级选手",
		"difficulty": 4,
		"time_limit": 200.0,
		"timer_enabled": true,
		"max_weight": 900.0,
		"target_fill_ratio": 0.82,
		"perfect_threshold": 0.92,
		"good_threshold": 0.72,
		"container_size": Vector2(620, 540),
		"total_items": 16,
		"fragile_count": 4,
		"unlocks": [8],
		"items": [
			{"config_id": "appliance_fridge", "count": 1},
			{"config_id": "appliance_washing", "count": 1},
			{"config_id": "box_large", "count": 3},
			{"config_id": "furniture_small", "count": 2},
			{"config_id": "box_medium", "count": 2},
			{"config_id": "books_stack", "count": 3},
			{"config_id": "china_plate", "count": 2},
			{"config_id": "glass_cup", "count": 2}
		],
		"tutorial_hints": [
			"留意右上角重量表",
			"超过90%会有黄色警告"
		]
	}

func _create_level_8() -> Dictionary:
	return {
		"id": 8,
		"name": "终极搬家 - 全家出动",
		"description": "Grand Finale！什么东西都有，考验综合实力",
		"difficulty": 5,
		"time_limit": 300.0,
		"timer_enabled": true,
		"max_weight": 1200.0,
		"target_fill_ratio": 0.82,
		"perfect_threshold": 0.93,
		"good_threshold": 0.73,
		"container_size": Vector2(720, 580),
		"total_items": 22,
		"fragile_count": 6,
		"unlocks": [],
		"items": [
			{"config_id": "furniture_large", "count": 1},
			{"config_id": "furniture_chair", "count": 2},
			{"config_id": "electronics_tv", "count": 1},
			{"config_id": "appliance_fridge", "count": 1},
			{"config_id": "box_large", "count": 2},
			{"config_id": "box_medium", "count": 3},
			{"config_id": "box_small", "count": 2},
			{"config_id": "mirror", "count": 1},
			{"config_id": "irregular_guitar", "count": 1},
			{"config_id": "china_plate", "count": 3},
			{"config_id": "glass_cup", "count": 3},
			{"config_id": "clothes_bag", "count": 2},
			{"config_id": "soft_pillow", "count": 1}
		],
		"tutorial_hints": [
			"先放大件，规划空间",
			"易碎品最后放最上面",
			"善用旋转和撤销！"
		]
	}
