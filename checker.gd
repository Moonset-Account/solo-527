extends Node

func _ready():
	call_deferred("_run_check")

func _run_check():
	var scripts = [
		"res://scripts/autoload/EventBus.gd",
		"res://scripts/autoload/AudioManager.gd",
		"res://scripts/autoload/DebugLog.gd",
		"res://scripts/autoload/GameState.gd",
		"res://scripts/autoload/SaveSystem.gd",
		"res://scripts/data/levels.gd",
		"res://scripts/data/characters.gd",
		"res://scripts/data/skills.gd",
		"res://scripts/data/story_events.gd",
		"res://scripts/ui/MainMenu.gd",
		"res://scripts/ui/Tutorial.gd",
		"res://scripts/ui/LevelSelect.gd",
		"res://scripts/ui/Settings.gd",
		"res://scripts/ui/ResultScreen.gd",
		"res://scripts/battle/BattleScene.gd",
	]
	var ok_count = 0
	for s in scripts:
		var loaded = load(s)
		if loaded:
			print("OK:   " + s)
			ok_count += 1
		else:
			print("FAIL: " + s)
	print("--- Passed: %d / %d ---" % [ok_count, scripts.size()])
	get_tree().quit()
