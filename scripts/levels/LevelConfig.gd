extends Node

const LEVEL_1 = {
	"id": 1,
	"name": "新手仓库",
	"description": "熟悉基本操作：移动、扫描、修复标签",
	"difficulty": "简单",
	"difficulty_stars": 1,
	"player_spawn": Vector2(120, 500),
	"goal_position": Vector2(1150, 120),
	"required_scans": 3,
	"required_fixes": 1,
	"shelves": [
		{"id": "S1-A1", "pos": Vector2(300, 500), "has_error": false, "expected": "A-101", "actual": "A-101"},
		{"id": "S1-A2", "pos": Vector2(300, 300), "has_error": true, "expected": "A-102", "actual": "B-205"},
		{"id": "S1-A3", "pos": Vector2(500, 400), "has_error": false, "expected": "A-103", "actual": "A-103"},
		{"id": "S1-A4", "pos": Vector2(750, 250), "has_error": false, "expected": "A-104", "actual": "A-104"},
		{"id": "S1-A5", "pos": Vector2(900, 450), "has_error": true, "expected": "A-105", "actual": "X-999"}
	],
	"patrols": [
		{
			"points": [Vector2(600, 150), Vector2(600, 550)],
			"speed": 45,
			"view_dist": 180,
			"view_angle": 35
		}
	],
	"checkpoints": [
		{"id": 1, "pos": Vector2(500, 500)},
		{"id": 2, "pos": Vector2(800, 350)}
	],
	"walls": [
		{"start": Vector2(0, 0), "end": Vector2(1280, 0)},
		{"start": Vector2(0, 720), "end": Vector2(1280, 720)},
		{"start": Vector2(0, 0), "end": Vector2(0, 720)},
		{"start": Vector2(1280, 0), "end": Vector2(1280, 720)},
		{"start": Vector2(400, 100), "end": Vector2(400, 200)},
		{"start": Vector2(400, 200), "end": Vector2(550, 200)},
		{"start": Vector2(700, 400), "end": Vector2(700, 600)},
		{"start": Vector2(700, 600), "end": Vector2(900, 600)}
	]
}

const LEVEL_2 = {
	"id": 2,
	"name": "B区货仓",
	"description": "多盏巡逻灯，合理利用检查点节省时间",
	"difficulty": "普通",
	"difficulty_stars": 2,
	"player_spawn": Vector2(80, 600),
	"goal_position": Vector2(1200, 80),
	"required_scans": 5,
	"required_fixes": 2,
	"shelves": [
		{"id": "S2-B1", "pos": Vector2(250, 500), "has_error": true, "expected": "B-201", "actual": "C-310"},
		{"id": "S2-B2", "pos": Vector2(250, 250), "has_error": false, "expected": "B-202", "actual": "B-202"},
		{"id": "S2-B3", "pos": Vector2(500, 150), "has_error": true, "expected": "B-203", "actual": "A-055"},
		{"id": "S2-B4", "pos": Vector2(500, 550), "has_error": false, "expected": "B-204", "actual": "B-204"},
		{"id": "S2-B5", "pos": Vector2(800, 350), "has_error": false, "expected": "B-205", "actual": "B-205"},
		{"id": "S2-B6", "pos": Vector2(800, 580), "has_error": true, "expected": "B-206", "actual": "D-100"},
		{"id": "S2-B7", "pos": Vector2(1050, 180), "has_error": false, "expected": "B-207", "actual": "B-207"}
	],
	"patrols": [
		{
			"points": [Vector2(400, 350), Vector2(400, 100), Vector2(650, 100), Vector2(650, 350)],
			"speed": 55,
			"view_dist": 200,
			"view_angle": 40
		},
		{
			"points": [Vector2(900, 200), Vector2(900, 500), Vector2(1150, 500), Vector2(1150, 200)],
			"speed": 60,
			"view_dist": 220,
			"view_angle": 45
		}
	],
	"checkpoints": [
		{"id": 1, "pos": Vector2(380, 600)},
		{"id": 2, "pos": Vector2(680, 380)},
		{"id": 3, "pos": Vector2(1000, 300)}
	],
	"walls": [
		{"start": Vector2(0, 0), "end": Vector2(1280, 0)},
		{"start": Vector2(0, 720), "end": Vector2(1280, 720)},
		{"start": Vector2(0, 0), "end": Vector2(0, 720)},
		{"start": Vector2(1280, 0), "end": Vector2(1280, 720)},
		{"start": Vector2(150, 350), "end": Vector2(350, 350)},
		{"start": Vector2(550, 250), "end": Vector2(550, 450)},
		{"start": Vector2(550, 450), "end": Vector2(700, 450)},
		{"start": Vector2(750, 100), "end": Vector2(750, 280)},
		{"start": Vector2(1000, 380), "end": Vector2(1000, 650)}
	]
}

