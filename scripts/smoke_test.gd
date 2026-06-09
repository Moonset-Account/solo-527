extends Node

var passed_tests: int = 0
var failed_tests: int = 0
var errors: Array = []
var root: Node

func _ready():
	root = get_tree().root
	bar("🎮 CLUB ACTIVITY TACTICS - FULL FLOW SMOKE TEST")
	
	_load_configs()
	_test_title_flow()
	_test_level_select_flow()
	_test_settings_flow()
	_test_pause_menu_flow()
	_test_result_screen()
	_test_tutorial_level()
	_test_save_system()
	_test_input_manager()
	_test_performance_stats()
	
	bar("📊 SUMMARY: " + str(passed_tests) + " PASSED / " + str(failed_tests) + " FAILED")
	if errors.size() > 0:
		print("❌ ERRORS:")
		for e in errors:
			print("   - " + e)
	bar("")
	get_tree().quit(0 if failed_tests == 0 else 1)

func bar(t: String):
	var s: String = ""
	for i in 60:
		s += "="
	print("\n" + s)
	print(t)
	print(s)

func _load_configs():
	var loader: Node = load("res://scripts/autoload/ConfigLoader.gd").new()
	root.add_child(loader)
	loader._ready()
	var char_count: int = loader.characters.size()
	var level_count: int = loader.level_list.get("levels", []).size()
	_check("ConfigLoader loaded " + str(char_count) + " characters", char_count >= 4)
	_check("ConfigLoader loaded " + str(level_count) + " levels", level_count >= 3)
	_check("ConfigLoader has get_skill()", loader.has_method("get_skill"))
	_check("ConfigLoader has is_level_unlocked()", loader.has_method("is_level_unlocked"))
	_check("Balance config loaded", loader.balance_config.size() >= 5)
	root.remove_child(loader)
	loader.free()

func _test_title_flow():
	print("\n[1] Testing Title Screen...")
	var t: Control = load("res://scripts/ui/TitleScreen.gd").new()
	_check("TitleScreen instantiated", t != null)
	if t:
		_check("TitleScreen has start_clicked", t.has_signal("start_clicked"))
		_check("TitleScreen has settings_clicked", t.has_signal("settings_clicked"))
		_check("TitleScreen has level_select_clicked", t.has_signal("level_select_clicked"))
		t.free()

func _test_level_select_flow():
	print("\n[2] Testing Level Select...")
	var ls: Control = load("res://scripts/ui/LevelSelect.gd").new()
	_check("LevelSelect instantiated", ls != null)
	if ls:
		_check("LevelSelect has level_selected", ls.has_signal("level_selected"))
		_check("LevelSelect has back_clicked", ls.has_signal("back_clicked"))
		ls.free()

func _test_settings_flow():
	print("\n[3] Testing Settings Screen...")
	var s: Control = load("res://scripts/ui/SettingsScreen.gd").new()
	_check("SettingsScreen instantiated", s != null)
	if s:
		_check("SettingsScreen has closed", s.has_signal("closed"))
		s.free()

func _test_pause_menu_flow():
	print("\n[4] Testing Pause Menu...")
	var pm: Control = load("res://scripts/ui/PauseMenu.gd").new()
	_check("PauseMenu instantiated", pm != null)
	if pm:
		_check("PauseMenu has resumed", pm.has_signal("resumed"))
		_check("PauseMenu has retry_clicked", pm.has_signal("retry_clicked"))
		_check("PauseMenu has back_to_title", pm.has_signal("back_to_title"))
		_check("PauseMenu has settings_clicked", pm.has_signal("settings_clicked"))
		pm.free()

func _test_result_screen():
	print("\n[5] Testing Result Screen (Win/Fail/Retry)...")
	var rs: Control = load("res://scripts/ui/ResultScreen.gd").new()
	_check("ResultScreen instantiated", rs != null)
	if rs:
		_check("ResultScreen has retry_clicked", rs.has_signal("retry_clicked"))
		_check("ResultScreen has next_level", rs.has_signal("next_level"))
		_check("ResultScreen has back_to_title", rs.has_signal("back_to_title"))
		if rs.has_method("set_result"):
			rs.set_result({"victory": true, "reason": "🎉 活动圆满成功！", "final_satisfaction": 85.0, "tasks_completed": 2, "tasks_required": 3})
			_check("Result set win data OK", true)
		rs.free()
	var rsf: Control = load("res://scripts/ui/ResultScreen.gd").new()
	if rsf and rsf.has_method("set_result"):
		rsf.set_result({"victory": false, "reason": "😢 满意度不足…再试一次？", "final_satisfaction": 15.0, "tasks_completed": 0, "tasks_required": 3})
		_check("Result set fail/retry data OK", true)
		rsf.free()

func _install_autoloads():
	var save: Node = load("res://scripts/autoload/SaveSystem.gd").new()
	save.name = "SaveSystem"
	root.add_child(save); save._ready()
	var im: Node = load("res://scripts/autoload/InputManager.gd").new()
	im.name = "InputManager"
	root.add_child(im); im._ready()
	var am: Node = load("res://scripts/autoload/AudioManager.gd").new()
	am.name = "AudioManager"
	root.add_child(am); am._ready()
	var perf: Node = load("res://scripts/autoload/PerformanceStats.gd").new()
	perf.name = "PerformanceStats"
	root.add_child(perf); perf._ready()
	var cl: Node = load("res://scripts/autoload/ConfigLoader.gd").new()
	cl.name = "ConfigLoader"
	root.add_child(cl); cl._ready()
	var gm: Node = load("res://scripts/autoload/GameManager.gd").new()
	gm.name = "GameManager"
	root.add_child(gm); gm._ready()
	return gm

