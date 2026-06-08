extends SceneTree

func _init():
	print("=== SneakyBot 项目验证开始 ===")
	var errors: Array = []
	
	var test_scenes: Array = [
		"res://scenes/ui/MainMenu.tscn",
		"res://scenes/ui/Settings.tscn",
		"res://scenes/ui/HUD.tscn",
		"res://scenes/ui/PauseMenu.tscn",
		"res://scenes/ui/TutorialOverlay.tscn",
		"res://scenes/player/Player.tscn",
		"res://scenes/enemies/PatrolLight.tscn",
		"res://scenes/props/Shelf.tscn",
		"res://scenes/props/Checkpoint.tscn",
		"res://scenes/levels/Level_01.tscn",
		"res://scenes/levels/TutorialLevel.tscn",
	]
	
	print("\n--- 场景文件验证 ---")
	for scn_path in test_scenes:
		if ResourceLoader.exists(scn_path):
			var loaded := load(scn_path)
			if loaded and loaded is PackedScene:
				print("[OK]  %s  (可加载)" % scn_path)
			else:
				print("[WARN] %s  存在但不是PackedScene" % scn_path)
				errors.append("场景不是PackedScene: " + scn_path)
		else:
			print("[FAIL] %s  不存在!" % scn_path)
			errors.append("场景缺失: " + scn_path)
	
	print("\n--- 脚本文件验证 ---")
	var test_scripts: Array = [
		"res://scripts/autoload/EventBus.gd",
		"res://scripts/autoload/GameManager.gd",
		"res://scripts/autoload/SaveManager.gd",
		"res://scripts/autoload/AudioManager.gd",
		"res://scripts/autoload/RuntimeTextureManager.gd",
		"res://scripts/autoload/TextureReplacer.gd",
		"res://scripts/ui/MainMenu.gd",
		"res://scripts/ui/Settings.gd",
		"res://scripts/ui/HUD.gd",
		"res://scripts/ui/PauseMenu.gd",
		"res://scripts/ui/TutorialOverlay.gd",
		"res://scripts/player/PlayerController.gd",
		"res://scripts/enemies/PatrolLight.gd",
		"res://scripts/enemies/VisionCone.gd",
		"res://scripts/props/Shelf.gd",
		"res://scripts/props/Checkpoint.gd",
		"res://scripts/levels/LevelBase.gd",
		"res://scripts/systems/NoiseSystem.gd",
		"res://scripts/systems/EnergySystem.gd",
		"res://scripts/systems/ScanSystem.gd",
	]
	
	for script_path in test_scripts:
		if ResourceLoader.exists(script_path):
			var scr := load(script_path)
			if scr and scr is GDScript:
				print("[OK]  %s" % script_path)
			else:
				print("[WARN] %s  加载异常" % script_path)
				errors.append("脚本加载异常: " + script_path)
		else:
			print("[FAIL] %s  不存在!" % script_path)
			errors.append("脚本缺失: " + script_path)
	
	print("\n--- 关键配置验证 ---")
	var project_cfg: ConfigFile = ConfigFile.new()
	var cfg_err: int = project_cfg.load("res://project.godot")
	if cfg_err == OK:
		var main_scene: String = project_cfg.get_value("application", "run/main_scene", "")
		print("主场景: %s" % main_scene)
		if main_scene == "res://scenes/ui/MainMenu.tscn":
			print("[OK] 主场景设置正确")
		else:
			print("[WARN] 主场景可能不正确")
			errors.append("主场景配置异常")
			
		var autoload_section: Array = project_cfg.get_section_keys("autoload")
		print("Autoload单例 (%d个):" % autoload_section.size())
		for key in autoload_section:
			print("  - %s" % key)
		var expected_autoloads: Array = ["EventBus", "GameManager", "SaveManager", "AudioManager", "TextureManager", "TextureReplacer"]
		for exp in expected_autoloads:
			if not autoload_section.has(exp):
				print("[WARN] 缺少Autoload: %s" % exp)
				errors.append("缺少Autoload: " + exp)
		if autoload_section.size() >= 6:
			print("[OK] Autoload数量正确 (>=6)")
	else:
		print("[FAIL] project.godot加载失败!")
		errors.append("project.godot无法读取")
	
	print("\n=== 验证总结 ===")
	if errors.is_empty():
		print("✓ 全部验证通过！项目可以正常加载。")
	else:
		print("✗ 发现 %d 个问题:" % errors.size())
		for e in errors:
			print("  - %s" % e)
	
	quit(0)