const LEVEL_3 = {
	"id": 3,
	"name": "核心物流区",
	"description": "巡逻灯密集，注意噪音和视野，合理规划路线",
	"difficulty": "困难",
	"difficulty_stars": 3,
	"player_spawn": Vector2(60, 660),
	"goal_position": Vector2(1220, 60),
	"required_scans": 7,
	"required_fixes": 3,
	"shelves": [
		{"id": "S3-C1", "pos": Vector2(200, 550), "has_error": false, "expected": "C-301", "actual": "C-301"},
		{"id": "S3-C2", "pos": Vector2(200, 300), "has_error": true, "expected": "C-302", "actual": "X-007"},
		{"id": "S3-C3", "pos": Vector2(450, 150), "has_error": false, "expected": "C-303", "actual": "C-303"},
		{"id": "S3-C4", "pos": Vector2(450, 450), "has_error": true, "expected": "C-304", "actual": "Z-888"},
		{"id": "S3-C5", "pos": Vector2(700, 600), "has_error": false, "expected": "C-305", "actual": "C-305"},
		{"id": "S3-C6", "pos": Vector2(700, 250), "has_error": true, "expected": "C-306", "actual": "Q-123"},
		{"id": "S3-C7", "pos": Vector2(950, 100), "has_error": false, "expected": "C-307", "actual": "C-307"},
		{"id": "S3-C8", "pos": Vector2(950, 450), "has_error": false, "expected": "C-308", "actual": "C-308"},
		{"id": "S3-C9", "pos": Vector2(1100, 620), "has_error": true, "expected": "C-309", "actual": "W-001"}
	],
	"patrols": [
		{
			"points": [Vector2(320, 450), Vector2(320, 100), Vector2(580, 100), Vector2(580, 450)],
			"speed": 65,
			"view_dist": 240,
			"view_angle": 50
		},
		{
			"points": [Vector2(800, 180), Vector2(800, 550)],
			"speed": 70,
			"view_dist": 250,
			"view_angle": 50
		},
		{
			"points": [Vector2(1050, 300), Vector2(1050, 650), Vector2(1200, 650), Vector2(1200, 300)],
			"speed": 60,
			"view_dist": 230,
			"view_angle": 45
		}
	],
	"checkpoints": [
		{"id": 1, "pos": Vector2(300, 650)},
		{"id": 2, "pos": Vector2(600, 380)},
		{"id": 3, "pos": Vector2(880, 220)},
		{"id": 4, "pos": Vector2(1150, 500)}
	],
	"walls": [
		{"start": Vector2(0, 0), "end": Vector2(1280, 0)},
		{"start": Vector2(0, 720), "end": Vector2(1280, 720)},
		{"start": Vector2(0, 0), "end": Vector2(0, 720)},
		{"start": Vector2(1280, 0), "end": Vector2(1280, 720)},
		{"start": Vector2(120, 400), "end": Vector2(280, 400)},
		{"start": Vector2(350, 200), "end": Vector2(350, 350)},
		{"start": Vector2(500, 300), "end": Vector2(650, 300)},
		{"start": Vector2(650, 300), "end": Vector2(650, 500)},
		{"start": Vector2(850, 100), "end": Vector2(850, 280)},
		{"start": Vector2(850, 480), "end": Vector2(850, 680)},
		{"start": Vector2(1000, 200), "end": Vector2(1150, 200)}
	]
}

const ALL_LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3]

func get_level(level_id: int) -> Dictionary:
	for level in ALL_LEVELS:
		if level["id"] == level_id:
			return level.duplicate(true)
	return {}

func get_all_levels_info() -> Array:
	var info: Array = []
	for level in ALL_LEVELS:
		info.append({
			"id": level["id"],
			"name": level["name"],
			"description": level["description"],
			"difficulty": level["difficulty"],
			"difficulty_stars": level["difficulty_stars"],
			"unlocked": SaveManager.is_level_unlocked(level["id"]),
			"progress": SaveManager.get_level_progress(level["id"]),
			"best_time": SaveManager.get_best_time(level["id"])
		})
	return info

func get_level_count() -> int:
	return ALL_LEVELS.size()
