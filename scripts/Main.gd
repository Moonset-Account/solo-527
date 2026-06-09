extends Control

var title_screen: Control
var level_select: Control
var game_board: Node2D
var game_hud: Control
var pause_menu: Control
var settings_screen: Control
var result_screen: Control
var dialog_box: Control
var tutorial_screen: Control
var board_center: CenterContainer
var current_level_id_to_load: String = ""

func _ready():
	_build_scene()
	_connect_signals()
	_apply_stored_settings()
	_show_title()

func _build_scene():
	set_anchors_preset(Control.PRESET_FULL_RECT)
	name = "Main"
	title_screen = preload("res://scripts/ui/TitleScreen.gd").new()
	title_screen.visible = false
	add_child(title_screen)
	level_select = preload("res://scripts/ui/LevelSelect.gd").new()
	level_select.visible = false
	add_child(level_select)
	board_center = CenterContainer.new()
	board_center.visible = false
	board_center.set_anchors_preset(Control.PRESET_FULL_RECT)
	board_center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(board_center)
	var game_root: Node2D = Node2D.new()
	game_root.name = "GameRoot"
	board_center.add_child(game_root)
	game_board = preload("res://scripts/core/GameBoard.gd").new()
	game_board.name = "GameBoard"
	game_root.add_child(game_board)
	game_hud = preload("res://scripts/ui/GameHUD.gd").new()
	game_hud.visible = false
	add_child(game_hud)

func _connect_signals():
	title_screen.connect("start_clicked", _on_start_tutorial)
	title_screen.connect("level_select_clicked", _show_level_select)
	title_screen.connect("settings_clicked", _show_settings_title)
	level_select.connect("level_selected", _on_level_selected)
	level_select.connect("back_clicked", _show_title)
	game_hud.connect("end_turn_clicked", _on_end_turn)
	game_hud.connect("pause_clicked", _on_pause_clicked)
	game_hud.connect("skill_used", _on_skill_used)
	game_hud.connect("work_clicked", _on_work_clicked)
	game_board.connect("tile_clicked", _on_tile_clicked)
	game_board.connect("character_clicked", _on_character_clicked)
	game_board.connect("task_clicked", _on_task_clicked)
	GameManager.connect("state_changed", _on_state_changed)
	GameManager.connect("dialog_requested", _on_dialog_requested)
	GameManager.connect("game_over", _on_game_over)
	GameManager.connect("task_completed", _on_task_completed)
	GameManager.connect("character_selected", _on_gm_char_selected)

func _apply_stored_settings():
	if SaveSystem.get_setting("fullscreen", false):
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	if not SaveSystem.get_setting("vsync", true):
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	var fps: int = int(SaveSystem.get_setting("max_fps", 60))
	Engine.max_fps = fps
	if SaveSystem.get_setting("show_performance", false):
		PerformanceStats.set_enabled(true)
	AudioManager.apply_volumes()

func _show_title():
	_hide_all()
	title_screen.visible = true
	GameManager.change_state(GameManager.GameState.TITLE)

func _show_level_select():
	_hide_all()
	level_select.queue_free()
	level_select = preload("res://scripts/ui/LevelSelect.gd").new()
	level_select.visible = true
	add_child(level_select)
	level_select.connect("level_selected", _on_level_selected)
	level_select.connect("back_clicked", _show_title)
	GameManager.change_state(GameManager.GameState.LEVEL_SELECT)

func _on_start_tutorial():
	_start_level("level_01_tutorial")
	if tutorial_screen and is_instance_valid(tutorial_screen):
		tutorial_screen.queue_free()

func _on_level_selected(level_id: String):
	_start_level(level_id)

