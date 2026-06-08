extends Node

func _ready():
	print("=== Syntax Test ===")
	var test_scenes := [
		"res://scripts/autoload/EventBus.gd",
		"res://scripts/data/levels.gd",
		"res://scripts/data/characters.gd",
		"res://scripts/data/skills.gd",
		"res://scripts/data/story_events.gd",
	]
	var passed = 0
	for s in test_scenes:
		var res = load(s)
		if res != null:
			print("PASS: " + s)
			passed += 1
		else:
			print("FAIL: " + s)
	print("Data scripts: %d/%d passed" % [passed, test_scenes.size()])
	print("Test complete")
	get_tree().quit()
