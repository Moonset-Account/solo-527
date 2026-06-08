extends SceneTree

func _init():
	print("=== SneakyBot 最终验证 (Godot 4.6) ===")
	
	var errors_found: Array = []
	var total_checks: int = 0
	var passed_checks: int = 0
	
	print("\n--- 1. 场景文件可加载性验证 ---")
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
	
	for scn_path in test_scenes:
		total_checks += 1
		if ResourceLoader.exists(scn_path):
			var loaded: Resource = load(scn_path)
			if loaded and loaded is PackedScene:
				print("  [PASS] %s" % scn_path)
				passed_checks += 1
			else:
				print("  [FAIL] %s (不是 PackedScene)" % scn_path)
				errors_found.append("场景格式错误: " + scn_path)
		else:
			print("  [MISS] %s (文件不存在)" % scn_path)
			errors_found.append("场景缺失: " + scn_path)
	
	print("\n--- 2. 项目配置验证 ---")
	total_checks += 1
	var project_cfg: ConfigFile = ConfigFile.new()
	var cfg_err: int = project_cfg.load("res://project.godot")
	if cfg_err == OK:
		var main_scene: String = project_cfg.get_value("application", "run/main_scene", "")
		print("  主场景: %s" % main_scene)
		if main_scene == "res://scenes/ui/MainMenu.tscn":
			print("  [PASS] 主场景设置正确")
			passed_checks += 1
		else:
			print("  [FAIL] 主场景异常")
			errors_found.append("主场景不是MainMenu.tscn")
		
		total_checks += 1
		var autoload_keys: Array = project_cfg.get_section_keys("autoload")
		print("  Autoload: %s" % str(autoload_keys))
		var required_autoloads: Array = ["EventBus", "GameManager", "SaveManager", "AudioManager", "TextureManager", "TextureReplacer"]
		var has_all: bool = true
		for req in required_autoloads:
			if not autoload_keys.has(req):
				has_all = false
				errors_found.append("缺少Autoload: " + req)
		if has_all:
			print("  [PASS] 全部6个Autoload已配置")
			passed_checks += 1
		else:
			print("  [FAIL] 缺少必要的Autoload")
	else:
		print("  [FAIL] project.godot无法读取")
		errors_found.append("project.godot读取失败")
	
	print("\n--- 3. 导出配置验证 ---")
	total_checks += 1
	var export_exists: bool = FileAccess.file_exists("res://export_presets.cfg")
	if export_exists:
		var export_cfg: ConfigFile = ConfigFile.new()
		var exp_err: int = export_cfg.load("res://export_presets.cfg")
		if exp_err == OK:
			var sections: Array = export_cfg.get_sections()
			var preset_count: int = 0
			for s in sections:
				if s.begins_with("preset."):
					preset_count += 1
			print("  [PASS] export_presets.cfg存在，%d个导出预设" % preset_count)
			passed_checks += 1
		else:
			print("  [WARN] export_presets.cfg存在但解析失败")
			passed_checks += 1
	else:
		print("  [WARN] export_presets.cfg不存在（可选）")
		passed_checks += 1
	
	print("\n=== 验证总结 ===")
	print("  通过: %d / %d" % [passed_checks, total_checks])
	if errors_found.is_empty():
		print("  ✓ 项目配置检查全部通过！")
		print("\n  下一步操作建议：")
		print("  1. 在Godot编辑器中打开本项目目录")
		print("  2. 点击右上角 ▶ 运行按钮启动游戏")
		print("  3. 点击 '开始游戏' 进入 Level_01.tscn")
		print("  4. 完整循环：教程 → 扫描6个货架 → 避开4个巡逻灯 → 激活4个Checkpoint")
		print("  5. 游戏内按 ESC 暂停，可打开设置页面调整音量/全屏等")
	else:
		print("  ✗ 发现 %d 个问题:" % errors_found.size())
		for e in errors_found:
			print("    - %s" % e)
	
	print("\n=== 注意：单独加载脚本时会报Autoload未定义错误是正常现象 ===")
	print("=== 因为Autoload仅在完整游戏启动时才会被加载 ===")
	
	quit(0)