func _start_level(level_id: String):
	current_level_id_to_load = level_id
	GameManager.start_level(level_id)
	_hide_all()
	board_center.visible = true
	game_hud.visible = true
	game_board.queue_free()
	game_board = preload("res://scripts/core/GameBoard.gd").new()
	game_board.name = "GameBoard"
	board_center.get_child(0).add_child(game_board)
	game_board.setup_from_level(GameManager.level_data)
	_center_board()
	game_board.connect("tile_clicked", _on_tile_clicked)
	game_board.connect("character_clicked", _on_character_clicked)
	game_board.connect("task_clicked", _on_task_clicked)
	game_hud.queue_free()
	game_hud = preload("res://scripts/ui/GameHUD.gd").new()
	game_hud.visible = true
	add_child(game_hud)
	game_hud.connect("end_turn_clicked", _on_end_turn)
	game_hud.connect("pause_clicked", _on_pause_clicked)
	game_hud.connect("skill_used", _on_skill_used)
	game_hud.connect("work_clicked", _on_work_clicked)
	_check_work_available()
	var tutorial_flag: bool = GameManager.level_data.get("tutorial_hints", false)
	if tutorial_flag and SaveSystem.get_completed_levels().size() == 0:
		call_deferred("_show_tutorial_first_time")

func _show_tutorial_first_time():
	if tutorial_screen and is_instance_valid(tutorial_screen):
		tutorial_screen.queue_free()
	tutorial_screen = preload("res://scripts/ui/TutorialScreen.gd").new()
	tutorial_screen.connect("closed", _on_tutorial_closed)
	add_child(tutorial_screen)

func _on_tutorial_closed():
	pass

func _center_board():
	var mp: Dictionary = GameManager.level_data.get("map", {})
	var ts: int = int(mp.get("tile_size", 64))
	var w: int = int(mp.get("width", 8))
	var h: int = int(mp.get("height", 6))
	var bw: int = w * ts
	var bh: int = h * ts
	var vp: Vector2 = get_viewport_rect().size
	var offset_x: float = (vp.x - bw) * 0.5
	var offset_y: float = (vp.y - bh) * 0.5
	var game_root: Node = board_center.get_child(0)
	game_root.position = Vector2(offset_x, max(offset_y, 80))

func _hide_all():
	title_screen.visible = false
	level_select.visible = false
	board_center.visible = false
	game_hud.visible = false

func _on_end_turn():
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	GameManager.end_turn()
	_check_work_available()

func _on_pause_clicked():
	if pause_menu and is_instance_valid(pause_menu):
		return
	pause_menu = preload("res://scripts/ui/PauseMenu.gd").new()
	add_child(pause_menu)
	GameManager.change_state(GameManager.GameState.PAUSED)
	pause_menu.connect("resumed", _on_resume)
	pause_menu.connect("retry_clicked", _on_retry)
	pause_menu.connect("back_to_title", _on_back_title)
	pause_menu.connect("settings_clicked", _show_settings_from_pause)

func _on_resume():
	GameManager.change_state(GameManager.GameState.PLAYING)
	pause_menu = null
	_check_work_available()

func _on_retry():
	var lid: String = GameManager.current_level_id
	_start_level(lid)

func _on_back_title():
	_show_title()

func _show_settings_title():
	if settings_screen and is_instance_valid(settings_screen):
		settings_screen.queue_free()
	settings_screen = preload("res://scripts/ui/SettingsScreen.gd").new()
	settings_screen.connect("closed", _on_settings_closed)
	add_child(settings_screen)
	GameManager.change_state(GameManager.GameState.SETTINGS)

func _show_settings_from_pause():
	if settings_screen and is_instance_valid(settings_screen):
		settings_screen.queue_free()
	settings_screen = preload("res://scripts/ui/SettingsScreen.gd").new()
	settings_screen.connect("closed", _on_settings_closed_from_pause)
	add_child(settings_screen)

func _on_settings_closed():
	GameManager.change_state(GameManager.GameState.TITLE)
	settings_screen = null

func _on_settings_closed_from_pause():
	settings_screen = null
	_check_work_available()

func _on_skill_used(skill_idx: int):
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	var ch: Dictionary = GameManager.get_selected_character()
	if ch.is_empty():
		return
	var skill: Dictionary = ConfigLoader.get_skill(ch.get("id", ""), skill_idx)
	if skill.is_empty():
		return
	var target: String = skill.get("target", "self")
	if target == "self":
		GameManager.use_skill(skill_idx)
		_update_board_visuals()
		_check_work_available()
	elif target in ["tile", "ally", "area", "area_ally"]:
		var r: int = int(skill.get("range", 0))
		var gx: int = int(ch.get("grid_x", 0))
		var gy: int = int(ch.get("grid_y", 0))
		game_board.show_skill_range_tiles(r, gx, gy)
		GameManager.show_toast("选择目标格子，再点一次取消", Color.LIGHT_BLUE)
		_pending_skill = {"idx": skill_idx, "ch_idx": GameManager.selected_character_idx}

