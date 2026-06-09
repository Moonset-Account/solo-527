extends SceneTree

func _init():
	print("=== Project Validation ===")
	var errors: Array = []
	var scripts: Array = [
		"res://scripts/autoload/ConfigLoader.gd",
		"res://scripts/autoload/GameManager.gd",
		"res://scripts/autoload/SaveSystem.gd",
		"res://scripts/autoload/InputManager.gd",
		"res://scripts/autoload/AudioManager.gd",
		"res://scripts/autoload/PerformanceStats.gd",
		"res://scripts/core/GameBoard.gd",
		"res://scripts/core/CharacterNode.gd",
		"res://scripts/core/TaskNode.gd",
		"res://scripts/core/GuiInputDetector.gd",
		"res://scripts/core/OutlineLabelContainer.gd",
		"res://scripts/ui/StyledButton.gd",
		"res://scripts/ui/TitleScreen.gd",
		"res://scripts/ui/LevelSelect.gd",
		"res://scripts/ui/GameHUD.gd",
		"res://scripts/ui/PauseMenu.gd",
		"res://scripts/ui/SettingsScreen.gd",
		"res://scripts/ui/ResultScreen.gd",
		"res://scripts/ui/DialogBox.gd",
		"res://scripts/ui/TutorialScreen.gd",
		"res://scripts/Main.gd"
	]
	var loaded: int = 0
	for sp in scripts:
		if not ResourceLoader.exists(sp):
			errors.append("Missing file: " + sp)
			continue
		var res = load(sp)
		if res == null:
			errors.append("Failed compile: " + sp)
		else:
			loaded += 1
			print("OK  " + sp)
	print("\nLoaded: %d/%d scripts" % [loaded, scripts.size()])
	if errors.size() > 0:
		print("\n=== ERRORS (%d) ===" % errors.size())
		for e in errors:
			print("  ! " + e)
	else:
		print("\n=== All scripts compiled OK ===")
	print("\n=== Config JSON Test ===")
	var cl_script = load("res://scripts/autoload/ConfigLoader.gd")
	var cl = cl_script.new()
	cl._ready()
	var chars = cl.characters.get("characters", [])
	var levels = cl.level_list.get("levels", [])
	print("Characters: " + str(chars.size()))
	print("Levels: " + str(levels.size()))
	var tuto = cl.load_level_data("level_01_tutorial")
	print("Tutorial tasks: " + str(tuto.get("tasks", []).size()))
	print("Tutorial map: %dx%d" % [tuto.get("map", {}).get("width", 0), tuto.get("map", {}).get("height", 0)])
	print("\n=== Balance Config ===")
	print("Move AP cost: " + str(cl.get_balance("balance.move_ap_cost")))
	print("Task work AP: " + str(cl.get_balance("balance.task_work_ap_cost")))
	cl.queue_free()
	var ok: bool = chars.size() > 0 and levels.size() > 0 and tuto.size() > 0
	print("\n=== Result: %s ===" % ("PASS" if ok and errors.size() == 0 else "FAIL"))
	quit(0 if (ok and errors.size() == 0) else 1)