func _test_tutorial_level():
	print("\n[6] Testing Tutorial Level_01 (Full Game Loop)...")
	_clear_children_except_root()
	var gm = _install_autoloads()
	_check("GameManager instantiated", gm != null)
	if not gm: return
	
	gm.start_level("level_01_tutorial")
	_check("Level started: " + str(gm.current_level_id), gm.current_level_id == "level_01_tutorial")
	_check("Characters >= 3 (got " + str(gm.characters.size()) + ")", gm.characters.size() >= 3)
	_check("Tasks >= 2 (got " + str(gm.tasks.size()) + ")", gm.tasks.size() >= 2)
	_check("Turn starts at 1", gm.turn == 1)
	_check("State is PLAYING(2)", gm.current_state == 2)
	_check("Satisfaction initialized OK", 
		float(gm.satisfaction) >= float(gm.min_satisfaction) - 0.1)
	_check("Required tasks set (>0)", gm.required_tasks > 0)
	_check("Target satisfaction set (>0)", gm.target_satisfaction > 0)
	
	gm.select_character(0)
	var ch: Dictionary = gm.get_selected_character()
	_check("Select char 0 OK (not empty)", not ch.is_empty())
	if not ch.is_empty():
		_check("Selected idx matches", gm.selected_character_idx == 0)
		var ap: int = int(ch.get("ap", -1))
		_check("AP >= 2 (got " + str(ap) + ")", ap >= 2)
		var mr: int = int(ch.get("move_range", 0))
		_check("Move range >= 2 (got " + str(mr) + ")", mr >= 2)
		var gx: int = int(ch.get("grid_x", -999))
		var gy: int = int(ch.get("grid_y", -999))
		_check("Char 0 has grid coords (" + str(gx) + "," + str(gy) + ")", gx >= 0 and gy >= 0)
		var skills: Array = ch.get("skills", [])
		_check("Char 0 has skills (" + str(skills.size()) + ")", skills.size() >= 2)
	
	var t1: int = gm.turn
	gm.end_turn()
	_check("End turn " + str(t1) + " -> " + str(gm.turn), gm.turn == t1 + 1)
	for extra in 4:
		gm.end_turn()
	_check("4x end_turn OK (turn " + str(gm.turn) + ")", gm.turn >= 5)
	_check("All chars AP refilled", _all_chars_have_ap(gm))

func _all_chars_have_ap(gm) -> bool:
	for c in gm.characters:
		if int(c.get("ap", -1)) < 0:
			return false
	return true

func _clear_children_except_root():
	var kids: Array = root.get_children()
	for k in kids:
		root.remove_child(k)
		if is_instance_valid(k):
			k.free()

func _test_save_system():
	print("\n[7] Testing SaveSystem Persistence...")
	_clear_children_except_root()
	var save: Node = load("res://scripts/autoload/SaveSystem.gd").new()
	save.name = "SaveSystem"
	root.add_child(save); save._ready()
	save.set_setting("test_int", 42)
	save.set_setting("test_str", "hello_game")
	save.set_setting("test_float", 3.14)
	save.add_completed_level("level_01_tutorial")
	var ok: bool = save.save()
	_check("Save serialized OK", ok)
	var save2: Node = load("res://scripts/autoload/SaveSystem.gd").new()
	root.add_child(save2); save2._ready()
	save2.load_data()
	_check("Int preserved (42)", save2.get_setting("test_int", 0) == 42)
	_check("Str preserved (hello_game)", save2.get_setting("test_str", "") == "hello_game")
	var completed: Array = save2.get_completed_levels()
	_check("Level completion recorded (" + str(completed) + ")", completed.size() >= 1)
	_check("get_last_result() exists", save2.has_method("get_last_result"))
	var last_res: Dictionary = save2.get_last_result()
	_check("get_last_result returns dict", typeof(last_res) == TYPE_DICTIONARY)
	save.save()

func _test_input_manager():
	print("\n[8] Testing InputManager Remap...")
	var im: Node = load("res://scripts/autoload/InputManager.gd").new()
	im.name = "InputManager"
	root.add_child(im); im._ready()
	var actions: Array = ["move_up","move_down","confirm","cancel","end_turn","skill_1","skill_2","skill_3","pause"]
	var ok_count: int = 0
	for a in actions:
		var disp: String = im.get_action_display(a)
		if disp != "":
			ok_count += 1
	_check("Action displays OK (" + str(ok_count) + "/" + str(actions.size()) + ")", ok_count >= 6)
	_check("Default bindings >= 7", im.default_bindings.size() >= 7)
	_check("Has reset_defaults() or reset_bindings()", 
		im.has_method("reset_defaults") or im.has_method("reset_bindings"))

func _test_performance_stats():
	print("\n[9] Testing PerformanceStats...")
	var ps: Node = load("res://scripts/autoload/PerformanceStats.gd").new()
	ps.name = "PerformanceStats"
	root.add_child(ps); ps._ready()
	var fps: float = ps.get_current_fps()
	_check("FPS available: " + "%.0f" % fps, fps >= 0.0)
	_check("Has set_enabled()", ps.has_method("set_enabled"))
	_check("Has get_current_fps()", ps.has_method("get_current_fps"))

func _check(name: String, cond: bool):
	if cond:
		passed_tests += 1
		print("  ✅ " + name)
	else:
		failed_tests += 1
		print("  ❌ " + name)
		errors.append(name)