var _pending_skill: Dictionary = {}

func _on_tile_clicked(gx: int, gy: int, _mb: int):
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	if _pending_skill.size() > 0:
		var idx: int = int(_pending_skill.get("idx", -1))
		GameManager.use_skill(idx, gx, gy)
		_pending_skill.clear()
		game_board._hide_skill_range()
		_update_board_visuals()
		_check_work_available()
		return
	var ch_idx: int = GameManager.selected_character_idx
	if ch_idx < 0:
		return
	var ch: Dictionary = GameManager.characters[ch_idx]
	var sx: int = int(ch.get("grid_x", 0))
	var sy: int = int(ch.get("grid_y", 0))
	var path: PackedVector2Array = game_board.find_path(sx, sy, gx, gy, ch_idx)
	if path.size() > 1:
		game_board.move_character_to(ch_idx, path)
		game_board.hide_all_highlights()
		call_deferred("_after_move_update", ch_idx)

func _after_move_update(ch_idx: int):
	game_board.show_move_highlights(ch_idx)
	game_board.show_selectable_ring(ch_idx)
	_check_work_available()

func _on_character_clicked(idx: int):
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	_pending_skill.clear()
	game_board._hide_skill_range()
	GameManager.select_character(idx)
	AudioManager.play_sfx("click")
	_check_work_available()

func _on_task_clicked(task_idx: int):
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	var ch_idx: int = GameManager.selected_character_idx
	if ch_idx < 0:
		GameManager.show_toast("先选中一个角色！", Color.ORANGE)
		return
	if not GameManager.is_character_adjacent_to_task(ch_idx, task_idx):
		GameManager.show_toast("请先移动到任务附近！", Color.ORANGE)
		return
	_do_work(task_idx)

func _on_work_clicked():
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	var ch_idx: int = GameManager.selected_character_idx
	if ch_idx < 0:
		GameManager.show_toast("先选中一个角色！", Color.ORANGE)
		return
	var tidx: int = _find_adjacent_task(ch_idx)
	if tidx < 0:
		GameManager.show_toast("附近没有可执行的任务，移动到任务旁边！", Color.ORANGE)
		return
	_do_work(tidx)

func _find_adjacent_task(ch_idx: int) -> int:
	var ch: Dictionary = GameManager.characters[ch_idx]
	var cx: int = int(ch.get("grid_x", 0))
	var cy: int = int(ch.get("grid_y", 0))
	for dy in range(-1, 2):
		for dx in range(-1, 2):
			var idx: int = GameManager.get_task_at(cx + dx, cy + dy)
			if idx >= 0:
				return idx
	return -1

func _do_work(task_idx: int):
	var ch_idx: int = GameManager.selected_character_idx
	var ok: bool = GameManager.work_on_task(task_idx)
	if ok:
		game_board.work_animation(ch_idx)
		var t: Dictionary = GameManager.tasks[task_idx]
		if t.get("completed", false):
			game_board.task_complete_animation(task_idx)
	_update_board_visuals()
	_check_work_available()

func _on_gm_char_selected(_idx: int):
	_check_work_available()

func _check_work_available():
	var ch_idx: int = GameManager.selected_character_idx
	if not game_hud:
		return
	if ch_idx < 0:
		game_hud.set_work_enabled(false, "请先选择角色")
		return
	var tidx: int = _find_adjacent_task(ch_idx)
	if tidx < 0:
		game_hud.set_work_enabled(false, "附近无任务")
		return
	var ch: Dictionary = GameManager.characters[ch_idx]
	if int(ch.get("ap", 0)) < int(ConfigLoader.get_balance("balance.task_work_ap_cost", 1)):
		game_hud.set_work_enabled(false, "行动点不足")
		return
	game_hud.set_work_enabled(true)

func _update_board_visuals():
	game_board._update_all_visuals()

func _on_state_changed(new_state: int, _old: int):
	pass

func _on_dialog_requested(dialog_data: Dictionary):
	GameManager.change_state(GameManager.GameState.DIALOG)
	if dialog_box and is_instance_valid(dialog_box):
		dialog_box.queue_free()
	dialog_box = preload("res://scripts/ui/DialogBox.gd").new()
	if dialog_box.has_method("set_event"):
		dialog_box.set_event(dialog_data)
	dialog_box.connect("choice_made", _on_dialog_choice)
	add_child(dialog_box)

func _on_dialog_choice(ev: Dictionary, choice_idx: int):
	GameManager.resolve_event_choice(ev, choice_idx)
	GameManager.change_state(GameManager.GameState.PLAYING)
	dialog_box = null
	_update_board_visuals()
	_check_work_available()

func _on_game_over(victory: bool):
	var result: Dictionary = SaveSystem.get_last_result()
	if result_screen and is_instance_valid(result_screen):
		result_screen.queue_free()
	result_screen = preload("res://scripts/ui/ResultScreen.gd").new()
	if result_screen.has_method("set_result"):
		result_screen.set_result(result if not result.is_empty() else {"victory": victory})
	result_screen.connect("retry_clicked", _on_result_retry)
	result_screen.connect("next_level", _on_result_next)
	result_screen.connect("back_to_title", _on_result_back)
	add_child(result_screen)

func _on_result_retry():
	var lid: String = GameManager.current_level_id
	_start_level(lid)

func _on_result_next():
	var levels: Array = ConfigLoader.level_list.get("levels", [])
	var current: String = GameManager.current_level_id
	for i in range(levels.size()):
		if levels[i].get("level_id", "") == current and i + 1 < levels.size():
			var next_id: String = levels[i + 1].get("level_id", "")
			_start_level(next_id)
			return
	_show_title()

func _on_result_back():
	_show_title()

func _on_task_completed(_td: Dictionary):
	_update_board_visuals()
	_check_work_available()

func _input(event: InputEvent):
	if GameManager.current_state == GameManager.GameState.PLAYING:
		if Input.is_action_just_pressed("end_turn"):
			_on_end_turn()
			get_viewport().set_input_as_handled()
			return
		if Input.is_action_just_pressed("confirm"):
			_on_work_clicked()
			get_viewport().set_input_as_handled()
			return
		if Input.is_action_just_pressed("pause"):
			_on_pause_clicked()
			get_viewport().set_input_as_handled()
			return
		if Input.is_action_just_pressed("skill_1"):
			_on_skill_used(0)
			get_viewport().set_input_as_handled()
			return
		if Input.is_action_just_pressed("skill_2"):
			_on_skill_used(1)
			get_viewport().set_input_as_handled()
			return
		if Input.is_action_just_pressed("skill_3"):
			_on_skill_used(2)
			get_viewport().set_input_as_handled()
			return
		var idx: int = GameManager.selected_character_idx
		var dx: int = 0
		var dy: int = 0
		if Input.is_action_just_pressed("move_up"):
			dy = -1
		elif Input.is_action_just_pressed("move_down"):
			dy = 1
		elif Input.is_action_just_pressed("move_left"):
			dx = -1
		elif Input.is_action_just_pressed("move_right"):
			dx = 1
		if dx != 0 or dy != 0:
			if idx >= 0 and idx < GameManager.characters.size():
				var ch: Dictionary = GameManager.characters[idx]
				var tx: int = int(ch.get("grid_x", 0)) + dx
				var ty: int = int(ch.get("grid_y", 0)) + dy
				_on_tile_clicked(tx, ty, 1)
			get_viewport().set_input_as_handled()
			return
	if Input.is_action_just_pressed("cancel"):
		if GameManager.current_state == GameManager.GameState.PAUSED:
			if pause_menu and pause_menu.is_inside_tree():
				_on_resume()
		elif GameManager.current_state == GameManager.GameState.PLAYING:
			_on_pause_clicked()

func _notification(what: int):
	if what == NOTIFICATION_WM_SIZE_CHANGED:
		if board_center.visible and game_board and game_board.is_inside_tree():
			call_deferred("_center_board")
